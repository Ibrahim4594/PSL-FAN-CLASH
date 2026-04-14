# PSL Fan Clash — Complete Architecture & Build Plan

## Concept
Rivalry staking for charity. Before each PSL 11 match, fans of both teams lock WIRE tokens into a match vault. Winners earn rewards (82%), a charity chosen by the winning fan base receives 15%, and 3% funds platform gas subsidies. Cricket rivalry directly powers social impact.

---

## Smart Contracts (4 contracts)

### 1. `MatchFactory.sol`
**Purpose:** Deploys new MatchVault instances per match. Single source of truth for all matches.

```
Functions:
├── createMatch(teamA, teamB, stakingDeadline, matchId) → onlyOwner
├── getMatch(matchId) → returns vault address
├── getActiveMatches() → returns all open vaults
├── getAllMatches() → returns full season history
└── setCharityDAO(address) → onlyOwner, one-time setup

Storage:
├── mapping(uint256 => address) matchVaults
├── uint256[] activeMatchIds
├── address charityDAO
└── address platformTreasury
```

**Events:** `MatchCreated(matchId, teamA, teamB, vaultAddress, stakingDeadline)`

---

### 2. `MatchVault.sol` (deployed per match)
**Purpose:** Holds staked WIRE for a single match, distributes after resolution.

```
State Machine:
  OPEN → LOCKED → RESOLVED

Functions:
├── stakeForTeam(teamId) → payable, requires OPEN state
├── lockMatch() → onlyFactory, transitions to LOCKED
├── resolveMatch(winningTeamId) → onlyFactory, transitions to RESOLVED
├── claimReward() → requires RESOLVED, winning side only
├── emergencyRefund() → onlyOwner, safety valve if match cancelled
├── getMatchInfo() → view, returns teams/pools/state/deadline
└── getUserStake(address) → view, returns stake amount + team

Storage:
├── mapping(address => Stake) stakes          // user → {amount, teamId, claimed}
├── mapping(uint8 => uint256) teamPools       // teamId → total staked
├── uint256 totalPool
├── uint8 winningTeam
├── MatchState state                          // OPEN, LOCKED, RESOLVED
├── uint256 stakingDeadline
├── Team[2] teams                             // {id, name}
├── uint256 constant WINNER_SHARE = 8200      // 82% (basis points)
├── uint256 constant CHARITY_SHARE = 1500     // 15%
└── uint256 constant PLATFORM_SHARE = 300     // 3%

Distribution (on resolution):
├── 82% → winners pool (claimable pro-rata by stake size)
├── 15% → CharityDAO contract (held until vote)
└── 3% → platform treasury
```

**Events:**
- `Staked(user, teamId, amount, newTeamTotal)`
- `MatchLocked(matchId, teamAPool, teamBPool)`
- `MatchResolved(matchId, winningTeam, winnersPool, charityPool)`
- `RewardClaimed(user, amount)`

**Security:**
- ReentrancyGuard on all fund transfers
- stakingDeadline enforced via block.timestamp
- Can't stake for both teams from same wallet
- Minimum stake: 0.01 WIRE
- Emergency refund only if match cancelled (no result reported within 48hrs)

---

### 3. `CharityDAO.sol`
**Purpose:** Winners of each match vote on which registered charity receives the 15% pool.

```
Functions:
├── proposeCharity(name, wallet, description) → onlyOwner, pre-register charities
├── startVote(matchId) → onlyFactory, auto-called on resolution
├── castVote(matchId, charityId) → only winning stakers, weighted by stake
├── executeVote(matchId) → anyone, after 48hr window, sends funds to winner
├── getCharities() → view, returns all registered charities
├── getVoteResults(matchId) → view, returns vote tallies
└── getVotingPower(matchId, user) → view, returns user's weight

Storage:
├── Charity[] charities                        // {name, wallet, description, active}
├── mapping(uint256 => Vote) matchVotes        // matchId → voting state
├── mapping(uint256 => mapping(address => bool)) hasVoted
└── uint256 constant VOTE_DURATION = 48 hours

Vote struct:
├── uint256 startTime
├── uint256 charityPool (WIRE held)
├── mapping(uint256 => uint256) charityVotes   // charityId → weighted votes
├── bool executed
└── uint256 winningCharity
```

**Events:**
- `VoteCast(matchId, voter, charityId, weight)`
- `VoteExecuted(matchId, charityId, charityName, amount)`

---

### 4. `SeasonLeaderboard.sol`
**Purpose:** Tracks fan engagement and charitable impact across the full PSL 11 season.

```
Functions:
├── recordStake(user, teamId, amount) → onlyVault, called on every stake
├── recordWin(user, amount) → onlyVault, called on claim
├── recordCharityContribution(teamId, amount) → onlyDAO
├── getTopFans(count) → view, returns most active stakers
├── getTopCharitableFanBases() → view, returns team charity rankings
├── getFanProfile(address) → view, returns full history
└── getSeasonStats() → view, returns aggregate numbers

Storage:
├── mapping(address => FanProfile) fans
│   ├── totalStaked
│   ├── totalWon
│   ├── matchesParticipated
│   ├── teamId (primary allegiance)
│   └── charityVotesCast
├── mapping(uint8 => TeamStats) teamStats
│   ├── totalStakedByFans
│   ├── totalCharityGenerated
│   ├── uniqueFans
│   └── wins
└── uint256 seasonTotalCharity
```

