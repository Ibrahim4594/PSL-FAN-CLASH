// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICharityDAO
 * @notice Interface for the charity voting contract.
 * @dev Winning stakers vote (stake-weighted) on which registered charity
 *      receives the 15% charity pool from each resolved match.
 */
interface ICharityDAO {
    // ─── Structs ──────────────────────────────────────────────────────────
    struct Charity {
        bytes32 name;
        address wallet;
        bytes32 description;
        bool active;
    }

    struct VoteInfo {
        uint256 startTime;
        uint256 charityPool;
        bool executed;
        uint256 winningCharityId;
        address vaultAddress;
    }

    // ─── Events ───────────────────────────────────────────────────────────
    event CharityRegistered(
        uint256 indexed charityId,
        bytes32 name,
        address wallet
    );
    event CharityDeactivated(uint256 indexed charityId);
    event VotingStarted(
        uint256 indexed matchId,
        uint256 charityPool,
        uint256 deadline
    );
    event VoteCast(
        uint256 indexed matchId,
        address indexed voter,
        uint256 indexed charityId,
        uint256 weight
    );
    event VoteExecuted(
        uint256 indexed matchId,
        uint256 charityId,
        bytes32 charityName,
        uint256 amount
    );

    // ─── Custom Errors ────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();
    error InvalidCharity();
    error CharityInactive();
    error VoteAlreadyStarted();
    error VoteNotStarted();
    error VoteStillOpen();
    error VoteAlreadyExecuted();
    error AlreadyVoted();
    error NotWinningStaker();
    error ZeroVotingPower();
    error NoVotesCast();

    // ─── External Functions ───────────────────────────────────────────────

    /// @notice Register a new charity eligible for receiving match donations
    /// @param name The charity name (bytes32 for gas optimization)
    /// @param wallet The wallet address to receive funds
    /// @param description Short description (bytes32 for gas optimization)
    function registerCharity(
        bytes32 name,
        address wallet,
        bytes32 description
    ) external;

    /// @notice Deactivate a charity so it can no longer receive votes
    /// @param charityId The index of the charity to deactivate
    function deactivateCharity(uint256 charityId) external;

    /// @notice Start the 48-hour voting period for a resolved match
    /// @param matchId The ID of the resolved match
    /// @param vaultAddress The address of the MatchVault for on-chain verification
    function startVoting(uint256 matchId, address vaultAddress) external;

    /// @notice Cast a stake-weighted vote for a charity
    /// @param matchId The match ID to vote on
    /// @param charityId The charity to vote for
    function castVote(uint256 matchId, uint256 charityId) external;

    /// @notice Execute the vote after 48hr window and send funds to winning charity
    /// @param matchId The match ID whose vote to execute
    function executeVote(uint256 matchId) external;

    /// @notice Get all registered charities
    /// @return Array of Charity structs
    function getCharities() external view returns (Charity[] memory);

    /// @notice Get vote results for a specific match
    /// @param matchId The match ID
    /// @return info The VoteInfo struct with voting data
    function getVoteResults(uint256 matchId)
        external
        view
        returns (VoteInfo memory info);

    /// @notice Get the voting power of a user for a specific match
    /// @param matchId The match ID
    /// @param voter The voter address
    /// @return weight The stake-weighted voting power
    function getVotingPower(uint256 matchId, address voter)
        external
        view
        returns (uint256 weight);
}
