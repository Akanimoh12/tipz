// Legacy stream types for backward compatibility with existing hooks
// These types are converted from Somnia Data Streams types by the adapter

import type { Hex } from 'viem';

/**
 * Legacy tip event format
 */
export interface TipEvent {
  id: string;
  from: Hex;
  fromUsername: string;
  to: Hex;
  toUsername: string;
  amount: bigint;
  message: string;
  timestamp: number;
  txHash: Hex;
}

/**
 * Legacy profile event format
 */
export interface ProfileEvent {
  username: string;
  action: 'created' | 'updated';
  metadata: {
    userAddress?: Hex;
    creditScore?: bigint;
    profileImageIpfs?: string;
  };
  timestamp: number;
  txHash: Hex;
}

/**
 * Legacy leaderboard update format
 */
export interface LeaderboardRanking {
  address: Hex;
  username: string;
  score: number;
  totalAmount?: bigint;
  count?: number;
  creditScore?: number;
  rank?: number;
}

export interface LeaderboardUpdate {
  type: 'top_creators' | 'top_tippers';
  rankings: LeaderboardRanking[];
  timestamp: number;
}

/**
 * Union type for all stream events
 */
export type StreamEvent = TipEvent | ProfileEvent | LeaderboardUpdate;
