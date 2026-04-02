import { describe, test, expect } from "vitest";
import { getProviders, captureHandler, parseResult } from "./setup.js";
import { registerContractTools } from "../../src/tools/contract.js";
import { registerTokenTools } from "../../src/tools/token.js";
import { FIXTURES } from "./fixtures.js";

const RUN = process.env.RUN_INTEGRATION === "true";
const describeIf = RUN ? describe : describe.skip;

describeIf("Integration: Contract & Token Tools", () => {
  const providers = getProviders();

  test("getContractCode — companion registry is a contract", async () => {
    const handler = captureHandler(registerContractTools, "getContractCode", providers);
    const result = await handler({
      address: FIXTURES.avalanche.companionRegistry,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.isContract).toBe(true);
    expect(Number(data.bytecodeLength)).toBeGreaterThan(0);
    expect(data.bytecodeHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }, 15_000);

  test("getContractCode — zero address is not a contract", async () => {
    const handler = captureHandler(registerContractTools, "getContractCode", providers);
    const result = await handler({
      address: "0x0000000000000000000000000000000000000001",
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.isContract).toBe(false);
  }, 15_000);

  test("getERC20Info — WAVAX on avalanche", async () => {
    const handler = captureHandler(registerTokenTools, "getERC20Info", providers);
    const result = await handler({
      tokenAddress: FIXTURES.avalanche.wavax,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.name).toBe(FIXTURES.avalanche.wavaxName);
    expect(data.symbol).toBe(FIXTURES.avalanche.wavaxSymbol);
    expect(data.decimals).toBe(FIXTURES.avalanche.wavaxDecimals);
    expect(data.totalSupply).toBeDefined();
  }, 15_000);

  test("getERC20Info — cUSD on celo", async () => {
    const handler = captureHandler(registerTokenTools, "getERC20Info", providers);
    const result = await handler({
      tokenAddress: FIXTURES.celo.cusd,
      chain: "celo",
    });
    const data = parseResult(result);

    expect(data.name).toBe(FIXTURES.celo.cusdName);
    expect(data.symbol).toBe(FIXTURES.celo.cusdSymbol);
    expect(data.decimals).toBe(FIXTURES.celo.cusdDecimals);
  }, 15_000);

  test("getContractCode — companion registry on base", async () => {
    const handler = captureHandler(registerContractTools, "getContractCode", providers);
    const result = await handler({
      address: FIXTURES.base.companionRegistry,
      chain: "base",
    });
    const data = parseResult(result);

    expect(data.isContract).toBe(true);
    expect(Number(data.bytecodeLength)).toBeGreaterThan(0);
  }, 15_000);

  test("getERC20Info — USDC on base", async () => {
    const handler = captureHandler(registerTokenTools, "getERC20Info", providers);
    const result = await handler({
      tokenAddress: FIXTURES.base.usdc,
      chain: "base",
    });
    const data = parseResult(result);

    expect(data.name).toBe(FIXTURES.base.usdcName);
    expect(data.symbol).toBe(FIXTURES.base.usdcSymbol);
    expect(data.decimals).toBe(FIXTURES.base.usdcDecimals);
  }, 15_000);

  test("getERC20Info — USDC on optimism", async () => {
    const handler = captureHandler(registerTokenTools, "getERC20Info", providers);
    const result = await handler({
      tokenAddress: FIXTURES.optimism.usdc,
      chain: "optimism",
    });
    const data = parseResult(result);

    expect(data.name).toBe(FIXTURES.optimism.usdcName);
    expect(data.symbol).toBe(FIXTURES.optimism.usdcSymbol);
    expect(data.decimals).toBe(FIXTURES.optimism.usdcDecimals);
  }, 15_000);
});
