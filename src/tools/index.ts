import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Providers } from "../providers/multi-chain.js";
import type { Config } from "../config.js";
import { registerBalanceTools } from "./balance.js";
import { registerBlockTools } from "./block.js";
import { registerTransactionTools } from "./transaction.js";
import { registerGasTools } from "./gas.js";
import { registerChainTools } from "./chain.js";

export function registerAllTools(server: McpServer, providers: Providers, _config: Config) {
  registerBalanceTools(server, providers);
  registerBlockTools(server, providers);
  registerTransactionTools(server, providers);
  registerGasTools(server, providers);
  registerChainTools(server, providers);
}
