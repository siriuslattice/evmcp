// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/EventAggregator.sol";

contract EventAggregatorTest is Test {
    EventAggregator public agg;
    address public owner;
    address public nonOwner;

    function setUp() public {
        owner = address(this);
        nonOwner = address(0xBEEF);
        agg = new EventAggregator(owner);
    }

    function test_updateSummary_new() public {
        address target = address(0x1234);
        agg.updateSummary(target, 100, 5000);

        EventAggregator.Summary memory s = agg.getSummary(target);
        assertEq(s.eventCount, 100);
        assertEq(s.lastBlock, 5000);
        assertEq(s.updatedAt, block.timestamp);

        address[] memory tracked = agg.getTrackedContracts();
        assertEq(tracked.length, 1);
        assertEq(tracked[0], target);
    }

    function test_updateSummary_existing_noDuplicate() public {
        address target = address(0x1234);
        agg.updateSummary(target, 100, 5000);
        agg.updateSummary(target, 200, 6000);

        // Should NOT add duplicate
        address[] memory tracked = agg.getTrackedContracts();
        assertEq(tracked.length, 1);

        EventAggregator.Summary memory s = agg.getSummary(target);
        assertEq(s.eventCount, 200);
        assertEq(s.lastBlock, 6000);
    }

    function test_getSummary_unset() public view {
        EventAggregator.Summary memory s = agg.getSummary(address(0xDEAD));
        assertEq(s.eventCount, 0);
        assertEq(s.lastBlock, 0);
        assertEq(s.updatedAt, 0);
    }

    function test_getTrackedContracts_multiple() public {
        agg.updateSummary(address(0x1), 10, 100);
        agg.updateSummary(address(0x2), 20, 200);
        agg.updateSummary(address(0x3), 30, 300);

        address[] memory tracked = agg.getTrackedContracts();
        assertEq(tracked.length, 3);
        assertEq(tracked[0], address(0x1));
        assertEq(tracked[1], address(0x2));
        assertEq(tracked[2], address(0x3));
    }

    function test_emitsEvent() public {
        address target = address(0x1234);
        vm.expectEmit(true, false, false, true);
        emit EventAggregator.SummaryUpdated(target, 100, 5000);
        agg.updateSummary(target, 100, 5000);
    }

    function test_onlyOwner_updateSummary() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        agg.updateSummary(address(0x1), 10, 100);
    }

    function test_pause_blocks_update() public {
        agg.pause();
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        agg.updateSummary(address(0x1), 10, 100);
    }

    function test_unpause_allows_update() public {
        agg.pause();
        agg.unpause();
        agg.updateSummary(address(0x1), 10, 100);
        assertEq(agg.getSummary(address(0x1)).eventCount, 10);
    }

    function test_onlyOwner_pause() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        agg.pause();
    }

    function test_ownershipTransfer() public {
        address newOwner = address(0xCAFE);
        agg.transferOwnership(newOwner);
        assertEq(agg.owner(), owner); // Still pending

        vm.prank(newOwner);
        agg.acceptOwnership();
        assertEq(agg.owner(), newOwner);
    }

    function testFuzz_updateSummary(address target, uint256 eventCount, uint256 lastBlock) public {
        vm.assume(target != address(0));
        agg.updateSummary(target, eventCount, lastBlock);
        EventAggregator.Summary memory s = agg.getSummary(target);
        assertEq(s.eventCount, eventCount);
        assertEq(s.lastBlock, lastBlock);
    }
}
