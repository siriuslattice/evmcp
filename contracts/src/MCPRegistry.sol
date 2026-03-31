// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title MCPRegistry — On-chain metadata for EVMCP tools
/// @notice Stores tool names, descriptions, and versions. Owner-only writes.
contract MCPRegistry is Ownable2Step, Pausable {
    struct ToolEntry {
        string name;
        string description;
        string version;
        uint256 updatedAt;
    }

    ToolEntry[] private _tools;
    mapping(bytes32 => uint256) private _toolIndex; // keccak256(name) => array index + 1 (0 = not found)

    event ToolRegistered(string indexed name, string version, uint256 timestamp);
    event ToolUpdated(string indexed name, string version, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerTool(
        string calldata name,
        string calldata description,
        string calldata version
    ) external onlyOwner whenNotPaused {
        bytes32 key = keccak256(abi.encodePacked(name));
        require(_toolIndex[key] == 0, "Tool already registered");
        _tools.push(ToolEntry(name, description, version, block.timestamp));
        _toolIndex[key] = _tools.length; // 1-indexed
        emit ToolRegistered(name, version, block.timestamp);
    }

    function updateTool(
        string calldata name,
        string calldata description,
        string calldata version
    ) external onlyOwner whenNotPaused {
        bytes32 key = keccak256(abi.encodePacked(name));
        uint256 idx = _toolIndex[key];
        require(idx != 0, "Tool not found");
        ToolEntry storage entry = _tools[idx - 1];
        entry.description = description;
        entry.version = version;
        entry.updatedAt = block.timestamp;
        emit ToolUpdated(name, version, block.timestamp);
    }

    function getToolCount() external view returns (uint256) {
        return _tools.length;
    }

    function getAllTools() external view returns (ToolEntry[] memory) {
        return _tools;
    }

    function getToolByName(string calldata name) external view returns (ToolEntry memory) {
        bytes32 key = keccak256(abi.encodePacked(name));
        uint256 idx = _toolIndex[key];
        require(idx != 0, "Tool not found");
        return _tools[idx - 1];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
