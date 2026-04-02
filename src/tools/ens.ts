import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { normalize } from "viem/ens";
import type { Providers } from "../providers/multi-chain.js";
import { formatError } from "../utils/errors.js";
import { cache } from "../utils/cache.js";

const ENS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function registerENSTools(server: McpServer, providers: Providers) {
  server.registerTool(
    "resolveENS",
    {
      title: "Resolve ENS Name",
      description:
        "Resolve an ENS name (e.g. vitalik.eth) to an Ethereum address. Uses Ethereum L1 for resolution.",
      inputSchema: {
        name: z.string().describe("ENS name to resolve (e.g. vitalik.eth)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      try {
        const cacheKey = `ens:${name}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient("ethereum");
        const address = await client.getEnsAddress({ name: normalize(name) });

        if (!address) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: true,
                    code: "ENS_NOT_FOUND",
                    message: `No address found for ENS name: ${name}`,
                  },
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ name, address }, null, 2),
            },
          ],
        };

        cache.set(cacheKey, result, ENS_CACHE_TTL);
        return result;
      } catch (error) {
        return formatError("resolveENS", "ethereum", error);
      }
    },
  );

  server.registerTool(
    "lookupAddress",
    {
      title: "Reverse ENS Lookup",
      description:
        "Look up the ENS name associated with an Ethereum address (reverse resolution). Uses Ethereum L1.",
      inputSchema: {
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 0x address"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ address }) => {
      try {
        const cacheKey = `ens:reverse:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as { content: { type: "text"; text: string }[] };

        const client = providers.getClient("ethereum");
        const ensName = await client.getEnsName({ address: address as `0x${string}` });

        const result = {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ address, ensName: ensName ?? null }, null, 2),
            },
          ],
        };

        cache.set(cacheKey, result, ENS_CACHE_TTL);
        return result;
      } catch (error) {
        return formatError("lookupAddress", "ethereum", error);
      }
    },
  );
}
