import type { PublicClient } from "viem";
import type { SupportedChain } from "../providers/multi-chain.js";
import { COMPANION_ADDRESSES, isDeployed } from "./addresses.js";
import MCPRegistryABI from "./abis/MCPRegistry.json" with { type: "json" };

/** Read all tools from the MCPRegistry on a specific chain */
export async function readRegistryTools(
  client: PublicClient,
  chain: SupportedChain,
): Promise<Array<{ name: string; description: string; version: string }> | null> {
  if (!isDeployed(chain, "MCPRegistry")) return null;

  const result = await client.readContract({
    address: COMPANION_ADDRESSES[chain].MCPRegistry,
    abi: MCPRegistryABI,
    functionName: "getAllTools",
  });
  return result as Array<{ name: string; description: string; version: string }>;
}

/** Execute a batch query via Multicall3 directly */
export async function executeBatchQuery(
  client: PublicClient,
  calls: Array<{ target: `0x${string}`; callData: `0x${string}` }>,
) {
  const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

  const multicallCalls = calls.map((c) => ({
    target: c.target,
    allowFailure: true,
    callData: c.callData,
  }));

  const results = await client.readContract({
    address: MULTICALL3,
    abi: [
      {
        name: "aggregate3",
        type: "function",
        stateMutability: "payable",
        inputs: [
          {
            name: "calls",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "allowFailure", type: "bool" },
              { name: "callData", type: "bytes" },
            ],
          },
        ],
        outputs: [
          {
            name: "",
            type: "tuple[]",
            components: [
              { name: "success", type: "bool" },
              { name: "returnData", type: "bytes" },
            ],
          },
        ],
      },
    ],
    functionName: "aggregate3",
    args: [multicallCalls],
  });

  return results;
}
