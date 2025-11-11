// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITipzProfile
 * @notice Interface for TipzProfile contract
 * @dev Use this interface when integrating with TipzProfile from other contracts
 */
interface ITipzProfile {
    // ============ Structs ============

    struct Profile {
        address walletAddress;
        string xUsername;
        uint64 xFollowers;
        uint64 xPosts;
        uint64 xReplies;
        uint32 creditScore;
        string profileImageIpfs;
        uint256 totalTipsReceived;
        uint64 totalTipsCount;
        uint256 withdrawableBalance;
        uint256 totalWithdrawn;
        uint256 createdAt;
        bool isActive;
    }

    // ============ Events ============

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

    event ProfileDeactivated(address indexed user, uint256 timestamp);
    event ProfileReactivated(address indexed user, uint256 timestamp);

    event CreditScoreUpdated(
        address indexed user,
        uint32 oldScore,
        uint32 newScore,
        uint256 timestamp
    );

    // ============ User Functions ============

    function registerProfile(
        string calldata username,
        uint64 xFollowers,
        uint64 xPosts,
        uint64 xReplies,
        string calldata profileImageIpfs
    ) external;

    function updateProfileMetadata(string calldata profileImageIpfs) external;

    function updateXMetrics(
        uint64 xFollowers,
        uint64 xPosts,
        uint64 xReplies
    ) external;

    function deactivateProfile() external;

    function reactivateProfile() external;

    // ============ View Functions ============

    function getProfile(address user) external view returns (Profile memory);

    function getProfileByUsername(string calldata username)
        external
        view
        returns (Profile memory);

    function calculateCreditScore(
        uint64 followers,
        uint64 posts,
        uint64 replies
    ) external pure returns (uint32);

    function isUsernameTaken(string calldata username) external view returns (bool);

    function isRegistered(address user) external view returns (bool);

    function getAddressByUsername(string calldata username)
        external
        view
        returns (address);

    // ============ Admin Functions ============

    function pause() external;

    function unpause() external;

    function adminDeactivateProfile(address user) external;

    function updateTipStats(address recipient, uint256 amount) external;

    function updateWithdrawalStats(address user, uint256 amount) external;

    // ============ Constants ============

    function MIN_USERNAME_LENGTH() external view returns (uint8);

    function MAX_USERNAME_LENGTH() external view returns (uint8);

    function MAX_CREDIT_SCORE() external view returns (uint32);

    function FOLLOWERS_WEIGHT() external view returns (uint32);

    function POSTS_WEIGHT() external view returns (uint32);

    function REPLIES_WEIGHT() external view returns (uint32);

    function SCORE_DIVISOR() external view returns (uint32);
}
