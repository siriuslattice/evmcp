# MCP Registry Submissions

Reference guide for submitting EVMCP to MCP server registries.

## Project Details (copy-paste ready)

- **Name**: evmcp
- **One-liner**: MCP server giving AI assistants real-time access to EVM blockchain data across Base, Optimism, Avalanche, and Celo — with companion smart contracts for batch queries and cross-chain data.
- **GitHub**: https://github.com/SiriusLattice/evmcp
- **npm**: https://www.npmjs.com/package/evmcp
- **Install command**: `npx -y evmcp`
- **Transport**: stdio
- **License**: MIT
- **Categories**: blockchain, web3, data
- **Tags**: ethereum, base, optimism, avalanche, celo, evm, cross-chain, mcp
- **Tool count**: 28
- **Resources**: 4
- **Prompts**: 4

## 1. mcp.so

**Submit at**: https://mcp.so/submit

Typical information required:
- Server name
- Short description (one-liner)
- GitHub repository URL
- npm package name
- Installation instructions (npx command or Claude Desktop config snippet)
- List of tools with descriptions
- Category selection (look for "blockchain" or "web3"; if unavailable, use "data" or "developer tools")

Notes:
- mcp.so is one of the largest MCP server directories
- Having a published npm package improves listing quality
- Include the Claude Desktop config JSON snippet from the README for easy adoption

## 2. Smithery

**Submit at**: https://smithery.ai/submit (or https://smithery.ai/new)

Typical information required:
- GitHub repository URL (Smithery pulls metadata from the repo)
- `server.json` at project root (already created — Smithery may auto-detect this)
- npm package name
- Server description
- Installation method (stdio via npx)

Notes:
- Smithery can auto-detect MCP servers from GitHub repos
- Make sure the README has clear installation instructions
- Smithery may require a `smithery.yaml` config file in some cases — check their docs at https://smithery.ai/docs if the standard submission flow asks for one
- Verified npm packages get better visibility

## 3. PulseMCP

**Submit at**: https://pulsemcp.com/submit

Typical information required:
- Server name and description
- GitHub URL
- npm package name
- Transport type (stdio)
- Tool list with descriptions
- Author/organization name

Notes:
- PulseMCP indexes MCP servers and tracks adoption metrics
- A well-written README with tool documentation helps with discoverability
- Include keywords in the description for search visibility

## Pre-Submission Checklist

Before submitting to any registry:

- [ ] npm package is published and installable via `npx -y evmcp`
- [ ] `server.json` exists at project root with correct metadata
- [ ] README has clear quickstart instructions (Claude Desktop config, Claude Code command)
- [ ] README lists all tools with one-line descriptions
- [ ] GitHub repo is public
- [ ] LICENSE file is present (MIT)
- [ ] At least one release tag exists (e.g., `v0.1.1`)
- [ ] CI is green (tests pass, typecheck clean)

## After Submission

- Monitor each registry for approval status (some review manually, others auto-list)
- Once listed, link to the registry pages from the README
- Submit PRs to community lists:
  - https://github.com/punkpeye/awesome-mcp-servers
  - Search GitHub for "awesome-crypto-mcp" or "awesome-blockchain-mcp" lists
