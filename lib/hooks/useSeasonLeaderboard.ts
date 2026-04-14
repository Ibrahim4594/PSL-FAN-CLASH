'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { SEASONLEADERBOARD_ABI } from '@/src/abi/SeasonLeaderboard.abi';
import { CONTRACTS } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { formatEther } from 'viem';

const LEADERBOARD_ADDRESS = CONTRACTS.seasonLeaderboard as `0x${string}`;

export interface SeasonStats {
  totalStaked: string;
  totalStakedWei: bigint;
  totalCharity: string;
  totalCharityWei: bigint;
  totalFans: number;
}

/**
 * Reads aggregate season stats from SeasonLeaderboard.
 */
export function useSeasonStats() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getSeasonStats',
    chainId: wirefluid.id,
    query: { staleTime: 30_000 },
  });

  let stats: SeasonStats | null = null;
  if (data) {
    const [totalStaked, totalCharity, totalFans] = data as [bigint, bigint, bigint];
    stats = {
      totalStaked: formatEther(totalStaked),
      totalStakedWei: totalStaked,
      totalCharity: formatEther(totalCharity),
      totalCharityWei: totalCharity,
      totalFans: Number(totalFans),
    };
  }

  return { stats, isLoading, error, refetch };
}

export interface TopFanData {
  address: `0x${string}`;
  totalStaked: string;
  totalStakedWei: bigint;
}

/**
 * Reads top fans from SeasonLeaderboard.
 */
export function useTopFans(count: number = 10) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getTopFans',
    args: [BigInt(count)],
    chainId: wirefluid.id,
    query: { staleTime: 30_000 },
  });

  let fans: TopFanData[] = [];
  if (data) {
    const [addresses, stakes] = data as [readonly `0x${string}`[], readonly bigint[]];
    fans = addresses.map((addr, i) => ({
      address: addr,
      totalStaked: formatEther(stakes[i]),
      totalStakedWei: stakes[i],
    })).filter((f) => f.totalStakedWei > BigInt(0));
  }

  return { fans, isLoading, error, refetch };
}

export interface FanProfile {
  totalStaked: string;
  totalStakedWei: bigint;
  totalWon: string;
  totalWonWei: bigint;
  matchesParticipated: number;
  primaryTeam: number;
  charityVotesCast: number;
  exists: boolean;
}

/**
 * Reads a fan's profile from SeasonLeaderboard.
 */
export function useFanProfile(address?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getFanProfile',
    args: address ? [address] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!address, staleTime: 15_000 },
  });

  let profile: FanProfile | null = null;
  if (data) {
    const d = data as {
      totalStaked: bigint;
      totalWon: bigint;
      matchesParticipated: bigint;
      primaryTeam: number;
      charityVotesCast: bigint;
      exists: boolean;
    };
    profile = {
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

  return { profile, isLoading, error, refetch };
}

export interface TeamStatsData {
  teamId: number;
  totalStakedByFans: string;
  totalCharityGenerated: string;
  uniqueFans: number;
  wins: number;
}

/**
 * Reads team stats for all 8 PSL teams via multicall.
 */
export function useAllTeamStats() {
  const teamIds = [0, 1, 2, 3, 4, 5, 6, 7];

  const contracts = teamIds.map((id) => ({
    address: LEADERBOARD_ADDRESS,
    abi: SEASONLEADERBOARD_ABI,
    functionName: 'getTeamStats' as const,
    args: [id] as const,
    chainId: wirefluid.id,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: { staleTime: 30_000 },
  });

  const teamStats: TeamStatsData[] = (data ?? []).map((result, i) => {
    if (result.status !== 'success' || !result.result) {
      return {
        teamId: teamIds[i],
        totalStakedByFans: '0',
        totalCharityGenerated: '0',
        uniqueFans: 0,
        wins: 0,
      };
    }
    const d = result.result as {
      totalStakedByFans: bigint;
      totalCharityGenerated: bigint;
      uniqueFans: bigint;
      wins: bigint;
    };
    return {
      teamId: teamIds[i],
      totalStakedByFans: formatEther(d.totalStakedByFans),
      totalCharityGenerated: formatEther(d.totalCharityGenerated),
      uniqueFans: Number(d.uniqueFans),
      wins: Number(d.wins),
    };
  });

  return { teamStats, isLoading, error, refetch };
}
