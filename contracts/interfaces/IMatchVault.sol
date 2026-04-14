// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMatchVault
 * @notice Interface for the per-match staking vault contract.
 * @dev Each vault handles staking, locking, resolution, claiming, and cancellation
 *      for a single PSL match. Deployed by MatchFactory.
 */
interface IMatchVault {
    // ─── Enums ────────────────────────────────────────────────────────────
    enum MatchState {
        OPEN,
        LOCKED,
        RESOLVED,
        CANCELLED
    }

    // ─── Structs ──────────────────────────────────────────────────────────
    struct Stake {
        uint128 amount;
        uint8 teamId;
        bool claimed;
    }

    struct MatchInfo {
        bytes32 teamAName;
        bytes32 teamBName;
        uint8 teamAId;
        uint8 teamBId;
        uint256 teamAPool;
        uint256 teamBPool;
        uint256 totalPool;
        MatchState state;
        uint256 stakingDeadline;
        uint8 winningTeam;
    }

    // ─── Events ───────────────────────────────────────────────────────────
    event Staked(
        address indexed user,
        uint8 indexed teamId,
        uint256 amount,
        uint256 newTeamTotal
    );
    event MatchLocked(
        uint256 indexed matchId,
        uint256 teamAPool,
        uint256 teamBPool
    );
    event MatchResolved(
        uint256 indexed matchId,
        uint8 winningTeam,
        uint256 winnersPool,
        uint256 charityPool
    );
    event RewardClaimed(address indexed user, uint256 amount);
    event MatchCancelled(uint256 indexed matchId, uint256 totalRefundable);

    // ─── Custom Errors ────────────────────────────────────────────────────
    error MatchNotOpen();
    error MatchNotResolved();
    error MatchNotCancellable();
    error AlreadyClaimed();
    error NotWinner();
    error ZeroStake();
    error BelowMinimumStake();
    error InvalidTeam();
    error CannotStakeBothTeams();
    error StakingDeadlinePassed();
    error OnlyFactory();
    error TransferFailed();
    error InvalidWinner();
    error DeadlineMustBeFuture();
    error ZeroAddress();

    // ─── External Functions ───────────────────────────────────────────────

    /// @notice Stake native WIRE for a team
    /// @param teamId The team to stake for (must be teamA or teamB id)
    function stakeForTeam(uint8 teamId) external payable;

    /// @notice Lock the match to prevent further staking
    function lockMatch() external;

    /// @notice Resolve the match with a winning team and distribute funds
    /// @param winningTeamId The ID of the winning team
    function resolveMatch(uint8 winningTeamId) external;

    /// @notice Claim reward after match resolution (winning stakers only)
    function claimReward() external;

    /// @notice Cancel the match and enable refunds for all stakers
    function cancelMatch() external;

    /// @notice Claim refund after match cancellation
    function claimRefund() external;

    /// @notice Get full match information
    /// @return info The MatchInfo struct with all match data
    function getMatchInfo() external view returns (MatchInfo memory info);

    /// @notice Get a user's stake details
    /// @param user The user address to query
    /// @return amount The staked amount
    /// @return teamId The team staked for
    /// @return claimed Whether the reward/refund was claimed
    function getUserStake(address user)
        external
        view
        returns (uint128 amount, uint8 teamId, bool claimed);
}
