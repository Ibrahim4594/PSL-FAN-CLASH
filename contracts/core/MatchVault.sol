// SPDX-License-Identifier: MIT
// @title MatchVault — Per-match staking vault for PSL Fan Clash
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev Security: ReentrancyGuard, CEI pattern, custom errors, minimum stake anti-spam
// @dev Gas optimized: uint128 for amounts, basis points for splits, unchecked arithmetic where safe
// @dev Distribution: 82% winners, 15% charity (via CharityDAO), 3% platform
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IMatchVault.sol";

/**
 * @title MatchVault
 * @author PSL Fan Clash Team
 * @notice Per-match staking vault for PSL Fan Clash. Holds staked WIRE,
 *         distributes rewards to winners (82%), charity (15%), and platform (3%).
 * @dev Deployed by MatchFactory via CREATE2 for deterministic addresses.
 *      State machine: OPEN -> LOCKED -> RESOLVED | CANCELLED.
 *      Uses custom errors for gas-efficient reverts and basis points for
 *      precise percentage math.
 */
contract MatchVault is IMatchVault, ReentrancyGuard {
    // ─── Constants ────────────────────────────────────────────────────────
    /// @notice Percentage of the pool allocated to winning stakers (82%)
    uint256 public constant WINNER_BPS = 8200;
    /// @notice Percentage of the pool allocated to charity (15%)
    uint256 public constant CHARITY_BPS = 1500;
    /// @notice Percentage of the pool allocated to the platform (3%)
    uint256 public constant PLATFORM_BPS = 300;
    /// @notice Total basis points (100%)
    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Minimum stake amount (0.01 WIRE)
    uint256 public constant MIN_STAKE = 0.01 ether;

    // ─── Immutables ───────────────────────────────────────────────────────
    /// @notice Address of the MatchFactory that deployed this vault
    address public immutable factory;
    /// @notice Address of the platform treasury receiving the 3% fee
    address public immutable platformTreasury;
    /// @notice Address of the CharityDAO contract receiving the 15% share
    address public immutable charityDAO;
    /// @notice Address of the SeasonLeaderboard contract for stats tracking
    address public immutable leaderboard;
    /// @notice Unique match identifier
    uint256 public immutable matchId;
    /// @notice Unix timestamp after which staking is no longer accepted
    uint256 public immutable stakingDeadline;
    /// @notice Team A numeric identifier
    uint8 public immutable teamAId;
    /// @notice Team B numeric identifier
    uint8 public immutable teamBId;
    /// @notice Team A name stored as bytes32 for gas optimization
    bytes32 public immutable teamAName;
    /// @notice Team B name stored as bytes32 for gas optimization
    bytes32 public immutable teamBName;

    // ─── Storage ──────────────────────────────────────────────────────────
    /// @notice Maps user address to their stake details
    mapping(address => Stake) private _stakes;
    /// @notice Maps team ID to total WIRE staked for that team
    mapping(uint8 => uint256) public teamPools;
    /// @notice Total WIRE staked across both teams
    uint256 public totalPool;
    /// @notice ID of the winning team (set on resolution)
    uint8 public winningTeam;
    /// @notice Current state of the match vault
    MatchState public state;
    /// @notice Total WIRE allocated to winning stakers (set on resolution)
    uint256 public winnersPool;

    // ─── Modifiers ────────────────────────────────────────────────────────
    /// @dev Restricts function access to the factory contract
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    /// @dev Restricts function to a specific match state
    modifier inState(MatchState requiredState) {
        if (state != requiredState) {
            if (requiredState == MatchState.OPEN) revert MatchNotOpen();
            if (requiredState == MatchState.RESOLVED) revert MatchNotResolved();
            revert MatchNotCancellable();
        }
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────
    /// @notice Initializes a new match vault with two competing teams
    /// @dev Called by MatchFactory during match creation. Sets all immutable
    ///      configuration values. The factory address is implicitly msg.sender.
    /// @param _matchId Unique match identifier assigned by the factory
    /// @param _teamAId Numeric ID for Team A
    /// @param _teamAName Name of Team A encoded as bytes32
    /// @param _teamBId Numeric ID for Team B
    /// @param _teamBName Name of Team B encoded as bytes32
    /// @param _stakingDeadline Unix timestamp after which staking closes
    /// @param _platformTreasury Address to receive 3% platform fee
    /// @param _charityDAO Address of the CharityDAO contract
    /// @param _leaderboard Address of the SeasonLeaderboard contract
    constructor(
        uint256 _matchId,
        uint8 _teamAId,
        bytes32 _teamAName,
        uint8 _teamBId,
        bytes32 _teamBName,
        uint256 _stakingDeadline,
        address _platformTreasury,
        address _charityDAO,
        address _leaderboard
    ) {
        if (_stakingDeadline <= block.timestamp) revert DeadlineMustBeFuture();
        if (_platformTreasury == address(0)) revert ZeroAddress();
        if (_charityDAO == address(0)) revert ZeroAddress();

        factory = msg.sender;
        matchId = _matchId;
        teamAId = _teamAId;
        teamAName = _teamAName;
        teamBId = _teamBId;
        teamBName = _teamBName;
        stakingDeadline = _stakingDeadline;
        platformTreasury = _platformTreasury;
        charityDAO = _charityDAO;
        leaderboard = _leaderboard;
        state = MatchState.OPEN;
    }

    // ─── Staking ──────────────────────────────────────────────────────────
    /// @notice Stake native WIRE tokens for a team in this match
    /// @dev Users can add to an existing stake but cannot change teams.
    ///      Validates minimum stake, team validity, and staking deadline.
    ///      Records the stake on the SeasonLeaderboard if the leaderboard is set.
    /// @param teamId The team to stake for (must match teamAId or teamBId)
    function stakeForTeam(uint8 teamId)
        external
        payable
        inState(MatchState.OPEN)
        nonReentrant
    {
        if (block.timestamp >= stakingDeadline) revert StakingDeadlinePassed();
        if (msg.value < MIN_STAKE) revert BelowMinimumStake();
        if (teamId != teamAId && teamId != teamBId) revert InvalidTeam();

        Stake storage userStake = _stakes[msg.sender];

        if (userStake.amount > 0) {
            if (userStake.teamId != teamId) revert CannotStakeBothTeams();
        } else {
            userStake.teamId = teamId;
        }

        // Safe to use uint128 — total supply of WIRE will never reach 2^128
        userStake.amount += uint128(msg.value);
        teamPools[teamId] += msg.value;
        totalPool += msg.value;

        // Record on leaderboard if available
        if (leaderboard != address(0)) {
            // Use low-level call to avoid reverting the stake if leaderboard fails
            leaderboard.call(
                abi.encodeWithSignature(
                    "recordStake(address,uint8,uint256)",
                    msg.sender,
                    teamId,
                    msg.value
                )
            );
        }

        emit Staked(msg.sender, teamId, msg.value, teamPools[teamId]);
    }

    // ─── State Transitions ────────────────────────────────────────────────
    /// @notice Lock the match to prevent further staking
    /// @dev Only callable by the factory. Transitions state from OPEN to LOCKED.
    ///      Emits the current pool sizes for both teams.
    function lockMatch() external onlyFactory inState(MatchState.OPEN) {
        state = MatchState.LOCKED;
        emit MatchLocked(matchId, teamPools[teamAId], teamPools[teamBId]);
    }

    /// @notice Resolve the match with a winning team and distribute funds
    /// @dev Only callable by the factory when match is LOCKED. Calculates and
    ///      sends charity (15%) and platform (3%) shares immediately. The remaining
    ///      82% stays in the contract for winners to claim pro-rata.
    /// @param winningTeamId The ID of the winning team (must be teamAId or teamBId)
    function resolveMatch(uint8 winningTeamId)
        external
        onlyFactory
        inState(MatchState.LOCKED)
        nonReentrant
    {
        if (winningTeamId != teamAId && winningTeamId != teamBId) {
            revert InvalidWinner();
        }

        winningTeam = winningTeamId;
        state = MatchState.RESOLVED;

        if (totalPool > 0) {
            uint256 charityAmount;
            uint256 platformAmount;

            // Use unchecked for arithmetic that provably cannot overflow:
            // totalPool * 1500 fits in uint256 even for enormous values
            unchecked {
                charityAmount = (totalPool * CHARITY_BPS) / BPS_DENOMINATOR;
                platformAmount = (totalPool * PLATFORM_BPS) / BPS_DENOMINATOR;
            }
            winnersPool = totalPool - charityAmount - platformAmount;

            // Transfer charity share to CharityDAO
            (bool charityOk, ) = charityDAO.call{value: charityAmount}("");
            if (!charityOk) revert TransferFailed();

            // Transfer platform share to treasury (gas-limited to prevent griefing)
            (bool platformOk, ) = platformTreasury.call{value: platformAmount, gas: 10000}(
                ""
            );
            if (!platformOk) revert TransferFailed();

            emit MatchResolved(
                matchId,
                winningTeamId,
                winnersPool,
                charityAmount
            );
        }
    }

    /// @notice Cancel the match and enable refunds for all stakers
    /// @dev Only callable by the factory. Can cancel from OPEN or LOCKED state.
    ///      After cancellation, users must call claimRefund() individually.
    function cancelMatch() external onlyFactory {
        if (state != MatchState.OPEN && state != MatchState.LOCKED) {
            revert MatchNotCancellable();
        }

        state = MatchState.CANCELLED;
        emit MatchCancelled(matchId, totalPool);
    }

    // ─── Claims ───────────────────────────────────────────────────────────
    /// @notice Claim pro-rata reward after match resolution (winning stakers only)
    /// @dev Calculates the user's share of the winners pool based on their stake
    ///      relative to the total winning team pool. Records the win on the
    ///      SeasonLeaderboard. Uses ReentrancyGuard for safety.
    function claimReward()
        external
        inState(MatchState.RESOLVED)
        nonReentrant
    {
        Stake storage userStake = _stakes[msg.sender];
        if (userStake.amount == 0) revert ZeroStake();
        if (userStake.teamId != winningTeam) revert NotWinner();
        if (userStake.claimed) revert AlreadyClaimed();

        userStake.claimed = true;

        uint256 winningPool = teamPools[winningTeam];
        uint256 reward;
        unchecked {
            // Safe: userStake.amount <= winningPool, winnersPool <= totalPool
            reward = (uint256(userStake.amount) * winnersPool) / winningPool;
        }

        // Record on leaderboard if available
        if (leaderboard != address(0)) {
            leaderboard.call(
                abi.encodeWithSignature(
                    "recordWin(address,uint256)",
                    msg.sender,
                    reward
                )
            );
        }

        (bool ok, ) = msg.sender.call{value: reward}("");
        if (!ok) revert TransferFailed();

        emit RewardClaimed(msg.sender, reward);
    }

    /// @notice Claim a full refund after match cancellation
    /// @dev Returns the exact amount staked by the user. Uses ReentrancyGuard
    ///      for safety. Decrements pool tracking for accounting accuracy.
    function claimRefund()
        external
        inState(MatchState.CANCELLED)
        nonReentrant
    {
        Stake storage userStake = _stakes[msg.sender];
        if (userStake.amount == 0) revert ZeroStake();
        if (userStake.claimed) revert AlreadyClaimed();

        uint256 refundAmount = uint256(userStake.amount);
        userStake.claimed = true;

        unchecked {
            teamPools[userStake.teamId] -= refundAmount;
            totalPool -= refundAmount;
        }

        (bool ok, ) = msg.sender.call{value: refundAmount}("");
        if (!ok) revert TransferFailed();

        emit RewardClaimed(msg.sender, refundAmount);
    }

    /// @notice Sweep unclaimed winners pool to charity if no winners exist
    /// @dev Only callable by factory after resolution. If winning team pool is 0
    ///      (no one staked on the winner), the 82% is redirected to charity
    ///      instead of being locked forever.
    function sweepToCharity()
        external
        onlyFactory
        inState(MatchState.RESOLVED)
        nonReentrant
    {
        // Only sweep if winning team had zero stakers
        if (teamPools[winningTeam] > 0) revert InvalidWinner();
        if (winnersPool == 0) revert ZeroStake();

        uint256 amount = winnersPool;
        winnersPool = 0;

        (bool ok, ) = charityDAO.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ─── Views ────────────────────────────────────────────────────────────
    /// @notice Get comprehensive match information in a single call
    /// @dev Returns all key match data packed into a MatchInfo struct.
    ///      This is more gas-efficient for frontends than multiple individual reads.
    /// @return info The MatchInfo struct containing all match data
    function getMatchInfo()
        external
        view
        returns (MatchInfo memory info)
    {
        info = MatchInfo({
            teamAName: teamAName,
            teamBName: teamBName,
            teamAId: teamAId,
            teamBId: teamBId,
            teamAPool: teamPools[teamAId],
            teamBPool: teamPools[teamBId],
            totalPool: totalPool,
            state: state,
            stakingDeadline: stakingDeadline,
            winningTeam: winningTeam
        });
    }

    /// @notice Get a specific user's stake details for this match
    /// @dev Returns zero values for users who have not staked
    /// @param user The address to query
    /// @return amount The total WIRE staked by this user
    /// @return teamId The team the user staked for
    /// @return claimed Whether the user has claimed their reward or refund
    function getUserStake(address user)
        external
        view
        returns (uint128 amount, uint8 teamId, bool claimed)
    {
        Stake memory s = _stakes[user];
        return (s.amount, s.teamId, s.claimed);
    }

    /// @dev Accept WIRE transfers (needed for CharityDAO returns, etc.)
    receive() external payable {}
}
