import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo"] as const;

/** Registers the audit-contract prompt */
export function registerAuditContractPrompt(server: McpServer) {
  server.registerPrompt(
    "audit-contract",
    {
      title: "Audit Contract",
      description: "Perform a basic inspection and audit workflow for a smart contract",
      argsSchema: {
        contractAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Chain where the contract is deployed"),
      },
    },
    async ({ contractAddress, chain }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Audit the smart contract at ${contractAddress} on ${chain}.`,
              "",
              "Please perform the following steps:",
              "1. Use getContractCode to verify the contract is deployed and get bytecode info",
              "2. Use getContractEvents to check recent activity and event patterns",
              "3. Use getStorageAt to inspect key storage slots (slot 0 through 5)",
              "4. Check if the same contract is deployed on other chains using isContractDeployed",
              "5. Summarize findings including:",
              "   - Whether the contract is verified",
              "   - Bytecode size and complexity estimate",
              "   - Recent event activity",
              "   - Cross-chain deployment status",
              "   - Any potential concerns or observations",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
