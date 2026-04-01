#!/usr/bin/env tsx
/**
 * refresh-cache.ts — Periodically updates CrossChainCache and EventAggregator
 * with real on-chain data from notable Avalanche C-Chain addresses.
 *
 * This generates legitimate on-chain activity (gas burn) while keeping
 * the companion contracts populated with useful, real-world data.
 *
 * Usage:
 *   pnpm tsx scripts/refresh-cache.ts                # Run once
 *   pnpm tsx scripts/refresh-cache.ts --loop 3600    # Run every hour (seconds)
 */
import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import { COMPANION_ADDRESSES } from "../src/contracts/addresses.js";
import CrossChainCacheABI from "../src/contracts/abis/CrossChainCache.json" with { type: "json" };
import EventAggregatorABI from "../src/contracts/abis/EventAggregator.json" with { type: "json" };

// ── Notable Avalanche C-Chain addresses to track ──
// These are real, high-activity contracts and wallets on Avalanche.
// Helper to ensure proper checksums
const addr = (a: string) => getAddress(a) as `0x${string}`;

const TRACKED_ADDRESSES: Array<{ address: `0x${string}`; label: string }> = [
  // DEX & DeFi
  { address: addr("0x9Ad6C38BE94206cA50bb0d90783181834C915350"), label: "Trader Joe Router" },
  { address: addr("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"), label: "Trader Joe Router v1" },
  { address: addr("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"), label: "WAVAX" },
  { address: addr("0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"), label: "JOE Token" },
  { address: addr("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"), label: "USDC (Avalanche)" },
  { address: addr("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"), label: "USDT (Avalanche)" },
  { address: addr("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB"), label: "WETH.e (Bridged ETH)" },
  { address: addr("0x152b9d0FdC40C096DE7b5Ae1E64edFAbBB38310F"), label: "WBTC.e (Bridged BTC)" },
  // Bridges & Infrastructure
  { address: addr("0xcA11bde05977b3631167028862bE2a173976CA11"), label: "Multicall3" },
  { address: addr("0x8731d54E9D02c286767d56ac03e8037C07e01e98"), label: "Stargate Bridge" },
  // Lending
  { address: addr("0x794a61358D6845594F94dc1DB02A252b5b4814aD"), label: "Aave V3 Pool" },
  { address: addr("0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C"), label: "Aave V3 Collector" },
  // Avalanche Foundation
  { address: "0x0000000000000000000000000000000000000000", label: "Zero Address (burn)" },
  // Our own contracts (self-referential tracking)
  { address: COMPANION_ADDRESSES.avalanche.MCPRegistry, label: "EVMCP MCPRegistry" },
  { address: COMPANION_ADDRESSES.avalanche.BatchQuery, label: "EVMCP BatchQuery" },
  { address: COMPANION_ADDRESSES.avalanche.EventAggregator, label: "EVMCP EventAggregator" },
  { address: COMPANION_ADDRESSES.avalanche.CrossChainCache, label: "EVMCP CrossChainCache" },
];

// Contracts to track event counts for
const EVENT_TARGETS: Array<{ address: `0x${string}`; label: string }> = [
  { address: addr("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"), label: "WAVAX" },
  { address: addr("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"), label: "USDC" },
  { address: addr("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"), label: "USDT" },
  { address: addr("0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"), label: "JOE" },
  { address: addr("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB"), label: "WETH.e" },
  { address: COMPANION_ADDRESSES.avalanche.MCPRegistry, label: "EVMCP MCPRegistry" },
];

const CHAIN = "avalanche" as const;
const BATCH_SIZE = 10; // addresses per batchUpdateSnapshots call

function log(msg: string) {
  process.stderr.write(`[${new Date().toISOString()}] ${msg}\n`);
}

