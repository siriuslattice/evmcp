import type { Request, Response, NextFunction } from "express";
import type { Config } from "../config.js";
import { getToolPrice, FREE_TOOLS } from "./pricing.js";
import { logger } from "../utils/logger.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
  id?: string | number | null;
}

/**
 * Creates Express middleware that gates MCP tool calls behind x402 payment.
 *
 * This is custom middleware because MCP multiplexes all operations over
 * a single POST /mcp endpoint using JSON-RPC. Standard @x402/express
 * gates HTTP routes, not individual JSON-RPC method calls.
 *
 * Flow:
 * 1. Parse JSON-RPC body to find tools/call requests
 * 2. Look up tool price
 * 3. If no X-PAYMENT header → return HTTP 402 with payment requirements
 * 4. If header present → verify via facilitator, then pass through
 */
export function createX402Middleware(config: Config) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept POST /mcp
    if (req.method !== "POST" || req.path !== "/mcp") {
      next();
      return;
    }

    const body = req.body;
    if (!body) {
      next();
      return;
    }

    // Handle batched JSON-RPC requests
    const messages: JsonRpcRequest[] = Array.isArray(body) ? body : [body];

    // Find any tools/call request that requires payment
    const toolCallMsg = messages.find(
      (msg) => msg.method === "tools/call" && msg.params?.name,
    );

    if (!toolCallMsg) {
      next();
      return;
    }

    const toolName = toolCallMsg.params!.name!;

    if (FREE_TOOLS.has(toolName)) {
      next();
      return;
    }

    const price = getToolPrice(toolName);
    if (price === null) {
      next();
      return;
    }

    // Check for x402 payment header
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // Return HTTP 402 with payment requirements per x402 spec
      res.status(402).json({
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453", // Base mainnet
            maxAmountRequired: price,
            resource: `mcp://evmcp/tools/${toolName}`,
            payTo: config.X402_PAYEE_ADDRESS,
            facilitatorUrl: config.X402_FACILITATOR_URL,
          },
        ],
        error: `Payment required for tool: ${toolName} (${price})`,
      });
      return;
    }

    // Verify payment via the facilitator
    try {
      const facilitatorUrl = config.X402_FACILITATOR_URL;
      if (!facilitatorUrl) {
        res.status(500).json({ error: "Facilitator URL not configured" });
        return;
      }

      const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment: paymentHeader,
          payTo: config.X402_PAYEE_ADDRESS,
          maxAmountRequired: price,
          network: "eip155:8453",
          resource: `mcp://evmcp/tools/${toolName}`,
        }),
      });

      if (!verifyResponse.ok) {
        res.status(402).json({
          error: "Payment verification failed",
          details: await verifyResponse.text().catch(() => "Unknown error"),
        });
        return;
      }

      logger.debug(`x402 payment verified for tool: ${toolName}`);
      next();
    } catch (error) {
      logger.error("x402 facilitator request failed", error);
      res.status(402).json({ error: "Payment verification failed" });
    }
  };
}
