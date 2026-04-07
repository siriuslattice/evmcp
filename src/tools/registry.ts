import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { readRegistryTools } from "../contracts/interactions.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

export function registerRegistryTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "queryRegistry",
    {
      title: "Query MCP Registry",
      description:
        "Read all registered tool metadata from the on-chain MCPRegistry companion contract on a specific chain. Returns tool names, descriptions, and versions.",
      inputSchema: {
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ chain }) => {
      try {
        const cacheKey = `registry:${chain}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const tools = await readRegistryTools(client, chain);

        if (tools === null) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    chain,
                    error: `MCPRegistry not deployed on ${chain}`,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chain,
                  tools: tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    version: t.version,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 300_000);
        return result;
      } catch (error) {
        return formatError("queryRegistry", chain, error);
      }
    },
  );
}
