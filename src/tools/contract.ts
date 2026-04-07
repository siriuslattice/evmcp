import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { keccak256 } from "viem";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";

const SUPPORTED_CHAINS = ["base", "optimism", "avalanche", "celo", "arbitrum"] as const;

export function registerContractTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "readContract",
    {
      title: "Read Contract",
      description:
        "Call a read-only function on a smart contract. Requires the contract ABI (as a JSON array) and function name. Returns the decoded return value.",
      inputSchema: {
        contractAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
        functionName: z.string().describe("The name of the contract function to call"),
        abi: z.array(z.any()).describe("The contract ABI as a JSON array"),
        args: z.array(z.any()).optional().describe("Optional arguments to pass to the function"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ contractAddress, chain, functionName, abi, args }) => {
      try {
        const client = providers.getClient(chain);

        const result = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi,
          functionName,
          args: args ?? [],
        });

        // Handle bigint serialization
        const serialized =
          typeof result === "bigint"
            ? result.toString()
            : JSON.parse(
                JSON.stringify(result, (_key, value) =>
                  typeof value === "bigint" ? value.toString() : value,
                ),
              );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  contractAddress,
                  chain,
                  functionName,
                  result: serialized,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("readContract", chain, error);
      }
    },
  );

  server.registerTool(
    "getContractCode",
    {
      title: "Get Contract Code",
      description:
        "Check if an address has contract code deployed on a specific chain. Returns whether it is a contract, the bytecode length, and the keccak256 hash of the bytecode.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address, chain }) => {
      try {
        const cacheKey = `code:${chain}:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient(chain);
        const bytecode = await client.getCode({ address: address as `0x${string}` });

        const isContract = !!bytecode && bytecode !== "0x";
        const bytecodeLength = isContract ? (bytecode.length - 2) / 2 : 0; // subtract "0x", each byte = 2 hex chars
        const bytecodeHash = isContract ? keccak256(bytecode) : null;

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  chain,
                  isContract,
                  bytecodeLength,
                  bytecodeHash,
                },
                null,
                2,
              ),
            },
          ],
        };

        // Cache for 24 hours — deployed code doesn't change
        cache.set(cacheKey, result, 86_400_000);
        return result;
      } catch (error) {
        return formatError("getContractCode", chain, error);
      }
    },
  );

  server.registerTool(
    "getStorageAt",
    {
      title: "Get Storage At",
      description:
        "Read the raw value of a storage slot at a specific address on a given chain. Returns the hex-encoded 32-byte value.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
        slot: z.string().regex(/^0x[a-fA-F0-9]+$/, "Must be a hex string"),
        chain: z.enum(SUPPORTED_CHAINS).describe("Target blockchain"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address, slot, chain }) => {
      try {
        const client = providers.getClient(chain);
        const value = await client.getStorageAt({
          address: address as `0x${string}`,
          slot: slot as `0x${string}`,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address,
                  slot,
                  chain,
                  value: value ?? "0x0",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatError("getStorageAt", chain, error);
      }
    },
  );
}
