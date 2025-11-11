import { defineChain } from 'viem';

export const somniaTestnet = defineChain({
  id: Number(import.meta.env.VITE_SOMNIA_TESTNET_CHAIN_ID) || 50312,
  name: 'Somnia Testnet (Shannon)',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_TESTNET_RPC_URL || 'https://rpc.testnet.somnia.network'],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_TESTNET_RPC_URL || 'https://rpc.testnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Testnet Explorer',
      url: import.meta.env.VITE_SOMNIA_TESTNET_EXPLORER_URL || 'https://testnet.somnia.network',
    },
  },
  testnet: true,
});

export const somniaMainnet = defineChain({
  id: Number(import.meta.env.VITE_SOMNIA_MAINNET_CHAIN_ID) || 5031,
  name: 'Somnia Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SOMI',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_MAINNET_RPC_URL || 'https://rpc.somnia.network'],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_MAINNET_RPC_URL || 'https://rpc.somnia.network'],
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

export const CURRENCY_SYMBOL = 'SOMI';
export const CURRENCY_DECIMALS = 18;
export const CURRENCY_NAME = 'SOMI';
