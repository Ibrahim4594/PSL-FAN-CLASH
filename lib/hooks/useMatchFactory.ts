'use client';

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MATCHFACTORY_ABI } from '@/src/abi/MatchFactory.abi';
import { MATCHVAULT_ABI } from '@/src/abi/MatchVault.abi';
import { CONTRACTS } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { PSL_TEAMS } from '@/lib/teams';
import { formatEther } from 'viem';

const FACTORY_ADDRESS = CONTRACTS.matchFactory as `0x${string}`;

/**
 * Decodes a bytes32-encoded team name into a readable string.
 * Removes null bytes from the end.
 */
function decodeBytes32(hex: string): string {
  if (!hex || hex === '0x0000000000000000000000000000000000000000000000000000000000000000') return '';
  try {
    const bytes = hex.replace(/^0x/, '');
    let result = '';
    for (let i = 0; i < bytes.length; i += 2) {
      const code = parseInt(bytes.substring(i, i + 2), 16);
      if (code === 0) break;
      result += String.fromCharCode(code);
    }
    return result;
  } catch {
    return hex;
  }
}

/**
 * Looks up a team's full name from PSL_TEAMS by its on-chain ID.
 */
function getTeamByOnChainId(id: number) {
  return PSL_TEAMS.find((t) => t.id === id);
}

export interface MatchData {
  id: number;
  vaultAddress: `0x${string}`;
  teamA: { name: string; short: string; id: number };
  teamB: { name: string; short: string; id: number };
  poolA: string;
  poolB: string;
  poolAWei: bigint;
  poolBWei: bigint;
  totalPool: string;
  totalPoolWei: bigint;
  status: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
  deadlineTs: number;
  winner?: string;
  winningTeamId?: number;
}

const MATCH_STATES = ['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'] as const;

/**
 * Reads the total number of matches from MatchFactory.
 */
export function useMatchCount() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: MATCHFACTORY_ABI,
    functionName: 'getMatchCount',
    chainId: wirefluid.id,
  });
}

/**
 * Reads all match IDs from MatchFactory.
 */
export function useAllMatchIds() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: MATCHFACTORY_ABI,
    functionName: 'getAllMatchIds',
    chainId: wirefluid.id,
  });
}

/**
 * Reads all matches with their vault info via multicall.
 * First gets all match IDs, then batch-reads each vault's getMatchInfo().
 */
export function useAllMatches() {
  const { data: matchIds, isLoading: idsLoading, error: idsError } = useAllMatchIds();

  // Step 1: Get vault addresses for each match ID
  const vaultContracts = (matchIds ?? []).map((id) => ({
    address: FACTORY_ADDRESS,
    abi: MATCHFACTORY_ABI,
    functionName: 'getMatch' as const,
    args: [id] as const,
    chainId: wirefluid.id,
  }));

  const { data: vaultAddresses, isLoading: vaultsLoading } = useReadContracts({
    contracts: vaultContracts,
    query: { enabled: !!matchIds && matchIds.length > 0, staleTime: 30_000 },
  });

  // Step 2: Get match info from each vault
  const validVaults = (vaultAddresses ?? [])
    .map((v, i) => ({
      address: v.result as `0x${string}`,
      matchId: matchIds?.[i],
      valid: v.status === 'success' && v.result !== '0x0000000000000000000000000000000000000000',
    }))
    .filter((v) => v.valid);

  const infoContracts = validVaults.map((v) => ({
    address: v.address,
    abi: MATCHVAULT_ABI,
    functionName: 'getMatchInfo' as const,
    chainId: wirefluid.id,
  }));

  const { data: matchInfos, isLoading: infosLoading, error: infosError, refetch } = useReadContracts({
    contracts: infoContracts,
    query: { enabled: validVaults.length > 0, staleTime: 15_000 },
  });

  const matches: MatchData[] = (matchInfos ?? []).map((info, i) => {
    if (info.status !== 'success' || !info.result) {
      return null;
    }
    const data = info.result as {
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

    const teamA = getTeamByOnChainId(data.teamAId);
    const teamB = getTeamByOnChainId(data.teamBId);
    const teamAName = teamA?.name ?? decodeBytes32(data.teamAName);
    const teamBName = teamB?.name ?? decodeBytes32(data.teamBName);
    const teamAShort = teamA?.short ?? decodeBytes32(data.teamAName).substring(0, 3).toUpperCase();
    const teamBShort = teamB?.short ?? decodeBytes32(data.teamBName).substring(0, 3).toUpperCase();
    const stateStr = MATCH_STATES[data.state] ?? 'OPEN';
    const winnerTeam = stateStr === 'RESOLVED' ? (data.winningTeam === data.teamAId ? teamAShort : teamBShort) : undefined;

    return {
      id: Number(validVaults[i].matchId),
      vaultAddress: validVaults[i].address,
      teamA: { name: teamAName, short: teamAShort, id: data.teamAId },
      teamB: { name: teamBName, short: teamBShort, id: data.teamBId },
      poolA: formatEther(data.teamAPool),
      poolB: formatEther(data.teamBPool),
      poolAWei: data.teamAPool,
      poolBWei: data.teamBPool,
      totalPool: formatEther(data.totalPool),
      totalPoolWei: data.totalPool,
      status: stateStr,
      deadlineTs: Number(data.stakingDeadline) * 1000,
      winner: winnerTeam,
      winningTeamId: stateStr === 'RESOLVED' ? data.winningTeam : undefined,
    } satisfies MatchData;
  }).filter(Boolean) as MatchData[];

  return {
    matches,
    isLoading: idsLoading || vaultsLoading || infosLoading,
    error: idsError || infosError,
    refetch,
  };
}
