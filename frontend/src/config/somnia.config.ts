import { defineChain } from 'viem';

export const somniaTestnet = defineChain({
  id: Number(import.meta.env.VITE_SOMNIA_TESTNET_CHAIN_ID) || 31337,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_TESTNET_RPC_URL || 'http://localhost:8545'],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_TESTNET_RPC_URL || 'http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: import.meta.env.VITE_SOMNIA_TESTNET_EXPLORER_URL || 'https://testnet-explorer.somnia.network',
    },
  },
  testnet: true,
});

export const somniaMainnet = defineChain({
  id: Number(import.meta.env.VITE_SOMNIA_MAINNET_CHAIN_ID) || 1,
  name: 'Somnia Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_MAINNET_RPC_URL || ''],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_MAINNET_RPC_URL || ''],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: import.meta.env.VITE_SOMNIA_MAINNET_EXPLORER_URL || 'https://explorer.somnia.network',
    },
  },
  testnet: false,
});

export const SOMNIA_NETWORKS = {
  TESTNET: somniaTestnet,
  MAINNET: somniaMainnet,
} as const;

export const DEFAULT_CHAIN = import.meta.env.VITE_DEFAULT_NETWORK === 'mainnet' 
  ? somniaMainnet 
  : somniaTestnet;

export const SUPPORTED_CHAINS = [somniaTestnet, somniaMainnet] as const;

export const CURRENCY_SYMBOL = 'STT';
export const CURRENCY_DECIMALS = 18;
export const CURRENCY_NAME = 'Somnia Token';
