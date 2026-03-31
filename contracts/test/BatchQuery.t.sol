// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BatchQuery.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] = amount;
    }
}

contract BatchQueryTest is Test {
    BatchQuery public bq;
    address public owner;

    function setUp() public {
        owner = address(this);
        bq = new BatchQuery(owner);
    }

    function test_multiBalance() public {
        address alice = address(0xA11CE);
        address bob = address(0xB0B);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 2.5 ether);

        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;

        uint256[] memory balances = bq.multiBalance(wallets);
        assertEq(balances[0], 1 ether);
        assertEq(balances[1], 2.5 ether);
    }

    function test_multiBalance_empty() public view {
        address[] memory wallets = new address[](0);
        uint256[] memory balances = bq.multiBalance(wallets);
        assertEq(balances.length, 0);
    }

    function test_multiIsContract() public {
        address eoa = address(0xA11CE);
        // Deploy a simple contract
        MockERC20 token = new MockERC20();

        address[] memory addrs = new address[](2);
        addrs[0] = eoa;
        addrs[1] = address(token);

        bool[] memory results = bq.multiIsContract(addrs);
        assertFalse(results[0]); // EOA
        assertTrue(results[1]); // Contract
    }

    function test_multiTokenBalance() public {
        // Deploy Multicall3 mock at the canonical address
        _deployMulticall3();

        MockERC20 token1 = new MockERC20();
        MockERC20 token2 = new MockERC20();
        address wallet = address(0xA11CE);

        token1.mint(wallet, 100e18);
        token2.mint(wallet, 200e18);

        address[] memory tokens = new address[](2);
        tokens[0] = address(token1);
        tokens[1] = address(token2);

        uint256[] memory balances = bq.multiTokenBalance(wallet, tokens);
        assertEq(balances[0], 100e18);
        assertEq(balances[1], 200e18);
    }

    function test_multiTokenBalance_invalidToken() public {
        _deployMulticall3();

        // EOA has no balanceOf — call will fail, allowFailure=true returns 0
        address[] memory tokens = new address[](1);
        tokens[0] = address(0xDEAD);

        uint256[] memory balances = bq.multiTokenBalance(address(0xA11CE), tokens);
        assertEq(balances[0], 0);
    }

    function test_multiBalance_singleAddress() public {
        address alice = address(0xA11CE);
        vm.deal(alice, 5 ether);

        address[] memory wallets = new address[](1);
        wallets[0] = alice;

        uint256[] memory balances = bq.multiBalance(wallets);
        assertEq(balances.length, 1);
        assertEq(balances[0], 5 ether);
    }

    function testFuzz_multiBalance(uint96 amount) public {
        address alice = address(0xA11CE);
        vm.deal(alice, amount);

        address[] memory wallets = new address[](1);
        wallets[0] = alice;

        uint256[] memory balances = bq.multiBalance(wallets);
        assertEq(balances[0], amount);
    }

    function _deployMulticall3() internal {
        // Deploy a minimal Multicall3 at the canonical address
        vm.etch(0xcA11bde05977b3631167028862bE2a173976CA11, address(new Multicall3Mock()).code);
    }
}

/// @dev Minimal Multicall3 mock that implements aggregate3
contract Multicall3Mock {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }
    struct Result {
        bool success;
        bytes returnData;
    }

    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory results) {
        results = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory returnData) = calls[i].target.call(calls[i].callData);
            if (!success && !calls[i].allowFailure) {
                revert("Multicall3: call failed");
            }
            results[i] = Result(success, returnData);
        }
    }
}
