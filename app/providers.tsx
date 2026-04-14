'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { BalanceProvider } from '@/lib/balance-context';
import { LocaleProvider } from '@/lib/locale-context';
import { PageTransition } from '@/components/layout/page-transition';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 2,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BalanceProvider>
          <LocaleProvider>
            <PageTransition>
              {children}
            </PageTransition>
          </LocaleProvider>
        </BalanceProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
