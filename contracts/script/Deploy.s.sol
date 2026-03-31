// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MCPRegistry.sol";
import "../src/BatchQuery.sol";
import "../src/EventAggregator.sol";
import "../src/CrossChainCache.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        MCPRegistry registry = new MCPRegistry(deployer);
        BatchQuery batchQuery = new BatchQuery(deployer);
        EventAggregator eventAgg = new EventAggregator(deployer);
        CrossChainCache cache = new CrossChainCache(deployer);

        vm.stopBroadcast();

        console.log("Chain ID:", block.chainid);
        console.log("MCPRegistry:", address(registry));
        console.log("BatchQuery:", address(batchQuery));
        console.log("EventAggregator:", address(eventAgg));
        console.log("CrossChainCache:", address(cache));
    }
}
