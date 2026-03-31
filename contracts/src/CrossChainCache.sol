// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CrossChainCache — Stores balance snapshots for cross-chain queries
/// @notice Caches balance snapshots per account for cross-chain comparison. Owner-only writes.
contract CrossChainCache is Ownable2Step, Pausable {
    struct Snapshot {
        uint256 balance;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(address => Snapshot) public snapshots;

    event SnapshotUpdated(address indexed account, uint256 balance, uint256 blockNumber);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function updateSnapshot(
        address account,
        uint256 balance,
        uint256 blockNumber
    ) external onlyOwner whenNotPaused {
        snapshots[account] = Snapshot(balance, blockNumber, block.timestamp);
        emit SnapshotUpdated(account, balance, blockNumber);
    }

    function batchUpdateSnapshots(
        address[] calldata accounts,
        uint256[] calldata balances,
        uint256[] calldata blockNumbers
    ) external onlyOwner whenNotPaused {
        require(accounts.length == balances.length && balances.length == blockNumbers.length, "Length mismatch");
        for (uint256 i = 0; i < accounts.length; i++) {
            snapshots[accounts[i]] = Snapshot(balances[i], blockNumbers[i], block.timestamp);
            emit SnapshotUpdated(accounts[i], balances[i], blockNumbers[i]);
        }
    }

    function getSnapshot(address account) external view returns (Snapshot memory) {
        return snapshots[account];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
