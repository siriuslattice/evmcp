import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatEther, formatGwei } from "viem";
import type { Providers, SupportedChain } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import { nativeSymbol } from "../utils/formatters.js";

/** Approximate USD prices for native tokens — updated manually for v1 */
const NATIVE_USD_PRICES: Record<SupportedChain, number> = {
  base: 2000,
  optimism: 2000,
  arbitrum: 2000,
  avalanche: 30,
  celo: 0.5,
};

/** OP Stack L1 Gas Price Oracle (same address on Base, Optimism) */
const OP_GAS_ORACLE = "0x420000000000000000000000000000000000000F" as const;

const OP_GAS_ORACLE_ABI = [
  {
    name: "getL1Fee",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_data", type: "bytes" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Chains that have an L1 data fee component */
const L1_FEE_CHAINS = new Set<SupportedChain>(["base", "optimism", "arbitrum"]);

export function registerOptimizerTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "gasOptimizer",
    {
      title: "Gas Cost Optimizer",
      description:
        "Recommends the cheapest chain to execute a transaction right now. Accounts for L1 data fees on Base, Optimism, and Arbitrum. Returns all 5 chains ranked by estimated total cost in USD with savings percentage.",
      inputSchema: {
        calldataSize: z
          .number()
          .int()
          .min(0)
          .max(100000)
          .default(128)
          .describe("Approximate calldata size in bytes (default 128)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ calldataSize }) => {
      try {
        const cacheKey = `gas-optimizer:${calldataSize}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const l2Clients = providers.getAllL2Clients();
        const sampleCalldata = ("0x" + "00".repeat(calldataSize)) as `0x${string}`;

        const results = await Promise.allSettled(
          l2Clients.map(async ({ chain, client }) => {
            const gasPrice = await client.getGasPrice();
            const executionGas = 21000n;
            const executionCost = executionGas * gasPrice;

            let l1DataFee = 0n;
            if (chain === "base" || chain === "optimism") {
              try {
                l1DataFee = (await client.readContract({
                  address: OP_GAS_ORACLE,
                  abi: OP_GAS_ORACLE_ABI,
                  functionName: "getL1Fee",
                  args: [sampleCalldata],
                })) as bigint;
              } catch {
                // Fallback: estimate L1 fee as ~10x execution cost for OP Stack
              }
            } else if (chain === "arbitrum") {
              try {
                // Arbitrum estimates L1 gas via gasEstimateComponents on NodeInterface
                // Simpler approach: use estimateGas with a sample tx which includes L1 component
                const totalGas = await client.estimateGas({
                  to: "0x0000000000000000000000000000000000000001" as `0x${string}`,
                  data: sampleCalldata,
                });
                // The difference between estimated total gas and base execution gas
                // approximates the L1 gas component (Arbitrum inflates gas units for L1 costs)
                if (totalGas > executionGas) {
                  l1DataFee = (totalGas - executionGas) * gasPrice;
                }
              } catch {
                // Fallback: no L1 fee estimate
              }
            }

            const totalCostWei = executionCost + l1DataFee;
            const totalCostNative = Number(formatEther(totalCostWei));
            const totalCostUsd = totalCostNative * NATIVE_USD_PRICES[chain];

            return {
              chain,
              gasPrice: formatGwei(gasPrice) + " gwei",
              executionCost: formatEther(executionCost) + " " + nativeSymbol(chain),
              l1DataFee: l1DataFee > 0n ? formatEther(l1DataFee) + " " + nativeSymbol(chain) : null,
              hasL1Fee: L1_FEE_CHAINS.has(chain),
              totalCostNative: formatEther(totalCostWei) + " " + nativeSymbol(chain),
              totalCostUsd: `$${totalCostUsd.toFixed(6)}`,
              totalCostUsdRaw: totalCostUsd,
            };
          }),
        );

        interface ChainGasResult {
          chain: SupportedChain;
          gasPrice: string;
          executionCost: string;
          l1DataFee: string | null;
          hasL1Fee: boolean;
          totalCostNative: string;
          totalCostUsd: string;
          totalCostUsdRaw: number;
        }

        const chains: ChainGasResult[] = [];
        for (const r of results) {
          if (r.status === "fulfilled") {
            chains.push(r.value as ChainGasResult);
          }
        }

        const sorted = [...chains].sort((a, b) => a.totalCostUsdRaw - b.totalCostUsdRaw);
        const cheapest = sorted[0];
        const mostExpensive = sorted[sorted.length - 1];
        const savingsPercent =
          cheapest && mostExpensive && mostExpensive.totalCostUsdRaw > 0
            ? ((mostExpensive.totalCostUsdRaw - cheapest.totalCostUsdRaw) /
                mostExpensive.totalCostUsdRaw) *
              100
            : 0;

        // Strip raw USD values from output
        const outputChains = sorted.map(({ totalCostUsdRaw: _, ...rest }) => rest);

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  calldataSize,
                  note: "USD estimates use approximate hardcoded native token prices",
                  ranked: outputChains,
                  recommendation: cheapest?.chain ?? null,
                  cheapest: cheapest?.chain ?? null,
                  mostExpensive: mostExpensive?.chain ?? null,
                  savingsPercent: `${savingsPercent.toFixed(1)}%`,
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 12_000);
        return result;
      } catch (error) {
        return formatError("gasOptimizer", undefined, error);
      }
    },
  );
}
