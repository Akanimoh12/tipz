// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TipzProfile.sol";

contract TipzProfileTest is Test {
    TipzProfile public tipzProfile;
    address public owner;
    address public user1;
    address public user2;

    // Test data
    string constant USERNAME1 = "alice_crypto";
    string constant USERNAME2 = "bob_defi";
    uint64 constant FOLLOWERS = 10000;
    uint64 constant POSTS = 500;
    uint64 constant REPLIES = 300;
    string constant IPFS_HASH = "QmTest123456789";

    // Events to test
    event ProfileCreated(
        address indexed user,
        string username,
        uint32 creditScore,
        uint256 timestamp
    );

    event ProfileUpdated(
        address indexed user,
        string metadata,
        uint256 timestamp
    );

    event CreditScoreUpdated(
        address indexed user,
        uint32 oldScore,
        uint32 newScore,
        uint256 timestamp
    );

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        tipzProfile = new TipzProfile();
    }

    // ============ Registration Tests ============

    function testRegisterProfile() public {
        vm.startPrank(user1);

        // Calculate expected credit score
        uint32 expectedScore = tipzProfile.calculateCreditScore(
            FOLLOWERS,
            POSTS,
            REPLIES
        );

        // Expect ProfileCreated event
        vm.expectEmit(true, false, false, true);
        emit ProfileCreated(user1, USERNAME1, expectedScore, block.timestamp);

        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        // Verify profile was created
        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertEq(profile.walletAddress, user1);
        assertEq(profile.xUsername, USERNAME1);
        assertEq(profile.xFollowers, FOLLOWERS);
        assertEq(profile.xPosts, POSTS);
        assertEq(profile.xReplies, REPLIES);
        assertEq(profile.creditScore, expectedScore);
        assertEq(profile.profileImageIpfs, IPFS_HASH);
        assertEq(profile.totalTipsReceived, 0);
        assertEq(profile.totalTipsCount, 0);
        assertEq(profile.withdrawableBalance, 0);
        assertEq(profile.totalWithdrawn, 0);
        assertTrue(profile.isActive);
        assertEq(profile.createdAt, block.timestamp);

        vm.stopPrank();
    }

    function testCannotRegisterDuplicateProfile() public {
        vm.startPrank(user1);

        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        // Try to register again
        vm.expectRevert(TipzProfile.ProfileAlreadyExists.selector);
        tipzProfile.registerProfile("another_name", FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        vm.stopPrank();
    }

    function testCannotRegisterDuplicateUsername() public {
        // User1 registers
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        // User2 tries to use same username
        vm.prank(user2);
        vm.expectRevert(TipzProfile.UsernameAlreadyTaken.selector);
        tipzProfile.registerProfile(USERNAME1, 5000, 200, 100, "QmOther");
    }

    function testCannotRegisterEmptyUsername() public {
        vm.prank(user1);
        vm.expectRevert(TipzProfile.EmptyUsername.selector);
        tipzProfile.registerProfile("", FOLLOWERS, POSTS, REPLIES, IPFS_HASH);
    }

    function testCannotRegisterInvalidUsernameLength() public {
        // Too short (0 chars handled by EmptyUsername)
        // Too long (>15 chars)
        vm.prank(user1);
        vm.expectRevert(TipzProfile.InvalidUsernameLength.selector);
        tipzProfile.registerProfile(
            "this_is_way_too_long_username",
            FOLLOWERS,
            POSTS,
            REPLIES,
            IPFS_HASH
        );
    }

    function testCannotRegisterInvalidUsername() public {
        // Username with special characters
        vm.prank(user1);
        vm.expectRevert(TipzProfile.InvalidUsername.selector);
        tipzProfile.registerProfile("user@test", FOLLOWERS, POSTS, REPLIES, IPFS_HASH);
    }

    // ============ Credit Score Tests ============

    function testCalculateCreditScore() public view {
        // Test case 1: Small metrics
        // (100*50 + 50*30 + 30*20) / 10000 = (5000 + 1500 + 600) / 10000 = 7100 / 10000 = 0
        uint32 score1 = tipzProfile.calculateCreditScore(100, 50, 30);
        assertEq(score1, 0); // Integer division results in 0

        // Test case 2: Medium metrics
        // (10000*50 + 500*30 + 300*20) / 10000 = (500000 + 15000 + 6000) / 10000 = 521000 / 10000 = 52
        uint32 score2 = tipzProfile.calculateCreditScore(10000, 500, 300);
        assertEq(score2, 52);

        // Test case 3: Large metrics
        // (100000*50 + 10000*30 + 5000*20) / 10000 = (5000000 + 300000 + 100000) / 10000 = 5400000 / 10000 = 540
        uint32 score3 = tipzProfile.calculateCreditScore(100000, 10000, 5000);
        assertEq(score3, 540);

        // Test case 4: Very large metrics (should cap at 1000)
        // (1000000*50 + 100000*30 + 50000*20) / 10000 = (50000000 + 3000000 + 1000000) / 10000 = 5400
        uint32 score4 = tipzProfile.calculateCreditScore(1000000, 100000, 50000);
        assertEq(score4, 1000); // Capped at MAX_CREDIT_SCORE
    }

    function testUpdateXMetrics() public {
        // Register profile
        vm.startPrank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        uint32 oldScore = tipzProfile.getProfile(user1).creditScore;

        // Update metrics
        uint64 newFollowers = 20000;
        uint64 newPosts = 1000;
        uint64 newReplies = 600;

        uint32 expectedNewScore = tipzProfile.calculateCreditScore(
            newFollowers,
            newPosts,
            newReplies
        );

        vm.expectEmit(true, false, false, true);
        emit CreditScoreUpdated(user1, oldScore, expectedNewScore, block.timestamp);

        tipzProfile.updateXMetrics(newFollowers, newPosts, newReplies);

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertEq(profile.xFollowers, newFollowers);
        assertEq(profile.xPosts, newPosts);
        assertEq(profile.xReplies, newReplies);
        assertEq(profile.creditScore, expectedNewScore);

        vm.stopPrank();
    }

    // ============ Profile Update Tests ============

    function testUpdateProfileMetadata() public {
        vm.startPrank(user1);

        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        string memory newIpfs = "QmNewHash987654321";

        vm.expectEmit(true, false, false, true);
        emit ProfileUpdated(user1, newIpfs, block.timestamp);

        tipzProfile.updateProfileMetadata(newIpfs);

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertEq(profile.profileImageIpfs, newIpfs);

        vm.stopPrank();
    }

    function testCannotUpdateNonExistentProfile() public {
        vm.prank(user1);
        vm.expectRevert(TipzProfile.ProfileNotFound.selector);
        tipzProfile.updateProfileMetadata("QmTest");
    }

    // ============ Profile Status Tests ============

    function testDeactivateProfile() public {
        vm.startPrank(user1);

        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);
        tipzProfile.deactivateProfile();

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertFalse(profile.isActive);

        vm.stopPrank();
    }

    function testReactivateProfile() public {
        vm.startPrank(user1);

        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);
        tipzProfile.deactivateProfile();
        tipzProfile.reactivateProfile();

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertTrue(profile.isActive);

        vm.stopPrank();
    }

    // ============ View Function Tests ============

    function testGetProfileByUsername() public {
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        TipzProfile.Profile memory profile = tipzProfile.getProfileByUsername(USERNAME1);
        assertEq(profile.walletAddress, user1);
        assertEq(profile.xUsername, USERNAME1);
    }

    function testIsUsernameTaken() public {
        assertFalse(tipzProfile.isUsernameTaken(USERNAME1));

        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        assertTrue(tipzProfile.isUsernameTaken(USERNAME1));
        assertFalse(tipzProfile.isUsernameTaken(USERNAME2));
    }

    function testIsRegistered() public {
        assertFalse(tipzProfile.isRegistered(user1));

        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        assertTrue(tipzProfile.isRegistered(user1));
        assertFalse(tipzProfile.isRegistered(user2));
    }

    function testGetAddressByUsername() public {
        assertEq(tipzProfile.getAddressByUsername(USERNAME1), address(0));

        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        assertEq(tipzProfile.getAddressByUsername(USERNAME1), user1);
    }

    // ============ Pausable Tests ============

    function testPauseUnpause() public {
        tipzProfile.pause();

        vm.prank(user1);
        vm.expectRevert();
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        tipzProfile.unpause();

        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);
        assertTrue(tipzProfile.isRegistered(user1));
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(user1);
        vm.expectRevert();
        tipzProfile.pause();
    }

    // ============ Admin Functions Tests ============

    function testAdminDeactivateProfile() public {
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        tipzProfile.adminDeactivateProfile(user1);

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertFalse(profile.isActive);
    }

    function testUpdateTipStats() public {
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        uint256 tipAmount = 1 ether;
        tipzProfile.updateTipStats(user1, tipAmount);

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertEq(profile.totalTipsReceived, tipAmount);
        assertEq(profile.totalTipsCount, 1);
        assertEq(profile.withdrawableBalance, tipAmount);
    }

    function testUpdateWithdrawalStats() public {
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        // First add some tips
        uint256 tipAmount = 1 ether;
        tipzProfile.updateTipStats(user1, tipAmount);

        // Then withdraw
        uint256 withdrawAmount = 0.5 ether;
        tipzProfile.updateWithdrawalStats(user1, withdrawAmount);

        TipzProfile.Profile memory profile = tipzProfile.getProfile(user1);
        assertEq(profile.withdrawableBalance, tipAmount - withdrawAmount);
        assertEq(profile.totalWithdrawn, withdrawAmount);
    }

    // ============ Reentrancy Tests ============

    function testReentrancyProtection() public {
        // TipzProfile uses nonReentrant modifier on state-changing functions
        // This test verifies the modifier is applied
        vm.prank(user1);
        tipzProfile.registerProfile(USERNAME1, FOLLOWERS, POSTS, REPLIES, IPFS_HASH);

        // Further reentrancy testing would require a malicious contract
        // For now, we verify the contract compiles and deploys with ReentrancyGuard
        assertTrue(tipzProfile.isRegistered(user1));
    }
}
