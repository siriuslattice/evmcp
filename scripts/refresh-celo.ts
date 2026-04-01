#!/usr/bin/env tsx
/**
 * refresh-celo.ts — Updates CrossChainCache and EventAggregator on Celo
 * with real on-chain data. Optimized for TRANSACTION COUNT (not gas burn)
 * to progress toward Celo Agent Visa Work tier (1,000 tx threshold).
 *
 * Uses individual updateSnapshot calls instead of batch to maximize tx count.
 *
 * Usage:
 *   pnpm tsx scripts/refresh-celo.ts                # Run once
 *   pnpm tsx scripts/refresh-celo.ts --loop 900     # Run every 15 minutes
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
import { celo } from "viem/chains";
import { COMPANION_ADDRESSES } from "../src/contracts/addresses.js";
import CrossChainCacheABI from "../src/contracts/abis/CrossChainCache.json" with { type: "json" };
import EventAggregatorABI from "../src/contracts/abis/EventAggregator.json" with { type: "json" };

const addr = (a: string) => getAddress(a) as `0x${string}`;

// ── Notable Celo addresses to track ──
const TRACKED_ADDRESSES: Array<{ address: `0x${string}`; label: string }> = [
  // Celo native tokens
  { address: addr("0x471EcE3750Da237f93B8E339c536989b8978a438"), label: "CELO Token" },
  { address: addr("0x765DE816845861e75A25fCA122bb6898B8B1282a"), label: "cUSD" },
  { address: addr("0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73"), label: "cEUR" },
  { address: addr("0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787"), label: "cREAL" },
  // DEX & DeFi
  { address: addr("0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121"), label: "Ubeswap Router" },
  { address: addr("0x1a8Dbe5958c597a744Ba51763AbEBD3355996c3e"), label: "Mento Broker" },
  { address: addr("0x87647780180B8f55980C7D3fFeFe08a9B29e9aE1"), label: "Mento Reserve" },
  // Infrastructure
  { address: addr("0xcA11bde05977b3631167028862bE2a173976CA11"), label: "Multicall3" },
  { address: addr("0x4200000000000000000000000000000000000042"), label: "Celo OP Token" },
  // Lending
  { address: addr("0x970b12522CA9b4054807a2c5B736149a5BE6f670"), label: "Moola Market" },
  // Staking
  { address: addr("0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E"), label: "stCELO" },
  // Bridges
  { address: addr("0x2dCCDB493827E15a5dC8f8b72147E6c4A5620857"), label: "AllBridge" },
  // Zero address
  { address: "0x0000000000000000000000000000000000000000", label: "Zero Address" },
  // Our own contracts
  { address: COMPANION_ADDRESSES.celo.MCPRegistry, label: "EVMCP MCPRegistry" },
  { address: COMPANION_ADDRESSES.celo.BatchQuery, label: "EVMCP BatchQuery" },
  { address: COMPANION_ADDRESSES.celo.EventAggregator, label: "EVMCP EventAggregator" },
  { address: COMPANION_ADDRESSES.celo.CrossChainCache, label: "EVMCP CrossChainCache" },
];

// Contracts to track event counts for
const EVENT_TARGETS: Array<{ address: `0x${string}`; label: string }> = [
  { address: addr("0x471EcE3750Da237f93B8E339c536989b8978a438"), label: "CELO Token" },
  { address: addr("0x765DE816845861e75A25fCA122bb6898B8B1282a"), label: "cUSD" },
  { address: addr("0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73"), label: "cEUR" },
  { address: addr("0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787"), label: "cREAL" },
  { address: addr("0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E"), label: "stCELO" },
  { address: COMPANION_ADDRESSES.celo.MCPRegistry, label: "EVMCP MCPRegistry" },
];

function log(msg: string) {
  process.stderr.write(`[${new Date().toISOString()}] ${msg}\n`);
}

async function run() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    log("ERROR: DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  // Use public Celo RPC to avoid Alchemy rate limits
  const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http(rpcUrl, { timeout: 15_000, retryCount: 3, retryDelay: 2_000 });

  const walletClient = createWalletClient({ account, chain: celo, transport });
  const publicClient = createPublicClient({ chain: celo, transport });

  const cacheAddress = COMPANION_ADDRESSES.celo.CrossChainCache;
  const eventAggAddress = COMPANION_ADDRESSES.celo.EventAggregator;

  const deployerBalance = await publicClient.getBalance({ address: account.address });
  log(`Deployer balance: ${formatEther(deployerBalance)} CELO`);

  if (deployerBalance < BigInt(1e17)) { // < 0.1 CELO
    log("WARNING: Low deployer balance, skipping to preserve gas");
    return;
  }

  let txCount = 0;

  // ── Step 1: Individual balance snapshot updates (1 tx per address) ──
  log(`\n=== Updating CrossChainCache — ${TRACKED_ADDRESSES.length} individual txs ===`);
  const currentBlock = await publicClient.getBlockNumber();

  for (const target of TRACKED_ADDRESSES) {
    try {
      const balance = await publicClient.getBalance({ address: target.address });

      const hash = await walletClient.writeContract({
        address: cacheAddress,
        abi: CrossChainCacheABI,
        functionName: "updateSnapshot",
        args: [target.address, balance, currentBlock],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txCount++;
      log(`  [${txCount}] ${target.label}: ${formatEther(balance)} CELO`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`  FAIL ${target.label}: ${msg}`);
    }
  }

  // ── Step 2: Update event count summaries (1 tx per contract) ──
  log(`\n=== Updating EventAggregator — ${EVENT_TARGETS.length} contracts ===`);

  for (const target of EVENT_TARGETS) {
    try {
      // Celo block time is ~5s, so 100 blocks ≈ 8 minutes
      const fromBlock = currentBlock > 100n ? currentBlock - 100n : 0n;
      const logs = await publicClient.getLogs({
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
      await publicClient.waitForTransactionReceipt({ hash });
      txCount++;
      log(`  [${txCount}] ${target.label}: ${logs.length} events in last 100 blocks`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`  FAIL ${target.label}: ${msg}`);
    }
  }

  // ── Summary ──
  const endBalance = await publicClient.getBalance({ address: account.address });
  const spent = deployerBalance - endBalance;
  log(`\n=== Complete ===`);
  log(`Transactions this run: ${txCount}`);
  log(`Gas spent: ${formatEther(spent)} CELO`);
  log(`Remaining balance: ${formatEther(endBalance)} CELO`);
}

// ── CLI ──
const args = process.argv.slice(2);
const loopIdx = args.indexOf("--loop");
const loopSeconds = loopIdx !== -1 && args[loopIdx + 1] ? parseInt(args[loopIdx + 1], 10) : null;

async function main() {
  log("EVMCP Cache Refresh — Celo (tx-count optimized)");
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
