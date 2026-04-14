// SPDX-License-Identifier: MIT
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev PSL Fan Clash — rivalry staking-for-charity dApp. PSL 3x scoring multiplier.
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PulseToken
 * @author PSL Fan Clash Team
 * @notice ERC-20 loyalty token for PSL Fan Clash. Fans earn PULSE for
 *         correct predictions, charity votes, and engagement milestones.
 * @dev Only authorized minters (MatchVault, CharityDAO, owner) can mint.
 *      Initial supply: 0. All tokens are earned through participation.
 */
contract PulseToken is ERC20, Ownable {
    // ─── Custom Errors ────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();

    // ─── Storage ──────────────────────────────────────────────────────
    /// @notice Authorized minters (contracts that can reward PULSE)
    mapping(address => bool) public authorizedMinters;

    // ─── Events ───────────────────────────────────────────────────────
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event PulseRewarded(address indexed fan, uint256 amount, string reason);

    // ─── Constants ────────────────────────────────────────────────────
    /// @notice PULSE reward for winning a prediction (backing the winning team)
    uint256 public constant REWARD_WIN = 10 ether;        // 10 PULSE
    /// @notice PULSE reward for casting a charity vote
    uint256 public constant REWARD_CHARITY_VOTE = 5 ether; // 5 PULSE
    /// @notice PULSE reward for first Fan ID mint
    uint256 public constant REWARD_FIRST_MINT = 20 ether;  // 20 PULSE

    // ─── Constructor ──────────────────────────────────────────────────
    constructor() ERC20("PSL Pulse Token", "PULSE") Ownable(msg.sender) {}

    // ─── Minting ──────────────────────────────────────────────────────
    /// @notice Reward a fan with PULSE tokens
    /// @param to The fan's address
    /// @param amount Amount of PULSE to reward (in wei, 18 decimals)
    /// @param reason Human-readable reason for the reward
    function reward(address to, uint256 amount, string calldata reason) external {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _mint(to, amount);
        emit PulseRewarded(to, amount, reason);
    }

    /// @notice Convenience: reward for winning a match prediction
    /// @param fan The winning fan's address
    function rewardWin(address fan) external {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _mint(fan, REWARD_WIN);
        emit PulseRewarded(fan, REWARD_WIN, "Match prediction win");
    }

    /// @notice Convenience: reward for casting a charity vote
    /// @param fan The voting fan's address
    function rewardCharityVote(address fan) external {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _mint(fan, REWARD_CHARITY_VOTE);
        emit PulseRewarded(fan, REWARD_CHARITY_VOTE, "Charity vote cast");
    }

    /// @notice Convenience: reward for minting first Fan ID
    /// @param fan The new fan's address
    function rewardFirstMint(address fan) external {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _mint(fan, REWARD_FIRST_MINT);
        emit PulseRewarded(fan, REWARD_FIRST_MINT, "First Fan ID minted");
    }

    // ─── Admin ────────────────────────────────────────────────────────
    /// @notice Authorize a contract to mint PULSE rewards
    function authorizeMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /// @notice Revoke minting authorization
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
}
