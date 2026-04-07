import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createProviders } from "./providers/multi-chain.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import { logger } from "./utils/logger.js";

const config = loadConfig();
const providers = createProviders(config);

const server = new McpServer({
  name: "evmcp",
  version: "0.2.0",
});

registerAllTools(server, providers, config);
registerAllResources(server, providers, config);
registerAllPrompts(server);

async function main() {
  logger.info("EVMCP server starting...");

  if (config.TRANSPORT === "http") {
    const { startHttpTransport } = await import("./transports/http.js");
    await startHttpTransport(server, config.HTTP_PORT, config);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("EVMCP server connected via stdio");
  }
}

main().catch((error) => {
  logger.error("Fatal error starting server", error);
  process.exit(1);
});
