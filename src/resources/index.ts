import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Providers } from "../providers/multi-chain.js";
import type { Config } from "../config.js";
import { registerChainStatusResource } from "./chain-status.js";
import { registerGasPricesResource } from "./gas-prices.js";
import { registerTokenListResource } from "./token-list.js";
import { registerSupportedChainsResource } from "./supported-chains.js";

export function registerAllResources(
  server: McpServer,
  providers: Providers,
  _config: Config,
) {
  registerChainStatusResource(server, providers);
  registerGasPricesResource(server, providers);
  registerTokenListResource(server, providers);
  registerSupportedChainsResource(server, providers);
}
