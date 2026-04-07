import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses config with ALCHEMY_API_KEY", async () => {
    process.env.ALCHEMY_API_KEY = "test-key";
    // Dynamic import to get fresh module
    const { loadConfig } = await import("../../src/config.js");
    const config = loadConfig();
    expect(config.ALCHEMY_API_KEY).toBe("test-key");
    expect(config.CACHE_TTL_SECONDS).toBe(15);
    expect(config.LOG_LEVEL).toBe("info");
    expect(config.USE_TESTNETS).toBe(false);
  });

  it("parses USE_TESTNETS=true correctly", async () => {
    process.env.ALCHEMY_API_KEY = "test-key";
    process.env.USE_TESTNETS = "true";
    const { loadConfig } = await import("../../src/config.js");
    const config = loadConfig();
    expect(config.USE_TESTNETS).toBe(true);
  });

  it("parses USE_TESTNETS=false string correctly", async () => {
    process.env.ALCHEMY_API_KEY = "test-key";
    process.env.USE_TESTNETS = "false";
    const { loadConfig } = await import("../../src/config.js");
    const config = loadConfig();
    expect(config.USE_TESTNETS).toBe(false);
  });

  it("rejects config without any RPC configuration", async () => {
    delete process.env.ALCHEMY_API_KEY;
    delete process.env.BASE_RPC_URL;
    delete process.env.OPTIMISM_RPC_URL;
    delete process.env.AVALANCHE_RPC_URL;
    delete process.env.CELO_RPC_URL;
    delete process.env.ARBITRUM_RPC_URL;
    const { loadConfig } = await import("../../src/config.js");
    expect(() => loadConfig()).toThrow();
  });
});
