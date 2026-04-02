import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatUnits } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";
import ERC20ABI from "../contracts/abis/ERC20.json" with { type: "json" };

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo"] as const;

export function registerTokenTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "getERC20Info",
    {
      title: "Get ERC20 Token Info",
      description:
        "Get ERC20 token metadata including name, symbol, decimals, and total supply on a specific chain.",
      inputSchema: {
        tokenAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid token contract address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ tokenAddress, chain }) => {
      try {
        const cacheKey = `token:${chain}:${tokenAddress}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const addr = tokenAddress as `0x${string}`;

        const [name, symbol, decimals, totalSupply] = await Promise.all([
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "name",
          }) as Promise<string>,
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "symbol",
          }) as Promise<string>,
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "decimals",
          }) as Promise<number>,
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "totalSupply",
          }) as Promise<bigint>,
        ]);

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  tokenAddress,
                  chain,
                  name,
                  symbol,
                  decimals,
                  totalSupply: totalSupply.toString(),
                  totalSupplyFormatted: formatUnits(totalSupply, decimals),
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 86_400_000); // 24 hours
        return result;
      } catch (error) {
        return formatError("getERC20Info", chain, error);
      }
    },
  );

  server.registerTool(
    "getTokenAllowance",
    {
      title: "Get ERC20 Token Allowance",
      description:
        "Get the ERC20 token allowance granted by an owner to a spender on a specific chain.",
      inputSchema: {
        tokenAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid token contract address"),
        owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        spender: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ tokenAddress, owner, spender, chain }) => {
      try {
        const cacheKey = `allowance:${chain}:${tokenAddress}:${owner}:${spender}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const addr = tokenAddress as `0x${string}`;

        const [allowance, decimals, symbol] = await Promise.all([
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "allowance",
            args: [owner as `0x${string}`, spender as `0x${string}`],
          }) as Promise<bigint>,
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "decimals",
          }) as Promise<number>,
          client.readContract({
            address: addr,
            abi: ERC20ABI,
            functionName: "symbol",
          }) as Promise<string>,
        ]);

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  tokenAddress,
                  owner,
                  spender,
                  chain,
                  allowance: allowance.toString(),
                  allowanceFormatted: formatUnits(allowance, decimals),
                  symbol,
                },
                null,
                2,
              ),
            },
          ],
        };

        cache.set(cacheKey, result, 15_000); // 15 seconds
        return result;
      } catch (error) {
        return formatError("getTokenAllowance", chain, error);
      }
    },
  );
}