**Events:**
- `FanStakeRecorded(user, teamId, amount, seasonTotal)`
- `CharityMilestone(teamId, totalCharity)` (emitted at 100, 500, 1000 WIRE milestones)

---

## Frontend Pages (Next.js 14 App Router)

### Page 1: Landing / Hero (`/`)
- 3D animated cricket ball (R3F, wireframe, B&W) floating with subtle rotation
- 21st Hero component: bold tagline — "Your Rivalry. Their Future."
- Live season stats: total staked, total donated, active fans
- Upcoming match countdown
- Connect wallet CTA

### Page 2: Live Matches (`/matches`)
- Grid of match cards (upcoming, live, completed)
- Each card: Team A vs Team B, pool sizes, time until deadline
- Filter by: upcoming / live / completed
- Click → individual match page

### Page 3: Match Detail (`/matches/[id]`)
- Team A vs Team B with live pool visualization (bar showing ratio)
- Staking form: amount input + team selector + stake button
- State-aware UI: shows staking form when OPEN, "match in progress" when LOCKED, claim button when RESOLVED
- Charity vote section: appears for winners after resolution
- Transaction history for this match

### Page 4: Leaderboard (`/leaderboard`)
- Two tabs: "Most Passionate Fans" and "Most Charitable Fan Bases"
- Fan table: rank, address (truncated), total staked, matches, wins
- Team table: team name, total charity generated, unique fans, win rate
- Season-wide aggregate stats at top

### Page 5: Charity Dashboard (`/charity`)
- List of registered charities with descriptions
- Total WIRE donated per charity across all matches
- Recent charity payouts with tx hash links to WireScan
- Impact story section (static content showing real-world results)

### Page 6: Profile (`/profile`)
- User's staking history across all matches
- Win/loss record
- Total earned, total contributed to charity
- Primary team allegiance badge
- Active stakes and pending claims

---

## 8 PSL Teams (hardcoded in contracts + frontend)

| ID | Team | Short |
|----|------|-------|
| 0 | Islamabad United | ISL |
| 1 | Karachi Kings | KAR |
| 2 | Lahore Qalandars | LHR |
| 3 | Multan Sultans | MUL |
| 4 | Peshawar Zalmi | PSH |
| 5 | Quetta Gladiators | QUE |
| 6 | Hyderabad Kingsmen | HYD |
| 7 | Rawalpindi Pindiz | RWP |

---

## Development Roadmap

### Phase 1: Smart Contracts (Day 1-2)
1. Write `MatchVault.sol` with full staking + distribution logic
2. Write `MatchFactory.sol` to deploy vaults
3. Write `CharityDAO.sol` with weighted voting
4. Write `SeasonLeaderboard.sol`
5. Full Hardhat test suite with gas reports
6. Deploy all to WireFluid Testnet
7. Log all tx hashes to `tx-hashes.md`

### Phase 2: Frontend Core (Day 2-3)
1. Next.js 14 project setup with wagmi + WireFluid config
2. Design tokens + global styles (B&W system)
3. Wallet connect component with chain auto-switch
4. Landing page with 3D hero (R3F wireframe cricket ball)
5. Match listing page with live contract reads

### Phase 3: Match Interaction (Day 3-4)
1. Match detail page with staking form
2. Live pool visualization (animated bar)
3. Claim rewards flow
4. Charity voting UI

### Phase 4: Leaderboard + Polish (Day 4-5)
1. Leaderboard page with contract reads
2. Profile page
3. Charity dashboard
4. Animations, transitions, responsive polish
5. 21st Hero component integration on landing

### Phase 5: Submission (Day 5)
1. Final QA pass
2. Create presentation (how we use WireFluid)
3. Record demo video (optional: Nano Banana for cinematic intro)
4. Compile all tx hashes
5. Submit to submissions@wirefluid.com

---

## Key Technical Decisions

**Why native WIRE (not ERC-20)?**
- Simpler UX: fans just send WIRE, no approve+transfer flow
- Lower gas: native transfers cost less than token transfers
- WireFluid is testnet, WIRE is free from faucet — lower barrier to entry

**Why admin-resolved (not oracle)?**
- No reliable cricket oracle exists on WireFluid
- Admin resolution is simpler, more reliable for hackathon demo
- Future version could integrate Chainlink or API3 oracle

**Why 82/15/3 split?**
- 82% keeps winners motivated (meaningful reward)
- 15% is impactful for charity (not token gesture)
- 3% keeps platform sustainable (gas subsidies for users)

**Why weighted charity voting?**
- Bigger stakers = more conviction = more voting power
- Prevents Sybil attacks (can't split wallet to multiply votes)
- Only winners vote — they earned the right to direct the charity

---

## Gas Optimization Targets

| Function | Target Gas |
|----------|-----------|
| stakeForTeam() | < 80,000 |
| claimReward() | < 60,000 |
| castVote() | < 50,000 |
| resolveMatch() | < 120,000 |
| createMatch() | < 2,000,000 (deploys vault) |

---

## Demo Script (for submission video)

1. Show landing page with 3D hero → connect wallet
2. Navigate to a live match (Lahore vs Karachi)
3. Stake 5 WIRE for Lahore Qalandars → show tx confirming in 5 seconds
4. Show the pool bars updating in real-time
5. Admin resolves match → Lahore wins
6. Claim reward → show WIRE hitting wallet
7. Vote for Edhi Foundation as charity recipient
8. Show leaderboard updating
9. Show charity dashboard with total season impact
10. End with tagline: "Your Rivalry. Their Future. Built on WireFluid."
