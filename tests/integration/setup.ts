import "dotenv/config";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../../src/config.js";
import { createProviders, type Providers } from "../../src/providers/multi-chain.js";

let _providers: Providers | null = null;

export function getProviders(): Providers {
  if (!_providers) {
    const config = loadConfig();
    _providers = createProviders(config);
  }
  return _providers;
}

export function captureHandler(
  registerFn: (server: McpServer, providers: Providers) => void,
  toolName: string,
  providers: Providers,
): (args: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }> {
  let handler: ((args: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>) | undefined;
  const mockServer = {
    registerTool: (name: string, _config: unknown, fn: typeof handler) => {
      if (name === toolName) handler = fn;
    },
  };
  registerFn(mockServer as unknown as McpServer, providers);
  if (!handler) throw new Error(`Tool "${toolName}" not found in register function`);
  return handler;
}

export function parseResult(result: { content: { type: string; text: string }[] }): Record<string, unknown> {
  return JSON.parse(result.content[0].text);
}
