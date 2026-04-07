import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Providers } from "../providers/multi-chain.js";
import { COMPANION_ADDRESSES } from "../contracts/addresses.js";

/** Static data for all supported chains */
const SUPPORTED_CHAINS_DATA = {
  chains: [
    {
      name: "Base",
      chain: "base",
      chainId: 8453,
      nativeSymbol: "ETH",
      blockExplorer: "https://basescan.org",
      companionContracts: COMPANION_ADDRESSES.base,
    },
    {
      name: "Optimism",
      chain: "optimism",
      chainId: 10,
      nativeSymbol: "ETH",
      blockExplorer: "https://optimistic.etherscan.io",
      companionContracts: COMPANION_ADDRESSES.optimism,
    },
    {
      name: "Avalanche C-Chain",
      chain: "avalanche",
      chainId: 43114,
      nativeSymbol: "AVAX",
      blockExplorer: "https://snowscan.xyz",
      companionContracts: COMPANION_ADDRESSES.avalanche,
    },
    {
      name: "Celo",
      chain: "celo",
      chainId: 42220,
      nativeSymbol: "CELO",
      blockExplorer: "https://celoscan.io",
      companionContracts: COMPANION_ADDRESSES.celo,
    },
    {
      name: "Arbitrum One",
      chain: "arbitrum",
      chainId: 42161,
      nativeSymbol: "ETH",
      blockExplorer: "https://arbiscan.io",
      companionContracts: COMPANION_ADDRESSES.arbitrum,
    },
  ],
  ensChain: {
    name: "Ethereum",
    chain: "ethereum",
    chainId: 1,
    nativeSymbol: "ETH",
    note: "Used exclusively for ENS resolution (read-only)",
  },
};

/** Registers the evmcp://chains static resource */
export function registerSupportedChainsResource(server: McpServer, _providers: Providers) {
  const data = JSON.stringify(SUPPORTED_CHAINS_DATA, null, 2);

  server.registerResource(
    "supported-chains",
    "evmcp://chains",
    {
      title: "Supported Chains",
      description:
        "All supported EVM chains with chain IDs, native symbols, and companion contract addresses",
      mimeType: "application/json",
    },
    async (uri) => {
      return {
        contents: [{ uri: uri.href, text: data, mimeType: "application/json" }],
      };
    },
  );
}
