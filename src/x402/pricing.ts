/** Price per tool call in USD (settled as USDC on Base via x402) */
export const TOOL_PRICES: Record<string, string> = {
  // Tier 1 — Basic single-chain reads ($0.001)
  getBalance: "$0.001",
  getTokenBalance: "$0.001",
  getBlock: "$0.001",
  getBlockByNumber: "$0.001",
  getLatestBlock: "$0.001",
  getTransaction: "$0.001",
  getTransactionReceipt: "$0.001",
  decodeTransaction: "$0.001",
  readContract: "$0.001",
  getContractCode: "$0.001",
  getStorageAt: "$0.001",
  getGasPrice: "$0.001",
  estimateGas: "$0.001",
  getERC20Info: "$0.001",
  getTokenAllowance: "$0.001",
  getChainInfo: "$0.001",
  resolveENS: "$0.001",
  lookupAddress: "$0.001",
  getContractEvents: "$0.001",
  decodeEventLog: "$0.001",

  // Tier 2 — Multi-chain parallel reads ($0.005)
  getMultiChainBalance: "$0.005",
  compareGasAcrossChains: "$0.005",
  compareBalances: "$0.005",
  crossChainActivity: "$0.005",
  isContractDeployed: "$0.005",

  // Tier 3 — Companion contract reads ($0.002)
  queryRegistry: "$0.002",
  batchQuery: "$0.005",

  // Tier 4 — Computed intelligence ($0.02)
  gasOptimizer: "$0.02",
};

/** These tools are always free, even with x402 enabled */
export const FREE_TOOLS = new Set(["healthCheck"]);

/** Default price for any tool not explicitly listed */
export const DEFAULT_PRICE = "$0.001";

/** Get the price for a tool, or null if free */
export function getToolPrice(toolName: string): string | null {
  if (FREE_TOOLS.has(toolName)) return null;
  return TOOL_PRICES[toolName] ?? DEFAULT_PRICE;
}
