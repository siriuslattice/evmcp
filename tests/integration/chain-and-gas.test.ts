import { describe, test, expect, beforeAll } from "vitest";
import { getProviders, captureHandler, parseResult } from "./setup.js";
import { registerChainTools } from "../../src/tools/chain.js";
import { registerGasTools } from "../../src/tools/gas.js";

const RUN = process.env.RUN_INTEGRATION === "true";
const describeIf = RUN ? describe : describe.skip;

describeIf("Integration: Chain & Gas Tools", () => {
  let providers: ReturnType<typeof getProviders>;
  beforeAll(() => { providers = getProviders(); });

  test("healthCheck — all RPCs reachable", async () => {
    const handler = captureHandler(registerChainTools, "healthCheck", providers);
    const result = await handler({});
    const data = parseResult(result);
    const chains = data.chains as Record<string, boolean>;

    expect(chains.ethereum).toBe(true);
    expect(chains.avalanche).toBe(true);
    expect(chains.celo).toBe(true);
    expect(chains.base).toBe(true);
    expect(chains.optimism).toBe(true);
  }, 30_000);

  test("getChainInfo — avalanche returns correct metadata", async () => {
    const handler = captureHandler(registerChainTools, "getChainInfo", providers);
    const result = await handler({ chain: "avalanche" });
    const data = parseResult(result);

    expect(data.chainId).toBe(43114);
    expect(data.nativeSymbol).toBe("AVAX");
    expect(Number(data.blockNumber)).toBeGreaterThan(40_000_000);
  }, 15_000);

  test("getGasPrice — celo returns fee data", async () => {
    const handler = captureHandler(registerGasTools, "getGasPrice", providers);
    const result = await handler({ chain: "celo" });
    const data = parseResult(result);

    expect(data.chain).toBe("celo");
    expect(data.gasPrice).toBeDefined();
    expect(data.symbol).toBe("CELO");
  }, 15_000);

  test("getChainInfo — base returns correct metadata", async () => {
    const handler = captureHandler(registerChainTools, "getChainInfo", providers);
    const result = await handler({ chain: "base" });
    const data = parseResult(result);

    expect(data.chainId).toBe(8453);
    expect(data.nativeSymbol).toBe("ETH");
    expect(Number(data.blockNumber)).toBeGreaterThan(10_000_000);
  }, 15_000);

  test("getGasPrice — optimism returns fee data", async () => {
    const handler = captureHandler(registerGasTools, "getGasPrice", providers);
    const result = await handler({ chain: "optimism" });
    const data = parseResult(result);

    expect(data.chain).toBe("optimism");
    expect(data.gasPrice).toBeDefined();
    expect(data.symbol).toBe("ETH");
  }, 15_000);
});
