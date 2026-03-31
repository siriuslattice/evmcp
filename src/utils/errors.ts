export function formatError(toolName: string, chain: string | undefined, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = classifyError(message);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: true, code, message, tool: toolName, chain }, null, 2),
      },
    ],
    isError: true,
  };
}

function classifyError(message: string): string {
  if (message.includes("timeout") || message.includes("ECONNREFUSED")) return "CHAIN_UNAVAILABLE";
  if (message.includes("rate limit") || message.includes("429")) return "RATE_LIMITED";
  if (message.includes("invalid address")) return "INVALID_ADDRESS";
  if (message.includes("execution reverted")) return "CONTRACT_REVERTED";
  return "UNKNOWN_ERROR";
}
