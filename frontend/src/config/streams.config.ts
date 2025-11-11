import { type Address } from 'viem';

export const STREAMS_ENDPOINT = import.meta.env.VITE_SOMNIA_STREAMS_ENDPOINT || 'wss://somnia-streams.example.com';

export const STREAM_SCHEMA_IDS = {
  TIP_EVENT: 'tipz.tip.v1',
  PROFILE_EVENT: 'tipz.profile.v1',
  LEADERBOARD_UPDATE: 'tipz.leaderboard.v1',
} as const;

export interface TipEvent {
  id: string;
  from: Address;
  fromUsername: string;
  to: Address;
  toUsername: string;
  amount: bigint;
  message: string;
  timestamp: number;
  txHash: string;
}

export interface ProfileEvent {
  username: string;
  action: 'created' | 'updated' | 'deactivated' | 'reactivated';
  metadata: {
    userAddress: Address;
    xFollowers?: bigint;
    xPosts?: bigint;
    xReplies?: bigint;
    creditScore?: bigint;
    profileImageIpfs?: string;
    isActive?: boolean;
  };
  timestamp: number;
  txHash: string;
}

export interface LeaderboardUpdate {
  type: 'top_creators' | 'top_tippers';
  rankings: Array<{
    rank: number;
    username: string;
    userAddress: Address;
    value: bigint;
    creditScore?: bigint;
  }>;
  timestamp: number;
}

export type StreamEvent = TipEvent | ProfileEvent | LeaderboardUpdate;

export interface StreamSubscription {
  id: string;
  schemaId: string;
  callback: (event: StreamEvent) => void;
  unsubscribe: () => void;
}

export const RECONNECTION_CONFIG = {
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
  MAX_RETRIES: 10,
  JITTER_MS: 500,
} as const;

export const HEARTBEAT_CONFIG = {
  INTERVAL_MS: 30000,
  TIMEOUT_MS: 5000,
} as const;

export const DEDUPLICATION_CONFIG = {
  WINDOW_MS: 5000,
  MAX_CACHE_SIZE: 1000,
} as const;
