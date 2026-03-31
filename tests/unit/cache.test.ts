import { describe, it, expect, beforeEach } from "vitest";
import { cache } from "../../src/utils/cache.js";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("returns undefined for missing keys", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("stores and retrieves values", () => {
    cache.set("key1", { data: "hello" }, 10_000);
    expect(cache.get("key1")).toEqual({ data: "hello" });
  });

  it("returns undefined for expired entries", async () => {
    cache.set("short", "value", 1);
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get("short")).toBeUndefined();
  });

  it("tracks size correctly", () => {
    cache.set("a", 1, 10_000);
    cache.set("b", 2, 10_000);
    expect(cache.size).toBe(2);
    cache.delete("a");
    expect(cache.size).toBe(1);
  });

  it("setForever stores with very long TTL", () => {
    cache.setForever("forever", "data");
    expect(cache.get("forever")).toBe("data");
  });

  it("clears all entries", () => {
    cache.set("a", 1, 10_000);
    cache.set("b", 2, 10_000);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
