import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { somniaTestnet, somniaMainnet, SUPPORTED_CHAINS } from './somnia.config';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file.');
}

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet],
    },
    {
      groupName: 'Other',
      wallets: [rainbowWallet, trustWallet],
    },
  ],
  {
    appName: 'Tipz',
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors,
  transports: {
    [somniaTestnet.id]: http(),
    [somniaMainnet.id]: http(),
  },
  ssr: false,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
