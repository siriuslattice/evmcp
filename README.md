# evmcp

> EVM + MCP — give your AI assistant blockchain superpowers.

MCP server providing real-time access to on-chain data across Base, Optimism, Avalanche, Celo, and Arbitrum, with companion smart contracts deployed on-chain for batch queries and cross-chain data.

## How it Works

EVMCP implements the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), a standard that lets AI assistants call external tools. When connected, your AI assistant gains 28 read-only blockchain tools it can invoke to query balances, decode transactions, compare gas prices, and more across five EVM chains.

What sets EVMCP apart is its **companion smart contracts** — four Solidity contracts deployed on Avalanche and Celo that enable batch queries via Multicall3, an on-chain tool registry, event aggregation, and cross-chain balance caching. The MCP server reads from these contracts; all write operations are performed separately by an admin CLI.

## Quick Start

### With Claude Desktop
Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
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

### With Claude Code
```bash
claude mcp add evmcp -- npx -y evmcp
```

## Supported Chains

| Chain | Chain ID | Native Token | Companion Contracts |
|-------|----------|--------------|---------------------|
| Base | 8453 | ETH | Not yet deployed |
| Optimism | 10 | ETH | Not yet deployed |
| Avalanche C-Chain | 43114 | AVAX | Deployed |
| Celo | 42220 | CELO | Deployed |
| Arbitrum One | 42161 | ETH | Not yet deployed |

Ethereum mainnet (chain ID 1) is also supported for ENS resolution only.

## Tools (29 total)

### Balance (3)
| Tool | Description |
|------|-------------|
| `getBalance` | Get the native token balance (ETH/AVAX/CELO) of an address on a specific chain |
| `getTokenBalance` | Get the ERC20 token balance of an address on a specific chain |
| `getMultiChainBalance` | Get the native token balance of an address across all 5 supported chains in parallel |

### Block (3)
| Tool | Description |
|------|-------------|
| `getBlock` | Get a block by its hash on a specific chain |
| `getBlockByNumber` | Get a block by its number on a specific chain, or pass "latest" for the most recent block |
| `getLatestBlock` | Get the latest block number, timestamp, and base fee for a specific chain |

### Transaction (3)
| Tool | Description |
|------|-------------|
| `getTransaction` | Get a transaction by its hash on a specific chain |
| `getTransactionReceipt` | Get the receipt for a transaction including status, gasUsed, and logs |
| `decodeTransaction` | Decode a transaction's function call using a provided ABI |

### Contract (3)
| Tool | Description |
|------|-------------|
| `readContract` | Call a read-only function on a smart contract with a provided ABI |
| `getContractCode` | Check if an address has contract code deployed, with bytecode length and hash |
| `getStorageAt` | Read the raw value of a storage slot at a specific address |

### Token (2)
| Tool | Description |
|------|-------------|
| `getERC20Info` | Get ERC20 token metadata including name, symbol, decimals, and total supply |
| `getTokenAllowance` | Get the ERC20 token allowance granted by an owner to a spender |

### Gas (3)
| Tool | Description |
|------|-------------|
| `getGasPrice` | Get current gas price and EIP-1559 fee data for a specific chain |
| `estimateGas` | Estimate gas for a transaction on a specific chain |
| `compareGasAcrossChains` | Compare current gas prices across all 5 supported chains |

### ENS (2)
| Tool | Description |
|------|-------------|
| `resolveENS` | Resolve an ENS name (e.g. vitalik.eth) to an Ethereum address via Ethereum L1 |
| `lookupAddress` | Reverse lookup an address to its ENS name via Ethereum L1 |

### Events (2)
| Tool | Description |
|------|-------------|
| `getContractEvents` | Get event logs emitted by a contract on a specific chain |
| `decodeEventLog` | Decode a raw event log using a provided ABI |

### Chain and Health (3)
| Tool | Description |
|------|-------------|
| `getChainInfo` | Get chain name, chain ID, current block number, block time, and native symbol |
| `isContractDeployed` | Check if an address has contract code deployed on all 5 supported chains |
| `healthCheck` | Test connectivity to all 6 RPC endpoints (Ethereum, Base, Optimism, Avalanche, Celo, Arbitrum) |

### Batch (1)
| Tool | Description |
|------|-------------|
| `batchQuery` | Execute multiple read calls in a single RPC request using Multicall3 |

### Cross-Chain (2)
| Tool | Description |
|------|-------------|
| `compareBalances` | Compare native token balances for an address across all 5 chains |
| `crossChainActivity` | Check transaction counts for an address across all 5 chains |

### Registry (1)
| Tool | Description |
|------|-------------|
| `queryRegistry` | Read registered tool metadata from the on-chain MCPRegistry companion contract |

