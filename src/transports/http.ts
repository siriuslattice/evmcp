import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { logger } from "../utils/logger.js";
import type { Config } from "../config.js";

export async function startHttpTransport(
  server: McpServer,
  port: number,
  config: Config,
): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // x402 payment middleware (must be before /mcp route handlers)
  if (config.X402_ENABLED) {
    const { createX402Middleware } = await import("../x402/middleware.js");
    app.use(createX402Middleware(config));
    logger.info("x402 payment middleware enabled");
  }

  // x402 discovery metadata (served when x402 is enabled)
  if (config.X402_ENABLED) {
    const { buildServerMetadata } = await import("../x402/discovery.js");
    app.get("/.well-known/mcp/server.json", (_req, res) => {
      res.json(buildServerMetadata(config));
    });
  }

  // Health endpoint — always free, no MCP
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", transport: "http", timestamp: new Date().toISOString() });
  });

  // Create a single stateless transport (no session management)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  // MCP Streamable HTTP endpoints
  app.post("/mcp", async (req, res) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error("Error handling POST /mcp", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req, res) => {
    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      logger.error("Error handling GET /mcp", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.delete("/mcp", async (req, res) => {
    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      logger.error("Error handling DELETE /mcp", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const httpServer = app.listen(port, () => {
    logger.info(`EVMCP HTTP server listening on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`MCP endpoint: http://localhost:${port}/mcp`);
  });

  process.on("SIGINT", async () => {
    logger.info("Shutting down HTTP transport...");
    await transport.close();
    httpServer.close();
    process.exit(0);
  });
}
