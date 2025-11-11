export const APP_ROUTES = {
  HOME: '/',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/@:username',
  LEADERBOARD: '/leaderboard',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

export const PLATFORM_CONFIG = {
  FEE_RATE: 200,
  FEE_PERCENTAGE: 2,
  MIN_TIP_AMOUNT: 0.001,
  MAX_TIP_AMOUNT: 1000000,
  MIN_WITHDRAWAL_AMOUNT: 0.01,
} as const;

export const IPFS_CONFIG = {
  PINATA_GATEWAY: 'https://gateway.pinata.cloud',
  FALLBACK_GATEWAYS: [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
  ],
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const CREDIT_SCORE_CONFIG = {
  MIN_SCORE: 0,
  MAX_SCORE: 1000,
  WEIGHTS: {
    FOLLOWERS: 0.5,
    POSTS: 0.3,
    REPLIES: 0.2,
  },
  TIERS: {
    BRONZE: { min: 0, max: 249, label: 'Bronze' },
    SILVER: { min: 250, max: 499, label: 'Silver' },
    GOLD: { min: 500, max: 749, label: 'Gold' },
    PLATINUM: { min: 750, max: 1000, label: 'Platinum' },
  },
} as const;

export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^\w+$/,
  },
  MESSAGE: {
    MAX_LENGTH: 280,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;

export const API_ENDPOINTS = {
  SOMNIA_TESTNET_RPC: import.meta.env.VITE_SOMNIA_TESTNET_RPC_URL,
  SOMNIA_MAINNET_RPC: import.meta.env.VITE_SOMNIA_MAINNET_RPC_URL,
  SOMNIA_STREAMS: import.meta.env.VITE_SOMNIA_STREAMS_ENDPOINT,
  PINATA_API: 'https://api.pinata.cloud',
} as const;

export const CONTRACT_ADDRESSES = {
  TIPZ_PROFILE: import.meta.env.VITE_TIPZ_PROFILE_ADDRESS,
  TIPZ_CORE: import.meta.env.VITE_TIPZ_CORE_ADDRESS,
  TIPZ_REWARDS: import.meta.env.VITE_TIPZ_REWARDS_ADDRESS,
} as const;

export const CHAIN_CONFIG = {
  TESTNET_CHAIN_ID: Number(import.meta.env.VITE_SOMNIA_TESTNET_CHAIN_ID) || 31337,
  MAINNET_CHAIN_ID: Number(import.meta.env.VITE_SOMNIA_MAINNET_CHAIN_ID) || 1,
  CURRENCY_SYMBOL: 'STT',
  DECIMALS: 18,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  LEADERBOARD_PAGE_SIZE: 50,
  ACTIVITY_FEED_SIZE: 10,
} as const;

export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/TipzPlatform',
  DISCORD: 'https://discord.gg/tipz',
  GITHUB: 'https://github.com/tipz-platform',
} as const;

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
} as const;