async function run() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    log("ERROR: DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const key = process.env.ALCHEMY_API_KEY;
  const rpcUrl = process.env.AVALANCHE_RPC_URL
    || (key ? `https://avax-mainnet.g.alchemy.com/v2/${key}` : "https://api.avax.network/ext/bc/C/rpc");

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http(rpcUrl, { timeout: 15_000, retryCount: 3, retryDelay: 2_000 });

  const walletClient = createWalletClient({ account, chain: avalanche, transport });
  const publicClient = createPublicClient({ chain: avalanche, transport });

  const cacheAddress = COMPANION_ADDRESSES[CHAIN].CrossChainCache;
  const eventAggAddress = COMPANION_ADDRESSES[CHAIN].EventAggregator;

  // Check deployer balance
  const deployerBalance = await publicClient.getBalance({ address: account.address });
  log(`Deployer balance: ${formatEther(deployerBalance)} AVAX`);

  if (deployerBalance < BigInt(1e16)) { // < 0.01 AVAX
    log("WARNING: Low deployer balance, skipping to preserve gas");
    return;
  }

  // ── Step 1: Batch update balance snapshots ──
  log(`\n=== Updating CrossChainCache (${TRACKED_ADDRESSES.length} addresses) ===`);
  const currentBlock = await publicClient.getBlockNumber();

  for (let i = 0; i < TRACKED_ADDRESSES.length; i += BATCH_SIZE) {
    const batch = TRACKED_ADDRESSES.slice(i, i + BATCH_SIZE);

    // Fetch real balances
    const balances = await Promise.all(
      batch.map((a) => publicClient.getBalance({ address: a.address })),
    );

    const addresses = batch.map((a) => a.address);
    const blockNumbers = batch.map(() => currentBlock);

    try {
      const hash = await walletClient.writeContract({
        address: cacheAddress,
        abi: CrossChainCacheABI,
        functionName: "batchUpdateSnapshots",
        args: [addresses, balances, blockNumbers],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const batchLabels = batch.map((a) => a.label).join(", ");
      log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} addresses updated (gas: ${receipt.gasUsed})`);
      log(`    [${batchLabels}]`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${msg}`);
    }
  }

  // ── Step 2: Update event count summaries ──
  // Use public RPC for getLogs — Alchemy free tier has severe block range limits
  const publicRpcClient = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc", { timeout: 15_000, retryCount: 3, retryDelay: 2_000 }),
  });

  log(`\n=== Updating EventAggregator (${EVENT_TARGETS.length} contracts) ===`);

  for (const target of EVENT_TARGETS) {
    try {
      // Count recent logs (last 100 blocks ≈ ~3 minutes on Avalanche)
      const fromBlock = currentBlock > 100n ? currentBlock - 100n : 0n;
      const logs = await publicRpcClient.getLogs({
        address: target.address,
        fromBlock,
        toBlock: currentBlock,
      });

      const hash = await walletClient.writeContract({
        address: eventAggAddress,
        abi: EventAggregatorABI,
        functionName: "updateSummary",
        args: [target.address, BigInt(logs.length), currentBlock],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      log(`  ${target.label}: ${logs.length} events in last 5000 blocks (gas: ${receipt.gasUsed})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`  ${target.label} failed: ${msg}`);
    }
  }

  // ── Summary ──
  const endBalance = await publicClient.getBalance({ address: account.address });
  const spent = deployerBalance - endBalance;
  log(`\n=== Complete ===`);
  log(`Gas spent this run: ${formatEther(spent)} AVAX`);
  log(`Remaining balance: ${formatEther(endBalance)} AVAX`);
}

// ── CLI ──
const args = process.argv.slice(2);
const loopIdx = args.indexOf("--loop");
const loopSeconds = loopIdx !== -1 && args[loopIdx + 1] ? parseInt(args[loopIdx + 1], 10) : null;

async function main() {
  log("EVMCP Cache Refresh — Avalanche C-Chain");
  log(`Mode: ${loopSeconds ? `loop every ${loopSeconds}s` : "single run"}`);

  await run();

  if (loopSeconds && loopSeconds > 0) {
    setInterval(async () => {
      try {
        await run();
      } catch (error) {
        log(`Run failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, loopSeconds * 1000);
  }
}

main().catch((error) => {
  log(`Fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
