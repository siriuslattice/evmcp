import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { executeBatchQuery } from "../contracts/interactions.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

export function registerBatchTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "batchQuery",
    {
      title: "Batch Query via Multicall3",
      description:
        "Execute multiple read calls in a single RPC request using Multicall3. Each call specifies a target contract address and encoded calldata. Returns an array of results with success status and return data.",
      inputSchema: {
        calls: z
          .array(
            z.object({
              target: z
                .string()
                .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
              callData: z
                .string()
                .regex(/^0x[a-fA-F0-9]*$/, "Must be valid hex-encoded calldata"),
            }),
          )
          .min(1, "Must provide at least one call")
          .max(50, "Maximum 50 calls per batch"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ calls, chain }) => {
      try {
        const client = providers.getClient(chain);

        const typedCalls = calls.map((c) => ({
          target: c.target as `0x${string}`,
          callData: c.callData as `0x${string}`,
        }));

        const results = await executeBatchQuery(client, typedCalls);

        const formattedResults = (results as Array<{ success: boolean; returnData: string }>).map(
          (r) => ({
            success: r.success,
            returnData: r.returnData,
          }),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chain,
                  results: formattedResults,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("batchQuery", chain, error);
      }
    },
  );
}
