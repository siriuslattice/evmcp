import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatGwei } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

export function registerBlockTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getBlock",
    {
      title: "Get Block by Hash",
      description: "Get a block by its hash on a specific chain. Optionally include full transaction objects.",
      inputSchema: {
        blockHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid 0x block hash"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        includeTransactions: z.boolean().default(false).describe("Include full transaction objects"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ blockHash, chain, includeTransactions }) => {
      try {
        const cacheKey = `block:${chain}:${blockHash}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const block = await client.getBlock({
          blockHash: blockHash as `0x${string}`,
          includeTransactions,
        });

        const serialized = JSON.parse(
          JSON.stringify(block, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        );

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ chain, ...serialized }, null, 2),
            },
          ],
        };

        // Blocks by hash are immutable — cache forever
        cache.setForever(cacheKey, result);
        return result;
      } catch (error) {
        return formatError("getBlock", chain, error);
      }
    },
  );

  server.registerTool(
    "getBlockByNumber",
    {
      title: "Get Block by Number",
      description:
        'Get a block by its number on a specific chain. Pass "latest" for the most recent block.',
      inputSchema: {
        blockNumber: z.union([z.coerce.bigint(), z.literal("latest")]).describe('Block number or "latest"'),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        includeTransactions: z.boolean().default(false).describe("Include full transaction objects"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ blockNumber, chain, includeTransactions }) => {
      try {
        const client = providers.getClient(chain);
        const blockTag = blockNumber === "latest" ? "latest" as const : undefined;
        const blockNum = blockNumber === "latest" ? undefined : BigInt(blockNumber);

        const block = await client.getBlock({
          ...(blockTag ? { blockTag } : { blockNumber: blockNum }),
          includeTransactions,
        });

        const serialized = JSON.parse(
          JSON.stringify(block, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        );

        const cacheKey = `block:${chain}:${block.number}`;
        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ chain, ...serialized }, null, 2),
            },
          ],
        };

        cache.set(cacheKey, result, 30_000);
        return result;
      } catch (error) {
        return formatError("getBlockByNumber", chain, error);
      }
    },
  );

  server.registerTool(
    "getLatestBlock",
    {
      title: "Get Latest Block",
      description:
        "Get the latest block number, timestamp, and base fee for a specific chain.",
      inputSchema: {
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ chain }) => {
      try {
        const cacheKey = `latestblock:${chain}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const block = await client.getBlock({ blockTag: "latest" });

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  chain,
                  blockNumber: block.number.toString(),
                  timestamp: block.timestamp.toString(),
                  baseFeePerGas: block.baseFeePerGas
                    ? formatGwei(block.baseFeePerGas) + " gwei"
                    : null,
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
        return formatError("getLatestBlock", chain, error);
      }
    },
  );
}
