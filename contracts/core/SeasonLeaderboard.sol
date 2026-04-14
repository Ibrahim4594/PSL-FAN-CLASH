// SPDX-License-Identifier: MIT
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev PSL Fan Clash — rivalry staking-for-charity dApp. PSL 3x scoring multiplier.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SeasonLeaderboard
 * @author PSL Fan Clash Team
 * @notice Tracks fan engagement and charitable impact across the full PSL 11 season.
 *         Records stakes, wins, and charity contributions from MatchVault and CharityDAO.
 * @dev Uses access control to ensure only authorized contracts (MatchVaults, CharityDAO,
 *      and the MatchFactory) can write data. All view functions are free off-chain.
 *      Uses mappings for O(1) lookups and an address array for enumeration.
 */
contract SeasonLeaderboard is Ownable {
    // ─── Custom Errors ────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();
    error OutOfBounds();

    // ─── Types ────────────────────────────────────────────────────────────
    /// @notice Represents a fan's cumulative season statistics
    struct FanProfile {
        uint256 totalStaked;
        uint256 totalWon;
        uint256 matchesParticipated;
        uint8 primaryTeam;
        uint256 charityVotesCast;
        bool exists;
    }

    /// @notice Represents aggregate statistics for a PSL team
    struct TeamStats {
        uint256 totalStakedByFans;
        uint256 totalCharityGenerated;
        uint256 uniqueFans;
        uint256 wins;
    }

    // ─── Storage ──────────────────────────────────────────────────────────
    /// @notice Maps fan address to their profile
    mapping(address => FanProfile) private _fans;
    /// @notice Maps team ID to aggregate stats
    mapping(uint8 => TeamStats) private _teamStats;
    /// @notice Tracks whether a fan has been counted as unique for a team
    mapping(uint8 => mapping(address => bool)) private _teamFanExists;
    /// @notice Ordered list of all fan addresses for enumeration
    address[] private _fanAddresses;
    /// @notice Total WIRE donated to charity across the entire season
    uint256 public seasonTotalCharity;
    /// @notice Total WIRE staked across all matches this season
    uint256 public seasonTotalStaked;

    // ─── Access Control ───────────────────────────────────────────────────
    /// @notice Address of the MatchFactory contract
    address public matchFactory;
    /// @notice Address of the CharityDAO contract
    address public charityDAO;
    /// @notice Maps addresses authorized to record data (vaults, factory, dao)
    mapping(address => bool) public authorizedCallers;

    // ─── Events ───────────────────────────────────────────────────────────
    event FanStakeRecorded(
        address indexed user,
        uint8 indexed teamId,
        uint256 amount,
        uint256 seasonTotal
    );
    event FanWinRecorded(address indexed user, uint256 amount);
    event CharityContributionRecorded(
        uint8 indexed teamId,
        uint256 amount
    );
    event CharityMilestone(uint8 indexed teamId, uint256 totalCharity);
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);

    // ─── Modifiers ────────────────────────────────────────────────────────
    /// @dev Restricts write access to authorized contracts and the owner
    modifier onlyAuthorized() {
        if (
            !authorizedCallers[msg.sender] &&
            msg.sender != matchFactory &&
            msg.sender != charityDAO &&
            msg.sender != owner()
        ) {
            revert Unauthorized();
        }
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────
    /// @notice Initialize the Season Leaderboard
    /// @dev The deployer becomes the owner with admin privileges
    constructor() Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────
    /// @notice Set the MatchFactory address for authorization
    /// @dev The factory address is used both for direct calls and to authorize vaults
    /// @param _factory The MatchFactory contract address
    function setMatchFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert ZeroAddress();
        matchFactory = _factory;
    }

    /// @notice Set the CharityDAO address for authorization
    /// @param _charityDAO The CharityDAO contract address
    function setCharityDAO(address _charityDAO) external onlyOwner {
        if (_charityDAO == address(0)) revert ZeroAddress();
        charityDAO = _charityDAO;
    }

    /// @notice Authorize a contract address to record data (e.g., MatchVault instances)
    /// @dev Called by the owner or factory to whitelist vault addresses
    /// @param caller The address to authorize
    function authorizeCaller(address caller) external {
        if (msg.sender != owner() && msg.sender != matchFactory) {
            revert Unauthorized();
        }
        authorizedCallers[caller] = true;
        emit CallerAuthorized(caller);
    }

    /// @notice Revoke an address's authorization to record data
    /// @param caller The address to revoke
    function revokeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit CallerRevoked(caller);
    }

    // ─── Recording ────────────────────────────────────────────────────────
    /// @notice Record a fan's stake for leaderboard tracking
    /// @dev Called by MatchVault when a user stakes. Creates a new FanProfile
    ///      if the user has not staked before. Updates team and season aggregates.
    /// @param _user The staker's address
    /// @param _teamId The team staked for
    /// @param _amount The amount staked in wei
    function recordStake(
        address _user,
        uint8 _teamId,
        uint256 _amount
    ) external onlyAuthorized {
        FanProfile storage fan = _fans[_user];

        if (!fan.exists) {
            fan.exists = true;
            fan.primaryTeam = _teamId;
            _fanAddresses.push(_user);
        }

        fan.totalStaked += _amount;
        unchecked {
            fan.matchesParticipated += 1;
        }

        _teamStats[_teamId].totalStakedByFans += _amount;

        if (!_teamFanExists[_teamId][_user]) {
            _teamFanExists[_teamId][_user] = true;
            unchecked {
                _teamStats[_teamId].uniqueFans += 1;
            }
        }

        seasonTotalStaked += _amount;

        emit FanStakeRecorded(_user, _teamId, _amount, fan.totalStaked);
    }

    /// @notice Record a fan's winning claim
    /// @dev Called by MatchVault when a winner claims their reward
    /// @param _user The winner's address
    /// @param _amount The reward amount in wei
    function recordWin(address _user, uint256 _amount)
        external
        onlyAuthorized
    {
        _fans[_user].totalWon += _amount;
        emit FanWinRecorded(_user, _amount);
    }

    /// @notice Record a charity contribution from a resolved match
    /// @dev Called by CharityDAO when a vote is executed and funds are sent.
    ///      Increments the team's charity stats and checks for milestones.
    /// @param _teamId The winning team whose fans directed the donation
    /// @param _amount The charity amount in wei
    function recordCharityContribution(uint8 _teamId, uint256 _amount)
        external
        onlyAuthorized
    {
        TeamStats storage stats = _teamStats[_teamId];
        stats.totalCharityGenerated += _amount;
        unchecked {
            stats.wins += 1;
        }
        seasonTotalCharity += _amount;

        emit CharityContributionRecorded(_teamId, _amount);

        // Emit milestones at 100, 500, 1000 WIRE thresholds
        uint256 total = stats.totalCharityGenerated;
        uint256 prev;
        unchecked {
            prev = total - _amount;
        }
        if (total >= 1000 ether && prev < 1000 ether) {
            emit CharityMilestone(_teamId, total);
        } else if (total >= 500 ether && prev < 500 ether) {
            emit CharityMilestone(_teamId, total);
        } else if (total >= 100 ether && prev < 100 ether) {
            emit CharityMilestone(_teamId, total);
        }
    }

    /// @notice Record that a fan cast a charity vote
    /// @dev Called by CharityDAO when a user votes
    /// @param _user The voter's address
    function recordCharityVote(address _user) external onlyAuthorized {
        unchecked {
            _fans[_user].charityVotesCast += 1;
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────
    /// @notice Get a fan's full season profile
    /// @param _user The fan's address
    /// @return profile The FanProfile struct with all stats
    function getFanProfile(address _user)
        external
        view
        returns (FanProfile memory profile)
    {
        return _fans[_user];
    }

    /// @notice Get aggregate statistics for a team
    /// @param _teamId The team ID (0-7 for PSL teams)
    /// @return stats The TeamStats struct
    function getTeamStats(uint8 _teamId)
        external
        view
        returns (TeamStats memory stats)
    {
        return _teamStats[_teamId];
    }

    /// @notice Get season-wide aggregate statistics
    /// @return _totalStaked Total WIRE staked across all matches
    /// @return _totalCharity Total WIRE donated to charity
    /// @return _totalFans Total unique fan addresses
    function getSeasonStats()
        external
        view
        returns (
            uint256 _totalStaked,
            uint256 _totalCharity,
            uint256 _totalFans
        )
    {
        return (seasonTotalStaked, seasonTotalCharity, _fanAddresses.length);
    }

    /// @notice Get the total number of unique fans
    /// @return Number of unique addresses that have staked at least once
    function getTotalFans() external view returns (uint256) {
        return _fanAddresses.length;
    }

    /// @notice Get a fan address by index for enumeration
    /// @dev Used by off-chain systems to iterate through all fans
    /// @param _index The index in the fan addresses array
    /// @return The fan address at that index
    function getFanAddress(uint256 _index)
        external
        view
        returns (address)
    {
        if (_index >= _fanAddresses.length) revert OutOfBounds();
        return _fanAddresses[_index];
    }

    /// @notice Get the top fans by total amount staked
    /// @dev Performs an on-chain sort. For large fan counts, prefer off-chain sorting.
    ///      Returns up to `count` fans, or all fans if fewer exist.
    /// @param count Maximum number of top fans to return
    /// @return addresses Array of fan addresses sorted by total staked (descending)
    /// @return stakes Array of total staked amounts corresponding to each address
    function getTopFans(uint256 count)
        external
        view
        returns (address[] memory addresses, uint256[] memory stakes)
    {
        uint256 total = _fanAddresses.length;
        if (count > total) {
            count = total;
        }

        // Build parallel arrays and selection-sort top `count`
        addresses = new address[](count);
        stakes = new uint256[](count);

        // Copy all into memory for sorting
        address[] memory allAddrs = new address[](total);
        uint256[] memory allStakes = new uint256[](total);

        for (uint256 i; i < total; ) {
            allAddrs[i] = _fanAddresses[i];
            allStakes[i] = _fans[allAddrs[i]].totalStaked;
            unchecked {
                ++i;
            }
        }

        // Partial selection sort — find top `count` entries
        for (uint256 i; i < count; ) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; ) {
                if (allStakes[j] > allStakes[maxIdx]) {
                    maxIdx = j;
                }
                unchecked {
                    ++j;
                }
            }
            // Swap
            if (maxIdx != i) {
                (allAddrs[i], allAddrs[maxIdx]) = (
                    allAddrs[maxIdx],
                    allAddrs[i]
                );
                (allStakes[i], allStakes[maxIdx]) = (
                    allStakes[maxIdx],
                    allStakes[i]
                );
            }
            addresses[i] = allAddrs[i];
            stakes[i] = allStakes[i];
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Get a paginated list of fan addresses
    /// @dev Useful for off-chain systems to enumerate fans in batches
    /// @param offset Starting index
    /// @param limit Maximum number of addresses to return
    /// @return fans Array of fan addresses
    function getFansPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory fans)
    {
        uint256 total = _fanAddresses.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 length;
        unchecked {
            length = end - offset;
        }

        fans = new address[](length);
        for (uint256 i; i < length; ) {
            fans[i] = _fanAddresses[offset + i];
            unchecked {
                ++i;
            }
        }
    }
}
