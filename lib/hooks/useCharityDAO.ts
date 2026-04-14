'use client';

import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { CHARITYDAO_ABI } from '@/src/abi/CharityDAO.abi';
import { CONTRACTS } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { formatEther } from 'viem';
import { useState, useCallback } from 'react';
import type { TxStatus } from './useMatchVault';

const DAO_ADDRESS = CONTRACTS.charityDAO as `0x${string}`;

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

export interface CharityData {
  id: number;
  name: string;
  wallet: `0x${string}`;
  description: string;
  active: boolean;
}

/**
 * Reads all registered charities from CharityDAO.
 */
export function useCharities() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: CHARITYDAO_ABI,
    functionName: 'getCharities',
    chainId: wirefluid.id,
    query: { staleTime: 60_000 },
  });

  let charities: CharityData[] = [];
  if (data) {
    const arr = data as ReadonlyArray<{
      name: string;
      wallet: `0x${string}`;
      description: string;
      active: boolean;
    }>;
    charities = arr.map((c, i) => ({
      id: i,
      name: decodeBytes32(c.name),
      wallet: c.wallet,
      description: decodeBytes32(c.description),
      active: c.active,
    }));
  }

  return { charities, isLoading, error, refetch };
}

export interface VoteResultData {
  startTime: number;
  charityPool: string;
  charityPoolWei: bigint;
  executed: boolean;
  winningCharityId: number;
  vaultAddress: `0x${string}`;
}

/**
 * Reads vote results for a specific match from CharityDAO.
 */
export function useVoteResults(matchId?: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: CHARITYDAO_ABI,
    functionName: 'getVoteResults',
    args: matchId !== undefined ? [BigInt(matchId)] : undefined,
    chainId: wirefluid.id,
    query: { enabled: matchId !== undefined, staleTime: 15_000 },
  });

  let voteResult: VoteResultData | null = null;
  if (data) {
    const d = data as {
      startTime: bigint;
      charityPool: bigint;
      executed: boolean;
      winningCharityId: bigint;
      vaultAddress: `0x${string}`;
    };
    voteResult = {
      startTime: Number(d.startTime),
      charityPool: formatEther(d.charityPool),
      charityPoolWei: d.charityPool,
      executed: d.executed,
      winningCharityId: Number(d.winningCharityId),
      vaultAddress: d.vaultAddress,
    };
  }

  return { voteResult, isLoading, error, refetch };
}

/**
 * Reads a user's voting power for a specific match.
 */
export function useVotingPower(matchId?: number, voterAddress?: `0x${string}`) {
  return useReadContract({
    address: DAO_ADDRESS,
    abi: CHARITYDAO_ABI,
    functionName: 'getVotingPower',
    args: matchId !== undefined && voterAddress ? [BigInt(matchId), voterAddress] : undefined,
    chainId: wirefluid.id,
    query: { enabled: matchId !== undefined && !!voterAddress, staleTime: 15_000 },
  });
}

/**
 * Reads whether a user has voted for a specific match.
 */
export function useHasVoted(matchId?: number, voterAddress?: `0x${string}`) {
  return useReadContract({
    address: DAO_ADDRESS,
    abi: CHARITYDAO_ABI,
    functionName: 'hasUserVoted',
    args: matchId !== undefined && voterAddress ? [BigInt(matchId), voterAddress] : undefined,
    chainId: wirefluid.id,
    query: { enabled: matchId !== undefined && !!voterAddress, staleTime: 15_000 },
  });
}

/**
 * Write hook for casting a charity vote.
 */
export function useCastVote() {
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

  const castVote = useCallback(
    async (matchId: number, charityId: number) => {
      setStatus('confirming');
      setError(null);
      setTxHash(undefined);

      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: CHARITYDAO_ABI,
          functionName: 'castVote',
          args: [BigInt(matchId), BigInt(charityId)],
          chainId: wirefluid.id,
        });
        setTxHash(hash);
        setStatus('pending');
        return hash;
      } catch (err: unknown) {
        const e = err as { code?: number; message?: string };
        if (e.code === 4001 || e.message?.includes('User rejected') || e.message?.includes('user rejected')) {
          setError('Transaction cancelled');
        } else if (e.message?.includes('AlreadyVoted')) {
          setError('You have already voted for this match');
        } else if (e.message?.includes('NotWinningStaker')) {
          setError('Only winning stakers can vote');
        } else if (e.message?.includes('VoteNotStarted')) {
          setError('Voting has not started yet');
        } else {
          setError('Vote failed. Please try again.');
        }
        setStatus('error');
        return null;
      }
    },
    [writeContractAsync]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  return { castVote, status, txHash, receipt, error, reset };
}