### Optimizer (1)
| Tool | Description |
|------|-------------|
| `gasOptimizer` | Recommends the cheapest chain for a transaction, accounting for L1 data fees on Base/Optimism/Arbitrum |

## Resources (4)

| URI Pattern | Description | Cache TTL |
|-------------|-------------|-----------|
| `chain://{chainId}/status` | Current block height and gas price for a chain | 12s |
| `chain://{chainId}/gas` | Base fee, gas price, and priority fee in gwei | 12s |
| `chain://{chainId}/tokens/popular` | Popular token addresses and decimals (hardcoded for v1) | 1 hour |
| `evmcp://chains` | All supported chains with IDs, symbols, and companion contract addresses | Static |

Supported chain IDs for templated resources: `8453` (Base), `10` (Optimism), `43114` (Avalanche), `42220` (Celo), `42161` (Arbitrum).

## Prompts (4)

| Prompt | Arguments | Description |
|--------|-----------|-------------|
| `analyze-wallet` | `address` | Multi-chain balance and activity analysis of a wallet |
| `audit-contract` | `contractAddress`, `chain` | Basic inspection and audit workflow for a smart contract |
| `compare-chains` | *(none)* | Compare gas costs, speed, and characteristics across all chains |
| `investigate-tx` | `txHash`, `chain` | Decode, analyze, and trace a transaction in detail |

## Companion Contracts

Four Solidity contracts are deployed on Avalanche and Celo. The MCP server reads from these contracts to provide batch queries, on-chain tool metadata, and cross-chain data. Base and Optimism deployments are planned.

### Avalanche C-Chain (43114)

| Contract | Address |
|----------|---------|
| MCPRegistry | `0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055` |
| BatchQuery | `0xfDc19e0617AdF1811A68Aa1575409F3769f39491` |
| EventAggregator | `0xECE24a53A28F088351EC2Da258f78479e81A8007` |
| CrossChainCache | `0x0899a6Ef23c6B39A4D9B877B219645B89209A670` |

### Celo (42220)

| Contract | Address |
|----------|---------|
| MCPRegistry | `0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055` |
| BatchQuery | `0xfDc19e0617AdF1811A68Aa1575409F3769f39491` |
| EventAggregator | `0xECE24a53A28F088351EC2Da258f78479e81A8007` |
| CrossChainCache | `0x0899a6Ef23c6B39A4D9B877B219645B89209A670` |

### Contract Descriptions

- **MCPRegistry** -- On-chain metadata for all EVMCP tools (names, descriptions, versions). Owner-only writes.
- **BatchQuery** -- Optimized batch reads via Multicall3. Includes multi-balance, multi-contract-check, and multi-token-balance helpers.
- **EventAggregator** -- Caches event count summaries per contract. Updated by the admin CLI.
- **CrossChainCache** -- Stores balance snapshots for cross-chain queries. Updated by the admin CLI.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALCHEMY_API_KEY` | Yes* | Alchemy API key (covers all chains) |
| `BASE_RPC_URL` | No* | Override RPC URL for Base |
| `OPTIMISM_RPC_URL` | No* | Override RPC URL for Optimism |
| `AVALANCHE_RPC_URL` | No* | Override RPC URL for Avalanche |
| `CELO_RPC_URL` | No* | Override RPC URL for Celo |
| `ARBITRUM_RPC_URL` | No* | Override RPC URL for Arbitrum |
| `ETHEREUM_RPC_URL` | No | Override RPC URL for ENS resolution |
| `CACHE_TTL_SECONDS` | No | Cache TTL in seconds (default: 15) |
| `CACHE_MAX_ENTRIES` | No | Max cache entries (default: 1000) |
| `LOG_LEVEL` | No | debug, info, warn, or error (default: info) |
| `USE_TESTNETS` | No | Use testnet chains (default: false) |

| `TRANSPORT` | No | `stdio` (default) or `http` for Streamable HTTP transport |
| `HTTP_PORT` | No | Port for HTTP transport (default: 3402) |
| `X402_ENABLED` | No | Enable x402 payment gating on HTTP transport |
| `X402_PAYEE_ADDRESS` | No** | USDC receive address on Base |
| `X402_FACILITATOR_URL` | No | x402 facilitator URL (has default) |

*Provide either `ALCHEMY_API_KEY` or all five individual chain RPC URLs.
**Required when `X402_ENABLED=true`.

## Development

```bash
pnpm install
pnpm build
pnpm inspect          # MCP Inspector UI at localhost:6274
pnpm test             # Unit tests
pnpm typecheck        # Type check
pnpm lint             # ESLint
```

## License

MIT
