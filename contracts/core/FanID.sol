// SPDX-License-Identifier: MIT
// @notice Deployed on WireFluid Testnet (Chain ID 92533) for Entangled 2026 Hackathon
// @dev PSL Fan Clash — rivalry staking-for-charity dApp. PSL 3x scoring multiplier.
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FanID
 * @author PSL Fan Clash Team
 * @notice Soulbound (non-transferable) ERC-721 NFT representing a PSL fan's on-chain identity.
 *         One per address. Stores team allegiance and tracks engagement stats.
 * @dev Transfer functions are overridden to revert — making this soulbound.
 *      Stats are updated by authorized callers (MatchVault, owner).
 */
contract FanID is ERC721, Ownable, ReentrancyGuard {
    // ─── Custom Errors ────────────────────────────────────────────────
    error AlreadyRegistered();
    error InvalidTeam();
    error InsufficientPayment();
    error Unauthorized();
    error SoulboundTransferBlocked();

    // ─── Types ────────────────────────────────────────────────────────
    /// @notice Fan stats packed into minimal storage slots
    struct FanStats {
        uint8 teamId;           // PSL team (0-7)
        uint32 matchesJoined;   // total matches participated
        uint32 correctPicks;    // times on winning side
        uint128 totalStaked;    // cumulative WIRE staked (in wei, fits uint128)
        uint128 totalWon;       // cumulative WIRE won
        uint32 charityVotes;    // charity votes cast
        uint64 mintedAt;        // block.timestamp when minted
    }

    // ─── Storage ──────────────────────────────────────────────────────
    /// @notice Maps token ID to fan stats
    mapping(uint256 => FanStats) private _stats;
    /// @notice Maps address to their token ID (0 = not minted)
    mapping(address => uint256) public fanTokenId;
    /// @notice Next token ID to mint
    uint256 private _nextId = 1;
    /// @notice Minimum mint cost (0.01 WIRE)
    uint256 public constant MINT_COST = 0.01 ether;
    /// @notice Authorized callers that can update stats
    mapping(address => bool) public authorizedUpdaters;

    // ─── Events ───────────────────────────────────────────────────────
    event FanRegistered(address indexed fan, uint256 indexed tokenId, uint8 teamId);
    event StatsUpdated(uint256 indexed tokenId, uint32 matchesJoined, uint32 correctPicks);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);

    // ─── Constructor ──────────────────────────────────────────────────
    constructor() ERC721("PSL Fan ID", "FANID") Ownable(msg.sender) {}

    // ─── Minting ──────────────────────────────────────────────────────
    /// @notice Mint your Fan ID — pick your PSL team. One per address. Soulbound.
    /// @param teamId Your team (0=ISL, 1=KAR, 2=LHR, 3=MUL, 4=PSH, 5=QUE, 6=HYD, 7=RWP)
    function mint(uint8 teamId) external payable nonReentrant {
        if (fanTokenId[msg.sender] != 0) revert AlreadyRegistered();
        if (teamId > 7) revert InvalidTeam();
        if (msg.value < MINT_COST) revert InsufficientPayment();

        uint256 tokenId = _nextId;
        unchecked { _nextId++; }

        _safeMint(msg.sender, tokenId);
        fanTokenId[msg.sender] = tokenId;

        _stats[tokenId] = FanStats({
            teamId: teamId,
            matchesJoined: 0,
            correctPicks: 0,
            totalStaked: 0,
            totalWon: 0,
            charityVotes: 0,
            mintedAt: uint64(block.timestamp)
        });

        emit FanRegistered(msg.sender, tokenId, teamId);
    }

    // ─── Soulbound Override ───────────────────────────────────────────
    /// @dev Block all transfers — Fan IDs are soulbound
    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTransferBlocked();
    }

    /// @dev Block all transfers — Fan IDs are soulbound
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundTransferBlocked();
    }

    // ─── Stats Updates ────────────────────────────────────────────────
    /// @notice Record that a fan joined a match (staked)
    /// @param fan The fan's address
    /// @param amount The amount staked in wei
    function recordMatchJoined(address fan, uint256 amount) external {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        uint256 tokenId = fanTokenId[fan];
        if (tokenId == 0) return; // No Fan ID — skip silently

        unchecked {
            _stats[tokenId].matchesJoined++;
            _stats[tokenId].totalStaked += uint128(amount);
        }
    }

    /// @notice Record that a fan won (claimed reward)
    /// @param fan The fan's address
    /// @param amount The reward amount in wei
    function recordWin(address fan, uint256 amount) external {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        uint256 tokenId = fanTokenId[fan];
        if (tokenId == 0) return;

        unchecked {
            _stats[tokenId].correctPicks++;
            _stats[tokenId].totalWon += uint128(amount);
        }
    }

    /// @notice Record that a fan cast a charity vote
    /// @param fan The fan's address
    function recordCharityVote(address fan) external {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) revert Unauthorized();
        uint256 tokenId = fanTokenId[fan];
        if (tokenId == 0) return;

        unchecked {
            _stats[tokenId].charityVotes++;
        }
    }

    // ─── Admin ────────────────────────────────────────────────────────
    /// @notice Authorize an address to update fan stats (e.g., MatchVault, SeasonLeaderboard)
    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater);
    }

    /// @notice Revoke an updater's authorization
    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRevoked(updater);
    }

    /// @notice Withdraw accumulated mint fees
    function withdraw() external onlyOwner {
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        require(ok);
    }

    // ─── Views ────────────────────────────────────────────────────────
    /// @notice Check if an address has a Fan ID
    function hasFanID(address fan) external view returns (bool) {
        return fanTokenId[fan] != 0;
    }

    /// @notice Get a fan's stats by address
    function getFanStats(address fan) external view returns (FanStats memory) {
        uint256 tokenId = fanTokenId[fan];
        return _stats[tokenId];
    }

    /// @notice Get a fan's stats by token ID
    function getStatsById(uint256 tokenId) external view returns (FanStats memory) {
        return _stats[tokenId];
    }

    /// @notice Total Fan IDs minted
    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }

    /// @notice Get a fan's Cricket IQ (accuracy percentage × 100 for precision)
    /// @return iq Accuracy as basis points (7320 = 73.20%)
    function getCricketIQ(address fan) external view returns (uint256 iq) {
        uint256 tokenId = fanTokenId[fan];
        if (tokenId == 0) return 0;
        FanStats memory s = _stats[tokenId];
        if (s.matchesJoined == 0) return 0;
        iq = (uint256(s.correctPicks) * 10000) / uint256(s.matchesJoined);
    }
}
