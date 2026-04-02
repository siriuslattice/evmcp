import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { decodeEventLog as viemDecodeEventLog } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo"] as const;

export function registerEventTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getContractEvents",
    {
      title: "Get Contract Events",
      description:
        "Get event logs emitted by a contract on a specific chain. Returns raw log data including topics and data fields.",
      inputSchema: {
        contractAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        fromBlock: z.number().int().nonnegative().optional().describe("Start block number"),
        toBlock: z.number().int().nonnegative().optional().describe("End block number"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .default(100)
          .describe("Maximum number of events to return (default 100, max 100)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ contractAddress, chain, fromBlock, toBlock, limit }) => {
      try {
        const client = providers.getClient(chain);

        let resolvedFromBlock: bigint;
        if (fromBlock !== undefined) {
          resolvedFromBlock = BigInt(fromBlock);
        } else {
          const latestBlock = await client.getBlockNumber();
          resolvedFromBlock = latestBlock > 1000n ? latestBlock - 1000n : 0n;
        }

        const resolvedToBlock = toBlock !== undefined ? BigInt(toBlock) : undefined;

        const logs = await client.getLogs({
          address: contractAddress as `0x${string}`,
          fromBlock: resolvedFromBlock,
          toBlock: resolvedToBlock,
        });

        const limited = logs.slice(0, limit);

        const events = limited.map((log) => ({
          blockNumber: log.blockNumber?.toString() ?? null,
          transactionHash: log.transactionHash ?? null,
          logIndex: log.logIndex?.toString() ?? null,
          topics: log.topics,
          data: log.data,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  contractAddress,
                  chain,
                  fromBlock: resolvedFromBlock.toString(),
                  toBlock: resolvedToBlock?.toString() ?? "latest",
                  totalReturned: events.length,
                  events,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("getContractEvents", chain, error);
      }
    },
  );

  server.registerTool(
    "decodeEventLog",
    {
      title: "Decode Event Log",
      description:
        "Decode a raw event log using the provided ABI. Returns the decoded event name and arguments. Does not require a chain connection.",
      inputSchema: {
        topics: z
          .array(z.string().regex(/^0x[a-fA-F0-9]*$/, "Must be a hex string"))
          .min(1)
          .describe("Array of topic hex strings from the log"),
        data: z
          .string()
          .regex(/^0x[a-fA-F0-9]*$/, "Must be a hex string")
          .describe("The data field from the log"),
        abi: z.array(z.any()).describe("ABI array containing the event definition"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ topics, data, abi }) => {
      try {
        const decoded = viemDecodeEventLog({
          abi,
          topics: topics as [`0x${string}`, ...`0x${string}`[]],
          data: data as `0x${string}`,
        }) as { eventName: string; args: unknown };

        // Convert any BigInt values in args to strings for JSON serialization
        const serializedArgs = JSON.parse(
          JSON.stringify(decoded.args, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  eventName: decoded.eventName,
                  args: serializedArgs,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: true,
                  code: "DECODE_FAILED",
                  message: `Failed to decode event log: ${message}. Ensure the ABI contains the matching event definition for the provided topics.`,
                  tool: "decodeEventLog",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
