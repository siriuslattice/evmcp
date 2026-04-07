import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
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

interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

/** Hardcoded popular tokens per chain for v1 */
const POPULAR_TOKENS: Record<SupportedChain, TokenInfo[]> = {
  base: [
    { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
    { symbol: "cbETH", name: "Coinbase Wrapped Staked ETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18 },
  ],
  optimism: [
    { symbol: "USDC", name: "USD Coin", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
    { symbol: "OP", name: "Optimism", address: "0x4200000000000000000000000000000000000042", decimals: 18 },
  ],
  avalanche: [
    { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    { symbol: "WAVAX", name: "Wrapped AVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18 },
    { symbol: "DAI.e", name: "Dai Stablecoin (bridged)", address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", decimals: 18 },
    { symbol: "WETH.e", name: "Wrapped Ether (bridged)", address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18 },
  ],
  celo: [
    { symbol: "USDC", name: "USD Coin", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6 },
    { symbol: "cUSD", name: "Celo Dollar", address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18 },
    { symbol: "cEUR", name: "Celo Euro", address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", decimals: 18 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207", decimals: 18 },
  ],
  arbitrum: [
    { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    { symbol: "GMX", name: "GMX", address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", decimals: 18 },
  ],
};

/** Registers the chain://{chainId}/tokens/popular resource template */
export function registerTokenListResource(server: McpServer, _providers: Providers) {
  server.registerResource(
    "token-list",
    new ResourceTemplate("chain://{chainId}/tokens/popular", {
      list: async () => ({
        resources: SUPPORTED_CHAIN_IDS.map((id) => ({
          uri: `chain://${id}/tokens/popular`,
          name: `${CHAIN_ID_MAP[id]} popular tokens`,
          description: `Popular token addresses on ${CHAIN_ID_MAP[id]}`,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Popular Tokens",
      description: "Top tokens with addresses and decimals for a chain (hardcoded for v1)",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const chainId = String(variables.chainId);
      const chain = CHAIN_ID_MAP[chainId];
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const cacheKey = `resource:tokens:${chain}`;
      const cached = cache.get<string>(cacheKey);
      if (cached) {
        return {
          contents: [{ uri: uri.href, text: cached, mimeType: "application/json" }],
        };
      }

      const tokens = POPULAR_TOKENS[chain];
      const data = JSON.stringify(
        {
          chain,
          chainId,
          tokens,
        },
        null,
        2,
      );

      cache.set(cacheKey, data, 3_600_000); // 1 hour

      return {
        contents: [{ uri: uri.href, text: data, mimeType: "application/json" }],
      };
    },
  );
}
