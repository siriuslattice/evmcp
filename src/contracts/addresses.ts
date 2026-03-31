import type { SupportedChain } from "../providers/multi-chain.js";

interface ContractAddresses {
  MCPRegistry: `0x${string}`;
  BatchQuery: `0x${string}`;
  EventAggregator: `0x${string}`;
  CrossChainCache: `0x${string}`;
}

const ZERO: ContractAddresses = {
  MCPRegistry: "0x0000000000000000000000000000000000000000",
  BatchQuery: "0x0000000000000000000000000000000000000000",
  EventAggregator: "0x0000000000000000000000000000000000000000",
  CrossChainCache: "0x0000000000000000000000000000000000000000",
};

/**
 * Deployed companion contract addresses per chain.
 * UPDATE THESE after running forge script Deploy.s.sol on each chain.
 * The MCP server gracefully degrades if addresses are zero — companion
 * contract tools return "not deployed" instead of failing.
 */
export const COMPANION_ADDRESSES: Record<SupportedChain, ContractAddresses> = {
  base: { ...ZERO }, // TODO: populate after deployment
  optimism: { ...ZERO }, // TODO: populate after deployment
  avalanche: { ...ZERO }, // TODO: populate after deployment
  celo: { ...ZERO }, // TODO: populate after deployment
};

export function isDeployed(chain: SupportedChain, contract: keyof ContractAddresses): boolean {
  return COMPANION_ADDRESSES[chain][contract] !== ZERO.MCPRegistry;
}
