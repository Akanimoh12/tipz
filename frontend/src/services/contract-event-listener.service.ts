// Contract Event Listener Service
// Listens to smart contract events and automatically publishes them to Somnia Data Streams

import { createPublicClient, http, type Hex, type Log, type Address } from 'viem';
import { DEFAULT_CHAIN } from '@/config/somnia.config';
import { CONTRACT_ADDRESSES, TIPZ_CORE_ABI, TIPZ_PROFILE_ABI } from './contract.service';
import { somniaStreamsService } from './somnia-streams.service';
import type {
  SomniaTipEvent,
  SomniaProfileCreatedEvent,
  SomniaProfileUpdatedEvent,
} from '@/config/somnia-streams.config';

// ============================================
// CONFIGURATION
// ============================================

const EVENT_LISTENER_CONFIG = {
  // Rate limiting: max events to publish per time window
  MAX_EVENTS_PER_WINDOW: 10,
  RATE_LIMIT_WINDOW_MS: 1000, // 1 second

  // Retry configuration
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,

  // Queue configuration
  MAX_QUEUE_SIZE: 100,

  // Logging
  ENABLE_VERBOSE_LOGGING: import.meta.env.DEV,
} as const;

// ============================================
// TYPES
// ============================================

type EventType = 'tip' | 'profileCreated' | 'profileUpdated';

interface QueuedEvent {
  type: EventType;
  data: unknown;
  retries: number;
  timestamp: number;
}

interface EventMetrics {
  tipsDetected: number;
  tipsPublished: number;
  profilesCreatedDetected: number;
  profilesCreatedPublished: number;
  profilesUpdatedDetected: number;
  profilesUpdatedPublished: number;
  publishErrors: number;
  queueSize: number;
}

type UnwatchFunction = () => void;

// ============================================
// CONTRACT EVENT LISTENER SERVICE
// ============================================

class ContractEventListenerService {
  private readonly publicClient = createPublicClient({
    chain: DEFAULT_CHAIN,
    transport: http(),
  });

  private unwatchFunctions: UnwatchFunction[] = [];
  private eventQueue: QueuedEvent[] = [];
  private publishAttempts: number[] = []; // Timestamps of recent publish attempts
  private isListeningState = false;
  private readonly metrics: EventMetrics = {
    tipsDetected: 0,
    tipsPublished: 0,
    profilesCreatedDetected: 0,
    profilesCreatedPublished: 0,
    profilesUpdatedDetected: 0,
    profilesUpdatedPublished: 0,
    publishErrors: 0,
    queueSize: 0,
  };

  private queueProcessor: ReturnType<typeof setInterval> | null = null;

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Start listening to all contract events
   */
  async start(): Promise<void> {
    if (this.isListeningState) {
      console.log('📡 Contract event listeners already running');
      return;
    }

    console.log('🚀 Starting contract event listeners...');

    try {
      // Start listening to all event types
      await Promise.all([
        this.listenToTipEvents(),
        this.listenToProfileCreatedEvents(),
        this.listenToProfileUpdatedEvents(),
      ]);

      // Start queue processor for failed events
      this.startQueueProcessor();

      this.isListeningState = true;
      console.log('✅ Contract event listeners started successfully');
      console.log(`   Listening to TipzCore: ${CONTRACT_ADDRESSES.tipzCore}`);
      console.log(`   Listening to TipzProfile: ${CONTRACT_ADDRESSES.tipzProfile}`);
    } catch (error) {
      console.error('❌ Failed to start contract event listeners:', error);
      throw error;
    }
  }

  /**
   * Stop all event listeners
   */
  stop(): void {
    if (!this.isListeningState) {
      console.log('📡 Contract event listeners not running');
      return;
    }

    console.log('🛑 Stopping contract event listeners...');

    // Call all unwatch functions
    for (const unwatch of this.unwatchFunctions) {
      try {
        unwatch();
      } catch (error) {
        console.error('Error unwatching event:', error);
      }
    }

    this.unwatchFunctions = [];

    // Stop queue processor
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }

