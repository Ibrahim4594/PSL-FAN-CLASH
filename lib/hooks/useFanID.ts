'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACTS, FanIDABI } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { PSL_TEAMS } from '@/lib/teams';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback } from 'react';
import type { TxStatus } from './useMatchVault';

const FANID_ADDRESS = CONTRACTS.fanID as `0x${string}`;

/**
 * Check if connected user has a Fan ID.
 */
export function useHasFanID() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    address: FANID_ADDRESS,
    abi: FanIDABI,
    functionName: 'hasFanID',
    args: address ? [address] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!address, staleTime: 10_000 },
  });

  return { hasFanID: !!data, isLoading, refetch };
}

/**
 * Get fan stats for connected user or any address.
 */
export function useFanStats(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const target = userAddress ?? address;

  const { data, isLoading, refetch } = useReadContract({
    address: FANID_ADDRESS,
    abi: FanIDABI,
    functionName: 'getFanStats',
    args: target ? [target] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!target, staleTime: 10_000 },
  });

  let stats: {
    teamId: number;
    teamName: string;
    teamShort: string;
    matchesJoined: number;
    correctPicks: number;
    totalStaked: string;
    totalWon: string;
    charityVotes: number;
    mintedAt: number;
  } | null = null;

  if (data) {
    const d = data as {
      teamId: number;
      matchesJoined: number;
      correctPicks: number;
      totalStaked: bigint;
      totalWon: bigint;
      charityVotes: number;
      mintedAt: bigint;
    };
    const team = PSL_TEAMS.find(t => t.id === d.teamId);
    stats = {
      teamId: d.teamId,
      teamName: team?.name ?? 'Unknown',
      teamShort: team?.short ?? '???',
      matchesJoined: d.matchesJoined,
      correctPicks: d.correctPicks,
      totalStaked: formatEther(d.totalStaked),
      totalWon: formatEther(d.totalWon),
      charityVotes: d.charityVotes,
      mintedAt: Number(d.mintedAt) * 1000,
    };
  }

  return { stats, isLoading, refetch };
}

/**
 * Get Cricket IQ for an address.
 */
export function useCricketIQ(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const target = userAddress ?? address;

  const { data } = useReadContract({
    address: FANID_ADDRESS,
    abi: FanIDABI,
    functionName: 'getCricketIQ',
    args: target ? [target] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!target, staleTime: 15_000 },
  });

  // Returns basis points (7320 = 73.20%)
  const iq = data ? Number(data) / 100 : 0;
  return { cricketIQ: iq };
}

/**
 * Get total Fan IDs minted.
 */
export function useTotalFanIDs() {
  const { data } = useReadContract({
    address: FANID_ADDRESS,
    abi: FanIDABI,
    functionName: 'totalMinted',
    chainId: wirefluid.id,
    query: { staleTime: 30_000 },
  });

  return { totalMinted: data ? Number(data) : 0 };
}

/**
 * Mint a Fan ID — pick your PSL team.
 */
export function useMintFanID() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: wirefluid.id,
  });

  if (receipt && status === 'pending') {
    setStatus('success');
  }

  const mint = useCallback(async (teamId: number) => {
    setStatus('confirming');
    setError(null);
    setTxHash(undefined);
    setStartTime(Date.now());

    try {
      const hash = await writeContractAsync({
        address: FANID_ADDRESS,
        abi: FanIDABI,
        functionName: 'mint',
        args: [teamId],
        value: parseEther('0.01'),
        chainId: wirefluid.id,
      });
      setTxHash(hash);
      setStatus('pending');
      return hash;
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 4001 || e.message?.includes('User rejected')) {
        setError('Transaction cancelled — no WIRE was spent');
      } else if (e.message?.includes('AlreadyRegistered')) {
        setError('You already have a Fan ID! Check your profile.');
      } else if (e.message?.includes('InsufficientPayment')) {
        setError('Send at least 0.01 WIRE to get your Fan ID');
      } else if (e.message?.includes('InvalidTeam')) {
        setError('Please pick a valid PSL team');
      } else if (e.message?.includes('insufficient funds')) {
        setError('Not enough WIRE — get free tokens at faucet.wirefluid.com');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStatus('error');
      return null;
    }
  }, [writeContractAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
    setStartTime(0);
  }, []);

  return { mint, status, txHash, receipt, error, startTime, reset };
}
