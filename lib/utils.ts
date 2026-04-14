import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatWIRE(amount: bigint, decimals = 18): string {
  const value = Number(amount) / 10 ** decimals;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function explorerTxUrl(hash: string): string {
  return `https://wirefluidscan.com/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://wirefluidscan.com/address/${address}`;
}
