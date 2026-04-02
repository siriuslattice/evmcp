# Awesome List PR Drafts

## Entry Text

```
- [evmcp](https://github.com/SiriusLattice/evmcp) - MCP server for multi-chain EVM blockchain data with companion smart contracts. Supports Base, Optimism, Avalanche, and Celo.
```

## Target Lists

### MCP-Focused Lists

1. **punkpeye/awesome-mcp-servers**
   - URL: https://github.com/punkpeye/awesome-mcp-servers
   - Section: Blockchain / Web3
   - Entry: `- [evmcp](https://github.com/SiriusLattice/evmcp) - Multi-chain EVM blockchain data server with 28 tools, companion smart contracts, and cross-chain queries across Base, Optimism, Avalanche, and Celo.`

2. **wong2/awesome-mcp-servers**
   - URL: https://github.com/wong2/awesome-mcp-servers
   - Section: Data / Blockchain (or most appropriate existing category)
   - Entry: `- [evmcp](https://github.com/SiriusLattice/evmcp) - Read-only EVM blockchain data across Base, Optimism, Avalanche, and Celo with on-chain companion contracts.`

3. **appcypher/awesome-mcp-servers**
   - URL: https://github.com/appcypher/awesome-mcp-servers
   - Section: Blockchain
   - Entry: same as above

### Blockchain/Crypto Lists

4. **ArkLabsHQ/awesome-crypto-mcp-servers**
   - URL: https://github.com/ArkLabsHQ/awesome-crypto-mcp-servers
   - Section: EVM / Multi-chain
   - Entry: `- [evmcp](https://github.com/SiriusLattice/evmcp) - 28-tool MCP server for Base, Optimism, Avalanche, and Celo with deployed companion smart contracts (MCPRegistry, BatchQuery, EventAggregator, CrossChainCache).`

5. **anthropics/awesome-mcp-servers** (official Anthropic list, if it exists)
   - URL: https://github.com/anthropics/awesome-mcp-servers
   - Section: Blockchain / Web3

### General Blockchain Lists

6. **ttumiel/awesome-ethereum**
   - URL: https://github.com/ttumiel/awesome-ethereum
   - Section: Developer Tools
   - Entry: `- [evmcp](https://github.com/SiriusLattice/evmcp) - MCP server giving AI assistants read-only access to EVM chain data across Base, Optimism, Avalanche, and Celo.`

7. **ong/awesome-decentralized-finance**
   - URL: https://github.com/ong/awesome-decentralized-finance
   - Section: Tools / Infrastructure

## PR Title

```
Add evmcp - MCP server for multi-chain EVM blockchain data
```

## PR Body Template

```markdown
## What is evmcp?

[evmcp](https://github.com/SiriusLattice/evmcp) is an open-source TypeScript MCP server that provides AI assistants with read-only access to on-chain data across Base, Optimism, Avalanche C-Chain, and Celo.

## Key details

- **28 tools** covering balances, blocks, transactions, contracts, tokens, gas, ENS, events, batch queries, and cross-chain comparisons
- **4 companion smart contracts** deployed on-chain (MCPRegistry, BatchQuery, EventAggregator, CrossChainCache)
- **4 MCP resources** and **4 MCP prompts**
- Works with Claude Desktop, Claude Code, and any MCP-compatible client
- Built with TypeScript, viem, and the official MCP SDK
- MIT licensed

## Links

- Repository: https://github.com/SiriusLattice/evmcp
- npm: https://www.npmjs.com/package/evmcp

## Checklist

- [x] Project is open source (MIT license)
- [x] Repository has a README with documentation
- [x] Project is functional and tested (50 unit tests passing)
- [x] Entry follows the list's formatting guidelines
```

## MCP Registry Submissions

In addition to awesome lists, submit to these MCP registries:

1. **mcp.so** -- https://mcp.so (submit via their website form)
2. **Smithery** -- https://smithery.ai (submit via GitHub or their form)
3. **PulseMCP** -- https://pulsemcp.com (submit via their website)
4. **MCP Registry** -- https://registry.modelcontextprotocol.io (submit `server.json` at project root)

The `server.json` file is already in the project root with the required schema for MCP Registry submission.
