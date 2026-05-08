import { http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createConfig } from '@privy-io/react-auth';

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});
