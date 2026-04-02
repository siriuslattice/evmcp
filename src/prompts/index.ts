import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnalyzeWalletPrompt } from "./analyze-wallet.js";
import { registerAuditContractPrompt } from "./audit-contract.js";
import { registerCompareChainsPrompt } from "./compare-chains.js";
import { registerInvestigateTxPrompt } from "./investigate-tx.js";

export function registerAllPrompts(server: McpServer) {
  registerAnalyzeWalletPrompt(server);
  registerAuditContractPrompt(server);
  registerCompareChainsPrompt(server);
  registerInvestigateTxPrompt(server);
}
