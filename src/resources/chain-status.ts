import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatGwei } from "viem";
import type { Providers, SupportedChain } from "../providers/multi-chain.js";
import { cache } from "../utils/cache.js";

const CHAIN_ID_MAP: Record<string, SupportedChain> = {
  "8453": "base",
  "10": "optimism",
  "43114": "avalanche",
  "42220": "celo",
  "42161": "arbitrum",
};

const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_ID_MAP);

/** Registers the chain://{chainId}/status resource template */
export function registerChainStatusResource(server: McpServer, providers: Providers) {
  server.registerResource(
    "chain-status",
    new ResourceTemplate("chain://{chainId}/status", {
      list: async () => ({
        resources: SUPPORTED_CHAIN_IDS.map((id) => ({
          uri: `chain://${id}/status`,
          name: `${CHAIN_ID_MAP[id]} status`,
          description: `Current block height and gas price for ${CHAIN_ID_MAP[id]}`,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Chain Status",
      description: "Current block height and gas price for a chain",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const chainId = String(variables.chainId);
      const chain = CHAIN_ID_MAP[chainId];
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const cacheKey = `resource:status:${chain}`;
      const cached = cache.get<string>(cacheKey);
      if (cached) {
        return {
          contents: [{ uri: uri.href, text: cached, mimeType: "application/json" }],
        };
      }

      const client = providers.getClient(chain);
      const [blockNumber, gasPrice] = await Promise.all([
        client.getBlockNumber(),
        client.getGasPrice(),
      ]);

      const data = JSON.stringify(
        {
          chain,
          chainId,
          blockNumber: blockNumber.toString(),
          gasPrice: gasPrice.toString(),
          gasPriceGwei: formatGwei(gasPrice),
        },
        null,
        2,
      );

      cache.set(cacheKey, data, 12_000);

      return {
        contents: [{ uri: uri.href, text: data, mimeType: "application/json" }],
      };
    },
  );
}
