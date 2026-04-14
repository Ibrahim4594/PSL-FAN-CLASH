import { defineChain } from 'viem';

export const wirefluid = defineChain({
  id: 92533,
  name: 'WireFluid Testnet',
  nativeCurrency: { name: 'WIRE', symbol: 'WIRE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.wirefluid.com'] },
  },
  blockExplorers: {
    default: { name: 'WireScan', url: 'https://wirefluidscan.com' },
  },
  testnet: true,
});
