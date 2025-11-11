// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TipzCore.sol";
import "../src/TipzProfile.sol";

contract IntegrationTest is Test {
    TipzProfile public tipzProfile;
    TipzCore public tipzCore;

    address payable public platformWallet;
    address public alice;
    address public bob;
    address public charlie;
    address public dave;

    string constant ALICE_USERNAME = "alice_crypto";
    string constant BOB_USERNAME = "bob_defi";
    string constant CHARLIE_USERNAME = "charlie_nft";
    string constant DAVE_USERNAME = "dave_web3";

    function setUp() public {
        platformWallet = payable(makeAddr("platform"));
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        dave = makeAddr("dave");

        tipzProfile = new TipzProfile();
        tipzCore = new TipzCore(address(tipzProfile), platformWallet);
        tipzProfile.transferOwnership(address(tipzCore));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(dave, 100 ether);
    }

    // ============ Full User Journey Tests ============

    function test_CompleteUserJourney_RegisterTipWithdraw() public {
        // Step 1: Alice registers
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        TipzProfile.Profile memory aliceProfile = tipzProfile.getProfile(alice);
        assertEq(aliceProfile.xUsername, ALICE_USERNAME);
        assertTrue(aliceProfile.isActive);
        assertEq(aliceProfile.totalTipsReceived, 0);

        // Step 2: Bob registers
        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Step 3: Alice tips Bob
        uint256 tipAmount = 1 ether;
        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(alice);
        tipzCore.sendTip{value: tipAmount}(BOB_USERNAME, "Great content!");

        assertEq(alice.balance, aliceBalanceBefore - tipAmount);

        uint256 expectedFee = tipzCore.calculateFee(tipAmount);
        uint256 expectedRecipientAmount = tipAmount - expectedFee;

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedRecipientAmount);
        assertEq(tipzCore.getWithdrawableBalance(platformWallet), expectedFee);

        // Step 4: Verify profile stats updated
        TipzProfile.Profile memory bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.totalTipsReceived, expectedRecipientAmount);
        assertEq(bobProfile.totalTipsCount, 1);
        assertEq(bobProfile.withdrawableBalance, expectedRecipientAmount);

        // Step 5: Bob withdraws
        uint256 bobBalanceBefore = bob.balance;

        vm.prank(bob);
        tipzCore.withdrawAllTips();

        assertEq(bob.balance, bobBalanceBefore + expectedRecipientAmount);
        assertEq(tipzCore.getWithdrawableBalance(bob), 0);

        // Step 6: Verify withdrawal stats
        bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.withdrawableBalance, 0);
        assertEq(bobProfile.totalWithdrawn, expectedRecipientAmount);
        assertEq(bobProfile.totalTipsReceived, expectedRecipientAmount);

        // Step 7: Platform collects fees
        uint256 platformBalanceBefore = platformWallet.balance;

        tipzCore.collectPlatformFees(expectedFee);

        assertEq(platformWallet.balance, platformBalanceBefore + expectedFee);
    }

    function test_MultipleUsersMultipleTips() public {
        // Register all users
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.prank(charlie);
        tipzProfile.registerProfile(CHARLIE_USERNAME, 8000, 400, 250, "QmCharlie");

        // Multiple tips to Bob
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(charlie);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        vm.prank(alice);
        tipzCore.sendTip{value: 0.3 ether}(BOB_USERNAME, "Tip 3");

        // Calculate expected total
        uint256 tip1Amount = 1 ether - tipzCore.calculateFee(1 ether);
        uint256 tip2Amount = 0.5 ether - tipzCore.calculateFee(0.5 ether);
        uint256 tip3Amount = 0.3 ether - tipzCore.calculateFee(0.3 ether);
        uint256 expectedTotal = tip1Amount + tip2Amount + tip3Amount;

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedTotal);

        TipzProfile.Profile memory bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.totalTipsCount, 3);
        assertEq(bobProfile.totalTipsReceived, expectedTotal);

        // Bob withdraws partial
        uint256 withdrawAmount = 0.5 ether;
        vm.prank(bob);
        tipzCore.withdrawTips(withdrawAmount);

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedTotal - withdrawAmount);

        // More tips come in
        vm.prank(charlie);
        tipzCore.sendTip{value: 0.2 ether}(BOB_USERNAME, "Tip 4");

        uint256 tip4Amount = 0.2 ether - tipzCore.calculateFee(0.2 ether);
        assertEq(
            tipzCore.getWithdrawableBalance(bob),
            expectedTotal - withdrawAmount + tip4Amount
        );
    }

    function test_CircularTipping() public {
        // Register users
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.prank(charlie);
        tipzProfile.registerProfile(CHARLIE_USERNAME, 8000, 400, 250, "QmCharlie");

        // Alice tips Bob
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "From Alice");

        // Bob tips Charlie
        vm.prank(bob);
        tipzCore.sendTip{value: 0.5 ether}(CHARLIE_USERNAME, "From Bob");

        // Charlie tips Alice
        vm.prank(charlie);
        tipzCore.sendTip{value: 0.3 ether}(ALICE_USERNAME, "From Charlie");

        // Verify balances
        uint256 aliceReceived = 0.3 ether - tipzCore.calculateFee(0.3 ether);
        uint256 bobReceived = 1 ether - tipzCore.calculateFee(1 ether);
        uint256 charlieReceived = 0.5 ether - tipzCore.calculateFee(0.5 ether);

        assertEq(tipzCore.getWithdrawableBalance(alice), aliceReceived);
        assertEq(tipzCore.getWithdrawableBalance(bob), bobReceived);
        assertEq(tipzCore.getWithdrawableBalance(charlie), charlieReceived);

        // Verify tip history counts
        TipzCore.TipRecord[] memory aliceHistory = tipzCore.getTipHistory(alice, 0);
        assertEq(aliceHistory.length, 2); // Sent 1, received 1

        TipzCore.TipRecord[] memory bobHistory = tipzCore.getTipHistory(bob, 0);
        assertEq(bobHistory.length, 2); // Sent 1, received 1

        TipzCore.TipRecord[] memory charlieHistory = tipzCore.getTipHistory(charlie, 0);
        assertEq(charlieHistory.length, 2); // Sent 1, received 1
    }

    function test_TipHistoryAccuracy() public {
        // Register users
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Send multiple tips
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip 1");

        vm.prank(alice);
        tipzCore.sendTip{value: 0.5 ether}(BOB_USERNAME, "Tip 2");

        vm.prank(alice);
        tipzCore.sendTip{value: 0.3 ether}(BOB_USERNAME, "Tip 3");

        // Verify getTipsSent
        TipzCore.TipRecord[] memory aliceSent = tipzCore.getTipsSent(alice, 0);
        assertEq(aliceSent.length, 3);
        assertEq(aliceSent[0].amount, 0.3 ether); // Most recent first
        assertEq(aliceSent[1].amount, 0.5 ether);
        assertEq(aliceSent[2].amount, 1 ether);

        // Verify getTipsReceived
        TipzCore.TipRecord[] memory bobReceived = tipzCore.getTipsReceived(BOB_USERNAME, 0);
        assertEq(bobReceived.length, 3);
        assertEq(bobReceived[0].toUsername, BOB_USERNAME);
        assertEq(bobReceived[0].fromUsername, ALICE_USERNAME);

        // Verify total count
        assertEq(tipzCore.getTotalTipCount(), 3);

        // Verify recent tips
        TipzCore.TipRecord[] memory recent = tipzCore.getRecentTips(2);
        assertEq(recent.length, 2);
        assertEq(recent[0].id, 3); // Most recent
        assertEq(recent[1].id, 2);
    }

    function test_ProfileStatsConsistency() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Send tips
        uint256 tip1 = 1 ether;
        uint256 tip2 = 0.5 ether;

        vm.prank(alice);
        tipzCore.sendTip{value: tip1}(BOB_USERNAME, "Tip 1");

        vm.prank(alice);
        tipzCore.sendTip{value: tip2}(BOB_USERNAME, "Tip 2");

        // Verify stats
        TipzProfile.Profile memory bobProfile = tipzProfile.getProfile(bob);
        uint256 expectedTotal =
            (tip1 - tipzCore.calculateFee(tip1)) + (tip2 - tipzCore.calculateFee(tip2));

        assertEq(bobProfile.totalTipsReceived, expectedTotal);
        assertEq(bobProfile.totalTipsCount, 2);
        assertEq(bobProfile.withdrawableBalance, expectedTotal);
        assertEq(bobProfile.totalWithdrawn, 0);

        // Bob withdraws partial
        uint256 withdrawAmount = 0.4 ether;
        vm.prank(bob);
        tipzCore.withdrawTips(withdrawAmount);

        bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.totalTipsReceived, expectedTotal); // Unchanged
        assertEq(bobProfile.withdrawableBalance, expectedTotal - withdrawAmount);
        assertEq(bobProfile.totalWithdrawn, withdrawAmount);

        // Bob withdraws rest
        vm.prank(bob);
        tipzCore.withdrawAllTips();

        bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.withdrawableBalance, 0);
        assertEq(bobProfile.totalWithdrawn, expectedTotal);
    }

    function test_PlatformFeeAccumulation() public {
        // Register users
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Multiple tips accumulate platform fees
        uint256[] memory tipAmounts = new uint256[](5);
        tipAmounts[0] = 1 ether;
        tipAmounts[1] = 0.5 ether;
        tipAmounts[2] = 2 ether;
        tipAmounts[3] = 0.3 ether;
        tipAmounts[4] = 1.5 ether;

        uint256 totalFees;
        for (uint256 i = 0; i < tipAmounts.length; i++) {
            vm.prank(alice);
            tipzCore.sendTip{value: tipAmounts[i]}(BOB_USERNAME, "Tip");
            totalFees += tipzCore.calculateFee(tipAmounts[i]);
        }

        assertEq(tipzCore.getWithdrawableBalance(platformWallet), totalFees);

        // Platform collects half
        uint256 collectAmount = totalFees / 2;
        uint256 platformBalanceBefore = platformWallet.balance;

        tipzCore.collectPlatformFees(collectAmount);

        assertEq(platformWallet.balance, platformBalanceBefore + collectAmount);
        assertEq(tipzCore.getWithdrawableBalance(platformWallet), totalFees - collectAmount);
    }

    function test_UnregisteredUserCanTip() public {
        // Bob registers
        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Dave (unregistered) tips Bob
        vm.prank(dave);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Anonymous tip");

        uint256 expectedAmount = 1 ether - tipzCore.calculateFee(1 ether);
        assertEq(tipzCore.getWithdrawableBalance(bob), expectedAmount);

        // Verify tip record has empty username
        TipzCore.TipRecord memory tip = tipzCore.getTipById(1);
        assertEq(tip.fromAddress, dave);
        assertEq(tip.fromUsername, "");
        assertEq(tip.toUsername, BOB_USERNAME);
    }

    function test_ProfileDeactivationPreventsTips() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Alice tips Bob successfully
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Before deactivation");

        // Bob deactivates profile
        vm.prank(bob);
        tipzProfile.deactivateProfile();

        // Alice cannot tip Bob anymore
        vm.prank(alice);
        vm.expectRevert(TipzCore.RecipientNotRegistered.selector);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "After deactivation");

        // Bob can still withdraw existing balance
        uint256 balance = tipzCore.getWithdrawableBalance(bob);
        assertTrue(balance > 0);

        vm.prank(bob);
        tipzCore.withdrawAllTips();
        assertEq(tipzCore.getWithdrawableBalance(bob), 0);
    }

    function test_ContractPauseStopsAllOperations() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        // Pause both contracts (owner is test contract)
        address profileOwner = tipzProfile.owner();
        address coreOwner = tipzCore.owner();

        vm.prank(profileOwner);
        tipzProfile.pause();
        
        vm.prank(coreOwner);
        tipzCore.pause();

        // Cannot register
        vm.prank(charlie);
        vm.expectRevert();
        tipzProfile.registerProfile(CHARLIE_USERNAME, 8000, 400, 250, "QmCharlie");

        // Cannot tip
        vm.prank(alice);
        vm.expectRevert();
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Should fail");

        // Cannot withdraw
        vm.prank(bob);
        vm.expectRevert();
        tipzCore.withdrawAllTips();

        // Unpause
        vm.prank(profileOwner);
        tipzProfile.unpause();
        
        vm.prank(coreOwner);
        tipzCore.unpause();

        // Operations work again
        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Should succeed");

        assertEq(tipzCore.getTotalTipCount(), 1);
    }

    // ============ Fuzz Testing ============

    function testFuzz_TipAmountAccuracy(uint256 amount) public {
        vm.assume(amount >= 0.001 ether && amount <= 100 ether);

        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.deal(alice, amount + 1 ether);

        vm.prank(alice);
        tipzCore.sendTip{value: amount}(BOB_USERNAME, "Fuzz test");

        uint256 expectedFee = tipzCore.calculateFee(amount);
        uint256 expectedRecipient = amount - expectedFee;

        assertEq(tipzCore.getWithdrawableBalance(bob), expectedRecipient);
        assertEq(tipzCore.getWithdrawableBalance(platformWallet), expectedFee);

        // Fee should be exactly 2%
        assertEq(expectedFee, (amount * 200) / 10000);

        // Total should equal original
        assertEq(expectedFee + expectedRecipient, amount);
    }

    function testFuzz_MultipleWithdrawals(uint8 numTips) public {
        vm.assume(numTips > 0 && numTips <= 20);

        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        uint256 tipAmount = 0.1 ether;
        uint256 totalExpected;

        for (uint256 i = 0; i < numTips; i++) {
            vm.prank(alice);
            tipzCore.sendTip{value: tipAmount}(BOB_USERNAME, "Fuzz tip");
            totalExpected += tipAmount - tipzCore.calculateFee(tipAmount);
        }

        assertEq(tipzCore.getWithdrawableBalance(bob), totalExpected);

        TipzProfile.Profile memory bobProfile = tipzProfile.getProfile(bob);
        assertEq(bobProfile.totalTipsCount, numTips);
        assertEq(bobProfile.totalTipsReceived, totalExpected);
    }

    // ============ Gas Snapshot Tests ============

    function test_Gas_CompleteFlow() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Gas test");

        vm.prank(bob);
        tipzCore.withdrawAllTips();

        tipzCore.collectPlatformFees(tipzCore.getWithdrawableBalance(platformWallet));
    }

    function test_Gas_BatchTips() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        for (uint256 i = 0; i < 10; i++) {
            vm.prank(alice);
            tipzCore.sendTip{value: 0.1 ether}(BOB_USERNAME, "Batch tip");
        }
    }

    // ============ Edge Cases ============

    function test_TipToSelfReverts() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(alice);
        vm.expectRevert(TipzCore.SelfTipNotAllowed.selector);
        tipzCore.sendTip{value: 1 ether}(ALICE_USERNAME, "Self tip");
    }

    function test_WithdrawMoreThanBalanceReverts() public {
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Tip");

        uint256 balance = tipzCore.getWithdrawableBalance(bob);

        vm.prank(bob);
        vm.expectRevert(TipzCore.WithdrawalAmountExceedsBalance.selector);
        tipzCore.withdrawTips(balance + 1);
    }

    function test_DirectETHTransferAddsToPlatform() public {
        uint256 amount = 1 ether;
        uint256 balanceBefore = tipzCore.getWithdrawableBalance(platformWallet);

        (bool success, ) = address(tipzCore).call{value: amount}("");
        assertTrue(success);

        assertEq(
            tipzCore.getWithdrawableBalance(platformWallet),
            balanceBefore + amount
        );
    }

    function test_EmergencyWithdrawWhenPaused() public {
        // Create a new owner that can receive ETH
        address payable newOwner = payable(makeAddr("newOwner"));
        address currentOwner = tipzCore.owner();
        
        vm.prank(currentOwner);
        tipzCore.transferOwnership(newOwner);
        
        vm.prank(alice);
        tipzProfile.registerProfile(ALICE_USERNAME, 10000, 500, 300, "QmAlice");

        vm.prank(bob);
        tipzProfile.registerProfile(BOB_USERNAME, 5000, 200, 100, "QmBob");

        vm.prank(alice);
        tipzCore.sendTip{value: 1 ether}(BOB_USERNAME, "Emergency test");

        vm.prank(newOwner);
        tipzCore.pause();

        uint256 contractBalance = address(tipzCore).balance;
        uint256 ownerBalanceBefore = newOwner.balance;

        vm.prank(newOwner);
        tipzCore.emergencyWithdraw();

        assertEq(address(tipzCore).balance, 0);
        assertEq(newOwner.balance, ownerBalanceBefore + contractBalance);
    }
}
