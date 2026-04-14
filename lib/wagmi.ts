import { createConfig, http } from 'wagmi';
import { wirefluid } from './chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [wirefluid],
  connectors: [metaMask()],
  transports: {
    [wirefluid.id]: http('https://evm.wirefluid.com'),
  },
});
