import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatEther, formatUnits } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { nativeSymbol } from "../utils/formatters.js";
import ERC20ABI from "../contracts/abis/ERC20.json" with { type: "json" };

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

export function registerBalanceTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getBalance",
    {
      title: "Get Native Balance",
      description:
        "Get the native token balance (ETH/AVAX/CELO) of an address on a specific chain. Returns balance in both wei and formatted units.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address, chain }) => {
      try {
        const cacheKey = `balance:${chain}:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const balance = await client.getBalance({ address: address as `0x${string}` });
        const blockNumber = await client.getBlockNumber();

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  chain,
                  balanceWei: balance.toString(),
                  balanceFormatted: formatEther(balance),
                  symbol: nativeSymbol(chain),
                  blockNumber: blockNumber.toString(),
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 15_000);
        return result;
      } catch (error) {
        return formatError("getBalance", chain, error);
      }
    },
  );

  server.registerTool(
    "getTokenBalance",
    {
      title: "Get ERC20 Token Balance",
      description:
        "Get the ERC20 token balance of an address on a specific chain. Returns balance in both raw and formatted units.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid token contract address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address, tokenAddress, chain }) => {
      try {
        const client = providers.getClient(chain);

        const [balance, decimals, symbol] = await Promise.all([
          client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          }) as Promise<bigint>,
          client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: "decimals",
          }) as Promise<number>,
          client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: "symbol",
          }) as Promise<string>,
        ]);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  token: tokenAddress,
                  balance: balance.toString(),
                  balanceFormatted: formatUnits(balance, decimals),
                  symbol,
                  decimals,
                  chain,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("getTokenBalance", chain, error);
      }
    },
  );

  server.registerTool(
    "getMultiChainBalance",
    {
      title: "Get Multi-Chain Balance",
      description:
        "Get the native token balance of an address across all 4 supported chains in parallel.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address }) => {
      try {
        const l2Clients = providers.getAllL2Clients();
        const results = await Promise.allSettled(
          l2Clients.map(async ({ chain, client }) => {
            const balance = await client.getBalance({ address: address as `0x${string}` });
            return {
              chain,
              balanceWei: balance.toString(),
              balanceFormatted: formatEther(balance),
              symbol: nativeSymbol(chain),
            };
          }),
        );

        const balances = results.map((result, i) => {
          if (result.status === "fulfilled") return result.value;
          return {
            chain: l2Clients[i].chain,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          };
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ address, balances }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError("getMultiChainBalance", undefined, error);
      }
    },
  );
}
