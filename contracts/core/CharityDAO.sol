// SPDX-License-Identifier: MIT
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev PSL Fan Clash — rivalry staking-for-charity dApp. PSL 3x scoring multiplier.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/ICharityDAO.sol";
import "../interfaces/IMatchVault.sol";

/**
 * @title CharityDAO
 * @author PSL Fan Clash Team
 * @notice Manages stake-weighted charity voting for PSL Fan Clash.
 *         After each match resolves, winning stakers vote on which registered
 *         charity receives the 15% charity pool. Voting is weighted by stake amount.
 * @dev Verifies voter eligibility on-chain by reading stake data from the
 *      MatchVault contract. Voting window is 48 hours. Funds are sent to
 *      the winning charity when executeVote() is called after the window closes.
 */
contract CharityDAO is ICharityDAO, Ownable, ReentrancyGuard {
    // ─── Constants ────────────────────────────────────────────────────────
    /// @notice Duration of the voting window after a match resolves
    uint256 public constant VOTE_DURATION = 48 hours;

    // ─── Storage ──────────────────────────────────────────────────────────
    /// @notice Array of all registered charities
    Charity[] private _charities;

    /// @notice Maps match ID to its voting state
    mapping(uint256 => VoteInfo) private _matchVotes;

    /// @notice Maps match ID => charity ID => total weighted votes received
    mapping(uint256 => mapping(uint256 => uint256)) public charityVoteTallies;

    /// @notice Maps match ID => voter address => whether they have voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Tracks the balance already allocated to pending votes
    uint256 private _allocatedBalance;

    /// @notice Address of the MatchFactory authorized to start votes
    address public matchFactory;

    /// @notice Address of the SeasonLeaderboard for recording stats
    address public leaderboardAddress;

    // ─── Events (additional to interface) ─────────────────────────────────
    event MatchFactoryUpdated(address indexed factory);
    event LeaderboardUpdated(address indexed leaderboard);

    // ─── Constructor ──────────────────────────────────────────────────────
    /// @notice Initialize the CharityDAO contract
    /// @dev The deployer becomes the owner with admin privileges
    constructor() Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────
    /// @notice Set the MatchFactory address for authorization
    /// @dev Only the factory or owner can start voting sessions
    /// @param _factory Address of the MatchFactory contract
    function setMatchFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert ZeroAddress();
        matchFactory = _factory;
        emit MatchFactoryUpdated(_factory);
    }

    /// @notice Set the SeasonLeaderboard address for stats tracking
    /// @param _leaderboard Address of the SeasonLeaderboard contract
    function setLeaderboard(address _leaderboard) external onlyOwner {
        if (_leaderboard == address(0)) revert ZeroAddress();
        leaderboardAddress = _leaderboard;
        emit LeaderboardUpdated(_leaderboard);
    }

    /// @notice Register a new charity eligible for receiving match donations
    /// @dev Only the owner can register charities. Uses bytes32 for gas-efficient
    ///      string storage. Charity is immediately active upon registration.
    /// @param name The charity name (bytes32 for gas optimization)
    /// @param wallet The wallet address to receive donated funds
    /// @param description Short description (bytes32 for gas optimization)
    function registerCharity(
        bytes32 name,
        address wallet,
        bytes32 description
    ) external onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        _charities.push(Charity(name, wallet, description, true));

        uint256 charityId;
        unchecked {
            charityId = _charities.length - 1;
        }
        emit CharityRegistered(charityId, name, wallet);
    }

    /// @notice Deactivate a charity so it cannot receive new votes
    /// @dev Deactivated charities keep their historical data but cannot be voted for
    /// @param charityId The index of the charity to deactivate
    function deactivateCharity(uint256 charityId) external onlyOwner {
        if (charityId >= _charities.length) revert InvalidCharity();
        _charities[charityId].active = false;
        emit CharityDeactivated(charityId);
    }

    // ─── Voting ───────────────────────────────────────────────────────────
    /// @notice Start the 48-hour voting period for a resolved match
    /// @dev Called by the MatchFactory automatically after match resolution,
    ///      or manually by the owner. Records the charity pool amount and
    ///      the vault address for on-chain stake verification during voting.
    /// @param matchId The ID of the resolved match
    /// @param vaultAddress The address of the MatchVault for voter verification
    function startVoting(uint256 matchId, address vaultAddress) external {
        if (msg.sender != matchFactory && msg.sender != owner()) {
            revert Unauthorized();
        }
        if (_matchVotes[matchId].startTime != 0) revert VoteAlreadyStarted();

        // Only allocate unallocated funds — prevents race condition with concurrent matches
        uint256 unallocated = address(this).balance - _allocatedBalance;
        _allocatedBalance += unallocated;

        _matchVotes[matchId] = VoteInfo({
            startTime: block.timestamp,
            charityPool: unallocated,
            executed: false,
            winningCharityId: 0,
            vaultAddress: vaultAddress
        });

        emit VotingStarted(
            matchId,
            unallocated,
            block.timestamp + VOTE_DURATION
        );
    }

    /// @notice Cast a stake-weighted vote for a charity
    /// @dev Verifies the voter on-chain by reading their stake from the MatchVault.
    ///      Only winning stakers can vote, and their voting power equals their
    ///      stake amount. Each address can only vote once per match.
    /// @param matchId The match ID to vote on
    /// @param charityId The index of the charity to vote for
    function castVote(uint256 matchId, uint256 charityId) external {
        VoteInfo storage vote = _matchVotes[matchId];
        if (vote.startTime == 0) revert VoteNotStarted();
        if (block.timestamp >= vote.startTime + VOTE_DURATION) {
            revert VoteStillOpen(); // Vote has ended, not "still open" — reusing error for "Vote ended"
        }
        if (vote.executed) revert VoteAlreadyExecuted();
        if (hasVoted[matchId][msg.sender]) revert AlreadyVoted();
        if (charityId >= _charities.length) revert InvalidCharity();
        if (!_charities[charityId].active) revert CharityInactive();

        // Verify voter is a winning staker by reading from the vault on-chain
        uint256 weight = _getVotingPower(vote.vaultAddress, msg.sender);
        if (weight == 0) revert NotWinningStaker();

        hasVoted[matchId][msg.sender] = true;
        charityVoteTallies[matchId][charityId] += weight;

        // Record vote on leaderboard if available
        if (leaderboardAddress != address(0)) {
            leaderboardAddress.call(
                abi.encodeWithSignature(
                    "recordCharityVote(address)",
                    msg.sender
                )
            );
        }

        emit VoteCast(matchId, msg.sender, charityId, weight);
    }

    /// @notice Execute the vote after the 48-hour window and send funds to the winning charity
    /// @dev Anyone can call this after the voting period ends. Finds the charity with
    ///      the most weighted votes and transfers the charity pool to their wallet.
    ///      Records the charity contribution on the SeasonLeaderboard.
    /// @param matchId The match ID whose vote to execute
    function executeVote(uint256 matchId) external nonReentrant {
        VoteInfo storage vote = _matchVotes[matchId];
        if (vote.startTime == 0) revert VoteNotStarted();
        if (block.timestamp < vote.startTime + VOTE_DURATION) {
            revert VoteStillOpen();
        }
        if (vote.executed) revert VoteAlreadyExecuted();

        vote.executed = true;

        // Find the charity with the most votes
        uint256 winningId;
        uint256 highestVotes;
        uint256 len = _charities.length;

        for (uint256 i; i < len; ) {
            uint256 votes = charityVoteTallies[matchId][i];
            if (votes > highestVotes) {
                highestVotes = votes;
                winningId = i;
            }
            unchecked {
                ++i;
            }
        }

        vote.winningCharityId = winningId;

        // Transfer funds to winning charity — release from allocated pool
        uint256 amount = vote.charityPool;
        if (amount > address(this).balance) {
            amount = address(this).balance;
        }
        _allocatedBalance -= vote.charityPool;

        if (amount > 0 && highestVotes > 0) {
            (bool ok, ) = _charities[winningId].wallet.call{value: amount}("");
            if (!ok) revert ZeroAddress(); // Reusing error — transfer failed

            // Record on leaderboard
            if (leaderboardAddress != address(0)) {
                // Get the winning team from vault to record contribution
                IMatchVault vault = IMatchVault(vote.vaultAddress);
                IMatchVault.MatchInfo memory info = vault.getMatchInfo();

                leaderboardAddress.call(
                    abi.encodeWithSignature(
                        "recordCharityContribution(uint8,uint256)",
                        info.winningTeam,
                        amount
                    )
                );
            }
        }

        emit VoteExecuted(
            matchId,
            winningId,
            _charities[winningId].name,
            amount
        );
    }

    // ─── Views ────────────────────────────────────────────────────────────
    /// @notice Get all registered charities
    /// @return Array of Charity structs including inactive ones
    function getCharities() external view returns (Charity[] memory) {
        return _charities;
    }

    /// @notice Get the number of registered charities
    /// @return Count of all charities (active and inactive)
    function getCharityCount() external view returns (uint256) {
        return _charities.length;
    }

    /// @notice Get vote results for a specific match
    /// @dev Returns zero values for matches that have not started voting
    /// @param matchId The match ID to query
    /// @return info The VoteInfo struct containing voting state and results
    function getVoteResults(uint256 matchId)
        external
        view
        returns (VoteInfo memory info)
    {
        return _matchVotes[matchId];
    }

    /// @notice Check if a specific address has voted on a match
    /// @param matchId The match ID to check
    /// @param voter The voter address
    /// @return Whether the voter has already cast a vote
    function hasUserVoted(uint256 matchId, address voter)
        external
        view
        returns (bool)
    {
        return hasVoted[matchId][voter];
    }

    /// @notice Get the vote tally for a specific charity on a specific match
    /// @param matchId The match ID
    /// @param charityId The charity index
    /// @return Total weighted votes received
    function getCharityVotes(uint256 matchId, uint256 charityId)
        external
        view
        returns (uint256)
    {
        return charityVoteTallies[matchId][charityId];
    }

    /// @notice Get the voting power of a user for a specific match
    /// @dev Reads the user's stake from the vault and checks if they are a winning staker
    /// @param matchId The match ID
    /// @param voter The voter address
    /// @return weight The stake amount if the user is a winning staker, 0 otherwise
    function getVotingPower(uint256 matchId, address voter)
        external
        view
        returns (uint256 weight)
    {
        VoteInfo memory vote = _matchVotes[matchId];
        if (vote.vaultAddress == address(0)) return 0;
        return _getVotingPower(vote.vaultAddress, voter);
    }

    // ─── Internal ─────────────────────────────────────────────────────────
    /// @dev Read a user's voting power from the MatchVault contract
    /// @param vaultAddress The address of the MatchVault to query
    /// @param voter The address of the voter to check
    /// @return weight The user's stake if they are on the winning team, 0 otherwise
    function _getVotingPower(address vaultAddress, address voter)
        private
        view
        returns (uint256 weight)
    {
        IMatchVault vault = IMatchVault(vaultAddress);
        IMatchVault.MatchInfo memory info = vault.getMatchInfo();

        // Only resolved matches have valid winners
        if (info.state != IMatchVault.MatchState.RESOLVED) return 0;

        (uint128 amount, uint8 teamId, ) = vault.getUserStake(voter);

        // Only winning stakers get voting power
        if (teamId == info.winningTeam && amount > 0) {
            weight = uint256(amount);
        }
    }

    /// @dev Accept WIRE from MatchVault resolution (15% charity share)
    receive() external payable {}
}
