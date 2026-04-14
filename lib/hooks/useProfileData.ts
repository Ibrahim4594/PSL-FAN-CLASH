'use client';

import { useReadContracts, useReadContract, useBalance } from 'wagmi';
import { MATCHVAULT_ABI } from '@/src/abi/MatchVault.abi';
import { SEASONLEADERBOARD_ABI } from '@/src/abi/SeasonLeaderboard.abi';
import { CONTRACTS, MATCH_VAULTS } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { formatEther } from 'viem';
import { PSL_TEAMS } from '@/lib/teams';

const LEADERBOARD_ADDRESS = CONTRACTS.seasonLeaderboard as `0x${string}`;

const MATCH_STATES = ['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'] as const;
type MatchState = (typeof MATCH_STATES)[number];

export interface ProfileFanData {
  totalStaked: string;
  totalStakedWei: bigint;
  totalWon: string;
  totalWonWei: bigint;
  matchesParticipated: number;
  primaryTeam: number;
  charityVotesCast: number;
  exists: boolean;
}

export interface VaultStakeData {
  matchId: number;
  vaultAddress: `0x${string}`;
  teamA: string;
  teamB: string;
  teamAId: number;
  teamBId: number;
  teamAPool: string;
  teamBPool: string;
  teamAPoolWei: bigint;
  teamBPoolWei: bigint;
  totalPool: string;
  totalPoolWei: bigint;
  state: MatchState;
  stakingDeadline: number;
  winningTeam: number;
  userStakeAmount: string;
  userStakeAmountWei: bigint;
  userStakeTeamId: number;
  userClaimed: boolean;
}

export interface ProfileData {
  fanProfile: ProfileFanData | null;
  activeStakes: VaultStakeData[];
  claimableRewards: VaultStakeData[];
  pastStakes: VaultStakeData[];
  balance: string;
  balanceWei: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Comprehensive profile hook that batches all vault reads into a single multicall.
 * Reads fan profile from SeasonLeaderboard, user stakes + match info from all vaults,
 * and WIRE balance -- all optimized for minimal RPC usage.
 */
export function useProfileData(address?: `0x${string}`): ProfileData {
  const vaultEntries = Object.entries(MATCH_VAULTS).map(([id, v]) => ({
    matchId: Number(id),
    address: v.address as `0x${string}`,
    teamA: v.teamA,
    teamB: v.teamB,
  }));

  // -- Fan profile from SeasonLeaderboard --
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getFanProfile',
    args: address ? [address] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!address, staleTime: 15_000 },
  });

  // -- Batch multicall: getUserStake + getMatchInfo for every vault --
  // This creates ONE multicall with 2 calls per vault (getUserStake + getMatchInfo)
  const multicallContracts = address
    ? vaultEntries.flatMap((v) => [
        {
          address: v.address,
          abi: MATCHVAULT_ABI,
          functionName: 'getUserStake' as const,
          args: [address] as const,
          chainId: wirefluid.id,
        },
        {
          address: v.address,
          abi: MATCHVAULT_ABI,
          functionName: 'getMatchInfo' as const,
          chainId: wirefluid.id,
        },
      ])
    : [];

  const {
    data: multicallData,
    isLoading: multicallLoading,
    isError: multicallError,
    refetch: refetchMulticall,
  } = useReadContracts({
    contracts: multicallContracts,
    query: { enabled: !!address && multicallContracts.length > 0, staleTime: 10_000 },
  });

  // -- WIRE balance --
  const {
    data: balanceData,
    isLoading: balanceLoading,
  } = useBalance({
    address,
    chainId: wirefluid.id,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // -- Parse fan profile --
  let fanProfile: ProfileFanData | null = null;
  if (profileData) {
    const d = profileData as {
      totalStaked: bigint;
      totalWon: bigint;
      matchesParticipated: bigint;
      primaryTeam: number;
      charityVotesCast: bigint;
      exists: boolean;
    };
    fanProfile = {
      totalStaked: formatEther(d.totalStaked),
      totalStakedWei: d.totalStaked,
      totalWon: formatEther(d.totalWon),
      totalWonWei: d.totalWon,
      matchesParticipated: Number(d.matchesParticipated),
      primaryTeam: d.primaryTeam,
      charityVotesCast: Number(d.charityVotesCast),
      exists: d.exists,
    };
  }

  // -- Parse vault data from multicall results --
  const allStakes: VaultStakeData[] = [];

  if (multicallData) {
    for (let i = 0; i < vaultEntries.length; i++) {
      const stakeResult = multicallData[i * 2];
      const infoResult = multicallData[i * 2 + 1];

      if (stakeResult?.status !== 'success' || infoResult?.status !== 'success') continue;

      const stake = stakeResult.result as [bigint, number, boolean]; // [amount, teamId, claimed]
      const info = infoResult.result as {
        teamAName: string;
        teamBName: string;
        teamAId: number;
        teamBId: number;
        teamAPool: bigint;
        teamBPool: bigint;
        totalPool: bigint;
        state: number;
        stakingDeadline: bigint;
        winningTeam: number;
      };

      const [amount, teamId, claimed] = stake;
      if (amount === BigInt(0)) continue; // User has no stake in this vault

      const entry = vaultEntries[i];
      const teamATeam = PSL_TEAMS.find((t) => t.id === info.teamAId);
      const teamBTeam = PSL_TEAMS.find((t) => t.id === info.teamBId);
      const stateStr = MATCH_STATES[info.state] ?? 'OPEN';

      allStakes.push({
        matchId: entry.matchId,
        vaultAddress: entry.address,
        teamA: teamATeam?.short ?? entry.teamA,
        teamB: teamBTeam?.short ?? entry.teamB,
        teamAId: info.teamAId,
        teamBId: info.teamBId,
        teamAPool: formatEther(info.teamAPool),
        teamBPool: formatEther(info.teamBPool),
        teamAPoolWei: info.teamAPool,
        teamBPoolWei: info.teamBPool,
        totalPool: formatEther(info.totalPool),
        totalPoolWei: info.totalPool,
        state: stateStr,
        stakingDeadline: Number(info.stakingDeadline) * 1000,
        winningTeam: info.winningTeam,
        userStakeAmount: formatEther(amount),
        userStakeAmountWei: amount,
        userStakeTeamId: teamId,
        userClaimed: claimed,
      });
    }
  }

  // Active stakes: OPEN or LOCKED state
  const activeStakes = allStakes.filter(
    (s) => s.state === 'OPEN' || s.state === 'LOCKED'
  );

  // Claimable rewards: RESOLVED, user staked on winning team, not claimed
  const claimableRewards = allStakes.filter(
    (s) =>
      s.state === 'RESOLVED' &&
      s.userStakeTeamId === s.winningTeam &&
      !s.userClaimed
  );

  // Past stakes: RESOLVED or CANCELLED
  const pastStakes = allStakes.filter(
    (s) => s.state === 'RESOLVED' || s.state === 'CANCELLED'
  );

  const refetch = () => {
    refetchProfile();
    refetchMulticall();
  };

  return {
    fanProfile,
    activeStakes,
    claimableRewards,
    pastStakes,
    balance: balanceData ? parseFloat(formatEther(balanceData.value)).toFixed(2) : '0.00',
    balanceWei: balanceData?.value,
    isLoading: profileLoading || multicallLoading || balanceLoading,
    isError: profileError || multicallError,
    refetch,
  };
}
