// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TipzProfile
 * @notice Profile registry for Tipz platform with credit scoring system
 * @dev Stores user profiles with X (Twitter) metrics and IPFS metadata
 */
contract TipzProfile is Ownable, ReentrancyGuard, Pausable {
    // Profile structure matching project_structure.md specification
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

    // State variables
    mapping(address => Profile) private _profiles;
    mapping(string => address) private _usernameToAddress;
    mapping(address => bool) private _registeredAddresses;

    // Constants for validation
    uint8 public constant MIN_USERNAME_LENGTH = 1;
    uint8 public constant MAX_USERNAME_LENGTH = 15;
    uint32 public constant MAX_CREDIT_SCORE = 1000;
    uint32 public constant FOLLOWERS_WEIGHT = 50; // 50%
    uint32 public constant POSTS_WEIGHT = 30; // 30%
    uint32 public constant REPLIES_WEIGHT = 20; // 20%
    uint32 public constant SCORE_DIVISOR = 10000;

    // Custom errors (gas efficient)
    error ProfileAlreadyExists();
    error ProfileNotFound();
    error UsernameAlreadyTaken();
    error InvalidUsername();
    error InvalidUsernameLength();
    error UnauthorizedAccess();
    error EmptyUsername();
    error InvalidAddress();

    // Events for all state changes (critical for Somnia Streams)
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

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new profile with X metrics
     * @param username X (Twitter) username (1-15 chars, alphanumeric + underscore)
     * @param xFollowers Follower count from X
     * @param xPosts Post count from X
     * @param xReplies Reply count from X
     * @param profileImageIpfs IPFS hash for profile image (from Pinata)
     */
    function registerProfile(
        string calldata username,
        uint64 xFollowers,
        uint64 xPosts,
        uint64 xReplies,
        string calldata profileImageIpfs
    ) external nonReentrant whenNotPaused {
        if (_registeredAddresses[msg.sender]) revert ProfileAlreadyExists();
        if (bytes(username).length == 0) revert EmptyUsername();
        if (
            bytes(username).length < MIN_USERNAME_LENGTH ||
            bytes(username).length > MAX_USERNAME_LENGTH
        ) revert InvalidUsernameLength();
        if (_usernameToAddress[username] != address(0)) revert UsernameAlreadyTaken();
        if (!_isValidUsername(username)) revert InvalidUsername();

        // Calculate initial credit score
        uint32 creditScore = calculateCreditScore(xFollowers, xPosts, xReplies);

        // Create profile
        _profiles[msg.sender] = Profile({
            walletAddress: msg.sender,
            xUsername: username,
            xFollowers: xFollowers,
            xPosts: xPosts,
            xReplies: xReplies,
            creditScore: creditScore,
            profileImageIpfs: profileImageIpfs,
            totalTipsReceived: 0,
            totalTipsCount: 0,
            withdrawableBalance: 0,
            totalWithdrawn: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        // Update mappings
        _usernameToAddress[username] = msg.sender;
        _registeredAddresses[msg.sender] = true;

        emit ProfileCreated(msg.sender, username, creditScore, block.timestamp);
    }

    /**
     * @notice Update profile IPFS metadata (profile image)
     * @param profileImageIpfs New IPFS hash from Pinata
     */
    function updateProfileMetadata(string calldata profileImageIpfs)
        external
        nonReentrant
        whenNotPaused
    {
        if (!_registeredAddresses[msg.sender]) revert ProfileNotFound();

        _profiles[msg.sender].profileImageIpfs = profileImageIpfs;

        emit ProfileUpdated(msg.sender, profileImageIpfs, block.timestamp);
    }

    /**
     * @notice Update X metrics and recalculate credit score
     * @param xFollowers New follower count
     * @param xPosts New post count
     * @param xReplies New reply count
     */
    function updateXMetrics(
        uint64 xFollowers,
        uint64 xPosts,
        uint64 xReplies
    ) external nonReentrant whenNotPaused {
        if (!_registeredAddresses[msg.sender]) revert ProfileNotFound();

        Profile storage profile = _profiles[msg.sender];
        uint32 oldScore = profile.creditScore;

        // Update metrics
        profile.xFollowers = xFollowers;
        profile.xPosts = xPosts;
        profile.xReplies = xReplies;

        // Recalculate credit score
        uint32 newScore = calculateCreditScore(xFollowers, xPosts, xReplies);
        profile.creditScore = newScore;

        emit CreditScoreUpdated(msg.sender, oldScore, newScore, block.timestamp);
    }

    /**
     * @notice Deactivate profile (user-initiated)
     */
    function deactivateProfile() external nonReentrant {
        if (!_registeredAddresses[msg.sender]) revert ProfileNotFound();

        _profiles[msg.sender].isActive = false;

        emit ProfileDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Reactivate profile
     */
    function reactivateProfile() external nonReentrant {
        if (!_registeredAddresses[msg.sender]) revert ProfileNotFound();

        _profiles[msg.sender].isActive = true;

        emit ProfileReactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Get profile by address
     * @param user Wallet address
     * @return Profile struct
     */
    function getProfile(address user) external view returns (Profile memory) {
        if (!_registeredAddresses[user]) revert ProfileNotFound();
        return _profiles[user];
    }

    /**
     * @notice Get profile by username
     * @param username X username
     * @return Profile struct
     */
    function getProfileByUsername(string calldata username)
        external
        view
        returns (Profile memory)
    {
        address user = _usernameToAddress[username];
        if (user == address(0)) revert ProfileNotFound();
        return _profiles[user];
    }

    /**
     * @notice Calculate credit score based on X metrics
     * @param followers Follower count
     * @param posts Post count
     * @param replies Reply count
     * @return Credit score (0-1000)
     * @dev Formula: (followers * 0.5 + posts * 0.3 + replies * 0.2) / 10000 * 1000
     */
    function calculateCreditScore(
        uint64 followers,
        uint64 posts,
        uint64 replies
    ) public pure returns (uint32) {
        uint256 score = (uint256(followers) * FOLLOWERS_WEIGHT +
            uint256(posts) * POSTS_WEIGHT +
            uint256(replies) * REPLIES_WEIGHT) / SCORE_DIVISOR;

        // Cap at maximum score
        if (score > MAX_CREDIT_SCORE) {
            return MAX_CREDIT_SCORE;
        }

        return uint32(score);
    }

    /**
     * @notice Check if username is registered
     * @param username X username to check
     * @return True if username is taken
     */
    function isUsernameTaken(string calldata username) external view returns (bool) {
        return _usernameToAddress[username] != address(0);
    }

    /**
     * @notice Check if address has registered profile
     * @param user Wallet address to check
     * @return True if address is registered
     */
    function isRegistered(address user) external view returns (bool) {
        return _registeredAddresses[user];
    }

    /**
     * @notice Get address by username
     * @param username X username
     * @return Wallet address (address(0) if not found)
     */
    function getAddressByUsername(string calldata username)
        external
        view
        returns (address)
    {
        return _usernameToAddress[username];
    }

    // Internal validation function
    function _isValidUsername(string calldata username) private pure returns (bool) {
        bytes memory usernameBytes = bytes(username);

        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];

            // Allow: a-z, A-Z, 0-9, underscore
            bool isLowercase = char >= 0x61 && char <= 0x7A; // a-z
            bool isUppercase = char >= 0x41 && char <= 0x5A; // A-Z
            bool isDigit = char >= 0x30 && char <= 0x39; // 0-9
            bool isUnderscore = char == 0x5F; // _

            if (!isLowercase && !isUppercase && !isDigit && !isUnderscore) {
                return false;
            }
        }

        return true;
    }

    // Admin functions
    /**
     * @notice Pause contract (emergency stop)
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
     * @notice Force deactivate profile (admin only)
     * @param user Address to deactivate
     */
    function adminDeactivateProfile(address user) external onlyOwner {
        if (!_registeredAddresses[user]) revert ProfileNotFound();

        _profiles[user].isActive = false;

        emit ProfileDeactivated(user, block.timestamp);
    }

    /**
     * @notice Update profile tip stats (called by TipzCore contract)
     * @param recipient Profile to update
     * @param amount Tip amount in wei
     */
    function updateTipStats(address recipient, uint256 amount) external onlyOwner {
        if (!_registeredAddresses[recipient]) revert ProfileNotFound();

        Profile storage profile = _profiles[recipient];
        profile.totalTipsReceived += amount;
        profile.totalTipsCount += 1;
        profile.withdrawableBalance += amount;
    }

    /**
     * @notice Update withdrawal stats (called by TipzCore contract)
     * @param user Profile to update
     * @param amount Withdrawal amount in wei
     */
    function updateWithdrawalStats(address user, uint256 amount) external onlyOwner {
        if (!_registeredAddresses[user]) revert ProfileNotFound();

        Profile storage profile = _profiles[user];
        profile.withdrawableBalance -= amount;
        profile.totalWithdrawn += amount;
    }
}
