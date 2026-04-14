'use client';

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { MATCHVAULT_ABI } from '@/src/abi/MatchVault.abi';
import { wirefluid } from '@/lib/chains';
import { PSL_TEAMS } from '@/lib/teams';
import { formatEther, parseEther } from 'viem';
import { useState, useCallback } from 'react';

/**
 * Decodes a bytes32-encoded string.
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

const MATCH_STATES = ['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'] as const;
type MatchState = (typeof MATCH_STATES)[number];

export interface MatchInfo {
  teamAName: string;
  teamBName: string;
  teamAShort: string;
  teamBShort: string;
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
  winner?: string;
}

/**
 * Reads full match info from a MatchVault contract.
 */
export function useMatchInfo(vaultAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: MATCHVAULT_ABI,
    functionName: 'getMatchInfo',
    chainId: wirefluid.id,
    query: { enabled: !!vaultAddress, staleTime: 10_000 },
  });

  let matchInfo: MatchInfo | null = null;
  if (data) {
    const d = data as {
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
    const teamA = PSL_TEAMS.find((t) => t.id === d.teamAId);
    const teamB = PSL_TEAMS.find((t) => t.id === d.teamBId);
    const stateStr = MATCH_STATES[d.state] ?? 'OPEN';

    matchInfo = {
      teamAName: teamA?.name ?? decodeBytes32(d.teamAName),
      teamBName: teamB?.name ?? decodeBytes32(d.teamBName),
      teamAShort: teamA?.short ?? decodeBytes32(d.teamAName).substring(0, 3).toUpperCase(),
      teamBShort: teamB?.short ?? decodeBytes32(d.teamBName).substring(0, 3).toUpperCase(),
      teamAId: d.teamAId,
      teamBId: d.teamBId,
      teamAPool: formatEther(d.teamAPool),
      teamBPool: formatEther(d.teamBPool),
      teamAPoolWei: d.teamAPool,
      teamBPoolWei: d.teamBPool,
      totalPool: formatEther(d.totalPool),
      totalPoolWei: d.totalPool,
      state: stateStr,
      stakingDeadline: Number(d.stakingDeadline) * 1000,
      winningTeam: d.winningTeam,
      winner:
        stateStr === 'RESOLVED'
          ? d.winningTeam === d.teamAId
            ? (teamA?.short ?? 'A')
            : (teamB?.short ?? 'B')
          : undefined,
    };
  }

  return { matchInfo, isLoading, error, refetch };
}

/**
 * Reads a user's stake in a specific match vault.
 */
export function useUserStake(vaultAddress?: `0x${string}`, userAddress?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: MATCHVAULT_ABI,
    functionName: 'getUserStake',
    args: userAddress ? [userAddress] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!vaultAddress && !!userAddress, staleTime: 10_000 },
  });

  let stake: { amount: string; amountWei: bigint; teamId: number; claimed: boolean } | null = null;
  if (data) {
    const [amount, teamId, claimed] = data as [bigint, number, boolean];
    stake = {
      amount: formatEther(amount),
      amountWei: amount,
      teamId,
      claimed,
    };
  }

  return { stake, isLoading, error, refetch };
}

export type TxStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'error';

/**
 * Write hook for staking WIRE on a team.
 * Returns a stake function, tx status, hash, and error.
 */
export function useStakeForTeam(vaultAddress?: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: wirefluid.id,
  });

  // Update status when receipt arrives
  if (receipt && status === 'pending') {
    setStatus('success');
  }

  const stake = useCallback(
    async (teamId: number, amountInEther: string) => {
      if (!vaultAddress) throw new Error('No vault address');
      setStatus('confirming');
      setError(null);
      setTxHash(undefined);

      try {
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: MATCHVAULT_ABI,
          functionName: 'stakeForTeam',
          args: [teamId],
          value: parseEther(amountInEther),
          chainId: wirefluid.id,
        });
        setTxHash(hash);
        setStatus('pending');
        return hash;
      } catch (err: unknown) {
        const e = err as { code?: number; message?: string };
        if (e.code === 4001 || e.message?.includes('User rejected') || e.message?.includes('user rejected')) {
          setError('Transaction cancelled');
        } else if (e.message?.includes('insufficient funds')) {
          setError('Not enough WIRE. Get tokens from the faucet.');
        } else if (e.message?.includes('BelowMinimumStake')) {
          setError('Minimum stake is 0.01 WIRE');
        } else if (e.message?.includes('StakingDeadlinePassed')) {
          setError('Staking deadline has passed');
        } else if (e.message?.includes('CannotStakeBothTeams')) {
          setError('You already staked for the other team');
        } else if (e.message?.includes('MatchNotOpen')) {
          setError('Match is not open for staking');
        } else {
          setError('Transaction failed. Please try again.');
        }
        setStatus('error');
        return null;
      }
    },
    [vaultAddress, writeContractAsync]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  return { stake, status, txHash, receipt, error, reset };
}

/**
 * Write hook for claiming rewards from a resolved match.
 */
export function useClaimReward(vaultAddress?: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: wirefluid.id,
  });

  if (receipt && status === 'pending') {
    setStatus('success');
  }

  const claim = useCallback(async () => {
    if (!vaultAddress) throw new Error('No vault address');
    setStatus('confirming');
    setError(null);
    setTxHash(undefined);

    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: MATCHVAULT_ABI,
        functionName: 'claimReward',
        chainId: wirefluid.id,
      });
      setTxHash(hash);
      setStatus('pending');
      return hash;
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 4001 || e.message?.includes('User rejected') || e.message?.includes('user rejected')) {
        setError('Transaction cancelled');
      } else if (e.message?.includes('NotWinner')) {
        setError('Only winners can claim rewards');
      } else if (e.message?.includes('AlreadyClaimed')) {
        setError('Reward already claimed');
      } else if (e.message?.includes('MatchNotResolved')) {
        setError('Match has not been resolved yet');
      } else if (e.message?.includes('ZeroStake')) {
        setError('You did not stake in this match');
      } else {
        setError('Claim failed. Please try again.');
      }
      setStatus('error');
      return null;
    }
  }, [vaultAddress, writeContractAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  return { claim, status, txHash, receipt, error, reset };
}
