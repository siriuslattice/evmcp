import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Providers } from "../providers/multi-chain.js";
import type { Config } from "../config.js";
import { registerBalanceTools } from "./balance.js";
import { registerBlockTools } from "./block.js";
import { registerTransactionTools } from "./transaction.js";
import { registerContractTools } from "./contract.js";
import { registerTokenTools } from "./token.js";
import { registerGasTools } from "./gas.js";
import { registerENSTools } from "./ens.js";
import { registerEventTools } from "./events.js";
import { registerChainTools } from "./chain.js";
import { registerBatchTools } from "./batch.js";
import { registerCrossChainTools } from "./cross-chain.js";
import { registerRegistryTools } from "./registry.js";
import { registerOptimizerTools } from "./optimizer.js";

export function registerAllTools(server: McpServer, providers: Providers, _config: Config) {
  registerBalanceTools(server, providers);
  registerBlockTools(server, providers);
  registerTransactionTools(server, providers);
  registerContractTools(server, providers);
  registerTokenTools(server, providers);
  registerGasTools(server, providers);
  registerENSTools(server, providers);
  registerEventTools(server, providers);
  registerChainTools(server, providers);
  registerBatchTools(server, providers);
  registerCrossChainTools(server, providers);
  registerRegistryTools(server, providers);
  registerOptimizerTools(server, providers);
}