    this.isListeningState = false;
    console.log('✅ Contract event listeners stopped');
  }

  /**
   * Check if listeners are active
   */
  isListening(): boolean {
    return this.isListeningState;
  }

  /**
   * Get current metrics
   */
  getMetrics(): EventMetrics {
    return {
      ...this.metrics,
      queueSize: this.eventQueue.length,
    };
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
    console.log('🗑️ Event queue cleared');
  }

  /**
   * Manually retry queued events
   */
  async retryQueue(): Promise<void> {
    console.log(`🔄 Manually retrying ${this.eventQueue.length} queued events...`);
    await this.processQueue();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Listen to TipSent events from TipzCore contract
   */
  private async listenToTipEvents(): Promise<void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.tipzCore,
      abi: TIPZ_CORE_ABI,
      eventName: 'TipSent',
      onLogs: (logs) => {
        for (const log of logs) {
          this.handleTipEvent(log);
        }
      },
      onError: (error) => {
        console.error('❌ Error watching TipSent events:', error);
      },
    });

    this.unwatchFunctions.push(unwatch);
  }

  /**
   * Listen to ProfileCreated events from TipzProfile contract
   */
  private async listenToProfileCreatedEvents(): Promise<void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.tipzProfile,
      abi: TIPZ_PROFILE_ABI,
      eventName: 'ProfileCreated',
      onLogs: (logs) => {
        for (const log of logs) {
          this.handleProfileCreatedEvent(log);
        }
      },
      onError: (error) => {
        console.error('❌ Error watching ProfileCreated events:', error);
      },
    });

    this.unwatchFunctions.push(unwatch);
  }

  /**
   * Listen to ProfileUpdated events from TipzProfile contract
   */
  private async listenToProfileUpdatedEvents(): Promise<void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.tipzProfile,
      abi: TIPZ_PROFILE_ABI,
      eventName: 'ProfileUpdated',
      onLogs: (logs) => {
        for (const log of logs) {
          this.handleProfileUpdatedEvent(log);
        }
      },
      onError: (error) => {
        console.error('❌ Error watching ProfileUpdated events:', error);
      },
    });

    this.unwatchFunctions.push(unwatch);
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle TipSent event
   */
  private handleTipEvent(log: Log): void {
    try {
      this.metrics.tipsDetected++;

      const { args, transactionHash } = log as Log & {
        args: {
          tipId: bigint;
          from: Address;
          to: Address;
          fromUsername: string;
          toUsername: string;
          amount: bigint;
          platformFee: bigint;
          recipientAmount: bigint;
          message: string;
          timestamp: bigint;
        };
      };

      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.log('💰 TipSent event detected:', {
          tipId: args.tipId.toString(),
          from: args.fromUsername,
          to: args.toUsername,
          amount: args.amount.toString(),
          txHash: transactionHash,
        });
      }

      if (!transactionHash) {
        console.warn('[ContractEventListener] TipSent event missing transaction hash');
        return;
      }

      const eventData = this.transformTipEvent(args, transactionHash);
      void this.publishWithRateLimiting('tip', eventData);
    } catch (error) {
      console.error('❌ Error handling TipSent event:', error);
    }
  }

  /**
   * Handle ProfileCreated event
   */
  private handleProfileCreatedEvent(log: Log): void {
    try {
      this.metrics.profilesCreatedDetected++;

      const { args, transactionHash } = log as Log & {
        args: {
          user: Address;
          username: string;
          creditScore: bigint;
          timestamp: bigint;
        };
      };

      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.log('👤 ProfileCreated event detected:', {
          user: args.user,
          username: args.username,
          creditScore: args.creditScore.toString(),
          txHash: transactionHash,
        });
      }

      if (!transactionHash) {
        console.warn('[ContractEventListener] ProfileCreated event missing transaction hash');
        return;
      }

      const eventData = this.transformProfileCreatedEvent(args, transactionHash);
      void this.publishWithRateLimiting('profileCreated', eventData);
    } catch (error) {
      console.error('❌ Error handling ProfileCreated event:', error);
    }
  }

  /**
   * Handle ProfileUpdated event
   */
  private handleProfileUpdatedEvent(log: Log): void {
    try {
      this.metrics.profilesUpdatedDetected++;

      const { args, transactionHash } = log as Log & {
        args: {
          user: Address;
          username: string;
          profileImageIpfs: string;
          timestamp: bigint;
        };
      };

      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.log('✏️ ProfileUpdated event detected:', {
          user: args.user,
          username: args.username,
          profileImageIpfs: args.profileImageIpfs,
          txHash: transactionHash,
        });
      }

      if (!transactionHash) {
        console.warn('[ContractEventListener] ProfileUpdated event missing transaction hash');
        return;
      }

      const eventData = this.transformProfileUpdatedEvent(args, transactionHash);
      void this.publishWithRateLimiting('profileUpdated', eventData);
    } catch (error) {
      console.error('❌ Error handling ProfileUpdated event:', error);
    }
  }

  // ============================================
  // EVENT TRANSFORMATION
  // ============================================

  /**
   * Transform contract TipSent event to SomniaTipEvent
   */
  private transformTipEvent(
    args: {
      tipId: bigint;
      from: Address;
      to: Address;
      fromUsername: string;
      toUsername: string;
      amount: bigint;
      platformFee: bigint;
      recipientAmount: bigint;
      message: string;
      timestamp: bigint;
    },
    _txHash: Hex
  ): Omit<SomniaTipEvent, 'timestamp' | 'txHash'> {
    return {
      tipId: args.tipId,
      fromAddress: args.from,
      toAddress: args.to,
      fromUsername: args.fromUsername,
      toUsername: args.toUsername,
      amount: args.amount,
      platformFee: args.platformFee,
      recipientAmount: args.recipientAmount,
      message: args.message,
    };
  }

  /**
   * Transform contract ProfileCreated event to SomniaProfileCreatedEvent
   */
  private transformProfileCreatedEvent(
    args: {
      user: Address;
      username: string;
      creditScore: bigint;
      timestamp: bigint;
    },
    _txHash: Hex
  ): Omit<SomniaProfileCreatedEvent, 'timestamp' | 'txHash'> {
    return {
      userAddress: args.user,
      username: args.username,
      creditScore: args.creditScore,
    };
  }

  /**
   * Transform contract ProfileUpdated event to SomniaProfileUpdatedEvent
   */
  private transformProfileUpdatedEvent(
    args: {
      user: Address;
      username: string;
      profileImageIpfs: string;
      timestamp: bigint;
    },
    _txHash: Hex
  ): Omit<SomniaProfileUpdatedEvent, 'timestamp' | 'txHash'> {
    return {
      userAddress: args.user,
      username: args.username,
      profileImageIpfs: args.profileImageIpfs,
    };
  }

  // ============================================
  // PUBLISHING WITH RATE LIMITING
  // ============================================

  /**
   * Publish event with rate limiting
   */
  private async publishWithRateLimiting(
    type: EventType,
    data: unknown
  ): Promise<void> {
    // Check rate limit
    if (this.isRateLimited()) {
      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.log('⏸️ Rate limit reached, queueing event');
      }
      this.queueEvent(type, data);
      return;
    }

    // Record publish attempt
    this.publishAttempts.push(Date.now());

    // Publish event
    await this.publishEvent(type, data);
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    const windowStart = now - EVENT_LISTENER_CONFIG.RATE_LIMIT_WINDOW_MS;

    // Remove old attempts
    this.publishAttempts = this.publishAttempts.filter((time) => time > windowStart);

    return this.publishAttempts.length >= EVENT_LISTENER_CONFIG.MAX_EVENTS_PER_WINDOW;
  }

  /**
   * Publish event to Somnia Streams
   */
  private async publishEvent(
    type: EventType,
    data: unknown,
    retries = 0
  ): Promise<void> {
    try {
      let result: Hex | Error;

      if (type === 'tip') {
        result = await somniaStreamsService.publishTipEvent(
          data as Omit<SomniaTipEvent, 'timestamp' | 'txHash'>
        );
      } else if (type === 'profileCreated') {
        result = await somniaStreamsService.publishProfileCreated(
          data as Omit<SomniaProfileCreatedEvent, 'timestamp' | 'txHash'>
        );
      } else {
        result = await somniaStreamsService.publishProfileUpdated(
          data as Omit<SomniaProfileUpdatedEvent, 'timestamp' | 'txHash'>
        );
      }

      if (result instanceof Error) {
        throw result;
      }

      // Success
      if (type === 'tip') this.metrics.tipsPublished++;
      else if (type === 'profileCreated') this.metrics.profilesCreatedPublished++;
      else this.metrics.profilesUpdatedPublished++;

      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.log(`✅ Published ${type} event to streams:`, result);
      }
    } catch (error) {
      this.metrics.publishErrors++;
      console.error(`❌ Failed to publish ${type} event (attempt ${retries + 1}):`, error);

      // Retry logic
      if (retries < EVENT_LISTENER_CONFIG.MAX_RETRIES) {
        const delay =
          EVENT_LISTENER_CONFIG.INITIAL_RETRY_DELAY_MS *
          Math.pow(EVENT_LISTENER_CONFIG.RETRY_BACKOFF_MULTIPLIER, retries);

        console.log(`🔄 Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.publishEvent(type, data, retries + 1);
      }

      // Max retries reached, queue for later
      console.log('📥 Max retries reached, queueing event');
      this.queueEvent(type, data);
    }
  }

  // ============================================
  // EVENT QUEUE MANAGEMENT
  // ============================================

  /**
   * Add event to queue
   */
  private queueEvent(type: EventType, data: unknown): void {
    if (this.eventQueue.length >= EVENT_LISTENER_CONFIG.MAX_QUEUE_SIZE) {
      console.warn('⚠️ Event queue full, dropping oldest event');
      this.eventQueue.shift(); // Remove oldest
    }

    this.eventQueue.push({
      type,
      data,
      retries: 0,
      timestamp: Date.now(),
    });

    this.metrics.queueSize = this.eventQueue.length;
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    if (this.queueProcessor) {
      return;
    }

    // Process queue every 5 seconds
    this.queueProcessor = setInterval(() => {
      void this.processQueue();
    }, 5000);
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    if (this.isRateLimited()) {
      return; // Wait for rate limit to reset
    }

    const event = this.eventQueue.shift();
    if (!event) {
      return;
    }

    event.retries++;

    if (event.retries > EVENT_LISTENER_CONFIG.MAX_RETRIES) {
      console.warn('⚠️ Event exceeded max retries, dropping:', event.type);
      return;
    }

    if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
      console.log(`🔄 Processing queued ${event.type} event (retry ${event.retries})`);
    }

    try {
      await this.publishEvent(event.type, event.data, event.retries);
    } catch (error) {
      // Re-queue on error
      this.eventQueue.push(event);
      if (EVENT_LISTENER_CONFIG.ENABLE_VERBOSE_LOGGING) {
        console.error(`❌ Failed to process queued event:`, error);
      }
    }

    this.metrics.queueSize = this.eventQueue.length;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const contractEventListenerService = new ContractEventListenerService();
