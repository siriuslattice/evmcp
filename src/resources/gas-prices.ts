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
};

const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_ID_MAP);

/** Registers the chain://{chainId}/gas resource template */
export function registerGasPricesResource(server: McpServer, providers: Providers) {
  server.registerResource(
    "gas-prices",
    new ResourceTemplate("chain://{chainId}/gas", {
      list: async () => ({
        resources: SUPPORTED_CHAIN_IDS.map((id) => ({
          uri: `chain://${id}/gas`,
          name: `${CHAIN_ID_MAP[id]} gas prices`,
          description: `Current gas prices for ${CHAIN_ID_MAP[id]}`,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Gas Prices",
      description: "Current base fee, gas price, and priority fee in gwei for a chain",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const chainId = String(variables.chainId);
      const chain = CHAIN_ID_MAP[chainId];
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const cacheKey = `resource:gas:${chain}`;
      const cached = cache.get<string>(cacheKey);
      if (cached) {
        return {
          contents: [{ uri: uri.href, text: cached, mimeType: "application/json" }],
        };
      }

      const client = providers.getClient(chain);
      const [gasPrice, block] = await Promise.all([
        client.getGasPrice(),
        client.getBlock({ blockTag: "latest" }),
      ]);

      const baseFee = block.baseFeePerGas ?? 0n;

      const data = JSON.stringify(
        {
          chain,
          chainId,
          gasPrice: gasPrice.toString(),
          gasPriceGwei: formatGwei(gasPrice),
          baseFee: baseFee.toString(),
          baseFeeGwei: formatGwei(baseFee),
          blockNumber: block.number?.toString() ?? "unknown",
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
