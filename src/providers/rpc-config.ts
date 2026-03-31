import type { Config } from "../config.js";
import type { AllChains } from "./multi-chain.js";
import { logger } from "../utils/logger.js";

const ALCHEMY_PREFIXES: Record<AllChains, string> = {
  ethereum: "eth-mainnet",
  base: "base-mainnet",
  optimism: "opt-mainnet",
  avalanche: "avax-mainnet",
  celo: "celo-mainnet",
};

const PUBLIC_FALLBACKS: Record<AllChains, string> = {
  ethereum: "https://eth.llamarpc.com",
  base: "https://mainnet.base.org",
  optimism: "https://mainnet.optimism.io",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  celo: "https://forno.celo.org",
};

export function resolveRpcUrl(chain: AllChains, config: Config): string {
  const overrides: Record<AllChains, string | undefined> = {
    ethereum: config.ETHEREUM_RPC_URL,
    base: config.BASE_RPC_URL,
    optimism: config.OPTIMISM_RPC_URL,
    avalanche: config.AVALANCHE_RPC_URL,
    celo: config.CELO_RPC_URL,
  };

  if (overrides[chain]) return overrides[chain]!;

  if (config.ALCHEMY_API_KEY) {
    return `https://${ALCHEMY_PREFIXES[chain]}.g.alchemy.com/v2/${config.ALCHEMY_API_KEY}`;
  }

  logger.warn(`Using public fallback RPC for ${chain} — expect rate limiting`);
  return PUBLIC_FALLBACKS[chain];
}
