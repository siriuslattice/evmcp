// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IMulticall3 {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }
    struct Result {
        bool success;
        bytes returnData;
    }
    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory);
}

/// @title BatchQuery — Optimized batch reads via Multicall3
/// @notice Provides convenience methods for common multi-call patterns
contract BatchQuery is Ownable2Step {
    IMulticall3 public constant MULTICALL3 = IMulticall3(0xcA11bde05977b3631167028862bE2a173976CA11);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Get native ETH/AVAX/CELO balance for multiple addresses
    function multiBalance(address[] calldata wallets) external view returns (uint256[] memory balances) {
        balances = new uint256[](wallets.length);
        for (uint256 i = 0; i < wallets.length; i++) {
            balances[i] = wallets[i].balance;
        }
    }

    /// @notice Check if addresses have contract code deployed
    function multiIsContract(address[] calldata addrs) external view returns (bool[] memory results) {
        results = new bool[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            results[i] = addrs[i].code.length > 0;
        }
    }

    /// @notice Get ERC20 balances for one wallet across multiple tokens
    function multiTokenBalance(
        address wallet,
        address[] calldata tokens
    ) external returns (uint256[] memory balances) {
        IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            calls[i] = IMulticall3.Call3({
                target: tokens[i],
                allowFailure: true,
                callData: abi.encodeWithSignature("balanceOf(address)", wallet)
            });
        }
        IMulticall3.Result[] memory results = MULTICALL3.aggregate3(calls);
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            if (results[i].success && results[i].returnData.length >= 32) {
                balances[i] = abi.decode(results[i].returnData, (uint256));
            }
        }
    }
}
