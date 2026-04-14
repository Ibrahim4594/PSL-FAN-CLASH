'use client';

import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useBalance, useAccount } from 'wagmi';
import { formatEther } from 'viem';

interface BalanceContextValue {
  /** Formatted balance string, always 2 decimal places (e.g. "45.52") */
  balance: string;
  /** Raw balance in wei, undefined if not connected */
  rawBalance: bigint | undefined;
  /** Call after any transaction to refresh the balance across the entire app */
  refetchBalance: () => void;
  /** Whether the balance query is currently loading */
  isLoading: boolean;
  /** Increments on every balance change -- used to trigger UI pulse animations */
  changeCounter: number;
}

const BalanceContext = createContext<BalanceContextValue>({
  balance: '0.00',
  rawBalance: undefined,
  refetchBalance: () => {},
  isLoading: false,
  changeCounter: 0,
});

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { data, refetch, isLoading } = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds for background updates
    },
  });

  const balance = data ? parseFloat(formatEther(data.value)).toFixed(2) : '0.00';

  // Track balance changes to drive pulse animation
  const changeCounterRef = useRef(0);
  const prevBalanceRef = useRef(balance);
  if (prevBalanceRef.current !== balance) {
    prevBalanceRef.current = balance;
    changeCounterRef.current += 1;
  }

  const refetchBalance = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <BalanceContext.Provider
      value={{
        balance,
        rawBalance: data?.value,
        refetchBalance,
        isLoading,
        changeCounter: changeCounterRef.current,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

/**
 * Shared WIRE balance hook. Uses a single useBalance call for the entire app.
 * After any transaction receipt, call refetchBalance() to update everywhere.
 */
export const useWireBalance = () => useContext(BalanceContext);
