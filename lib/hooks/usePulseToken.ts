'use client';

import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS, PulseTokenABI } from '@/lib/contracts';
import { wirefluid } from '@/lib/chains';
import { formatEther } from 'viem';

const PULSE_ADDRESS = CONTRACTS.pulseToken as `0x${string}`;

/**
 * Get PULSE token balance for connected user.
 */
export function usePulseBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: PULSE_ADDRESS,
    abi: PulseTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: wirefluid.id,
    query: { enabled: !!address, staleTime: 10_000 },
  });

  const balance = data ? parseFloat(formatEther(data as bigint)).toFixed(0) : '0';
  const balanceWei = (data as bigint) ?? BigInt(0);

  return { balance, balanceWei, isLoading, refetch };
}
