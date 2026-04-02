import { describe, it, expect, vi } from "vitest";
import { registerBalanceTools } from "../../src/tools/balance.js";
import { registerBlockTools } from "../../src/tools/block.js";
import { registerTransactionTools } from "../../src/tools/transaction.js";
import { registerContractTools } from "../../src/tools/contract.js";
import { registerTokenTools } from "../../src/tools/token.js";
import { registerGasTools } from "../../src/tools/gas.js";
import { registerENSTools } from "../../src/tools/ens.js";
import { registerEventTools } from "../../src/tools/events.js";
import { registerChainTools } from "../../src/tools/chain.js";
import { registerBatchTools } from "../../src/tools/batch.js";
import { registerCrossChainTools } from "../../src/tools/cross-chain.js";
import { registerRegistryTools } from "../../src/tools/registry.js";
import { registerAllTools } from "../../src/tools/index.js";
import type { Providers } from "../../src/providers/multi-chain.js";
import type { Config } from "../../src/config.js";

interface RegisteredTool {
  name: string;
  title: string;
  description: string;
}

function createMockServer() {
  const tools: RegisteredTool[] = [];
  return {
    registerTool: vi.fn((name: string, config: { title: string; description: string }, _handler: unknown) => {
      tools.push({ name, title: config.title, description: config.description });
    }),
    getRegisteredTools: () => tools,
  };
}

function createMockProviders(): Providers {
  return {
    getClient: vi.fn(),
    getAllL2Clients: vi.fn(() => []),
    healthCheck: vi.fn(),
  } as unknown as Providers;
}

function createMockConfig(): Config {
  return {
    CACHE_TTL_SECONDS: 15,
    CACHE_MAX_ENTRIES: 1000,
    LOG_LEVEL: "info",
    USE_TESTNETS: false,
  } as Config;
}

