import { describe, test, expect, beforeAll } from "vitest";
import { getProviders, captureHandler, parseResult } from "./setup.js";
import { registerBlockTools } from "../../src/tools/block.js";
import { registerTransactionTools } from "../../src/tools/transaction.js";
import { FIXTURES } from "./fixtures.js";

const RUN = process.env.RUN_INTEGRATION === "true";
const describeIf = RUN ? describe : describe.skip;

describeIf("Integration: Block & Transaction Tools", () => {
  const providers = getProviders();
  let knownTxHash: string;

  beforeAll(async () => {
    // Fetch a known block to get a stable tx hash
    const handler = captureHandler(registerBlockTools, "getBlockByNumber", providers);
    const result = await handler({
      blockNumber: FIXTURES.avalanche.knownBlock,
      chain: "avalanche",
    });
    const data = parseResult(result);
    const transactions = data.transactions as string[];
    knownTxHash = transactions[0];
  }, 30_000);

  test("getBlockByNumber — returns correct block on avalanche", async () => {
    const handler = captureHandler(registerBlockTools, "getBlockByNumber", providers);
    const result = await handler({
      blockNumber: FIXTURES.avalanche.knownBlock,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.number).toBe(String(FIXTURES.avalanche.knownBlock));
    expect(data.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(data.timestamp).toBeDefined();
    expect(Array.isArray(data.transactions)).toBe(true);
  }, 15_000);

  test("getTransaction — returns full tx details", async () => {
    const handler = captureHandler(registerTransactionTools, "getTransaction", providers);
    const result = await handler({
      txHash: knownTxHash,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.hash).toBe(knownTxHash);
    expect(data.blockNumber).toBe(String(FIXTURES.avalanche.knownBlock));
    expect(data.from).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }, 15_000);

  test("getTransactionReceipt — returns receipt with status", async () => {
    const handler = captureHandler(registerTransactionTools, "getTransactionReceipt", providers);
    const result = await handler({
      txHash: knownTxHash,
      chain: "avalanche",
    });
    const data = parseResult(result);

    expect(data.status).toBe("success");
    expect(data.gasUsed).toBeDefined();
    expect(data.blockNumber).toBe(String(FIXTURES.avalanche.knownBlock));
    expect(Array.isArray(data.logs)).toBe(true);
  }, 15_000);
});
