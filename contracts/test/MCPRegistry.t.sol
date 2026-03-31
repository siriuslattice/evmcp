// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MCPRegistry.sol";

contract MCPRegistryTest is Test {
    MCPRegistry public registry;
    address public owner;
    address public nonOwner;

    function setUp() public {
        owner = address(this);
        nonOwner = address(0xBEEF);
        registry = new MCPRegistry(owner);
    }

    function test_registerTool_success() public {
        registry.registerTool("getBalance", "Get native balance", "0.1.0");

        MCPRegistry.ToolEntry memory tool = registry.getToolByName("getBalance");
        assertEq(tool.name, "getBalance");
        assertEq(tool.description, "Get native balance");
        assertEq(tool.version, "0.1.0");
        assertEq(tool.updatedAt, block.timestamp);
        assertEq(registry.getToolCount(), 1);
    }

    function test_registerTool_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit MCPRegistry.ToolRegistered("getBalance", "0.1.0", block.timestamp);
        registry.registerTool("getBalance", "Get native balance", "0.1.0");
    }

    function test_registerTool_duplicate_reverts() public {
        registry.registerTool("getBalance", "Get native balance", "0.1.0");
        vm.expectRevert("Tool already registered");
        registry.registerTool("getBalance", "Different description", "0.2.0");
    }

    function test_updateTool_success() public {
        registry.registerTool("getBalance", "Get native balance", "0.1.0");
        registry.updateTool("getBalance", "Updated description", "0.2.0");

        MCPRegistry.ToolEntry memory tool = registry.getToolByName("getBalance");
        assertEq(tool.description, "Updated description");
        assertEq(tool.version, "0.2.0");
    }

    function test_updateTool_emitsEvent() public {
        registry.registerTool("getBalance", "Get native balance", "0.1.0");
        vm.expectEmit(false, false, false, true);
        emit MCPRegistry.ToolUpdated("getBalance", "0.2.0", block.timestamp);
        registry.updateTool("getBalance", "Updated", "0.2.0");
    }

    function test_updateTool_nonexistent_reverts() public {
        vm.expectRevert("Tool not found");
        registry.updateTool("nonexistent", "desc", "0.1.0");
    }

    function test_getToolCount() public {
        assertEq(registry.getToolCount(), 0);
        registry.registerTool("tool1", "desc1", "0.1.0");
        assertEq(registry.getToolCount(), 1);
        registry.registerTool("tool2", "desc2", "0.1.0");
        assertEq(registry.getToolCount(), 2);
    }

    function test_getAllTools() public {
        registry.registerTool("tool1", "desc1", "0.1.0");
        registry.registerTool("tool2", "desc2", "0.2.0");

        MCPRegistry.ToolEntry[] memory tools = registry.getAllTools();
        assertEq(tools.length, 2);
        assertEq(tools[0].name, "tool1");
        assertEq(tools[1].name, "tool2");
    }

    function test_getToolByName_notFound_reverts() public {
        vm.expectRevert("Tool not found");
        registry.getToolByName("nonexistent");
    }

    function test_onlyOwner_registerTool() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.registerTool("tool", "desc", "0.1.0");
    }

    function test_onlyOwner_updateTool() public {
        registry.registerTool("tool", "desc", "0.1.0");
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.updateTool("tool", "new desc", "0.2.0");
    }

    function test_pause_blocks_register() public {
        registry.pause();
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        registry.registerTool("tool", "desc", "0.1.0");
    }

    function test_pause_blocks_update() public {
        registry.registerTool("tool", "desc", "0.1.0");
        registry.pause();
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        registry.updateTool("tool", "new desc", "0.2.0");
    }

    function test_unpause_allows_register() public {
        registry.pause();
        registry.unpause();
        registry.registerTool("tool", "desc", "0.1.0");
        assertEq(registry.getToolCount(), 1);
    }

    function test_onlyOwner_pause() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.pause();
    }

    function test_onlyOwner_unpause() public {
        registry.pause();
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.unpause();
    }

    function test_ownershipTransfer() public {
        address newOwner = address(0xCAFE);
        registry.transferOwnership(newOwner);

        // Still pending — old owner is still owner
        assertEq(registry.owner(), owner);

        // New owner accepts
        vm.prank(newOwner);
        registry.acceptOwnership();
        assertEq(registry.owner(), newOwner);
    }

    function testFuzz_registerTool(string calldata name, string calldata desc, string calldata ver) public {
        vm.assume(bytes(name).length > 0);
        registry.registerTool(name, desc, ver);
        MCPRegistry.ToolEntry memory tool = registry.getToolByName(name);
        assertEq(tool.name, name);
        assertEq(tool.description, desc);
        assertEq(tool.version, ver);
    }
}
