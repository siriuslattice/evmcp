import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatGwei, formatEther } from "viem";
import type { Providers, SupportedChain } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { nativeSymbol } from "../utils/formatters.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo"] as const;

export function registerGasTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getGasPrice",
    {
      title: "Get Gas Price",
      description:
        "Get current gas price and EIP-1559 fee data for a specific chain. Returns prices in gwei.",
      inputSchema: {
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ chain }) => {
      try {
        const cacheKey = `gas:${chain}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const block = await client.getBlock({ blockTag: "latest" });
        const gasPrice = await client.getGasPrice();

        let maxPriorityFeePerGas: bigint | null = null;
        try {
          maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas();
        } catch {
          // Some chains may not support this
        }

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chain,
                  gasPrice: formatGwei(gasPrice) + " gwei",
                  baseFeePerGas: block.baseFeePerGas
                    ? formatGwei(block.baseFeePerGas) + " gwei"
                    : null,
                  maxPriorityFeePerGas: maxPriorityFeePerGas
                    ? formatGwei(maxPriorityFeePerGas) + " gwei"
                    : null,
                  symbol: nativeSymbol(chain),
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 12_000);
        return result;
      } catch (error) {
        return formatError("getGasPrice", chain, error);
      }
    },
  );

  server.registerTool(
    "estimateGas",
    {
      title: "Estimate Gas",
      description:
        "Estimate gas for a transaction on a specific chain. Returns estimated gas units and cost.",
      inputSchema: {
        to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        from: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address")
          .optional()
          .describe("Sender address (optional)"),
        data: z.string().optional().describe("Transaction calldata (hex)"),
        value: z.string().optional().describe("Value in wei"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ to, chain, from, data, value }) => {
      try {
        const client = providers.getClient(chain);

        const estimatedGas = await client.estimateGas({
          to: to as `0x${string}`,
          ...(from && { account: from as `0x${string}` }),
          ...(data && { data: data as `0x${string}` }),
          ...(value && { value: BigInt(value) }),
        });

        const gasPrice = await client.getGasPrice();
        const estimatedCost = estimatedGas * gasPrice;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chain,
                  estimatedGas: estimatedGas.toString(),
                  gasPrice: formatGwei(gasPrice) + " gwei",
                  estimatedCostWei: estimatedCost.toString(),
                  estimatedCostFormatted: formatEther(estimatedCost) + " " + nativeSymbol(chain),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("estimateGas", chain, error);
      }
    },
  );

  server.registerTool(
    "compareGasAcrossChains",
    {
      title: "Compare Gas Across Chains",
      description:
        "Compare current gas prices across all 4 supported chains. Identifies the cheapest and most expensive chains.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const l2Clients = providers.getAllL2Clients();
        const results = await Promise.allSettled(
          l2Clients.map(async ({ chain, client }) => {
            const gasPrice = await client.getGasPrice();
            const block = await client.getBlock({ blockTag: "latest" });
            return {
              chain,
              gasPrice: formatGwei(gasPrice),
              gasPriceWei: gasPrice.toString(),
              baseFeePerGas: block.baseFeePerGas
                ? formatGwei(block.baseFeePerGas)
                : null,
              symbol: nativeSymbol(chain),
            };
          }),
        );

        const chains: Array<{
          chain: SupportedChain;
          gasPrice: string;
          gasPriceWei: string;
          baseFeePerGas: string | null;
          symbol: string;
        }> = [];

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            chains.push(result.value);
          }
        });

        const sorted = [...chains].sort(
          (a, b) => Number(BigInt(a.gasPriceWei) - BigInt(b.gasPriceWei)),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chains,
                  cheapest: sorted[0]?.chain ?? null,
                  mostExpensive: sorted[sorted.length - 1]?.chain ?? null,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("compareGasAcrossChains", undefined, error);
      }
    },
  );
}
