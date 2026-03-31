#!/usr/bin/env tsx
import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, optimism, avalanche, celo } from "viem/chains";
import { COMPANION_ADDRESSES, isDeployed } from "../src/contracts/addresses.js";
import type { SupportedChain } from "../src/providers/multi-chain.js";
import MCPRegistryABI from "../src/contracts/abis/MCPRegistry.json" with { type: "json" };
import CrossChainCacheABI from "../src/contracts/abis/CrossChainCache.json" with { type: "json" };

const CHAIN_MAP: Record<SupportedChain, Chain> = {
  base,
  optimism,
  avalanche,
  celo,
};

const TOOLS = [
  { name: "getBalance", description: "Get the native token balance of an address on a specific chain" },
  { name: "getTokenBalance", description: "Get ERC20 token balance for an address on a specific chain" },
  { name: "getMultiChainBalance", description: "Get native balance across all 4 chains in parallel" },
  { name: "getBlock", description: "Get block details by hash on a specific chain" },
  { name: "getBlockByNumber", description: "Get block details by number or latest" },
  { name: "getLatestBlock", description: "Get the latest block number and timestamp for a chain" },
  { name: "getTransaction", description: "Get transaction details by hash" },
  { name: "getTransactionReceipt", description: "Get transaction receipt with status, gasUsed, and logs" },
  { name: "decodeTransaction", description: "Decode transaction function call and parameters" },
  { name: "readContract", description: "Call a read-only contract function and return decoded result" },
  { name: "getContractCode", description: "Check if an address has contract code and get bytecode metadata" },
  { name: "getStorageAt", description: "Read raw storage slot value at an address" },
  { name: "getERC20Info", description: "Get ERC20 token metadata via Multicall3 batch" },
  { name: "getTokenAllowance", description: "Get ERC20 allowance for an owner/spender pair" },
  { name: "getGasPrice", description: "Get current gas price and EIP-1559 fee data for a chain" },
  { name: "estimateGas", description: "Estimate gas cost for a transaction" },
  { name: "compareGasAcrossChains", description: "Compare current gas prices across all 4 supported chains" },
  { name: "resolveENS", description: "Resolve an ENS name to an address via Ethereum L1" },
  { name: "lookupAddress", description: "Reverse lookup an address to its ENS name" },
  { name: "getContractEvents", description: "Get decoded event logs for a contract" },
  { name: "decodeEventLog", description: "Decode a raw event log using a provided ABI" },
  { name: "getChainInfo", description: "Get chain metadata including block height and native symbol" },
  { name: "isContractDeployed", description: "Check if a contract is deployed across all supported chains" },
  { name: "healthCheck", description: "Test all RPC connections and report status" },
  { name: "batchQuery", description: "Execute batch read calls via Multicall3" },
] as const;

const VERSION = "0.1.0";

function resolveRpcUrl(chain: SupportedChain): string {
  const overrides: Record<SupportedChain, string | undefined> = {
    base: process.env.BASE_RPC_URL,
    optimism: process.env.OPTIMISM_RPC_URL,
    avalanche: process.env.AVALANCHE_RPC_URL,
    celo: process.env.CELO_RPC_URL,
  };
  if (overrides[chain]) return overrides[chain]!;

  const key = process.env.ALCHEMY_API_KEY;
  if (key) {
    const prefixes: Record<SupportedChain, string> = {
      base: "base-mainnet",
      optimism: "opt-mainnet",
      avalanche: "avax-mainnet",
      celo: "celo-mainnet",
    };
    return `https://${prefixes[chain]}.g.alchemy.com/v2/${key}`;
  }

  throw new Error(`No RPC URL configured for ${chain}`);
}

async function populateRegistry(chain: SupportedChain) {
  if (!isDeployed(chain, "MCPRegistry")) {
    process.stderr.write(`MCPRegistry not deployed on ${chain}\n`);
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    process.stderr.write("DEPLOYER_PRIVATE_KEY not set\n");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = resolveRpcUrl(chain);

  const walletClient = createWalletClient({
    account,
    chain: CHAIN_MAP[chain],
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chain],
    transport: http(rpcUrl),
  });

  const registryAddress = COMPANION_ADDRESSES[chain].MCPRegistry;

  process.stderr.write(`Populating registry on ${chain} at ${registryAddress}...\n`);

  for (const tool of TOOLS) {
    try {
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: MCPRegistryABI,
        functionName: "registerTool",
        args: [tool.name, tool.description, VERSION],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      process.stderr.write(`  Registered: ${tool.name}\n`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Tool already registered")) {
        process.stderr.write(`  Skipped (already registered): ${tool.name}\n`);
      } else {
        process.stderr.write(`  Failed: ${tool.name} — ${msg}\n`);
      }
    }
  }

  process.stderr.write(`Done. Registered ${TOOLS.length} tools on ${chain}.\n`);
}

async function updateCache(chain: SupportedChain, address: string) {
  if (!isDeployed(chain, "CrossChainCache")) {
    process.stderr.write(`CrossChainCache not deployed on ${chain}\n`);
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    process.stderr.write("DEPLOYER_PRIVATE_KEY not set\n");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = resolveRpcUrl(chain);

  const walletClient = createWalletClient({
    account,
    chain: CHAIN_MAP[chain],
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chain],
    transport: http(rpcUrl),
  });

  const cacheAddress = COMPANION_ADDRESSES[chain].CrossChainCache;
  const balance = await publicClient.getBalance({ address: address as `0x${string}` });
  const blockNumber = await publicClient.getBlockNumber();

  const hash = await walletClient.writeContract({
    address: cacheAddress,
    abi: CrossChainCacheABI,
    functionName: "updateSnapshot",
    args: [address as `0x${string}`, balance, blockNumber],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  process.stderr.write(`Updated snapshot for ${address} on ${chain}: balance=${balance}, block=${blockNumber}\n`);
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

function getFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const SUPPORTED_CHAINS: SupportedChain[] = ["base", "optimism", "avalanche", "celo"];

if (command === "populate-registry") {
  const chain = getFlag("--chain") as SupportedChain | undefined;
  if (!chain || !SUPPORTED_CHAINS.includes(chain)) {
    process.stderr.write("Usage: admin.ts populate-registry --chain <base|optimism|avalanche|celo>\n");
    process.exit(1);
  }
  populateRegistry(chain);
} else if (command === "update-cache") {
  const chain = getFlag("--chain") as SupportedChain | undefined;
  const address = getFlag("--address");
  if (!chain || !SUPPORTED_CHAINS.includes(chain) || !address) {
    process.stderr.write("Usage: admin.ts update-cache --chain <chain> --address <0x...>\n");
    process.exit(1);
  }
  updateCache(chain, address);
} else {
  process.stderr.write("EVMCP Admin CLI\n\n");
  process.stderr.write("Commands:\n");
  process.stderr.write("  populate-registry --chain <chain>              Register all 25 tools\n");
  process.stderr.write("  update-cache --chain <chain> --address <addr>  Update balance snapshot\n");
  process.exit(1);
}
