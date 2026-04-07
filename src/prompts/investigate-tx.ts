import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

/** Registers the investigate-tx prompt */
export function registerInvestigateTxPrompt(server: McpServer) {
  server.registerPrompt(
    "investigate-tx",
    {
      title: "Investigate Transaction",
      description: "Decode, analyze, and trace a transaction in detail",
      argsSchema: {
        txHash: z
          .string()
          .regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid 0x transaction hash"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Chain where the transaction occurred"),
      },
    },
    async ({ txHash, chain }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Investigate transaction ${txHash} on ${chain}.`,
              "",
              "Please perform the following steps:",
              "1. Use getTransaction to get the full transaction details",
              "2. Use getTransactionReceipt to get the receipt with status, gas used, and logs",
              "3. Use decodeTransaction to attempt decoding the function call and parameters",
              "4. Analyze the transaction logs/events from the receipt",
              "5. Check the sender and recipient addresses:",
              "   - Use getBalance to check their current balances",
              "   - Use getContractCode to determine if they are contracts or EOAs",
              "6. Summarize the investigation:",
              "   - What did this transaction do?",
              "   - Did it succeed or fail?",
              "   - How much gas was used and what did it cost?",
              "   - What events were emitted?",
              "   - Any notable observations about the addresses involved",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