describe("Tool Registration", () => {
  describe("registerBalanceTools", () => {
    it("registers 3 balance tools", () => {
      const server = createMockServer();
      registerBalanceTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "getBalance",
        "getTokenBalance",
        "getMultiChainBalance",
      ]);
    });

    it("registers getBalance with correct title", () => {
      const server = createMockServer();
      registerBalanceTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getBalance");
      expect(tool?.title).toBe("Get Native Balance");
    });
  });

  describe("registerBlockTools", () => {
    it("registers 3 block tools", () => {
      const server = createMockServer();
      registerBlockTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "getBlock",
        "getBlockByNumber",
        "getLatestBlock",
      ]);
    });
  });

  describe("registerTransactionTools", () => {
    it("registers 3 transaction tools", () => {
      const server = createMockServer();
      registerTransactionTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "getTransaction",
        "getTransactionReceipt",
        "decodeTransaction",
      ]);
    });
  });

  describe("registerContractTools", () => {
    it("registers 3 contract tools", () => {
      const server = createMockServer();
      registerContractTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "readContract",
        "getContractCode",
        "getStorageAt",
      ]);
    });

    it("registers readContract with correct title and description", () => {
      const server = createMockServer();
      registerContractTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "readContract");
      expect(tool?.title).toBe("Read Contract");
      expect(tool?.description).toContain("read-only function");
    });

    it("registers getContractCode with correct title", () => {
      const server = createMockServer();
      registerContractTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getContractCode");
      expect(tool?.title).toBe("Get Contract Code");
    });

    it("registers getStorageAt with correct title", () => {
      const server = createMockServer();
      registerContractTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getStorageAt");
      expect(tool?.title).toBe("Get Storage At");
    });
  });

  describe("registerTokenTools", () => {
    it("registers 2 token tools", () => {
      const server = createMockServer();
      registerTokenTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toEqual([
        "getERC20Info",
        "getTokenAllowance",
      ]);
    });

    it("registers getERC20Info with correct title", () => {
      const server = createMockServer();
      registerTokenTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getERC20Info");
      expect(tool?.title).toBe("Get ERC20 Token Info");
      expect(tool?.description).toContain("ERC20 token metadata");
    });

    it("registers getTokenAllowance with correct title", () => {
      const server = createMockServer();
      registerTokenTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getTokenAllowance");
      expect(tool?.title).toBe("Get ERC20 Token Allowance");
    });
  });

  describe("registerGasTools", () => {
    it("registers 3 gas tools", () => {
      const server = createMockServer();
      registerGasTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "getGasPrice",
        "estimateGas",
        "compareGasAcrossChains",
      ]);
    });
  });

  describe("registerENSTools", () => {
    it("registers 2 ENS tools", () => {
      const server = createMockServer();
      registerENSTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toEqual([
        "resolveENS",
        "lookupAddress",
      ]);
    });

    it("registers resolveENS with correct title and description", () => {
      const server = createMockServer();
      registerENSTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "resolveENS");
      expect(tool?.title).toBe("Resolve ENS Name");
      expect(tool?.description).toContain("ENS name");
      expect(tool?.description).toContain("Ethereum L1");
    });

    it("registers lookupAddress with correct title", () => {
      const server = createMockServer();
      registerENSTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "lookupAddress");
      expect(tool?.title).toBe("Reverse ENS Lookup");
    });
  });

  describe("registerEventTools", () => {
    it("registers 2 event tools", () => {
      const server = createMockServer();
      registerEventTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toEqual([
        "getContractEvents",
        "decodeEventLog",
      ]);
    });

    it("registers getContractEvents with correct title and description", () => {
      const server = createMockServer();
      registerEventTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "getContractEvents");
      expect(tool?.title).toBe("Get Contract Events");
      expect(tool?.description).toContain("event logs");
    });

    it("registers decodeEventLog with correct title", () => {
      const server = createMockServer();
      registerEventTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "decodeEventLog");
      expect(tool?.title).toBe("Decode Event Log");
      expect(tool?.description).toContain("Decode a raw event log");
    });
  });

  describe("registerChainTools", () => {
    it("registers 3 chain tools", () => {
      const server = createMockServer();
      registerChainTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(3);
      expect(tools.map((t) => t.name)).toEqual([
        "getChainInfo",
        "isContractDeployed",
        "healthCheck",
      ]);
    });
  });

  describe("registerBatchTools", () => {
    it("registers 1 batch tool", () => {
      const server = createMockServer();
      registerBatchTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("batchQuery");
      expect(tools[0].title).toBe("Batch Query via Multicall3");
      expect(tools[0].description).toContain("Multicall3");
    });
  });

  describe("registerCrossChainTools", () => {
    it("registers 2 cross-chain tools", () => {
      const server = createMockServer();
      registerCrossChainTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toEqual([
        "compareBalances",
        "crossChainActivity",
      ]);
    });

    it("registers compareBalances with correct title and description", () => {
      const server = createMockServer();
      registerCrossChainTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "compareBalances");
      expect(tool?.title).toBe("Compare Balances Across Chains");
      expect(tool?.description).toContain("all 4 supported chains");
    });

    it("registers crossChainActivity with correct title", () => {
      const server = createMockServer();
      registerCrossChainTools(server as never, createMockProviders());
      const tool = server.getRegisteredTools().find((t) => t.name === "crossChainActivity");
      expect(tool?.title).toBe("Cross-Chain Activity");
      expect(tool?.description).toContain("transaction count");
    });
  });

  describe("registerRegistryTools", () => {
    it("registers 1 registry tool", () => {
      const server = createMockServer();
      registerRegistryTools(server as never, createMockProviders());
      const tools = server.getRegisteredTools();

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("queryRegistry");
      expect(tools[0].title).toBe("Query MCP Registry");
      expect(tools[0].description).toContain("MCPRegistry");
    });
  });

  describe("registerAllTools", () => {
    it("registers all 28 tools via registerAllTools", () => {
      const server = createMockServer();
      registerAllTools(server as never, createMockProviders(), createMockConfig());

      const tools = server.getRegisteredTools();
      expect(tools).toHaveLength(28);
    });

    it("registers tools with unique names", () => {
      const server = createMockServer();
      registerAllTools(server as never, createMockProviders(), createMockConfig());

      const tools = server.getRegisteredTools();
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("includes all expected tool names", () => {
      const server = createMockServer();
      registerAllTools(server as never, createMockProviders(), createMockConfig());

      const names = server.getRegisteredTools().map((t) => t.name);

      // Balance tools
      expect(names).toContain("getBalance");
      expect(names).toContain("getTokenBalance");
      expect(names).toContain("getMultiChainBalance");

      // Block tools
      expect(names).toContain("getBlock");
      expect(names).toContain("getBlockByNumber");
      expect(names).toContain("getLatestBlock");

      // Transaction tools
      expect(names).toContain("getTransaction");
      expect(names).toContain("getTransactionReceipt");
      expect(names).toContain("decodeTransaction");

      // Contract tools
      expect(names).toContain("readContract");
      expect(names).toContain("getContractCode");
      expect(names).toContain("getStorageAt");

      // Token tools
      expect(names).toContain("getERC20Info");
      expect(names).toContain("getTokenAllowance");

      // Gas tools
      expect(names).toContain("getGasPrice");
      expect(names).toContain("estimateGas");
      expect(names).toContain("compareGasAcrossChains");

      // ENS tools
      expect(names).toContain("resolveENS");
      expect(names).toContain("lookupAddress");

      // Event tools
      expect(names).toContain("getContractEvents");
      expect(names).toContain("decodeEventLog");

      // Chain tools
      expect(names).toContain("getChainInfo");
      expect(names).toContain("isContractDeployed");
      expect(names).toContain("healthCheck");

      // Batch tools
      expect(names).toContain("batchQuery");

      // Cross-chain tools
      expect(names).toContain("compareBalances");
      expect(names).toContain("crossChainActivity");

      // Registry tools
      expect(names).toContain("queryRegistry");
    });

    it("every registered tool has a non-empty title and description", () => {
      const server = createMockServer();
      registerAllTools(server as never, createMockProviders(), createMockConfig());

      for (const tool of server.getRegisteredTools()) {
        expect(tool.title, `Tool "${tool.name}" should have a title`).toBeTruthy();
        expect(tool.description, `Tool "${tool.name}" should have a description`).toBeTruthy();
        expect(tool.title.length).toBeGreaterThan(0);
        expect(tool.description.length).toBeGreaterThan(0);
      }
    });

    it("registerTool was called with a handler function for each tool", () => {
      const server = createMockServer();
      registerAllTools(server as never, createMockProviders(), createMockConfig());

      for (const call of server.registerTool.mock.calls) {
        const handler = call[2];
        expect(typeof handler).toBe("function");
      }
    });
  });
});
