import { createPublicClient, http, type PublicClient, type Chain } from "viem";
import { mainnet, base, optimism, avalanche, celo, arbitrum } from "viem/chains";
import {
  baseSepolia,
  optimismSepolia,
  avalancheFuji,
  celoAlfajores,
  arbitrumSepolia,
} from "viem/chains";
import type { Config } from "../config.js";
import { resolveRpcUrl } from "./rpc-config.js";
import { logger } from "../utils/logger.js";

export type SupportedChain = "base" | "optimism" | "avalanche" | "celo" | "arbitrum";
export type AllChains = SupportedChain | "ethereum";

const CHAIN_MAP: Record<AllChains, Chain> = {
  ethereum: mainnet,
  base: base,
  optimism: optimism,
  avalanche: avalanche,
  celo: celo,
  arbitrum: arbitrum,
};

const TESTNET_MAP: Record<AllChains, Chain> = {
  ethereum: mainnet,
  base: baseSepolia,
  optimism: optimismSepolia,
  avalanche: avalancheFuji,
  celo: celoAlfajores,
  arbitrum: arbitrumSepolia,
};

export interface Providers {
  getClient(chain: AllChains): PublicClient;
  getAllL2Clients(): Array<{ chain: SupportedChain; client: PublicClient }>;
  healthCheck(): Promise<Record<AllChains, boolean>>;
}

export function createProviders(config: Config): Providers {
  const clients = new Map<AllChains, PublicClient>();
  const chainDefs = config.USE_TESTNETS ? TESTNET_MAP : CHAIN_MAP;

  function getClient(chain: AllChains): PublicClient {
    if (!clients.has(chain)) {
      const rpcUrl = resolveRpcUrl(chain, config);
      const client = createPublicClient({
        chain: chainDefs[chain],
        transport: http(rpcUrl, {
          timeout: 10_000,
          retryCount: 3,
          retryDelay: 1_000,
        }),
      });
      clients.set(chain, client as PublicClient);
    }
    return clients.get(chain)!;
  }

  function getAllL2Clients() {
    const l2Chains: SupportedChain[] = ["base", "optimism", "avalanche", "celo", "arbitrum"];
    return l2Chains.map((chain) => ({ chain, client: getClient(chain) }));
  }

  async function healthCheck(): Promise<Record<AllChains, boolean>> {
    const chains: AllChains[] = ["ethereum", "base", "optimism", "avalanche", "celo", "arbitrum"];
    const results = await Promise.allSettled(
      chains.map(async (chain) => {
        const client = getClient(chain);
        await client.getBlockNumber();
        return chain;
      }),
    );
    const status: Record<string, boolean> = {};
    results.forEach((result, i) => {
      status[chains[i]] = result.status === "fulfilled";
    });
    logger.debug("Health check results", status);
    return status as Record<AllChains, boolean>;
  }

  return { getClient, getAllL2Clients, healthCheck };
}
