import { describe, it, expect } from "vitest";
import { formatError } from "../../src/utils/errors.js";

describe("formatError", () => {
  it("formats Error instances", () => {
    const result = formatError("getBalance", "base", new Error("timeout reached"));
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("CHAIN_UNAVAILABLE");
    expect(parsed.tool).toBe("getBalance");
    expect(parsed.chain).toBe("base");
  });

  it("formats string errors", () => {
    const result = formatError("readContract", "optimism", "execution reverted");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.code).toBe("CONTRACT_REVERTED");
  });

  it("classifies rate limit errors", () => {
    const result = formatError("getBlock", "celo", new Error("429 Too Many Requests"));
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.code).toBe("RATE_LIMITED");
  });

  it("classifies unknown errors", () => {
    const result = formatError("test", undefined, new Error("something else"));
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.code).toBe("UNKNOWN_ERROR");
  });
});
