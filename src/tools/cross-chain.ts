import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatEther } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { nativeSymbol } from "../utils/formatters.js";

export function registerCrossChainTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "compareBalances",
    {
      title: "Compare Balances Across Chains",
      description:
        "Compare the native token balance of an address across all 4 supported chains (Base, Optimism, Avalanche, Celo). Fetches balances in parallel.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address }) => {
      try {
        const cacheKey = `xchain:balance:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const l2Clients = providers.getAllL2Clients();
        const results = await Promise.allSettled(
          l2Clients.map(async ({ chain, client }) => {
            const balance = await client.getBalance({ address: address as `0x${string}` });
            return {
              chain,
              balance: formatEther(balance),
              symbol: nativeSymbol(chain),
            };
          }),
        );

        const balances = results.map((result, i) => {
          if (result.status === "fulfilled") return result.value;
          return {
            chain: l2Clients[i].chain,
            balance: "0",
            symbol: nativeSymbol(l2Clients[i].chain),
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          };
        });

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  balances,
                  totalChains: 4,
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
        return formatError("compareBalances", undefined, error);
      }
    },
  );

  server.registerTool(
    "crossChainActivity",
    {
      title: "Cross-Chain Activity",
      description:
        "Check transaction count for an address across all 4 supported chains (Base, Optimism, Avalanche, Celo) to determine where the wallet is most active.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address }) => {
      try {
        const cacheKey = `xchain:activity:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const l2Clients = providers.getAllL2Clients();
        const results = await Promise.allSettled(
          l2Clients.map(async ({ chain, client }) => {
            const txCount = await client.getTransactionCount({
              address: address as `0x${string}`,
            });
            return { chain, txCount };
          }),
        );

        const activity = results.map((result, i) => {
          if (result.status === "fulfilled") return result.value;
          return {
            chain: l2Clients[i].chain,
            txCount: 0,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          };
        });

        const successfulActivity = activity.filter(
          (a) => !("error" in a),
        );

        const totalTransactions = successfulActivity.reduce((sum, a) => sum + a.txCount, 0);

        const mostActiveChain =
          successfulActivity.length > 0
            ? successfulActivity.reduce((max, a) => (a.txCount > max.txCount ? a : max)).chain
            : "unknown";

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  activity,
                  mostActiveChain,
                  totalTransactions,
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
        return formatError("crossChainActivity", undefined, error);
      }
    },
  );
}
