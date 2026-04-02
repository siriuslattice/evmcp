# EVMCP Launch Content

## X/Twitter (280 chars)

evmcp -- open-source MCP server that gives AI assistants read-only access to Base, Optimism, Avalanche, and Celo. 28 tools, companion smart contracts deployed on-chain. Works with Claude Desktop and Claude Code.

https://github.com/SiriusLattice/evmcp

## Farcaster (500 chars)

Announcing evmcp -- an open-source MCP server for multi-chain EVM blockchain data.

28 tools for querying balances, decoding transactions, comparing gas, and more across Base, Optimism, Avalanche, and Celo. ENS resolution via Ethereum L1.

What makes it different: 4 companion smart contracts deployed on-chain (MCPRegistry, BatchQuery, EventAggregator, CrossChainCache) for batch queries and cross-chain data.

Install: npx evmcp
GitHub: https://github.com/SiriusLattice/evmcp

MIT licensed. TypeScript. Node 20+.

## dev.to Blog Post

---
title: "evmcp: An MCP Server for Multi-Chain EVM Data with On-Chain Companion Contracts"
published: true
tags: blockchain, typescript, ai, web3
---

### What is EVMCP?

EVMCP (EVM + MCP) is an open-source TypeScript MCP server that gives AI assistants read-only access to on-chain data across four EVM chains: Base, Optimism, Avalanche C-Chain, and Celo. It implements the [Model Context Protocol](https://modelcontextprotocol.io/), the standard for connecting AI assistants to external tools.

When connected to Claude Desktop or Claude Code, the assistant can query balances, decode transactions, look up ENS names, compare gas prices across chains, and read from smart contracts -- all through natural language.

### What Makes It Different

Most blockchain MCP servers wrap RPC calls and stop there. EVMCP deploys **four companion smart contracts** on-chain:

- **MCPRegistry** -- stores tool metadata (names, descriptions, versions) on-chain, queryable by the AI assistant
- **BatchQuery** -- wraps Multicall3 with convenience methods for multi-address balance checks and multi-token queries
- **EventAggregator** -- caches event count summaries per contract, updated by an admin CLI
- **CrossChainCache** -- stores balance snapshots for cross-chain comparison queries

These contracts are deployed and verified on Avalanche and Celo (same addresses on both chains). Base and Optimism deployments use the same addresses as well.

| Contract | Address |
|----------|---------|
| MCPRegistry | `0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055` |
| BatchQuery | `0xfDc19e0617AdF1811A68Aa1575409F3769f39491` |
| EventAggregator | `0xECE24a53A28F088351EC2Da258f78479e81A8007` |
| CrossChainCache | `0x0899a6Ef23c6B39A4D9B877B219645B89209A670` |

The MCP server only reads from these contracts. All write operations (populating the registry, updating caches) are performed by a separate admin CLI script.

### Supported Chains

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| Base | 8453 | ETH |
| Optimism | 10 | ETH |
| Avalanche C-Chain | 43114 | AVAX |
| Celo | 42220 | CELO |

Ethereum mainnet (chain ID 1) is supported for ENS resolution only.

### Tool Suite

EVMCP provides 28 tools across 11 categories:

- **Balance** (3): getBalance, getTokenBalance, getMultiChainBalance
- **Block** (3): getBlock, getBlockByNumber, getLatestBlock
- **Transaction** (3): getTransaction, getTransactionReceipt, decodeTransaction
- **Contract** (3): readContract, getContractCode, getStorageAt
- **Token** (2): getERC20Info, getTokenAllowance
- **Gas** (3): getGasPrice, estimateGas, compareGasAcrossChains
- **ENS** (2): resolveENS, lookupAddress
- **Events** (2): getContractEvents, decodeEventLog
- **Chain/Health** (3): getChainInfo, isContractDeployed, healthCheck
- **Batch** (1): batchQuery (via Multicall3)
- **Cross-Chain** (2): compareBalances, crossChainActivity
- **Registry** (1): queryRegistry

Plus 4 MCP resources (chain status, gas prices, token lists, supported chains) and 4 MCP prompts (analyze-wallet, audit-contract, compare-chains, investigate-tx).

### Quick Start

**Claude Desktop** -- add to your config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "evmcp": {
      "command": "npx",
      "args": ["-y", "evmcp"],
      "env": { "ALCHEMY_API_KEY": "your_key_here" }
    }
  }
}
```

**Claude Code**:

```bash
claude mcp add evmcp -- npx -y evmcp
```

You need either an Alchemy API key (free tier covers all chains) or individual RPC URLs for each chain.

### Tech Stack

- TypeScript 5.8+, Node.js 20+
- [viem](https://viem.sh/) for all chain interactions
- [Zod](https://zod.dev/) for input validation
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) for MCP implementation
- Solidity 0.8.24 with OpenZeppelin for companion contracts
- Foundry for contract development and testing

### Future Plans

- npm publish for `npx evmcp` installation
- Submission to MCP registries (mcp.so, Smithery, PulseMCP)
- Integration tests against live testnets
- Expanded cross-chain comparison tools

### Links

- GitHub: [https://github.com/SiriusLattice/evmcp](https://github.com/SiriusLattice/evmcp)
- npm: [https://www.npmjs.com/package/evmcp](https://www.npmjs.com/package/evmcp)
- License: MIT
