import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** Registers the analyze-wallet prompt */
export function registerAnalyzeWalletPrompt(server: McpServer) {
  server.registerPrompt(
    "analyze-wallet",
    {
      title: "Analyze Wallet",
      description: "Perform a comprehensive multi-chain analysis of a wallet address",
      argsSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
      },
    },
    async ({ address }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Analyze the wallet at address ${address} across all supported chains.`,
              "",
              "Please perform the following steps:",
              "1. Use getMultiChainBalance to check native token balances on all chains",
              "2. Use crossChainActivity to see transaction counts per chain",
              "3. Identify which chain has the most activity",
              "4. Check if this address has any contracts deployed using isContractDeployed",
              "5. Summarize the wallet's cross-chain profile",
              "",
              "Format the results as a clear summary with balances and activity per chain.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
