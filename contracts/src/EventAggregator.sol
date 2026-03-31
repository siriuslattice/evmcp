// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title EventAggregator — Caches event count summaries per contract
/// @notice Stores event count summaries for tracked contracts. Owner-only writes.
contract EventAggregator is Ownable2Step, Pausable {
    struct Summary {
        uint256 eventCount;
        uint256 lastBlock;
        uint256 updatedAt;
    }

    mapping(address => Summary) public summaries;
    address[] private _trackedContracts;
    mapping(address => bool) private _isTracked;

    event SummaryUpdated(address indexed target, uint256 eventCount, uint256 lastBlock);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function updateSummary(
        address target,
        uint256 eventCount,
        uint256 lastBlock
    ) external onlyOwner whenNotPaused {
        if (!_isTracked[target]) {
            _trackedContracts.push(target);
            _isTracked[target] = true;
        }
        summaries[target] = Summary(eventCount, lastBlock, block.timestamp);
        emit SummaryUpdated(target, eventCount, lastBlock);
    }

    function getSummary(address target) external view returns (Summary memory) {
        return summaries[target];
    }

    function getTrackedContracts() external view returns (address[] memory) {
        return _trackedContracts;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
