import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PSL Fan Clash | Your Rivalry. Their Future. | Entangled 2026',
  description:
    'PSL Fan Clash — rivalry staking-for-charity dApp for Pakistan Super League on WireFluid. 6 smart contracts, NASA weather intelligence, AI match analysis, soulbound Fan IDs, PULSE loyalty tokens. 82% to winners, 15% to charity, 3% platform. Built for Entangled 2026 Hackathon. PSL 3x scoring multiplier eligible.',
  keywords: ['PSL', 'Pakistan Super League', 'cricket', 'Web3', 'WireFluid', 'staking', 'charity', 'blockchain', 'Entangled 2026', 'hackathon', 'soulbound', 'NFT', 'ERC-721', 'ERC-20', 'NASA', 'AI prediction'],
  other: {
    'hackathon': 'Entangled 2026 by WireFluid',
    'chain': 'WireFluid Testnet (Chain ID 92533)',
    'contracts': '6 deployed and verified',
    'psl-multiplier': '3x scoring eligible',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#f7f8f8]">
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f7f8f8',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
