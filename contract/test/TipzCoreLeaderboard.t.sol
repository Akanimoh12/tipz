// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TipzCore.sol";
import "../src/TipzProfile.sol";

contract TipzCoreLeaderboardTest is Test {
    TipzCore public tipzCore;
    TipzProfile public tipzProfile;
    
    address payable public platformWallet = payable(address(0x1234));
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    address public user4 = address(0x4);
    address public user5 = address(0x5);

    function setUp() public {
        // Deploy contracts (this contract becomes owner)
        tipzProfile = new TipzProfile();
        tipzCore = new TipzCore(address(tipzProfile), platformWallet);
        
        // Transfer ownership of TipzProfile to TipzCore
        tipzProfile.transferOwnership(address(tipzCore));
        
        // Fund test users
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        vm.deal(user4, 100 ether);
        vm.deal(user5, 100 ether);
    }

    // ============ Helper Functions ============

    function _registerUser(address user, string memory username) internal {
        vm.prank(user);
        tipzProfile.registerProfile(
            username,
            0,
            0,
            0,
            ""
        );
    }

    function _sendTip(address from, string memory toUsername, uint256 amount) internal {
        vm.prank(from);
        tipzCore.sendTip{value: amount}(toUsername, "Test tip");
    }

    // ============ GetTopCreators Tests ============

    function test_GetTopCreators_EmptyState() public {
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(10);
        assertEq(creators.length, 0, "Should return empty array when no users");
    }

    function test_GetTopCreators_NoTipsReceived() public {
        _registerUser(user1, "creator1");
        _registerUser(user2, "creator2");
        
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(10);
        assertEq(creators.length, 0, "Should return empty array when no tips received");
    }

    function test_GetTopCreators_SingleCreator() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator");
        _sendTip(user1, "creator", 1 ether);
        
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(10);
        assertEq(creators.length, 1, "Should have 1 creator");
        assertEq(creators[0].username, "creator", "Wrong username");
        assertEq(creators[0].walletAddress, user2, "Wrong address");
        assertEq(creators[0].totalAmount, 0.98 ether, "Wrong amount (after fee)");
        assertEq(creators[0].count, 1, "Wrong tip count");
        assertEq(creators[0].rank, 1, "Should be rank 1");
    }

    function test_GetTopCreators_MultipleCreatorsSorted() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        _registerUser(user4, "creator3");
        
        // Send different amounts to test sorting
        _sendTip(user1, "creator1", 1 ether);  // 0.98 ether
        _sendTip(user1, "creator2", 3 ether);  // 2.94 ether
        _sendTip(user1, "creator3", 2 ether);  // 1.96 ether
        
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(10);
        assertEq(creators.length, 3, "Should have 3 creators");
        
        // Check descending order
        assertEq(creators[0].username, "creator2", "Rank 1 should be creator2");
        assertEq(creators[0].totalAmount, 2.94 ether, "Wrong amount for rank 1");
        assertEq(creators[0].rank, 1, "Wrong rank assignment");
        
        assertEq(creators[1].username, "creator3", "Rank 2 should be creator3");
        assertEq(creators[1].totalAmount, 1.96 ether, "Wrong amount for rank 2");
        assertEq(creators[1].rank, 2, "Wrong rank assignment");
        
        assertEq(creators[2].username, "creator1", "Rank 3 should be creator1");
        assertEq(creators[2].totalAmount, 0.98 ether, "Wrong amount for rank 3");
        assertEq(creators[2].rank, 3, "Wrong rank assignment");
    }

    function test_GetTopCreators_LimitEnforcement() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        _registerUser(user4, "creator3");
        
        _sendTip(user1, "creator1", 1 ether);
        _sendTip(user1, "creator2", 2 ether);
        _sendTip(user1, "creator3", 3 ether);
        
        // Test limit = 2
        TipzCore.LeaderboardEntry[] memory limited = tipzCore.getTopCreators(2);
        assertEq(limited.length, 2, "Should respect limit");
        assertEq(limited[0].username, "creator3", "Should return top 2");
        assertEq(limited[1].username, "creator2", "Should return top 2");
    }

    function test_GetTopCreators_ZeroLimit() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator");
        _sendTip(user1, "creator", 1 ether);
        
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(0);
        assertEq(creators.length, 0, "Zero limit should return empty array");
    }

    function test_GetTopCreators_LimitExceedsTotal() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator");
        _sendTip(user1, "creator", 1 ether);
        
        TipzCore.LeaderboardEntry[] memory creators = tipzCore.getTopCreators(100);
        assertEq(creators.length, 1, "Should return all available when limit > total");
    }

    // ============ GetTopTippers Tests ============

    function test_GetTopTippers_EmptyState() public {
        TipzCore.LeaderboardEntry[] memory tippers = tipzCore.getTopTippers(10);
        assertEq(tippers.length, 0, "Should return empty array when no tippers");
    }

    function test_GetTopTippers_SingleTipper() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator");
        _sendTip(user1, "creator", 1 ether);
        
        TipzCore.LeaderboardEntry[] memory tippers = tipzCore.getTopTippers(10);
        assertEq(tippers.length, 1, "Should have 1 tipper");
        assertEq(tippers[0].username, "tipper", "Wrong username");
        assertEq(tippers[0].walletAddress, user1, "Wrong address");
        assertEq(tippers[0].totalAmount, 1 ether, "Wrong amount");
        assertEq(tippers[0].count, 1, "Wrong tip count");
        assertEq(tippers[0].rank, 1, "Should be rank 1");
    }

    function test_GetTopTippers_MultipleTippersSorted() public {
        _registerUser(user1, "tipper1");
        _registerUser(user2, "tipper2");
        _registerUser(user3, "tipper3");
        _registerUser(user4, "creator");
        
        _sendTip(user1, "creator", 1 ether);
        _sendTip(user2, "creator", 5 ether);
        _sendTip(user3, "creator", 3 ether);
        
        TipzCore.LeaderboardEntry[] memory tippers = tipzCore.getTopTippers(10);
        assertEq(tippers.length, 3, "Should have 3 tippers");
        
        // Check descending order
        assertEq(tippers[0].username, "tipper2", "Rank 1 should be tipper2");
        assertEq(tippers[0].totalAmount, 5 ether, "Wrong amount for rank 1");
        assertEq(tippers[0].rank, 1, "Wrong rank assignment");
        
        assertEq(tippers[1].username, "tipper3", "Rank 2 should be tipper3");
        assertEq(tippers[1].totalAmount, 3 ether, "Wrong amount for rank 2");
        
        assertEq(tippers[2].username, "tipper1", "Rank 3 should be tipper1");
        assertEq(tippers[2].totalAmount, 1 ether, "Wrong amount for rank 3");
    }

    function test_GetTopTippers_MultipleTipsFromSameUser() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        
        _sendTip(user1, "creator1", 1 ether);
        _sendTip(user1, "creator2", 2 ether);
        
        TipzCore.LeaderboardEntry[] memory tippers = tipzCore.getTopTippers(10);
        assertEq(tippers.length, 1, "Should have 1 tipper");
        assertEq(tippers[0].totalAmount, 3 ether, "Should aggregate tips");
        assertEq(tippers[0].count, 2, "Should count both tips");
    }

    function test_GetTopTippers_LimitEnforcement() public {
        _registerUser(user1, "tipper1");
        _registerUser(user2, "tipper2");
        _registerUser(user3, "tipper3");
        _registerUser(user4, "creator");
        
        _sendTip(user1, "creator", 1 ether);
        _sendTip(user2, "creator", 2 ether);
        _sendTip(user3, "creator", 3 ether);
        
        TipzCore.LeaderboardEntry[] memory limited = tipzCore.getTopTippers(2);
        assertEq(limited.length, 2, "Should respect limit");
        assertEq(limited[0].username, "tipper3", "Should return top 2");
    }

    // ============ GetUserRank Tests ============

    function test_GetUserRank_UnregisteredUser() public {
        uint256 rank = tipzCore.getUserRank("nonexistent");
        assertEq(rank, 0, "Unregistered user should have rank 0");
    }

    function test_GetUserRank_NoTipsReceived() public {
        _registerUser(user1, "creator");
        
        uint256 rank = tipzCore.getUserRank("creator");
        assertEq(rank, 0, "User with no tips should have rank 0");
    }

    function test_GetUserRank_TopRank() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        
        _sendTip(user1, "creator1", 5 ether);
        _sendTip(user1, "creator2", 1 ether);
        
        uint256 rank = tipzCore.getUserRank("creator1");
        assertEq(rank, 1, "Top creator should be rank 1");
    }

    function test_GetUserRank_MiddleRank() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        _registerUser(user4, "creator3");
        
        _sendTip(user1, "creator1", 1 ether);
        _sendTip(user1, "creator2", 2 ether);
        _sendTip(user1, "creator3", 3 ether);
        
        uint256 rank = tipzCore.getUserRank("creator2");
        assertEq(rank, 2, "Middle creator should be rank 2");
    }

    function test_GetUserRank_BottomRank() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        
        _sendTip(user1, "creator1", 2 ether);
        _sendTip(user1, "creator2", 1 ether);
        
        uint256 rank = tipzCore.getUserRank("creator2");
        assertEq(rank, 2, "Bottom creator should be rank 2");
    }

    // ============ Platform Statistics Tests ============

    function test_GetTotalUsers_Initial() public {
        uint256 total = tipzCore.getTotalUsers();
        assertEq(total, 0, "Should have 0 users initially");
    }

    function test_GetTotalUsers_AfterRegistrations() public {
        _registerUser(user1, "user1");
        _registerUser(user2, "user2");
        _registerUser(user3, "user3");
        
        uint256 total = tipzCore.getTotalUsers();
        assertEq(total, 3, "Should have 3 registered users");
    }

    function test_GetTotalVolume_Initial() public {
        uint256 volume = tipzCore.getTotalVolume();
        assertEq(volume, 0, "Should have 0 volume initially");
    }

    function test_GetTotalVolume_AfterTips() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator");
        
        _sendTip(user1, "creator", 1 ether);
        _sendTip(user1, "creator", 2 ether);
        
        uint256 volume = tipzCore.getTotalVolume();
        assertEq(volume, 3 ether, "Should track total volume including fees");
    }

    function test_GetActiveCreators_Initial() public {
        uint256 active = tipzCore.getActiveCreators();
        assertEq(active, 0, "Should have 0 active creators initially");
    }

    function test_GetActiveCreators_AfterTips() public {
        _registerUser(user1, "tipper");
        _registerUser(user2, "creator1");
        _registerUser(user3, "creator2");
        _registerUser(user4, "creator3");
        
        _sendTip(user1, "creator1", 1 ether);
        _sendTip(user1, "creator2", 1 ether);
        // creator3 has no tips
        
        uint256 active = tipzCore.getActiveCreators();
        assertEq(active, 2, "Should count only creators with tips > 0");
    }

    function test_GetActiveCreators_ExcludesRegisteredOnly() public {
        _registerUser(user1, "creator1");
        _registerUser(user2, "creator2");
        // No tips sent
        
        uint256 active = tipzCore.getActiveCreators();
        assertEq(active, 0, "Should not count registered users without tips");
    }

    // ============ Gas Benchmarking Tests ============

    function test_Gas_GetTopCreators_10Users() public {
        _registerUser(user1, "tipper");
        for (uint256 i = 0; i < 10; i++) {
            address creator = address(uint160(0x1000 + i));
            vm.deal(creator, 1 ether);
            _registerUser(creator, string(abi.encodePacked("creator", vm.toString(i))));
            _sendTip(user1, string(abi.encodePacked("creator", vm.toString(i))), 0.5 ether);
        }
        
        uint256 gasStart = gasleft();
        tipzCore.getTopCreators(10);
        uint256 gasUsed = gasStart - gasleft();
        
        emit log_named_uint("Gas used for getTopCreators(10)", gasUsed);
        assertLt(gasUsed, 500000, "Should use less than 500k gas");
    }

    function test_Gas_GetTopTippers_10Users() public {
        _registerUser(user1, "creator");
        for (uint256 i = 0; i < 10; i++) {
            address tipper = address(uint160(0x2000 + i));
            vm.deal(tipper, 10 ether);
            _registerUser(tipper, string(abi.encodePacked("tipper", vm.toString(i))));
            _sendTip(tipper, "creator", 0.5 ether);
        }
        
        uint256 gasStart = gasleft();
        tipzCore.getTopTippers(10);
        uint256 gasUsed = gasStart - gasleft();
        
        emit log_named_uint("Gas used for getTopTippers(10)", gasUsed);
        assertLt(gasUsed, 500000, "Should use less than 500k gas");
    }
}
