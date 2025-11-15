export const APP_CONFIG = {
  name: 'Tipz',
  description: 'Decentralized tipping platform on Somnia Network',
  url: import.meta.env.VITE_APP_URL || 'https://tipz.somnia.network',
} as const;

export const PLATFORM_FEE = {
  RATE: 200,
  PERCENTAGE: 2,
  BASIS_POINTS: 10000,
} as const;

export const TIP_LIMITS = {
  MIN_AMOUNT: 0.001,
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT_WEI: BigInt('1000000000000000'),
  MAX_AMOUNT_WEI: BigInt('1000000000000000000000000'),
} as const;

export const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 0.01,
  MIN_AMOUNT_WEI: BigInt('10000000000000000'),
} as const;

export const CREDIT_SCORE_TIERS = {
  BRONZE: {
    min: 0,
    max: 249,
    label: 'Bronze',
    color: '#CD7F32',
  },
  SILVER: {
    min: 250,
    max: 499,
    label: 'Silver',
    color: '#C0C0C0',
  },
  GOLD: {
    min: 500,
    max: 749,
    label: 'Gold',
    color: '#FFD700',
  },
  PLATINUM: {
    min: 750,
    max: 1000,
    label: 'Platinum',
    color: '#E5E4E2',
  },
} as const;

export const CREDIT_SCORE_WEIGHTS = {
  FOLLOWERS: 0.5,
  POSTS: 0.3,
  REPLIES: 0.2,
  NORMALIZER: 10000,
  MAX_SCORE: 1000,
} as const;

export const IPFS_GATEWAYS = {
  PRIMARY: import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud',
  FALLBACKS: [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
    'https://gateway.ipfs.io',
  ],
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
} as const;

export const VALIDATION_CONSTRAINTS = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^\w+$/,
  },
  MESSAGE: {
    MAX_LENGTH: 280,
  },
  BIO: {
    MAX_LENGTH: 160,
  },
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  LEADERBOARD_SIZE: 50,
  ACTIVITY_FEED_SIZE: 10,
  PROFILE_TIPS_SIZE: 20,
} as const;

export const CACHE_CONFIG = {
  PROFILE_STALE_TIME: 5 * 60 * 1000,
  TIPS_STALE_TIME: 30 * 1000,
  LEADERBOARD_STALE_TIME: 2 * 60 * 1000,
  BALANCE_STALE_TIME: 10 * 1000,
} as const;

export const STREAMS_CONFIG = {
  ENABLED: import.meta.env.VITE_ENABLE_STREAMS === 'true',
  POLL_INTERVAL: Number(import.meta.env.VITE_STREAMS_POLL_INTERVAL) || 1000,
  EVENT_PUBLISHING_ENABLED: import.meta.env.VITE_ENABLE_EVENT_PUBLISHING === 'true',
} as const;

export const SOCIAL_SHARE = {
  TWITTER_INTENT_URL: 'https://twitter.com/intent/tweet',
  HASHTAGS: ['Tipz', 'Somnia', 'Web3'],
} as const;

export const TOAST_CONFIG = {
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 4000,
    WARNING: 4000,
  },
  POSITION: 'top-right' as const,
} as const;

export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    DEFAULT: 'ease-in-out',
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const LINKS = {
  DOCUMENTATION: 'https://docs.tipz.somnia.network',
  GITHUB: 'https://github.com/tipz-platform',
  TWITTER: 'https://twitter.com/TipzPlatform',
  DISCORD: 'https://discord.gg/tipz',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SUPPORT: 'mailto:support@tipz.somnia.network',
} as const;

function validateRequiredEnvVars() {
  const required = [
    'VITE_SOMNIA_TESTNET_RPC_URL',
    'VITE_SOMNIA_TESTNET_CHAIN_ID',
    'VITE_WALLETCONNECT_PROJECT_ID',
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    const missingVars = missing.map((key) => `  - ${key}`).join('\n');
    throw new Error(
      `Missing required environment variables:\n${missingVars}\n\nPlease check your .env file.`
    );
  }
}

if (import.meta.env.MODE !== 'test') {
  validateRequiredEnvVars();
}
