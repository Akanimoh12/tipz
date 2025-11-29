// Somnia Data Streams Schema Configuration

import { SchemaEncoder } from '@somnia-chain/streams';

export const TIP_EVENT_SCHEMA = `
  uint256 tipId,
  address fromAddress,
  address toAddress,
  string fromUsername,
  string toUsername,
  uint256 amount,
  uint256 platformFee,
  uint256 recipientAmount,
  string message,
  uint256 timestamp,
  bytes32 txHash
`.replaceAll(/\s+/g, ' ').trim();

export const PROFILE_CREATED_SCHEMA = `
  address userAddress,
  string username,
  uint256 creditScore,
  uint256 timestamp,
  bytes32 txHash
`.replaceAll(/\s+/g, ' ').trim();

export const PROFILE_UPDATED_SCHEMA = `
  address userAddress,
  string username,
  string profileImageIpfs,
  uint256 timestamp,
  bytes32 txHash
`.replaceAll(/\s+/g, ' ').trim();

export const LEADERBOARD_UPDATE_SCHEMA = `
  string updateType,
  bytes rankings,
  uint256 timestamp
`.replaceAll(/\s+/g, ' ').trim();

export const STREAM_SCHEMA_NAMES = {
  TIP_EVENT: 'TIP_EVENT',
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LEADERBOARD_UPDATE: 'LEADERBOARD_UPDATE',
} as const;

export type StreamSchemaName = typeof STREAM_SCHEMA_NAMES[keyof typeof STREAM_SCHEMA_NAMES];

export interface SomniaTipEvent {
  tipId: bigint;
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  fromUsername: string;
  toUsername: string;
  amount: bigint;
  platformFee: bigint;
  recipientAmount: bigint;
  message: string;
  timestamp: bigint;
  txHash: `0x${string}`;
}

export interface SomniaProfileCreatedEvent {
  userAddress: `0x${string}`;
  username: string;
  creditScore: bigint;
  timestamp: bigint;
  txHash: `0x${string}`;
}

export interface SomniaProfileUpdatedEvent {
  userAddress: `0x${string}`;
  username: string;
  profileImageIpfs: string;
  timestamp: bigint;
  txHash: `0x${string}`;
}

export interface SomniaLeaderboardUpdate {
  updateType: 'top_creators' | 'top_tippers';
  rankings: Uint8Array;
  timestamp: bigint;
}

export type SomniaStreamEvent = 
  | SomniaTipEvent 
  | SomniaProfileCreatedEvent 
  | SomniaProfileUpdatedEvent 
  | SomniaLeaderboardUpdate;

export const SOMNIA_STREAMS_CONFIG = {
  POLL_INTERVAL_MS: 1000,
  MAX_CACHE_SIZE: 1000,
  BATCH_SIZE: 50,
  AUTO_RETRY: true,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const SCHEMA_REGISTRY = {
  [STREAM_SCHEMA_NAMES.TIP_EVENT]: TIP_EVENT_SCHEMA,
  [STREAM_SCHEMA_NAMES.PROFILE_CREATED]: PROFILE_CREATED_SCHEMA,
  [STREAM_SCHEMA_NAMES.PROFILE_UPDATED]: PROFILE_UPDATED_SCHEMA,
  [STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE]: LEADERBOARD_UPDATE_SCHEMA,
} as const;

export interface StreamSchemaDefinition {
  schema: string;
  encoder: SchemaEncoder;
}

export const STREAM_SCHEMA_DEFINITIONS: Record<StreamSchemaName, StreamSchemaDefinition> = {
  [STREAM_SCHEMA_NAMES.TIP_EVENT]: {
    schema: TIP_EVENT_SCHEMA,
    encoder: new SchemaEncoder(TIP_EVENT_SCHEMA),
  },
  [STREAM_SCHEMA_NAMES.PROFILE_CREATED]: {
    schema: PROFILE_CREATED_SCHEMA,
    encoder: new SchemaEncoder(PROFILE_CREATED_SCHEMA),
  },
  [STREAM_SCHEMA_NAMES.PROFILE_UPDATED]: {
    schema: PROFILE_UPDATED_SCHEMA,
    encoder: new SchemaEncoder(PROFILE_UPDATED_SCHEMA),
  },
  [STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE]: {
    schema: LEADERBOARD_UPDATE_SCHEMA,
    encoder: new SchemaEncoder(LEADERBOARD_UPDATE_SCHEMA),
  },
};
