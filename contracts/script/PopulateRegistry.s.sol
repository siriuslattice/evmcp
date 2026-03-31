// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MCPRegistry.sol";

contract PopulateRegistry is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryAddr = vm.envAddress("REGISTRY_ADDRESS");

        MCPRegistry registry = MCPRegistry(registryAddr);

        vm.startBroadcast(deployerKey);

        registry.registerTool("getBalance", "Get the native token balance of an address on a specific chain", "0.1.0");
        registry.registerTool("getTokenBalance", "Get ERC20 token balance for an address on a specific chain", "0.1.0");
        registry.registerTool(
            "getMultiChainBalance",
            "Get native balance across all 4 chains in parallel",
            "0.1.0"
        );
        registry.registerTool("getBlock", "Get block details by hash on a specific chain", "0.1.0");
        registry.registerTool("getBlockByNumber", "Get block details by number or latest", "0.1.0");
        registry.registerTool("getLatestBlock", "Get the latest block number and timestamp for a chain", "0.1.0");
        registry.registerTool("getTransaction", "Get transaction details by hash", "0.1.0");
        registry.registerTool(
            "getTransactionReceipt",
            "Get transaction receipt with status, gasUsed, and logs",
            "0.1.0"
        );
        registry.registerTool("decodeTransaction", "Decode transaction function call and parameters", "0.1.0");
        registry.registerTool("readContract", "Call a read-only contract function and return decoded result", "0.1.0");
        registry.registerTool(
            "getContractCode",
            "Check if an address has contract code and get bytecode metadata",
            "0.1.0"
        );
        registry.registerTool("getStorageAt", "Read raw storage slot value at an address", "0.1.0");
        registry.registerTool("getERC20Info", "Get ERC20 token metadata via Multicall3 batch", "0.1.0");
        registry.registerTool("getTokenAllowance", "Get ERC20 allowance for an owner/spender pair", "0.1.0");
        registry.registerTool("getGasPrice", "Get current gas price and EIP-1559 fee data for a chain", "0.1.0");
        registry.registerTool("estimateGas", "Estimate gas cost for a transaction", "0.1.0");
        registry.registerTool(
            "compareGasAcrossChains",
            "Compare current gas prices across all 4 supported chains",
            "0.1.0"
        );
        registry.registerTool("resolveENS", "Resolve an ENS name to an address via Ethereum L1", "0.1.0");
        registry.registerTool("lookupAddress", "Reverse lookup an address to its ENS name", "0.1.0");
        registry.registerTool("getContractEvents", "Get decoded event logs for a contract", "0.1.0");
        registry.registerTool("decodeEventLog", "Decode a raw event log using a provided ABI", "0.1.0");
        registry.registerTool("getChainInfo", "Get chain metadata including block height and native symbol", "0.1.0");
        registry.registerTool(
            "isContractDeployed",
            "Check if a contract is deployed across all supported chains",
            "0.1.0"
        );
        registry.registerTool("healthCheck", "Test all RPC connections and report status", "0.1.0");
        registry.registerTool("batchQuery", "Execute batch read calls via Multicall3", "0.1.0");

        vm.stopBroadcast();

        console.log("Registered 25 tools on chain:", block.chainid);
    }
}
