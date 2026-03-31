// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CrossChainCache.sol";

contract CrossChainCacheTest is Test {
    CrossChainCache public cache;
    address public owner;
    address public nonOwner;

    function setUp() public {
        owner = address(this);
        nonOwner = address(0xBEEF);
        cache = new CrossChainCache(owner);
    }

    function test_updateSnapshot() public {
        address account = address(0xA11CE);
        cache.updateSnapshot(account, 1 ether, 12345);

        CrossChainCache.Snapshot memory s = cache.getSnapshot(account);
        assertEq(s.balance, 1 ether);
        assertEq(s.blockNumber, 12345);
        assertEq(s.timestamp, block.timestamp);
    }

    function test_updateSnapshot_emitsEvent() public {
        address account = address(0xA11CE);
        vm.expectEmit(true, false, false, true);
        emit CrossChainCache.SnapshotUpdated(account, 1 ether, 12345);
        cache.updateSnapshot(account, 1 ether, 12345);
    }

    function test_overwrite_snapshot() public {
        address account = address(0xA11CE);
        cache.updateSnapshot(account, 1 ether, 100);
        cache.updateSnapshot(account, 2 ether, 200);

        CrossChainCache.Snapshot memory s = cache.getSnapshot(account);
        assertEq(s.balance, 2 ether);
        assertEq(s.blockNumber, 200);
    }

    function test_getSnapshot_unset() public view {
        CrossChainCache.Snapshot memory s = cache.getSnapshot(address(0xDEAD));
        assertEq(s.balance, 0);
        assertEq(s.blockNumber, 0);
        assertEq(s.timestamp, 0);
    }

    function test_batchUpdateSnapshots() public {
        address[] memory accounts = new address[](3);
        accounts[0] = address(0x1);
        accounts[1] = address(0x2);
        accounts[2] = address(0x3);

        uint256[] memory balances = new uint256[](3);
        balances[0] = 1 ether;
        balances[1] = 2 ether;
        balances[2] = 3 ether;

        uint256[] memory blockNums = new uint256[](3);
        blockNums[0] = 100;
        blockNums[1] = 200;
        blockNums[2] = 300;

        cache.batchUpdateSnapshots(accounts, balances, blockNums);

        assertEq(cache.getSnapshot(address(0x1)).balance, 1 ether);
        assertEq(cache.getSnapshot(address(0x2)).balance, 2 ether);
        assertEq(cache.getSnapshot(address(0x3)).balance, 3 ether);
        assertEq(cache.getSnapshot(address(0x1)).blockNumber, 100);
    }

    function test_batchUpdateSnapshots_emitsEvents() public {
        address[] memory accounts = new address[](2);
        accounts[0] = address(0x1);
        accounts[1] = address(0x2);

        uint256[] memory balances = new uint256[](2);
        balances[0] = 1 ether;
        balances[1] = 2 ether;

        uint256[] memory blockNums = new uint256[](2);
        blockNums[0] = 100;
        blockNums[1] = 200;

        vm.expectEmit(true, false, false, true);
        emit CrossChainCache.SnapshotUpdated(address(0x1), 1 ether, 100);
        vm.expectEmit(true, false, false, true);
        emit CrossChainCache.SnapshotUpdated(address(0x2), 2 ether, 200);
        cache.batchUpdateSnapshots(accounts, balances, blockNums);
    }

    function test_batchUpdateSnapshots_lengthMismatch() public {
        address[] memory accounts = new address[](2);
        accounts[0] = address(0x1);
        accounts[1] = address(0x2);

        uint256[] memory balances = new uint256[](1);
        balances[0] = 1 ether;

        uint256[] memory blockNums = new uint256[](2);
        blockNums[0] = 100;
        blockNums[1] = 200;

        vm.expectRevert("Length mismatch");
        cache.batchUpdateSnapshots(accounts, balances, blockNums);
    }

    function test_onlyOwner_updateSnapshot() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        cache.updateSnapshot(address(0x1), 1 ether, 100);
    }

    function test_onlyOwner_batchUpdate() public {
        address[] memory a = new address[](1);
        a[0] = address(0x1);
        uint256[] memory b = new uint256[](1);
        b[0] = 1;
        uint256[] memory c = new uint256[](1);
        c[0] = 1;

        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        cache.batchUpdateSnapshots(a, b, c);
    }

    function test_pause_blocks_updateSnapshot() public {
        cache.pause();
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        cache.updateSnapshot(address(0x1), 1 ether, 100);
    }

    function test_pause_blocks_batchUpdate() public {
        address[] memory a = new address[](1);
        a[0] = address(0x1);
        uint256[] memory b = new uint256[](1);
        b[0] = 1;
        uint256[] memory c = new uint256[](1);
        c[0] = 1;

        cache.pause();
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        cache.batchUpdateSnapshots(a, b, c);
    }

    function test_unpause_allows_operations() public {
        cache.pause();
        cache.unpause();
        cache.updateSnapshot(address(0x1), 1 ether, 100);
        assertEq(cache.getSnapshot(address(0x1)).balance, 1 ether);
    }

    function test_onlyOwner_pause() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        cache.pause();
    }

    function test_ownershipTransfer() public {
        address newOwner = address(0xCAFE);
        cache.transferOwnership(newOwner);
        assertEq(cache.owner(), owner);

        vm.prank(newOwner);
        cache.acceptOwnership();
        assertEq(cache.owner(), newOwner);
    }

    function testFuzz_updateSnapshot(address account, uint256 balance, uint256 blockNum) public {
        cache.updateSnapshot(account, balance, blockNum);
        CrossChainCache.Snapshot memory s = cache.getSnapshot(account);
        assertEq(s.balance, balance);
        assertEq(s.blockNumber, blockNum);
    }
}
