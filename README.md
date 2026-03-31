# evmcp

> EVM + MCP — give your AI assistant blockchain superpowers.

MCP server providing real-time access to on-chain data across Base, Optimism, Avalanche, and Celo.

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

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| Base | 8453 | ETH |
| Optimism | 10 | ETH |
| Avalanche C-Chain | 43114 | AVAX |
| Celo | 42220 | CELO |

Ethereum mainnet (chain ID 1) is also supported for ENS resolution only.

## Tools (25 total)

### Balance
- **getBalance** — Get native token balance (ETH/AVAX/CELO) of an address on a specific chain
- **getTokenBalance** — Get ERC20 token balance of an address on a specific chain
- **getMultiChainBalance** — Get native token balance across all 4 chains in parallel

### Block
- **getBlock** — Get a block by its hash
- **getBlockByNumber** — Get a block by its number (or "latest")
- **getLatestBlock** — Get the latest block number, timestamp, and base fee

### Transaction
- **getTransaction** — Get full transaction details by hash
- **getTransactionReceipt** — Get transaction receipt with status, gas used, and logs
- **decodeTransaction** — Decode transaction calldata with an optional ABI

### Contract
- **readContract** — Call a read-only contract function
- **getContractCode** — Check if an address has contract code deployed
- **getStorageAt** — Read raw storage at a specific slot

### Token
- **getERC20Info** — Get token name, symbol, decimals, and total supply
- **getTokenAllowance** — Get ERC20 allowance for an owner/spender pair

### Gas
- **getGasPrice** — Get current gas price and EIP-1559 fee data
- **estimateGas** — Estimate gas for a transaction
- **compareGasAcrossChains** — Compare gas prices across all 4 chains

### ENS & Identity
- **resolveENS** — Resolve an ENS name to an address (via Ethereum L1)
- **lookupAddress** — Reverse lookup an address to its ENS name

### Events
- **getContractEvents** — Get decoded event logs for a contract
- **decodeEventLog** — Decode a raw event log with an ABI

### Chain & Health
- **getChainInfo** — Get chain name, ID, block height, and native symbol
- **isContractDeployed** — Check if an address has code on all 4 chains
- **healthCheck** — Test connectivity to all 5 RPC endpoints

### Companion Contracts
- **batchQuery** — Execute batch reads via Multicall3
- **queryRegistry** — Read tool metadata from the on-chain MCPRegistry

### Cross-Chain
- **compareBalances** — Compare native balances for an address across all chains
- **crossChainActivity** — Compare transaction counts across all chains

## Environment Variables

- `ALCHEMY_API_KEY` — Alchemy API key (recommended, covers all chains)
- Or set individual chain URLs: `BASE_RPC_URL`, `OPTIMISM_RPC_URL`, `AVALANCHE_RPC_URL`, `CELO_RPC_URL`
- `ETHEREUM_RPC_URL` — Override for ENS resolution (optional)
- `CACHE_TTL_SECONDS` — Cache TTL in seconds (default: 15)
- `CACHE_MAX_ENTRIES` — Max cache entries (default: 1000)
- `LOG_LEVEL` — debug | info | warn | error (default: info)
- `USE_TESTNETS` — Use testnet chains (default: false)

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
