// Adapter layer to bridge old streams.config types with new Somnia Data Streams types
// This allows existing React hooks and components to work with minimal changes

import { somniaStreamsService, type StreamSubscription } from './somnia-streams.service';
import type {
  SomniaTipEvent,
  SomniaProfileCreatedEvent,
  SomniaProfileUpdatedEvent,
  SomniaLeaderboardUpdate,
} from '@/config/somnia-streams.config';
import type { TipEvent, ProfileEvent, LeaderboardUpdate } from '@/config/streams.config';

/**
 * Converts Somnia SDK TipEvent to legacy TipEvent format
 */
function convertTipEvent(event: SomniaTipEvent): TipEvent {
  return {
    id: event.tipId.toString(),
    from: event.fromAddress,
    fromUsername: event.fromUsername,
    to: event.toAddress,
    toUsername: event.toUsername,
    amount: event.amount,
    message: event.message,
    timestamp: Number(event.timestamp),
    txHash: event.txHash,
  };
}

/**
 * Converts Somnia SDK ProfileCreatedEvent to legacy ProfileEvent format
 */
function convertProfileCreatedEvent(event: SomniaProfileCreatedEvent): ProfileEvent {
  return {
    username: event.username,
    action: 'created',
    metadata: {
      userAddress: event.userAddress,
      creditScore: event.creditScore,
    },
    timestamp: Number(event.timestamp),
    txHash: event.txHash,
  };
}

/**
 * Converts Somnia SDK ProfileUpdatedEvent to legacy ProfileEvent format
 */
function convertProfileUpdatedEvent(event: SomniaProfileUpdatedEvent): ProfileEvent {
  return {
    username: event.username,
    action: 'updated',
    metadata: {
      userAddress: event.userAddress,
      profileImageIpfs: event.profileImageIpfs,
    },
    timestamp: Number(event.timestamp),
    txHash: event.txHash,
  };
}

/**
 * Converts Somnia SDK LeaderboardUpdate to legacy format
 */
function convertLeaderboardUpdate(event: SomniaLeaderboardUpdate): LeaderboardUpdate {
  // Decode rankings from bytes to array format
  // Note: This is a simplified conversion - actual implementation depends on encoding format
  const rankings: LeaderboardUpdate['rankings'] = [];
  
  // TODO: Implement proper decoding of rankings bytes data when contract integration is complete
  // For now, return empty rankings array as placeholder
  
  return {
    type: event.updateType === 'top_creators' ? 'top_creators' : 'top_tippers',
    rankings,
    timestamp: Number(event.timestamp),
  };
}

/**
 * Adapter service that wraps somniaStreamsService with legacy interface
 */
class StreamsAdapter {
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Somnia Streams SDK
   * Safe to call multiple times - will only initialize once
   */
  async initialize(): Promise<void> {
    this.initPromise ??= somniaStreamsService.initialize();
    return this.initPromise;
  }

  /**
   * Ensure SDK is initialized before any operation
   */
  private async ensureInitialized(): Promise<void> {
    if (!somniaStreamsService.isConnected()) {
      await this.initialize();
    }
  }

  /**
   * Subscribe to tip events with automatic type conversion
   */
  async subscribeToTips(
    callback: (event: TipEvent) => void,
    filter?: { username?: string }
  ): Promise<StreamSubscription> {
    await this.ensureInitialized();

    // Convert callback to handle new type and transform to old type
    const adaptedCallback = (event: SomniaTipEvent) => {
      const legacyEvent = convertTipEvent(event);
      callback(legacyEvent);
    };

    return somniaStreamsService.subscribeToTips(
      adaptedCallback,
      filter
    );
  }

  /**
   * Subscribe to profile events with automatic type conversion
   */
  async subscribeToProfile(
    username: string,
    callback: (event: ProfileEvent) => void
  ): Promise<StreamSubscription> {
    await this.ensureInitialized();

    const adaptedCallback = (event: SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent) => {
      const legacyEvent = 'creditScore' in event
        ? convertProfileCreatedEvent(event)
        : convertProfileUpdatedEvent(event);
      callback(legacyEvent);
    };

    return somniaStreamsService.subscribeToProfile(username, adaptedCallback);
  }

  /**
   * Subscribe to leaderboard updates with automatic type conversion
   */
  async subscribeToLeaderboard(
    callback: (event: LeaderboardUpdate) => void
  ): Promise<StreamSubscription> {
    await this.ensureInitialized();

    const adaptedCallback = (event: SomniaLeaderboardUpdate) => {
      const legacyEvent = convertLeaderboardUpdate(event);
      callback(legacyEvent);
    };

    return somniaStreamsService.subscribeToLeaderboard(adaptedCallback);
  }

  /**
   * Unsubscribe from all streams
   */
  unsubscribeAll(): void {
    somniaStreamsService.unsubscribeAll();
  }

  /**
   * Disconnect from Somnia Streams
   */
  disconnect(): void {
    somniaStreamsService.unsubscribeAll();
  }

  /**
   * Get connection state
   */
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    const state = somniaStreamsService.getConnectionState();
    
    // Map Somnia connection states to legacy format
    switch (state) {
      case 'connecting':
        return 'connecting';
      case 'connected':
        return 'connected';
      case 'error':
        return 'disconnected';
      case 'disconnected':
      default:
        return 'disconnected';
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return somniaStreamsService.getConnectionState() === 'connected';
  }
}

// Export singleton instance matching old pattern
export const streamsService = new StreamsAdapter();

// Re-export types for compatibility
export type { TipEvent, ProfileEvent, LeaderboardUpdate } from '@/config/streams.config';
export type { StreamSubscription } from './somnia-streams.service';
