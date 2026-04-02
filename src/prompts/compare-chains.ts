import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Registers the compare-chains prompt */
export function registerCompareChainsPrompt(server: McpServer) {
  server.registerPrompt(
    "compare-chains",
    {
      title: "Compare Chains",
      description: "Compare gas costs, speed, and characteristics across all supported chains",
    },
    async () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Compare all supported chains (Base, Optimism, Avalanche, Celo) for deployment decisions.",
              "",
              "Please perform the following steps:",
              "1. Use compareGasAcrossChains to get current gas prices on all chains",
              "2. Use getLatestBlock on each chain to check current block numbers and timestamps",
              "3. Use getChainInfo on each chain for chain characteristics",
              "4. Compare and rank the chains by:",
              "   - Gas cost (cheapest to most expensive, including L1 data fees for Base/OP)",
              "   - Block time and finality",
              "   - Native token and fee currency support (Celo supports multiple fee currencies)",
              "5. Provide a recommendation table summarizing which chain is best for:",
              "   - Lowest cost transactions",
              "   - Fastest confirmations",
              "   - Best developer ecosystem",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
