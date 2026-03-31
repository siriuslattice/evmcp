import { describe, it, expect } from "vitest";
import {
  weiToEther,
  formatTokenAmount,
  checksumAddress,
  hexToDecimal,
  nativeSymbol,
  truncateAddress,
} from "../../src/utils/formatters.js";

describe("formatters", () => {
  it("weiToEther converts correctly", () => {
    expect(weiToEther(1000000000000000000n)).toBe("1");
    expect(weiToEther(0n)).toBe("0");
    expect(weiToEther(500000000000000000n)).toBe("0.5");
  });

  it("formatTokenAmount handles decimals", () => {
    expect(formatTokenAmount(1000000n, 6)).toBe("1");
    expect(formatTokenAmount(1500000n, 6)).toBe("1.5");
  });

  it("checksumAddress returns valid checksum", () => {
    const addr = checksumAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
    expect(addr).toBe("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  });

  it("checksumAddress throws on invalid address", () => {
    expect(() => checksumAddress("0xinvalid")).toThrow();
  });

  it("hexToDecimal converts correctly", () => {
    expect(hexToDecimal("0xff")).toBe("255");
    expect(hexToDecimal("0x0")).toBe("0");
  });

  it("nativeSymbol returns correct symbols", () => {
    expect(nativeSymbol("avalanche")).toBe("AVAX");
    expect(nativeSymbol("celo")).toBe("CELO");
    expect(nativeSymbol("base")).toBe("ETH");
    expect(nativeSymbol("optimism")).toBe("ETH");
  });

  it("truncateAddress formats correctly", () => {
    expect(truncateAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe("0xd8dA...6045");
  });
});
