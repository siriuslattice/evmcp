import { describe, test, expect, beforeAll } from "vitest";
import { getProviders, captureHandler, parseResult } from "./setup.js";
import { registerBalanceTools } from "../../src/tools/balance.js";
import { FIXTURES } from "./fixtures.js";

const RUN = process.env.RUN_INTEGRATION === "true";
const describeIf = RUN ? describe : describe.skip;

describeIf("Integration: Balance Tools", () => {
  let providers: ReturnType<typeof getProviders>;
  beforeAll(() => { providers = getProviders(); });

  test("getBalance — WAVAX contract holds native AVAX", async () => {
    const handler = captureHandler(registerBalanceTools, "getBalance", providers);
    const result = await handler({
      address: FIXTURES.avalanche.wavax,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.address).toBe(FIXTURES.avalanche.wavax);
    expect(data.chain).toBe("avalanche");
    expect(data.symbol).toBe("AVAX");
    expect(data.balanceWei).toBeDefined();
    expect(data.balanceFormatted).toBeDefined();
    expect(data.blockNumber).toBeDefined();
    // WAVAX contract should hold significant AVAX
    expect(Number(data.balanceFormatted)).toBeGreaterThan(0);
  }, 15_000);

  test("getTokenBalance — structural validity on celo", async () => {
    const handler = captureHandler(registerBalanceTools, "getTokenBalance", providers);
    const result = await handler({
      address: FIXTURES.celo.companionRegistry,
      tokenAddress: FIXTURES.celo.cusd,
      chain: "celo",
    });
    const data = parseResult(result);

    expect(data.chain).toBe("celo");
    expect(data.symbol).toBe(FIXTURES.celo.cusdSymbol);
    expect(data.decimals).toBe(FIXTURES.celo.cusdDecimals);
    expect(data.balance).toBeDefined();
    expect(data.balanceFormatted).toBeDefined();
  }, 15_000);

  test("getBalance — WETH contract on base holds ETH", async () => {
    const handler = captureHandler(registerBalanceTools, "getBalance", providers);
    const result = await handler({
      address: FIXTURES.base.weth,
      chain: "base",
    });
    const data = parseResult(result);

    expect(data.chain).toBe("base");
    expect(data.symbol).toBe("ETH");
    expect(data.balanceWei).toBeDefined();
    expect(Number(data.balanceFormatted)).toBeGreaterThan(0);
  }, 15_000);

  test("getBalance — WETH contract on optimism holds ETH", async () => {
    const handler = captureHandler(registerBalanceTools, "getBalance", providers);
    const result = await handler({
      address: FIXTURES.optimism.weth,
      chain: "optimism",
    });
    const data = parseResult(result);

    expect(data.chain).toBe("optimism");
    expect(data.symbol).toBe("ETH");
    expect(data.balanceWei).toBeDefined();
    expect(Number(data.balanceFormatted)).toBeGreaterThan(0);
  }, 15_000);
});
