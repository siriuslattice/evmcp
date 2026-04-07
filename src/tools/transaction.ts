import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { decodeFunctionData } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

function serializeBigInts(obj: unknown): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  );
}

export function registerTransactionTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getTransaction",
    {
      title: "Get Transaction",
      description: "Get a transaction by its hash on a specific chain. Returns full transaction details.",
      inputSchema: {
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid transaction hash"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ txHash, chain }) => {
      try {
        const cacheKey = `tx:${chain}:${txHash}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ chain, ...serializeBigInts(tx) }, null, 2),
            },
          ],
        };

        // Confirmed transactions are immutable
        if (tx.blockNumber) {
          cache.setForever(cacheKey, result);
        }
        return result;
      } catch (error) {
        return formatError("getTransaction", chain, error);
      }
    },
  );

  server.registerTool(
    "getTransactionReceipt",
    {
      title: "Get Transaction Receipt",
      description:
        "Get the receipt for a transaction by its hash. Includes status, gasUsed, and logs.",
      inputSchema: {
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid transaction hash"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ txHash, chain }) => {
      try {
        const cacheKey = `receipt:${chain}:${txHash}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ chain, ...serializeBigInts(receipt) }, null, 2),
            },
          ],
        };

        cache.setForever(cacheKey, result);
        return result;
      } catch (error) {
        return formatError("getTransactionReceipt", chain, error);
      }
    },
  );

  server.registerTool(
    "decodeTransaction",
    {
      title: "Decode Transaction",
      description:
        "Decode a transaction's function call using a provided ABI. Falls back to raw input data if decoding fails.",
      inputSchema: {
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid transaction hash"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        abi: z.array(z.any()).optional().describe("Contract ABI for decoding (JSON array)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ txHash, chain, abi }) => {
      try {
        const client = providers.getClient(chain);
        const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

        const response: Record<string, unknown> = {
          chain,
          txHash,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          inputData: tx.input,
        };

        if (abi && tx.input && tx.input !== "0x") {
          try {
            const decoded = decodeFunctionData({ abi, data: tx.input });
            response.decoded = {
              functionName: decoded.functionName,
              args: JSON.parse(
                JSON.stringify(decoded.args, (_k, v) =>
                  typeof v === "bigint" ? v.toString() : v,
                ),
              ),
            };
          } catch {
            response.decoded = null;
            response.decodeError = "ABI does not match transaction input data";
          }
        } else if (!abi && tx.input && tx.input !== "0x") {
          response.functionSelector = tx.input.slice(0, 10);
          response.decoded = null;
          response.decodeError = "No ABI provided — showing raw function selector";
        } else {
          response.decoded = null;
          response.decodeError = "No input data (native transfer)";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError("decodeTransaction", chain, error);
      }
    },
  );
}
