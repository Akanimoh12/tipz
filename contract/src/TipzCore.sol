// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ITipzProfile.sol";

/**
 * @title TipzCore
 * @notice Core tipping contract for Tipz platform
 * @dev Handles tips with 2% platform fee and manages withdrawable balances
 */
contract TipzCore is Ownable, ReentrancyGuard, Pausable {
    // Tip record structure matching project_structure.md
    struct TipRecord {
        uint256 id;
        address fromAddress;
        string fromUsername;
        string toUsername;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    // State variables
    ITipzProfile public immutable profileRegistry;
    address payable public platformWallet;
    uint256 public constant PLATFORM_FEE_RATE = 200; // 200 basis points = 2%
    uint256 public constant FEE_DENOMINATOR = 10000; // 100% = 10000 basis points
    uint256 public constant MIN_TIP_AMOUNT = 0.001 ether;

    // Storage
    mapping(address => uint256) private _withdrawableBalances;
    TipRecord[] private _tipHistory;
    uint256 private _nextTipId = 1;

    // Custom errors
    error RecipientNotRegistered();
    error TipAmountTooLow();
    error InsufficientBalance();
    error WithdrawalAmountZero();
    error WithdrawalAmountExceedsBalance();
    error TransferFailed();
    error InvalidPlatformWallet();
    error SelfTipNotAllowed();

    // Events for Somnia Streams
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

    event TipsWithdrawn(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

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

    constructor(address _profileRegistry, address payable _platformWallet) Ownable(msg.sender) {
        if (_profileRegistry == address(0)) revert InvalidPlatformWallet();
        if (_platformWallet == address(0)) revert InvalidPlatformWallet();

        profileRegistry = ITipzProfile(_profileRegistry);
        platformWallet = _platformWallet;
    }

    /**
     * @notice Send a tip to a creator by username
     * @param toUsername Recipient's X username
     * @param message Optional message (max length handled by validation)
     */
    function sendTip(string calldata toUsername, string calldata message)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        if (msg.value < MIN_TIP_AMOUNT) revert TipAmountTooLow();

        // Get and validate recipient
        address recipient = profileRegistry.getAddressByUsername(toUsername);
        if (recipient == address(0)) revert RecipientNotRegistered();
        if (recipient == msg.sender) revert SelfTipNotAllowed();

        // Verify recipient profile is active
        if (!profileRegistry.getProfile(recipient).isActive) revert RecipientNotRegistered();

        // Calculate and distribute funds
        uint256 platformFee = calculateFee(msg.value);
        uint256 recipientAmount = msg.value - platformFee;

        _withdrawableBalances[recipient] += recipientAmount;
        _withdrawableBalances[platformWallet] += platformFee;

        // Store tip record
        uint256 tipId = _nextTipId++;
        _tipHistory.push(
            TipRecord({
                id: tipId,
                fromAddress: msg.sender,
                fromUsername: _getSenderUsername(),
                toUsername: toUsername,
                amount: msg.value,
                message: message,
                timestamp: block.timestamp
            })
        );

        // Update profile stats
        profileRegistry.updateTipStats(recipient, recipientAmount);

        emit TipSent(
            tipId,
            msg.sender,
            recipient,
            _getSenderUsername(),
            toUsername,
            msg.value,
            platformFee,
            recipientAmount,
            message,
            block.timestamp
        );
    }

    /**
     * @notice Get sender username if registered
     * @return Username or empty string
     */
    function _getSenderUsername() private view returns (string memory) {
        if (profileRegistry.isRegistered(msg.sender)) {
            return profileRegistry.getProfile(msg.sender).xUsername;
        }
        return "";
    }

    /**
     * @notice Withdraw accumulated tips
     * @param amount Amount to withdraw in wei
     */
    function withdrawTips(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert WithdrawalAmountZero();

        uint256 balance = _withdrawableBalances[msg.sender];
        if (amount > balance) revert WithdrawalAmountExceedsBalance();

        // Update balance before transfer (CEI pattern)
        _withdrawableBalances[msg.sender] = balance - amount;

        // Update profile stats
        if (profileRegistry.isRegistered(msg.sender)) {
            profileRegistry.updateWithdrawalStats(msg.sender, amount);
        }

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit TipsWithdrawn(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw all accumulated tips
     */
    function withdrawAllTips() external nonReentrant whenNotPaused {
        uint256 balance = _withdrawableBalances[msg.sender];
        if (balance == 0) revert WithdrawalAmountZero();

        // Update balance before transfer (CEI pattern)
        _withdrawableBalances[msg.sender] = 0;

        // Update profile stats
        if (profileRegistry.isRegistered(msg.sender)) {
            profileRegistry.updateWithdrawalStats(msg.sender, balance);
        }

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit TipsWithdrawn(msg.sender, balance, block.timestamp);
    }

    /**
     * @notice Get withdrawable balance for an address
     * @param user Address to check
     * @return Balance in wei
     */
    function getWithdrawableBalance(address user) external view returns (uint256) {
        return _withdrawableBalances[user];
    }

    /**
     * @notice Calculate platform fee for a given amount
     * @param amount Tip amount in wei
     * @return Platform fee in wei
     */
    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * PLATFORM_FEE_RATE) / FEE_DENOMINATOR;
    }

    /**
     * @notice Get tip history for a user (sent or received)
     * @param user Address to get history for
     * @param limit Maximum number of tips to return (0 = all)
     * @return Array of TipRecord
     */
    function getTipHistory(address user, uint256 limit)
        external
        view
        returns (TipRecord[] memory)
    {
        // Count relevant tips
        uint256 count = 0;
        for (uint256 i = 0; i < _tipHistory.length; i++) {
            if (_tipHistory[i].fromAddress == user) {
                count++;
            } else {
                address recipient = profileRegistry.getAddressByUsername(_tipHistory[i].toUsername);
                if (recipient == user) {
                    count++;
                }
            }
        }

        // Apply limit
        uint256 resultSize = (limit > 0 && limit < count) ? limit : count;
        TipRecord[] memory result = new TipRecord[](resultSize);

        // Fill result array (most recent first)
        uint256 resultIndex = 0;
        for (uint256 i = _tipHistory.length; i > 0 && resultIndex < resultSize; i--) {
            TipRecord memory tip = _tipHistory[i - 1];

            if (tip.fromAddress == user) {
                result[resultIndex] = tip;
                resultIndex++;
            } else {
                address recipient = profileRegistry.getAddressByUsername(tip.toUsername);
                if (recipient == user) {
                    result[resultIndex] = tip;
                    resultIndex++;
                }
            }
        }

        return result;
    }

    /**
     * @notice Get recent tips (for activity feed)
     * @param limit Maximum number of tips to return
     * @return Array of TipRecord
     */
    function getRecentTips(uint256 limit) external view returns (TipRecord[] memory) {
        uint256 resultSize = limit > _tipHistory.length ? _tipHistory.length : limit;
        TipRecord[] memory result = new TipRecord[](resultSize);

        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = _tipHistory[_tipHistory.length - 1 - i];
        }

        return result;
    }

    /**
     * @notice Get total number of tips
     * @return Total tip count
     */
    function getTotalTipCount() external view returns (uint256) {
        return _tipHistory.length;
    }

    /**
     * @notice Get tip by ID
     * @param tipId Tip ID
     * @return TipRecord
     */
    function getTipById(uint256 tipId) external view returns (TipRecord memory) {
        require(tipId > 0 && tipId < _nextTipId, "Invalid tip ID");

        // Tip IDs are 1-indexed, array is 0-indexed
        return _tipHistory[tipId - 1];
    }

    /**
     * @notice Get tips sent by a specific address
     * @param sender Address of sender
     * @param limit Maximum number of tips to return (0 = all)
     * @return Array of TipRecord
     */
    function getTipsSent(address sender, uint256 limit)
        external
        view
        returns (TipRecord[] memory)
    {
        // Count tips sent
        uint256 count = 0;
        for (uint256 i = 0; i < _tipHistory.length; i++) {
            if (_tipHistory[i].fromAddress == sender) {
                count++;
            }
        }

        // Apply limit
        uint256 resultSize = (limit > 0 && limit < count) ? limit : count;
        TipRecord[] memory result = new TipRecord[](resultSize);

        // Fill result array (most recent first)
        uint256 resultIndex = 0;
        for (uint256 i = _tipHistory.length; i > 0 && resultIndex < resultSize; i--) {
            if (_tipHistory[i - 1].fromAddress == sender) {
                result[resultIndex] = _tipHistory[i - 1];
                resultIndex++;
            }
        }

        return result;
    }

    /**
     * @notice Get tips received by a username
     * @param username Recipient username
     * @param limit Maximum number of tips to return (0 = all)
     * @return Array of TipRecord
     */
    function getTipsReceived(string calldata username, uint256 limit)
        external
        view
        returns (TipRecord[] memory)
    {
        // Count tips received
        uint256 count = 0;
        for (uint256 i = 0; i < _tipHistory.length; i++) {
            if (
                keccak256(abi.encodePacked(_tipHistory[i].toUsername)) ==
                keccak256(abi.encodePacked(username))
            ) {
                count++;
            }
        }

        // Apply limit
        uint256 resultSize = (limit > 0 && limit < count) ? limit : count;
        TipRecord[] memory result = new TipRecord[](resultSize);

        // Fill result array (most recent first)
        uint256 resultIndex = 0;
        for (uint256 i = _tipHistory.length; i > 0 && resultIndex < resultSize; i--) {
            if (
                keccak256(abi.encodePacked(_tipHistory[i - 1].toUsername)) ==
                keccak256(abi.encodePacked(username))
            ) {
                result[resultIndex] = _tipHistory[i - 1];
                resultIndex++;
            }
        }

        return result;
    }

    // Admin functions

    /**
     * @notice Update platform wallet address
     * @param newPlatformWallet New platform wallet address
     */
    function updatePlatformWallet(address payable newPlatformWallet) external onlyOwner {
        if (newPlatformWallet == address(0)) revert InvalidPlatformWallet();

        address oldWallet = platformWallet;
        platformWallet = newPlatformWallet;

        emit PlatformWalletUpdated(oldWallet, newPlatformWallet, block.timestamp);
    }

    /**
     * @notice Collect platform fees
     * @param amount Amount to collect (must be <= platform balance)
     */
    function collectPlatformFees(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert WithdrawalAmountZero();

        uint256 platformBalance = _withdrawableBalances[platformWallet];
        if (amount > platformBalance) revert WithdrawalAmountExceedsBalance();

        // Update balance before transfer
        _withdrawableBalances[platformWallet] = platformBalance - amount;

        // Transfer to platform wallet
        (bool success, ) = platformWallet.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PlatformFeeCollected(platformWallet, amount, block.timestamp);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw (only owner, only when paused)
     * @dev For emergency use only - withdraws contract balance to owner
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {
        // Accept direct transfers (add to platform wallet balance)
        _withdrawableBalances[platformWallet] += msg.value;
    }
}
