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
  base: {
    MCPRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055",
    BatchQuery: "0xfDc19e0617AdF1811A68Aa1575409F3769f39491",
    EventAggregator: "0xECE24a53A28F088351EC2Da258f78479e81A8007",
    CrossChainCache: "0x0899a6Ef23c6B39A4D9B877B219645B89209A670",
  },
  optimism: {
    MCPRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055",
    BatchQuery: "0xfDc19e0617AdF1811A68Aa1575409F3769f39491",
    EventAggregator: "0xECE24a53A28F088351EC2Da258f78479e81A8007",
    CrossChainCache: "0x0899a6Ef23c6B39A4D9B877B219645B89209A670",
  },
  avalanche: {
    MCPRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055",
    BatchQuery: "0xfDc19e0617AdF1811A68Aa1575409F3769f39491",
    EventAggregator: "0xECE24a53A28F088351EC2Da258f78479e81A8007",
    CrossChainCache: "0x0899a6Ef23c6B39A4D9B877B219645B89209A670",
  },
  celo: {
    MCPRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055",
    BatchQuery: "0xfDc19e0617AdF1811A68Aa1575409F3769f39491",
    EventAggregator: "0xECE24a53A28F088351EC2Da258f78479e81A8007",
    CrossChainCache: "0x0899a6Ef23c6B39A4D9B877B219645B89209A670",
  },
  arbitrum: {
    MCPRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055",
    BatchQuery: "0xfDc19e0617AdF1811A68Aa1575409F3769f39491",
    EventAggregator: "0xECE24a53A28F088351EC2Da258f78479e81A8007",
    CrossChainCache: "0x0899a6Ef23c6B39A4D9B877B219645B89209A670",
  },
};

export function isDeployed(chain: SupportedChain, contract: keyof ContractAddresses): boolean {
  return COMPANION_ADDRESSES[chain][contract] !== ZERO.MCPRegistry;
}
