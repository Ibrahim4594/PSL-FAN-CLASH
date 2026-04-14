// SPDX-License-Identifier: MIT
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev PSL Fan Clash — rivalry staking-for-charity dApp. PSL 3x scoring multiplier.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MatchVault.sol";

/**
 * @title MatchFactory
 * @author PSL Fan Clash Team
 * @notice Factory contract for deploying per-match MatchVault instances.
 *         Single source of truth for all PSL 11 season matches.
 * @dev Uses CREATE2 for deterministic vault addresses. Tracks season dates,
 *      total matches, and manages the full match lifecycle (create, lock,
 *      resolve, cancel). Owner-only administrative functions.
 */
contract MatchFactory is Ownable {
    // ─── Custom Errors ────────────────────────────────────────────────────
    error ZeroAddress();
    error MatchAlreadyExists();
    error MatchNotFound();
    error CharityDAONotSet();
    error InvalidSeasonDates();

    // ─── Storage ──────────────────────────────────────────────────────────
    /// @notice Maps match ID to its deployed vault address
    mapping(uint256 => address) public matchVaults;
    /// @notice Ordered list of all match IDs created this season
    uint256[] private _matchIds;
    /// @notice Address of the CharityDAO contract
    address public charityDAO;
    /// @notice Address of the platform treasury
    address public immutable platformTreasury;
    /// @notice Address of the SeasonLeaderboard contract
    address public leaderboard;
    /// @notice Season start date (Unix timestamp)
    uint256 public seasonStart;
    /// @notice Season end date (Unix timestamp)
    uint256 public seasonEnd;

    // ─── Events ───────────────────────────────────────────────────────────
    event MatchCreated(
        uint256 indexed matchId,
        address indexed vault,
        uint8 teamAId,
        bytes32 teamAName,
        uint8 teamBId,
        bytes32 teamBName,
        uint256 stakingDeadline
    );
    event MatchLockedByFactory(uint256 indexed matchId);
    event MatchResolvedByFactory(uint256 indexed matchId, uint8 winningTeamId);
    event MatchCancelledByFactory(uint256 indexed matchId);
    event CharityDAOUpdated(address indexed newCharityDAO);
    event LeaderboardUpdated(address indexed newLeaderboard);
    event SeasonConfigured(uint256 start, uint256 end);

    // ─── Constructor ──────────────────────────────────────────────────────
    /// @notice Initialize the factory with the platform treasury address
    /// @dev The deployer becomes the owner. CharityDAO and Leaderboard
    ///      must be set separately after deployment.
    /// @param _platformTreasury Address to receive 3% platform fees from each match
    constructor(address _platformTreasury) Ownable(msg.sender) {
        if (_platformTreasury == address(0)) revert ZeroAddress();
        platformTreasury = _platformTreasury;
    }

    // ─── Admin Setup ──────────────────────────────────────────────────────
    /// @notice Set the CharityDAO contract address
    /// @dev Must be called before creating matches. Can be updated if needed.
    /// @param _charityDAO Address of the deployed CharityDAO contract
    function setCharityDAO(address _charityDAO) external onlyOwner {
        if (_charityDAO == address(0)) revert ZeroAddress();
        charityDAO = _charityDAO;
        emit CharityDAOUpdated(_charityDAO);
    }

    /// @notice Set the SeasonLeaderboard contract address
    /// @dev Optional but recommended for engagement tracking. Can be updated.
    /// @param _leaderboard Address of the deployed SeasonLeaderboard contract
    function setLeaderboard(address _leaderboard) external onlyOwner {
        if (_leaderboard == address(0)) revert ZeroAddress();
        leaderboard = _leaderboard;
        emit LeaderboardUpdated(_leaderboard);
    }

    /// @notice Configure the PSL season date range
    /// @dev Used for frontend display and optional on-chain validation
    /// @param _start Season start Unix timestamp
    /// @param _end Season end Unix timestamp
    function configureSeason(uint256 _start, uint256 _end) external onlyOwner {
        if (_end <= _start) revert InvalidSeasonDates();
        seasonStart = _start;
        seasonEnd = _end;
        emit SeasonConfigured(_start, _end);
    }

    // ─── Match Lifecycle ──────────────────────────────────────────────────
    /// @notice Create a new match vault using CREATE2 for deterministic addressing
    /// @dev Deploys a new MatchVault contract. Requires CharityDAO to be set.
    ///      The match ID is used as the CREATE2 salt for address predictability.
    /// @param _matchId Unique match identifier (used as CREATE2 salt)
    /// @param _teamAId Numeric ID for Team A
    /// @param _teamAName Name of Team A encoded as bytes32
    /// @param _teamBId Numeric ID for Team B
    /// @param _teamBName Name of Team B encoded as bytes32
    /// @param _stakingDeadline Unix timestamp when staking closes
    /// @return vault Address of the newly deployed MatchVault
    function createMatch(
        uint256 _matchId,
        uint8 _teamAId,
        bytes32 _teamAName,
        uint8 _teamBId,
        bytes32 _teamBName,
        uint256 _stakingDeadline
    ) external onlyOwner returns (address vault) {
        if (matchVaults[_matchId] != address(0)) revert MatchAlreadyExists();
        if (charityDAO == address(0)) revert CharityDAONotSet();

        // Deploy with CREATE2 using matchId as salt for deterministic addresses
        bytes32 salt = bytes32(_matchId);
        MatchVault newVault = new MatchVault{salt: salt}(
            _matchId,
            _teamAId,
            _teamAName,
            _teamBId,
            _teamBName,
            _stakingDeadline,
            platformTreasury,
            charityDAO,
            leaderboard
        );

        vault = address(newVault);
        matchVaults[_matchId] = vault;
        _matchIds.push(_matchId);

        // Auto-authorize the vault on the leaderboard (prevents manual oversight)
        if (leaderboard != address(0)) {
            leaderboard.call(
                abi.encodeWithSignature("authorizeCaller(address)", vault)
            );
        }

        emit MatchCreated(
            _matchId,
            vault,
            _teamAId,
            _teamAName,
            _teamBId,
            _teamBName,
            _stakingDeadline
        );
    }

    /// @notice Lock a match to prevent further staking
    /// @dev Forwards the call to the vault. Only the factory owner can trigger this.
    /// @param _matchId The match to lock
    function lockMatch(uint256 _matchId) external onlyOwner {
        address vault = matchVaults[_matchId];
        if (vault == address(0)) revert MatchNotFound();
        MatchVault(payable(vault)).lockMatch();
        emit MatchLockedByFactory(_matchId);
    }

    /// @notice Resolve a match with the winning team
    /// @dev Forwards the call to the vault which handles fund distribution.
    ///      After resolution, starts voting on CharityDAO.
    /// @param _matchId The match to resolve
    /// @param _winningTeamId The ID of the winning team
    function resolveMatch(uint256 _matchId, uint8 _winningTeamId)
        external
        onlyOwner
    {
        address vault = matchVaults[_matchId];
        if (vault == address(0)) revert MatchNotFound();
        MatchVault(payable(vault)).resolveMatch(_winningTeamId);

        // Start charity voting automatically
        if (charityDAO != address(0)) {
            // Low-level call to avoid revert if charity voting setup fails
            charityDAO.call(
                abi.encodeWithSignature(
                    "startVoting(uint256,address)",
                    _matchId,
                    vault
                )
            );
        }

        emit MatchResolvedByFactory(_matchId, _winningTeamId);
    }

    /// @notice Cancel a match and enable refunds
    /// @dev Forwards the cancel call to the vault. Users then claim individual refunds.
    /// @param _matchId The match to cancel
    function cancelMatch(uint256 _matchId) external onlyOwner {
        address vault = matchVaults[_matchId];
        if (vault == address(0)) revert MatchNotFound();
        MatchVault(payable(vault)).cancelMatch();
        emit MatchCancelledByFactory(_matchId);
    }

    // ─── Views ────────────────────────────────────────────────────────────
    /// @notice Get the vault address for a specific match
    /// @param _matchId The match identifier
    /// @return The vault contract address (or zero address if not found)
    function getMatch(uint256 _matchId) external view returns (address) {
        return matchVaults[_matchId];
    }

    /// @notice Get all match IDs created this season
    /// @dev Returns the full array. Frontend should paginate off-chain if needed.
    /// @return Array of all match IDs in creation order
    function getAllMatchIds() external view returns (uint256[] memory) {
        return _matchIds;
    }

    /// @notice Get the total number of matches created
    /// @return Count of matches deployed by this factory
    function getMatchCount() external view returns (uint256) {
        return _matchIds.length;
    }

    /// @notice Get a paginated slice of match IDs
    /// @dev Useful for frontends that need to paginate through large match lists
    /// @param offset Starting index in the match IDs array
    /// @param limit Maximum number of match IDs to return
    /// @return ids Array of match IDs within the specified range
    function getMatchIdsPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory ids)
    {
        uint256 total = _matchIds.length;
        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 length;
        unchecked {
            length = end - offset;
        }

        ids = new uint256[](length);
        for (uint256 i; i < length; ) {
            ids[i] = _matchIds[offset + i];
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Predict the vault address for a given match ID before deployment
    /// @dev Uses CREATE2 address computation. Useful for frontends to pre-compute addresses.
    /// @param _matchId The match ID to predict the address for
    /// @param _teamAId Team A numeric identifier
    /// @param _teamAName Team A name as bytes32
    /// @param _teamBId Team B numeric identifier
    /// @param _teamBName Team B name as bytes32
    /// @param _stakingDeadline Unix timestamp for staking deadline
    /// @return predicted The predicted contract address
    function predictVaultAddress(
        uint256 _matchId,
        uint8 _teamAId,
        bytes32 _teamAName,
        uint8 _teamBId,
        bytes32 _teamBName,
        uint256 _stakingDeadline
    ) external view returns (address predicted) {
        bytes32 salt = bytes32(_matchId);
        bytes memory bytecode = abi.encodePacked(
            type(MatchVault).creationCode,
            abi.encode(
                _matchId,
                _teamAId,
                _teamAName,
                _teamBId,
                _teamBName,
                _stakingDeadline,
                platformTreasury,
                charityDAO,
                leaderboard
            )
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        predicted = address(uint160(uint256(hash)));
    }
}
