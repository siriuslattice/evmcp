import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Providers, SupportedChain } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { nativeSymbol } from "../utils/formatters.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo"] as const;

const CHAIN_INFO: Record<
  SupportedChain,
  { name: string; chainId: number; blockTime: string }
> = {
  base: { name: "Base", chainId: 8453, blockTime: "~2s" },
  optimism: { name: "Optimism", chainId: 10, blockTime: "~2s" },
  avalanche: { name: "Avalanche C-Chain", chainId: 43114, blockTime: "~2s" },
  celo: { name: "Celo", chainId: 42220, blockTime: "~5s" },
};

export function registerChainTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getChainInfo",
    {
      title: "Get Chain Info",
      description:
        "Get information about a supported chain including name, chain ID, current block number, block time, and native token symbol.",
      inputSchema: {
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ chain }) => {
      try {
        const client = providers.getClient(chain);
        const blockNumber = await client.getBlockNumber();
        const info = CHAIN_INFO[chain];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  name: info.name,
                  chain,
                  chainId: info.chainId,
                  blockNumber: blockNumber.toString(),
                  blockTime: info.blockTime,
                  nativeSymbol: nativeSymbol(chain),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("getChainInfo", chain, error);
      }
    },
  );

  server.registerTool(
    "isContractDeployed",
    {
      title: "Is Contract Deployed",
      description:
        "Check if an address has contract code deployed on all 4 supported chains.",
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
            const code = await client.getCode({ address: address as `0x${string}` });
            return {
              chain,
              isDeployed: !!code && code !== "0x",
            };
          }),
        );

        const deployments = results.map((result, i) => {
          if (result.status === "fulfilled") return result.value;
          return { chain: l2Clients[i].chain, isDeployed: false };
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ address, deployments }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError("isContractDeployed", undefined, error);
      }
    },
  );

  server.registerTool(
    "healthCheck",
    {
      title: "Health Check",
      description:
        "Test connectivity to all 5 RPC endpoints (Ethereum, Base, Optimism, Avalanche, Celo). Returns status for each chain.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const cacheKey = "health:all";
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const status = await providers.healthCheck();

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ chains: status }, null, 2),
            },
          ],
        };

        cache.set(cacheKey, result, 30_000);
        return result;
      } catch (error) {
        return formatError("healthCheck", undefined, error);
      }
    },
  );
}
