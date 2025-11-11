// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITipzCore
 * @notice Interface for TipzCore contract
 * @dev Use this interface when integrating with TipzCore from other contracts
 */
interface ITipzCore {
    // ============ Structs ============

    struct TipRecord {
        uint256 id;
        address fromAddress;
        string fromUsername;
        string toUsername;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    // ============ Events ============

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

    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet,
        uint256 timestamp
    );

    event PlatformFeeCollected(
        address indexed collector,
        uint256 amount,
        uint256 timestamp
    );

    // ============ User Functions ============

    function sendTip(string calldata toUsername, string calldata message) external payable;

    function withdrawTips(uint256 amount) external;

    function withdrawAllTips() external;

    // ============ View Functions ============

    function getWithdrawableBalance(address user) external view returns (uint256);

    function calculateFee(uint256 amount) external pure returns (uint256);

    function getTipHistory(address user, uint256 limit)
        external
        view
        returns (TipRecord[] memory);

    function getRecentTips(uint256 limit) external view returns (TipRecord[] memory);

    function getTotalTipCount() external view returns (uint256);

    function getTipById(uint256 tipId) external view returns (TipRecord memory);

    function getTipsSent(address sender, uint256 limit)
        external
        view
        returns (TipRecord[] memory);

    function getTipsReceived(string calldata username, uint256 limit)
        external
        view
        returns (TipRecord[] memory);

    // ============ Admin Functions ============

    function updatePlatformWallet(address payable newPlatformWallet) external;

    function collectPlatformFees(uint256 amount) external;

    function pause() external;

    function unpause() external;

    function emergencyWithdraw() external;

    // ============ State Variables ============

    function profileRegistry() external view returns (address);

    function platformWallet() external view returns (address payable);

    function PLATFORM_FEE_RATE() external view returns (uint256);

    function FEE_DENOMINATOR() external view returns (uint256);

    function MIN_TIP_AMOUNT() external view returns (uint256);
}
