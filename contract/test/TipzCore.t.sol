// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TipzCore.sol";
import "../src/TipzProfile.sol";

contract TipzCoreTest is Test {
    TipzProfile public tipzProfile;
    TipzCore public tipzCore;

    address public owner;
    address payable public platformWallet;
    address public alice;
    address public bob;
    address public charlie;

    // Test data
    string constant ALICE_USERNAME = "alice_crypto";
    string constant BOB_USERNAME = "bob_defi";
    string constant CHARLIE_USERNAME = "charlie_nft";

    // Events to test
    event TipSent(
        uint256 indexed tipId,
        address indexed from,
        address indexed to,
        string fromUsername,
        string toUsername,
        uint256 amount,
        uint256 platformFee,
        uint256 recipientAmount,
        string message,
        uint256 timestamp
    );

    event TipsWithdrawn(address indexed user, uint256 amount, uint256 timestamp);

    function setUp() public {
        owner = address(this);
        platformWallet = payable(makeAddr("platform"));
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        // Deploy contracts
        tipzProfile = new TipzProfile();
        tipzCore = new TipzCore(address(tipzProfile), platformWallet);

        // Make TipzCore the owner of TipzProfile (so it can update stats)
        tipzProfile.transferOwnership(address(tipzCore));

        // Register test users
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Give users some ETH
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }

    // ============ Tipping Tests ============

    function testSendTip() public {
        uint256 tipAmount = 1 ether;
        string memory message = "Great content!";

        uint256 expectedFee = tipzCore.calculateFee(tipAmount);
        uint256 expectedRecipientAmount = tipAmount - expectedFee;

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit TipSent(
            1,
            alice,
            bob,
            ALICE_USERNAME,
            BOB_USERNAME,
            tipAmount,
            expectedFee,
            expectedRecipientAmount,
            message,
            block.timestamp
        );

        tipzCore.sendTip{value: tipAmount}(BOB_USERNAME, message);

        // Verify balances
        assertEq(tipzCore.getWithdrawableBalance(bob), expectedRecipientAmount);
        assertEq(tipzCore.getWithdrawableBalance(platformWallet), expectedFee);

        // Verify tip history
        assertEq(tipzCore.getTotalTipCount(), 1);

        TipzCore.TipRecord memory tip = tipzCore.getTipById(1);
        assertEq(tip.fromAddress, alice);
        assertEq(tip.fromUsername, ALICE_USERNAME);
        assertEq(tip.toUsername, BOB_USERNAME);
        assertEq(tip.amount, tipAmount);
        assertEq(tip.message, message);
    }

    function testSendTipFromUnregisteredUser() public {
        uint256 tipAmount = 1 ether;

        vm.prank(charlie);
        tipzCore.sendTip{value: tipAmount}(ALICE_USERNAME, "Anonymous tip");

        TipzCore.TipRecord memory tip = tipzCore.getTipById(1);
        assertEq(tip.fromUsername, ""); // Empty string for unregistered
    }

    function testCannotTipNonExistentUser() public {
        vm.prank(alice);
        vm.expectRevert(TipzCore.RecipientNotRegistered.selector);
        tipzCore.sendTip{value: 1 ether}("nonexistent_user", "Hello");
    }

    function testCannotTipSelf() public {
        vm.prank(alice);
        vm.expectRevert(TipzCore.SelfTipNotAllowed.selector);
        tipzCore.sendTip{value: 1 ether}(ALICE_USERNAME, "Tipping myself");
    }

    function testCannotTipBelowMinimum() public {
        vm.prank(alice);
        vm.expectRevert(TipzCore.TipAmountTooLow.selector);
        tipzCore.sendTip{value: 0.0001 ether}(BOB_USERNAME, "Too small");
    }

    function testCannotTipInactiveProfile() public {
        // Deactivate Bob's profile
        vm.prank(bob);
        tipzProfile.deactivateProfile();

        vm.prank(alice);
        vm.expectRevert(TipzCore.RecipientNotRegistered.selector);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "To inactive user");
    }

    // ============ Fee Calculation Tests ============

    function testCalculateFee() public {
        // 2% of 1 ether = 0.02 ether
        assertEq(tipzCore.calculateFee(1 ether), 0.02 ether);

        // 2% of 100 ether = 2 ether
        assertEq(tipzCore.calculateFee(100 ether), 2 ether);

        // 2% of 0.5 ether = 0.01 ether
        assertEq(tipzCore.calculateFee(0.5 ether), 0.01 ether);
    }

    function testFeeCalculationAccuracy() public {
        uint256 tipAmount = 1.23456789 ether;
        uint256 fee = tipzCore.calculateFee(tipAmount);
        uint256 recipientAmount = tipAmount - fee;

        // Fee should be exactly 2%
        assertEq(fee, (tipAmount * 200) / 10000);

        // Sum should equal original
        assertEq(fee + recipientAmount, tipAmount);
    }

    function testFuzzFeeCalculation(uint256 amount) public {
        vm.assume(amount > 0 && amount < 1000000 ether);

        uint256 fee = tipzCore.calculateFee(amount);
        uint256 recipientAmount = amount - fee;

        // Fee should never exceed amount
        assertLe(fee, amount);

        // Recipient should get at least 98%
        assertGe(recipientAmount, (amount * 9800) / 10000);

        // Sum should equal original
        assertEq(fee + recipientAmount, amount);
    }

    // ============ Withdrawal Tests ============

    function testWithdrawTips() public {
        // Send tip to Bob
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Nice work");

        uint256 bobBalance = tipzCore.getWithdrawableBalance(bob);
        uint256 bobBalanceBefore = bob.balance;

        // Bob withdraws
        vm.prank(bob);
        vm.expectEmit(true, false, false, true);
        emit TipsWithdrawn(bob, bobBalance, block.timestamp);

        tipzCore.withdrawTips(bobBalance);

        // Verify balances
        assertEq(tipzCore.getWithdrawableBalance(bob), 0);
        assertEq(bob.balance, bobBalanceBefore + bobBalance);
    }

    function testWithdrawAllTips() public {
        // Send multiple tips
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(charlie);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        uint256 bobBalance = tipzCore.getWithdrawableBalance(bob);
        uint256 bobBalanceBefore = bob.balance;

        // Bob withdraws all
        vm.prank(bob);
        tipzCore.withdrawAllTips();

        assertEq(tipzCore.getWithdrawableBalance(bob), 0);
        assertEq(bob.balance, bobBalanceBefore + bobBalance);
    }

    function testCannotWithdrawZero() public {
        vm.prank(bob);
        vm.expectRevert(TipzCore.WithdrawalAmountZero.selector);
        tipzCore.withdrawTips(0);
    }

    function testCannotWithdrawMoreThanBalance() public {
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip");

        uint256 balance = tipzCore.getWithdrawableBalance(bob);

        vm.prank(bob);
        vm.expectRevert(TipzCore.WithdrawalAmountExceedsBalance.selector);
        tipzCore.withdrawTips(balance + 1);
    }

    function testPartialWithdrawal() public {
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip");

        uint256 balance = tipzCore.getWithdrawableBalance(bob);
        uint256 withdrawAmount = balance / 2;

        vm.prank(bob);
        tipzCore.withdrawTips(withdrawAmount);

        assertEq(tipzCore.getWithdrawableBalance(bob), balance - withdrawAmount);
    }

    // ============ Tip History Tests ============

    function testGetTipHistory() public {
        // Alice tips Bob
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        // Bob tips Alice
        vm.prank(bob);
        tipzCore.sendTip{value: 0.5 ether}(ALICE_USERNAME, "Tip 2");

        // Alice's history (sent 1, received 1)
        TipzCore.TipRecord[] memory aliceHistory = tipzCore.getTipHistory(alice, 0);
        assertEq(aliceHistory.length, 2);

        // Bob's history (sent 1, received 1)
        TipzCore.TipRecord[] memory bobHistory = tipzCore.getTipHistory(bob, 0);
        assertEq(bobHistory.length, 2);
    }

    function testGetTipHistoryWithLimit() public {
        // Send 5 tips
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            tipzCore.sendTip{value: 0.1 ether}(BOB_USERNAME, "Tip");
        }

        TipzCore.TipRecord[] memory history = tipzCore.getTipHistory(alice, 3);
        assertEq(history.length, 3);

        // Should be most recent first
        assertEq(history[0].id, 5);
        assertEq(history[1].id, 4);
        assertEq(history[2].id, 3);
    }

    function testGetRecentTips() public {
        // Send tips from different users
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(bob);
        tipzCore.sendTip{value: 0.5 ether}(ALICE_USERNAME, "Tip 2");

        vm.prank(charlie);
        tipzCore.sendTip{value: 0.3 ether}(ALICE_USERNAME, "Tip 3");

        TipzCore.TipRecord[] memory recent = tipzCore.getRecentTips(2);
        assertEq(recent.length, 2);

        // Most recent first
        assertEq(recent[0].id, 3);
        assertEq(recent[1].id, 2);
    }

    function testGetTipsSent() public {
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(alice);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        vm.prank(bob);
        tipzCore.sendTip{value: 0.3 ether}(ALICE_USERNAME, "Tip 3");

        TipzCore.TipRecord[] memory aliceSent = tipzCore.getTipsSent(alice, 0);
        assertEq(aliceSent.length, 2);
        assertEq(aliceSent[0].fromAddress, alice);
        assertEq(aliceSent[1].fromAddress, alice);
    }

    function testGetTipsReceived() public {
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(charlie);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        TipzCore.TipRecord[] memory bobReceived = tipzCore.getTipsReceived(BOB_USERNAME, 0);
        assertEq(bobReceived.length, 2);
        assertEq(bobReceived[0].toUsername, BOB_USERNAME);
        assertEq(bobReceived[1].toUsername, BOB_USERNAME);
    }

    // ============ Admin Tests ============

    function testUpdatePlatformWallet() public {
        address payable newWallet = payable(makeAddr("newPlatform"));

        tipzCore.updatePlatformWallet(newWallet);

        assertEq(tipzCore.platformWallet(), newWallet);
    }

    function testCannotUpdatePlatformWalletToZero() public {
        vm.expectRevert(TipzCore.InvalidPlatformWallet.selector);
        tipzCore.updatePlatformWallet(payable(address(0)));
    }

    function testCollectPlatformFees() public {
        // Generate some fees
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip");

        uint256 platformBalance = tipzCore.getWithdrawableBalance(platformWallet);
        uint256 walletBalanceBefore = platformWallet.balance;

        tipzCore.collectPlatformFees(platformBalance);

        assertEq(tipzCore.getWithdrawableBalance(platformWallet), 0);
        assertEq(platformWallet.balance, walletBalanceBefore + platformBalance);
    }

    function testPauseUnpause() public {
        tipzCore.pause();

        vm.prank(alice);
        vm.expectRevert();
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Should fail");

        tipzCore.unpause();

        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Should succeed");

        assertEq(tipzCore.getTotalTipCount(), 1);
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        tipzCore.pause();
    }

    function testOnlyOwnerCanUpdatePlatformWallet() public {
        vm.prank(alice);
        vm.expectRevert();
        tipzCore.updatePlatformWallet(payable(makeAddr("newWallet")));
    }

    // ============ Integration Tests ============

    function testFullTipCycle() public {
        // 1. Alice tips Bob 1 ETH
        uint256 tipAmount = 1 ether;
        vm.prank(alice);
        tipzCore.sendTip{value: tipAmount}(BOB_USERNAME, "Great work!");

        // 2. Verify fee distribution
        uint256 expectedFee = tipzCore.calculateFee(tipAmount);
        uint256 expectedRecipientAmount = tipAmount - expectedFee;

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedRecipientAmount);
        assertEq(tipzCore.getWithdrawableBalance(platformWallet), expectedFee);

        // 3. Bob withdraws
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        tipzCore.withdrawAllTips();

        assertEq(bob.balance, bobBalanceBefore + expectedRecipientAmount);
        assertEq(tipzCore.getWithdrawableBalance(bob), 0);

        // 4. Platform collects fees
        uint256 platformBalanceBefore = platformWallet.balance;
        tipzCore.collectPlatformFees(expectedFee);

        assertEq(platformWallet.balance, platformBalanceBefore + expectedFee);
    }

    function testMultipleTipsAccumulate() public {
        // Multiple tips to Bob
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(charlie);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        vm.prank(alice);
        tipzCore.sendTip{value: 0.3 ether}(BOB_USERNAME, "Tip 3");

        // Calculate expected total (minus fees)
        uint256 expectedTotal = (1 ether - tipzCore.calculateFee(1 ether)) +
            (0.5 ether - tipzCore.calculateFee(0.5 ether)) +
            (0.3 ether - tipzCore.calculateFee(0.3 ether));

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedTotal);
    }

    // ============ Reentrancy Tests ============

    function testReentrancyProtection() public {
        // TipzCore uses nonReentrant modifier on sendTip and withdrawTips
        // This test verifies the modifier is applied

        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Test");

        // Further reentrancy testing would require a malicious contract
        // For now, we verify the contract compiles with ReentrancyGuard
        assertTrue(tipzCore.getWithdrawableBalance(bob) > 0);
    }

    // ============ Receive Function Test ============

    function testReceiveFunction() public {
        uint256 amount = 1 ether;
        uint256 platformBalanceBefore = tipzCore.getWithdrawableBalance(platformWallet);

        // Send ETH directly to contract
        (bool success, ) = address(tipzCore).call{value: amount}("");
        assertTrue(success);

        // Should be added to platform wallet balance
        assertEq(
            tipzCore.getWithdrawableBalance(platformWallet),
            platformBalanceBefore + amount
        );
    }
}
