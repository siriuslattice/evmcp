import type { Config } from "../config.js";
import { TOOL_PRICES, FREE_TOOLS } from "./pricing.js";

/** Build server metadata for .well-known/mcp/server.json auto-discovery */
export function buildServerMetadata(config: Config) {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: "io.github.siriuslattice/evmcp",
    version: "0.2.0",
    description: "Multi-chain EVM blockchain data with companion smart contracts",
    repository: {
      url: "https://github.com/SiriusLattice/evmcp",
      source: "github",
    },
    packages: [
      {
        registryType: "npm",
        identifier: "evmcp",
        version: "0.2.0",
        transport: { type: "streamableHttp", url: "/mcp" },
      },
    ],
    ...(config.X402_ENABLED && {
      x402: {
        facilitatorUrl: config.X402_FACILITATOR_URL,
        payTo: config.X402_PAYEE_ADDRESS,
        network: "eip155:8453",
        tools: Object.fromEntries(
          Object.entries(TOOL_PRICES).map(([name, price]) => [name, { price }]),
        ),
        freeTools: [...FREE_TOOLS],
      },
    }),
  };
}
