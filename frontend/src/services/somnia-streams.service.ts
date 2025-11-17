// Somnia Data Streams Service - SDK wrapper for on-chain data streaming
//
// IMPLEMENTATION NOTE:
// The polling data read methods (readTipEvents, readProfileEvents, readLeaderboardEvents) 
// currently return empty arrays as placeholders. The Somnia Data Streams SDK requires knowing
// the publisher address to read data via getAllPublisherDataForSchema() or getByKey().
// 
// Two approaches for completion:
// 1. HYBRID APPROACH (Recommended): Listen to contract events using viem's watchContractEvent
//    to detect when data is published, then read from streams using the publisher address
//    captured from the event.
// 2. WEBSOCKET SUBSCRIPTIONS: Use SDK's subscribe() method with contract events as triggers,
//    bundling ETH calls to fetch associated stream data.
//
// The subscription infrastructure (polling intervals, callbacks, deduplication) is fully
// implemented and tested. Only the blockchain data reading logic needs completion based on
// chosen approach. This will be addressed in Prompt 5 or when contract integration happens.

import { SDK, SchemaEncoder } from '@somnia-chain/streams';
import { createPublicClient, createWalletClient, http, custom, type PublicClient, type WalletClient, type Hex, type Address } from 'viem';
import { DEFAULT_CHAIN } from '@/config/somnia.config';
import {
  TIP_EVENT_SCHEMA,
  PROFILE_CREATED_SCHEMA,
  PROFILE_UPDATED_SCHEMA,
  LEADERBOARD_UPDATE_SCHEMA,
  STREAM_SCHEMA_NAMES,
  SOMNIA_STREAMS_CONFIG,
  type SomniaStreamEvent,
  type SomniaTipEvent,
  type SomniaProfileCreatedEvent,
  type SomniaProfileUpdatedEvent,
  type SomniaLeaderboardUpdate,
} from '@/config/somnia-streams.config';

type SubscriptionCallback<T extends SomniaStreamEvent> = (event: T) => void;

interface StreamSubscription {
  id: string;
  unsubscribe: () => void;
}

interface InternalSubscription<T extends SomniaStreamEvent> {
  id: string;
  schemaName: string;
  callback: SubscriptionCallback<T>;
  filter?: Record<string, unknown>;
  lastProcessedTimestamp: bigint;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

class SomniaStreamsService {
  private sdk: SDK | null = null;
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private readonly encoders: Map<string, SchemaEncoder> = new Map();
  private readonly schemaIds: Map<string, Hex> = new Map();
  private readonly subscriptions: Map<string, InternalSubscription<any>> = new Map();
  private readonly pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private readonly eventCache: Set<string> = new Set();
  private readonly publisherRegistry: Set<Address> = new Set();
  private readonly PUBLISHER_STORAGE_KEY = 'somnia_stream_publishers';

  async initialize(): Promise<void> {
    if (this.sdk) {
      console.log('Somnia Streams SDK already initialized');
      return;
    }

    try {
      this.connectionState = 'connecting';
      console.log('Initializing Somnia Streams SDK...');

      this.publicClient = createPublicClient({
        chain: DEFAULT_CHAIN,
        transport: http(),
      });

      if (globalThis.window?.ethereum) {
        this.walletClient = createWalletClient({
          chain: DEFAULT_CHAIN,
          transport: custom(globalThis.window.ethereum),
        });
      }

      this.sdk = new SDK({
        public: this.publicClient,
        wallet: this.walletClient || undefined,
      });

      this.initializeEncoders();
      await this.computeSchemaIds();
      this.loadPublishersFromStorage();

      this.connectionState = 'connected';
      console.log('✅ Somnia Streams SDK initialized successfully');
      console.log('📋 Schema IDs:', Object.fromEntries(this.schemaIds));

    } catch (error) {
      this.connectionState = 'error';
      console.error('❌ Failed to initialize Somnia Streams SDK:', error);
      throw new Error(`SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private initializeEncoders(): void {
    this.encoders.set(STREAM_SCHEMA_NAMES.TIP_EVENT, new SchemaEncoder(TIP_EVENT_SCHEMA));
    this.encoders.set(STREAM_SCHEMA_NAMES.PROFILE_CREATED, new SchemaEncoder(PROFILE_CREATED_SCHEMA));
    this.encoders.set(STREAM_SCHEMA_NAMES.PROFILE_UPDATED, new SchemaEncoder(PROFILE_UPDATED_SCHEMA));
    this.encoders.set(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE, new SchemaEncoder(LEADERBOARD_UPDATE_SCHEMA));
    
    console.log('📝 Initialized schema encoders for', this.encoders.size, 'schemas');
  }

  private async computeSchemaIds(): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    const schemas = [
      { name: STREAM_SCHEMA_NAMES.TIP_EVENT, schema: TIP_EVENT_SCHEMA },
      { name: STREAM_SCHEMA_NAMES.PROFILE_CREATED, schema: PROFILE_CREATED_SCHEMA },
      { name: STREAM_SCHEMA_NAMES.PROFILE_UPDATED, schema: PROFILE_UPDATED_SCHEMA },
      { name: STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE, schema: LEADERBOARD_UPDATE_SCHEMA },
    ];

    for (const { name, schema } of schemas) {
      const schemaId = await this.sdk.streams.computeSchemaId(schema);
      if (schemaId instanceof Error) {
        console.error(`  ✗ Failed to compute schema ID for ${name}:`, schemaId);
        throw schemaId;
      }
      this.schemaIds.set(name, schemaId);
      console.log(`  ✓ ${name}: ${schemaId}`);
    }
  }

  private getSchemaId(schemaName: string): Hex {
    const schemaId = this.schemaIds.get(schemaName);
    if (!schemaId) {
      throw new Error(`Schema ID not found for: ${schemaName}`);
    }
    return schemaId;
  }

  private getEncoder(schemaName: string): SchemaEncoder {
    const encoder = this.encoders.get(schemaName);
    if (!encoder) {
      throw new Error(`Encoder not found for: ${schemaName}`);
    }
    return encoder;
  }

  private loadPublishersFromStorage(): void {
    try {
      if (!globalThis.window?.localStorage) {
        return;
      }
      
      const stored = globalThis.localStorage.getItem(this.PUBLISHER_STORAGE_KEY);
      if (stored) {
        const publishers = JSON.parse(stored) as string[];
        for (const addr of publishers) {
          this.publisherRegistry.add(addr as Address);
        }
        console.log(`📖 Loaded ${publishers.length} known publishers from storage`);
      }
    } catch (error) {
      console.error('Error loading publishers from storage:', error);
    }
  }

  private savePublishersToStorage(): void {
    try {
      if (!globalThis.window?.localStorage) {
        return;
      }
      
      const publishers = Array.from(this.publisherRegistry);
      globalThis.localStorage.setItem(this.PUBLISHER_STORAGE_KEY, JSON.stringify(publishers));
    } catch (error) {
      console.error('Error saving publishers to storage:', error);
    }
  }

  private addPublisher(address: Address): void {
    const sizeBefore = this.publisherRegistry.size;
    this.publisherRegistry.add(address);
    if (this.publisherRegistry.size > sizeBefore) {
      console.log(`➕ Added new publisher: ${address}`);
      this.savePublishersToStorage();
    }
  }

  private generateEventId(event: SomniaStreamEvent): string {
    if ('txHash' in event) {
      return event.txHash;
    }
    return `${event.timestamp}-${JSON.stringify(event)}`;
  }

  private isDuplicate(event: SomniaStreamEvent): boolean {
    const eventId = this.generateEventId(event);
    if (this.eventCache.has(eventId)) {
      return true;
    }
    
    this.eventCache.add(eventId);
    
    if (this.eventCache.size > SOMNIA_STREAMS_CONFIG.MAX_CACHE_SIZE) {
      const toDelete = Math.floor(this.eventCache.size * 0.3);
      const values = Array.from(this.eventCache);
      for (let i = 0; i < toDelete; i++) {
        this.eventCache.delete(values[i]);
      }
    }
    
    return false;
  }

  private ensureInitialized(): void {
    if (!this.sdk || this.connectionState !== 'connected') {
      throw new Error('Somnia Streams SDK not initialized. Call initialize() first.');
    }
  }

  // Retry with exponential backoff - reserved for future use
  // private async retryWithBackoff<T>(
  //   operation: () => Promise<T>,
  //   operationName: string
  // ): Promise<T | null> {
  //   let lastError: Error | null = null;
  //   
  //   for (let attempt = 0; attempt < SOMNIA_STREAMS_CONFIG.MAX_RETRIES; attempt++) {
  //     try {
  //       return await operation();
  //     } catch (error) {
  //       lastError = error instanceof Error ? error : new Error(String(error));
  //       
  //       if (attempt < SOMNIA_STREAMS_CONFIG.MAX_RETRIES - 1) {
  //         const delay = SOMNIA_STREAMS_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
  //         console.warn(`⚠️  ${operationName} failed (attempt ${attempt + 1}/${SOMNIA_STREAMS_CONFIG.MAX_RETRIES}), retrying in ${delay}ms...`);
  //         await new Promise(resolve => setTimeout(resolve, delay));
  //       }
  //     }
  //   }
  //   
  //   console.error(`❌ ${operationName} failed after ${SOMNIA_STREAMS_CONFIG.MAX_RETRIES} attempts:`, lastError);
  //   return null;
  // }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  private subscribe<T extends SomniaStreamEvent>(
    schemaName: string,
    callback: SubscriptionCallback<T>,
    filter?: Record<string, unknown>
  ): string {
    const subscriptionId = `${schemaName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const subscription: InternalSubscription<T> = {
      id: subscriptionId,
      schemaName,
      callback,
      filter,
      lastProcessedTimestamp: 0n,
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    if (!this.pollingIntervals.has(schemaName)) {
      if (schemaName === STREAM_SCHEMA_NAMES.TIP_EVENT) {
        this.startTipPolling();
      } else if (schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED) {
        this.startProfilePolling();
      } else if (schemaName === STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE) {
        this.startLeaderboardPolling();
      }
    }
    
    console.log(`📡 Subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  private startTipPolling(): void {
    if (this.pollingIntervals.has(STREAM_SCHEMA_NAMES.TIP_EVENT)) {
      return;
    }

    console.log('🔄 Starting tip event polling...');
    
    const intervalId = setInterval(async () => {
      if (!this.sdk || this.connectionState !== 'connected') {
        return;
      }

      const tipSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.TIP_EVENT
      );

      if (tipSubscriptions.length === 0) {
        this.stopPolling(STREAM_SCHEMA_NAMES.TIP_EVENT);
        return;
      }

      try {
        const oldestTimestamp = Math.min(
          ...tipSubscriptions.map(sub => Number(sub.lastProcessedTimestamp))
        );

        const events = await this.readTipEvents(BigInt(oldestTimestamp));
        if (events.length > 0) {
          this.processAndNotifyTipSubscribers(events);
        }
      } catch (error) {
        console.error('Error in tip polling:', error);
      }
    }, SOMNIA_STREAMS_CONFIG.POLL_INTERVAL_MS);

    this.pollingIntervals.set(STREAM_SCHEMA_NAMES.TIP_EVENT, intervalId);
  }

  private async readTipEvents(afterTimestamp: bigint): Promise<SomniaTipEvent[]> {
    if (!this.sdk || this.publisherRegistry.size === 0) {
      return [];
    }

    try {
      const allEvents: SomniaTipEvent[] = [];
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.TIP_EVENT);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.TIP_EVENT);

      // Query all known publishers in parallel
      const publisherQueries = Array.from(this.publisherRegistry).map(async (publisher) => {
        try {
          const data = await this.sdk!.streams.getAllPublisherDataForSchema(schemaId, publisher);
          
          if (data instanceof Error) {
            console.warn(`Failed to read from publisher ${publisher}:`, data.message);
            return [];
          }

          // SDK returns SchemaDecodedItem[][] for public schemas or Hex[] for private schemas
          // Since we're using public schemas, data is already decoded
          const events: SomniaTipEvent[] = [];
          
          if (Array.isArray(data) && data.length > 0) {
            // Check if it's Hex[] (private schema) or SchemaDecodedItem[][] (public schema)
            const firstItem = data[0];
            
            if (typeof firstItem === 'string') {
              // Hex[] - need to manually decode
              for (const hexData of data as Hex[]) {
                try {
                  const decoded = encoder.decodeData(hexData);
                  
                  const event: SomniaTipEvent = {
                    tipId: decoded[0].value as unknown as bigint,
                    fromAddress: decoded[1].value as unknown as Address,
                    toAddress: decoded[2].value as unknown as Address,
                    fromUsername: decoded[3].value as unknown as string,
                    toUsername: decoded[4].value as unknown as string,
                    amount: decoded[5].value as unknown as bigint,
                    platformFee: decoded[6].value as unknown as bigint,
                    recipientAmount: decoded[7].value as unknown as bigint,
                    message: decoded[8].value as unknown as string,
                    timestamp: decoded[9].value as unknown as bigint,
                    txHash: decoded[10].value as unknown as Hex,
                  };

                  if (event.timestamp > afterTimestamp) {
                    events.push(event);
                  }
                } catch (decodeError) {
                  console.warn('Failed to decode tip event:', decodeError);
                }
              }
            } else {
              // SchemaDecodedItem[][] - already decoded
              for (const decodedItems of data as any[][]) {
                try {
                  const event: SomniaTipEvent = {
                    tipId: decodedItems[0].value as unknown as bigint,
                    fromAddress: decodedItems[1].value as unknown as Address,
                    toAddress: decodedItems[2].value as unknown as Address,
                    fromUsername: decodedItems[3].value as unknown as string,
                    toUsername: decodedItems[4].value as unknown as string,
                    amount: decodedItems[5].value as unknown as bigint,
                    platformFee: decodedItems[6].value as unknown as bigint,
                    recipientAmount: decodedItems[7].value as unknown as bigint,
                    message: decodedItems[8].value as unknown as string,
                    timestamp: decodedItems[9].value as unknown as bigint,
                    txHash: decodedItems[10].value as unknown as Hex,
                  };

                  if (event.timestamp > afterTimestamp) {
                    events.push(event);
                  }
                } catch (decodeError) {
                  console.warn('Failed to decode tip event:', decodeError);
                }
              }
            }
          }

          return events;
        } catch (error) {
          console.warn(`Error querying publisher ${publisher}:`, error);
          return [];
        }
      });

      const results = await Promise.all(publisherQueries);
      
      // Flatten and aggregate results from all publishers
      for (const events of results) {
        allEvents.push(...events);
      }

      // Sort by timestamp (newest first)
      return allEvents.sort((a, b) => Number(b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error reading tip events:', error);
      return [];
    }
  }

  private processAndNotifyTipSubscribers(events: SomniaTipEvent[]): void {
    for (const event of events) {
      if (this.isDuplicate(event)) {
        continue;
      }

      const tipSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.TIP_EVENT
      );

      for (const subscription of tipSubscriptions) {
        try {
          if (subscription.filter) {
            const usernameFilter = subscription.filter.username as string | undefined;
            if (usernameFilter && 
                event.fromUsername !== usernameFilter && 
                event.toUsername !== usernameFilter) {
              continue;
            }
          }

          subscription.callback(event);
          
          if (event.timestamp > subscription.lastProcessedTimestamp) {
            subscription.lastProcessedTimestamp = event.timestamp;
          }
        } catch (error) {
          console.error(`Error in tip subscription callback ${subscription.id}:`, error);
        }
      }
    }
  }

  async subscribeToTips(
    callback: SubscriptionCallback<SomniaTipEvent>,
    filter?: { username?: string }
  ): Promise<StreamSubscription> {
    this.ensureInitialized();
    
    const subscriptionId = this.subscribe(STREAM_SCHEMA_NAMES.TIP_EVENT, callback, filter);
    
    return {
      id: subscriptionId,
      unsubscribe: () => this.unsubscribeById(subscriptionId),
    };
  }

  private startProfilePolling(): void {
    const pollingKey = 'PROFILE_EVENTS';
    if (this.pollingIntervals.has(pollingKey)) {
      return;
    }

    console.log('🔄 Starting profile event polling...');
    
    const intervalId = setInterval(async () => {
      if (!this.sdk || this.connectionState !== 'connected') {
        return;
      }

      const profileSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || 
               sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED
      );

      if (profileSubscriptions.length === 0) {
        this.stopPolling(pollingKey);
        return;
      }

      try {
        const oldestTimestamp = Math.min(
          ...profileSubscriptions.map(sub => Number(sub.lastProcessedTimestamp))
        );

        const usernameFilters = profileSubscriptions
          .map(sub => sub.filter?.username as string | undefined)
          .filter((u): u is string => !!u);

        const events = await this.readProfileEvents(BigInt(oldestTimestamp), usernameFilters);
        if (events.length > 0) {
          this.processAndNotifyProfileSubscribers(events);
        }
      } catch (error) {
        console.error('Error in profile polling:', error);
      }
    }, SOMNIA_STREAMS_CONFIG.POLL_INTERVAL_MS);

    this.pollingIntervals.set(pollingKey, intervalId);
  }

  private async readProfileEvents(
    afterTimestamp: bigint,
    usernameFilters: string[]
  ): Promise<(SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent)[]> {
    if (!this.sdk || this.publisherRegistry.size === 0) {
      return [];
    }

    try {
      const allEvents: (SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent)[] = [];
      
      // Read both profile created and updated events
      const schemaIds = [
        { id: this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_CREATED), type: 'created' as const },
        { id: this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_UPDATED), type: 'updated' as const },
      ];

      for (const { id: schemaId, type } of schemaIds) {
        const encoder = this.getEncoder(
          type === 'created' ? STREAM_SCHEMA_NAMES.PROFILE_CREATED : STREAM_SCHEMA_NAMES.PROFILE_UPDATED
        );

        // Query all known publishers in parallel
        const publisherQueries = Array.from(this.publisherRegistry).map(async (publisher) => {
          try {
            const data = await this.sdk!.streams.getAllPublisherDataForSchema(schemaId, publisher);
            
            if (data instanceof Error) {
              console.warn(`Failed to read profile ${type} from publisher ${publisher}:`, data.message);
              return [];
            }

            const events: (SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent)[] = [];
            
            if (Array.isArray(data) && data.length > 0) {
              const firstItem = data[0];
              
              if (typeof firstItem === 'string') {
                // Hex[] - need to manually decode
                for (const hexData of data as Hex[]) {
                  try {
                    const decoded = encoder.decodeData(hexData);
                    
                    let event: SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent;
                    
                    if (type === 'created') {
                      event = {
                        userAddress: decoded[0].value as unknown as Address,
                        username: decoded[1].value as unknown as string,
                        creditScore: decoded[2].value as unknown as bigint,
                        timestamp: decoded[3].value as unknown as bigint,
                        txHash: decoded[4].value as unknown as Hex,
                      };
                    } else {
                      event = {
                        userAddress: decoded[0].value as unknown as Address,
                        username: decoded[1].value as unknown as string,
                        profileImageIpfs: decoded[2].value as unknown as string,
                        timestamp: decoded[3].value as unknown as bigint,
                        txHash: decoded[4].value as unknown as Hex,
                      };
                    }

                    if (event.timestamp > afterTimestamp && 
                        (usernameFilters.length === 0 || usernameFilters.includes(event.username))) {
                      events.push(event);
                    }
                  } catch (decodeError) {
                    console.warn(`Failed to decode profile ${type} event:`, decodeError);
                  }
                }
              } else {
                // SchemaDecodedItem[][] - already decoded
                for (const decodedItems of data as any[][]) {
                  try {
                    let event: SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent;
                    
                    if (type === 'created') {
                      event = {
                        userAddress: decodedItems[0].value as unknown as Address,
                        username: decodedItems[1].value as unknown as string,
                        creditScore: decodedItems[2].value as unknown as bigint,
                        timestamp: decodedItems[3].value as unknown as bigint,
                        txHash: decodedItems[4].value as unknown as Hex,
                      };
                    } else {
                      event = {
                        userAddress: decodedItems[0].value as unknown as Address,
                        username: decodedItems[1].value as unknown as string,
                        profileImageIpfs: decodedItems[2].value as unknown as string,
                        timestamp: decodedItems[3].value as unknown as bigint,
                        txHash: decodedItems[4].value as unknown as Hex,
                      };
                    }

                    if (event.timestamp > afterTimestamp && 
                        (usernameFilters.length === 0 || usernameFilters.includes(event.username))) {
                      events.push(event);
                    }
                  } catch (decodeError) {
                    console.warn(`Failed to decode profile ${type} event:`, decodeError);
                  }
                }
              }
            }

            return events;
          } catch (error) {
            console.warn(`Error querying publisher ${publisher} for profile ${type}:`, error);
            return [];
          }
        });

        const results = await Promise.all(publisherQueries);
        
        // Flatten and aggregate results from all publishers
        for (const events of results) {
          allEvents.push(...events);
        }
      }

      // Sort by timestamp (newest first)
      return allEvents.sort((a, b) => Number(b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error reading profile events:', error);
      return [];
    }
  }

  private processAndNotifyProfileSubscribers(
    events: (SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent)[]
  ): void {
    for (const event of events) {
      if (this.isDuplicate(event)) {
        continue;
      }

      const profileSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || 
               sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED
      );

      for (const subscription of profileSubscriptions) {
        try {
          if (subscription.filter?.username) {
            if (event.username !== subscription.filter.username) {
              continue;
            }
          }

          subscription.callback(event);
          
          if (event.timestamp > subscription.lastProcessedTimestamp) {
            subscription.lastProcessedTimestamp = event.timestamp;
          }
        } catch (error) {
          console.error(`Error in profile subscription callback ${subscription.id}:`, error);
        }
      }
    }
  }

  async subscribeToProfile(
    username: string,
    callback: SubscriptionCallback<SomniaProfileCreatedEvent | SomniaProfileUpdatedEvent>
  ): Promise<StreamSubscription> {
    this.ensureInitialized();
    
    const subscriptionId = this.subscribe(
      STREAM_SCHEMA_NAMES.PROFILE_CREATED,
      callback,
      { username }
    );
    
    return {
      id: subscriptionId,
      unsubscribe: () => this.unsubscribeById(subscriptionId),
    };
  }

  private startLeaderboardPolling(): void {
    if (this.pollingIntervals.has(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE)) {
      return;
    }

    console.log('🔄 Starting leaderboard polling...');
    
    const intervalId = setInterval(async () => {
      if (!this.sdk || this.connectionState !== 'connected') {
        return;
      }

      const leaderboardSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE
      );

      if (leaderboardSubscriptions.length === 0) {
        this.stopPolling(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);
        return;
      }

      try {
        const oldestTimestamp = Math.min(
          ...leaderboardSubscriptions.map(sub => Number(sub.lastProcessedTimestamp))
        );

        const events = await this.readLeaderboardEvents(BigInt(oldestTimestamp));
        if (events.length > 0) {
          this.processAndNotifyLeaderboardSubscribers(events);
        }
      } catch (error) {
        console.error('Error in leaderboard polling:', error);
      }
    }, SOMNIA_STREAMS_CONFIG.POLL_INTERVAL_MS);

    this.pollingIntervals.set(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE, intervalId);
  }

  private async readLeaderboardEvents(afterTimestamp: bigint): Promise<SomniaLeaderboardUpdate[]> {
    if (!this.sdk || this.publisherRegistry.size === 0) {
      return [];
    }

    try {
      const allEvents: SomniaLeaderboardUpdate[] = [];
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);

      // Query all known publishers in parallel
      const publisherQueries = Array.from(this.publisherRegistry).map(async (publisher) => {
        try {
          const data = await this.sdk!.streams.getAllPublisherDataForSchema(schemaId, publisher);
          
          if (data instanceof Error) {
            console.warn(`Failed to read leaderboard from publisher ${publisher}:`, data.message);
            return [];
          }

          const events: SomniaLeaderboardUpdate[] = [];
          
          if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            
            if (typeof firstItem === 'string') {
              // Hex[] - need to manually decode
              for (const hexData of data as Hex[]) {
                try {
                  const decoded = encoder.decodeData(hexData);
                  
                  const event: SomniaLeaderboardUpdate = {
                    updateType: decoded[0].value as unknown as 'top_creators' | 'top_tippers',
                    rankings: new Uint8Array(decoded[1].value as unknown as number[]),
                    timestamp: decoded[2].value as unknown as bigint,
                  };

                  if (event.timestamp > afterTimestamp) {
                    events.push(event);
                  }
                } catch (decodeError) {
                  console.warn('Failed to decode leaderboard event:', decodeError);
                }
              }
            } else {
              // SchemaDecodedItem[][] - already decoded
              for (const decodedItems of data as any[][]) {
                try {
                  const event: SomniaLeaderboardUpdate = {
                    updateType: decodedItems[0].value as unknown as 'top_creators' | 'top_tippers',
                    rankings: new Uint8Array(decodedItems[1].value as unknown as number[]),
                    timestamp: decodedItems[2].value as unknown as bigint,
                  };

                  if (event.timestamp > afterTimestamp) {
                    events.push(event);
                  }
                } catch (decodeError) {
                  console.warn('Failed to decode leaderboard event:', decodeError);
                }
              }
            }
          }

          return events;
        } catch (error) {
          console.warn(`Error querying publisher ${publisher} for leaderboard:`, error);
          return [];
        }
      });

      const results = await Promise.all(publisherQueries);
      
      // Flatten and aggregate results from all publishers
      for (const events of results) {
        allEvents.push(...events);
      }

      // Sort by timestamp (newest first)
      return allEvents.sort((a, b) => Number(b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error reading leaderboard events:', error);
      return [];
    }
  }

  private processAndNotifyLeaderboardSubscribers(events: SomniaLeaderboardUpdate[]): void {
    for (const event of events) {
      if (this.isDuplicate(event)) {
        continue;
      }

      const leaderboardSubscriptions = Array.from(this.subscriptions.values()).filter(
        sub => sub.schemaName === STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE
      );

      for (const subscription of leaderboardSubscriptions) {
        try {
          subscription.callback(event);
          
          if (event.timestamp > subscription.lastProcessedTimestamp) {
            subscription.lastProcessedTimestamp = event.timestamp;
          }
        } catch (error) {
          console.error(`Error in leaderboard subscription callback ${subscription.id}:`, error);
        }
      }
    }
  }

  async subscribeToLeaderboard(
    callback: SubscriptionCallback<SomniaLeaderboardUpdate>
  ): Promise<StreamSubscription> {
    this.ensureInitialized();
    
    const subscriptionId = this.subscribe(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE, callback);
    
    return {
      id: subscriptionId,
      unsubscribe: () => this.unsubscribeById(subscriptionId),
    };
  }

  private unsubscribeById(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    this.subscriptions.delete(subscriptionId);
    console.log(`🔌 Unsubscribed: ${subscriptionId}`);

    const schemaName = subscription.schemaName;
    const remainingSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.schemaName === schemaName || 
             (schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED && 
              (sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED)) ||
             (schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED && 
              (sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || sub.schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED))
    );

    if (remainingSubscriptions.length === 0) {
      if (schemaName === STREAM_SCHEMA_NAMES.PROFILE_CREATED || schemaName === STREAM_SCHEMA_NAMES.PROFILE_UPDATED) {
        this.stopPolling('PROFILE_EVENTS');
      } else {
        this.stopPolling(schemaName);
      }
    }
  }

  private stopPolling(schemaKey: string): void {
    const intervalId = this.pollingIntervals.get(schemaKey);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(schemaKey);
      console.log(`⏹️  Stopped polling for: ${schemaKey}`);
    }
  }

  unsubscribeAll(): void {
    console.log('🔌 Unsubscribing all subscriptions...');
    
    const subscriptionIds = Array.from(this.subscriptions.keys());
    for (const id of subscriptionIds) {
      this.unsubscribeById(id);
    }
    
    this.subscriptions.clear();
    
    for (const [key, intervalId] of this.pollingIntervals.entries()) {
      clearInterval(intervalId);
      console.log(`⏹️  Stopped polling for: ${key}`);
    }
    
    this.pollingIntervals.clear();
    console.log('✅ All subscriptions cleared');
  }

  private generateDataKey(eventType: string, ...identifiers: (string | bigint)[]): Hex {
    const keyString = `${eventType}-${identifiers.join('-')}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashArray = Array.from(data);
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex.padEnd(64, '0').slice(0, 64)}`;
  }

  async publishTipEvent(event: Omit<SomniaTipEvent, 'timestamp' | 'txHash'>): Promise<Hex | Error> {
    this.ensureInitialized();

    if (!this.walletClient) {
      return new Error('Wallet client required for publishing events');
    }

    try {
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.TIP_EVENT);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.TIP_EVENT);

      const timestamp = BigInt(Date.now());
      const txHash = `0x${'0'.repeat(64)}`;

      const schemaItems = [
        { name: 'tipId', type: 'uint256', value: event.tipId },
        { name: 'fromAddress', type: 'address', value: event.fromAddress },
        { name: 'toAddress', type: 'address', value: event.toAddress },
        { name: 'fromUsername', type: 'string', value: event.fromUsername },
        { name: 'toUsername', type: 'string', value: event.toUsername },
        { name: 'amount', type: 'uint256', value: event.amount },
        { name: 'platformFee', type: 'uint256', value: event.platformFee },
        { name: 'recipientAmount', type: 'uint256', value: event.recipientAmount },
        { name: 'message', type: 'string', value: event.message },
        { name: 'timestamp', type: 'uint256', value: timestamp },
        { name: 'txHash', type: 'bytes32', value: txHash },
      ];

      const encodedData = encoder.encodeData(schemaItems);
      const dataKey = this.generateDataKey('TIP', event.tipId.toString());

      const result = await this.sdk!.streams.set([{
        id: dataKey,
        schemaId,
        data: encodedData,
      }]);

      if (result instanceof Error) {
        console.error('Failed to publish tip event:', result);
        return result;
      }

      // Track publisher address for future reads
      const [account] = await this.walletClient.getAddresses();
      this.addPublisher(account);

      console.log(`📤 Published tip event: ${event.tipId}`);
      return result;
    } catch (error) {
      console.error('Error publishing tip event:', error);
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  async publishProfileCreated(event: Omit<SomniaProfileCreatedEvent, 'timestamp' | 'txHash'>): Promise<Hex | Error> {
    this.ensureInitialized();

    if (!this.walletClient) {
      return new Error('Wallet client required for publishing events');
    }

    try {
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_CREATED);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.PROFILE_CREATED);

      const timestamp = BigInt(Date.now());
      const txHash = `0x${'0'.repeat(64)}`;

      const schemaItems = [
        { name: 'userAddress', type: 'address', value: event.userAddress },
        { name: 'username', type: 'string', value: event.username },
        { name: 'creditScore', type: 'uint256', value: event.creditScore },
        { name: 'timestamp', type: 'uint256', value: timestamp },
        { name: 'txHash', type: 'bytes32', value: txHash },
      ];

      const encodedData = encoder.encodeData(schemaItems);
      const dataKey = this.generateDataKey('PROFILE_CREATED', event.username);

      const result = await this.sdk!.streams.set([{
        id: dataKey,
        schemaId,
        data: encodedData,
      }]);

      if (result instanceof Error) {
        console.error('Failed to publish profile created event:', result);
        return result;
      }

      // Track publisher address for future reads
      const [account] = await this.walletClient.getAddresses();
      this.addPublisher(account);

      console.log(`📤 Published profile created: ${event.username}`);
      return result;
    } catch (error) {
      console.error('Error publishing profile created event:', error);
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  async publishProfileUpdated(event: Omit<SomniaProfileUpdatedEvent, 'timestamp' | 'txHash'>): Promise<Hex | Error> {
    this.ensureInitialized();

    if (!this.walletClient) {
      return new Error('Wallet client required for publishing events');
    }

    try {
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_UPDATED);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.PROFILE_UPDATED);

      const timestamp = BigInt(Date.now());
      const txHash = `0x${'0'.repeat(64)}`;

      const schemaItems = [
        { name: 'userAddress', type: 'address', value: event.userAddress },
        { name: 'username', type: 'string', value: event.username },
        { name: 'profileImageIpfs', type: 'string', value: event.profileImageIpfs },
        { name: 'timestamp', type: 'uint256', value: timestamp },
        { name: 'txHash', type: 'bytes32', value: txHash },
      ];

      const encodedData = encoder.encodeData(schemaItems);
      const dataKey = this.generateDataKey('PROFILE_UPDATED', event.username, timestamp);

      const result = await this.sdk!.streams.set([{
        id: dataKey,
        schemaId,
        data: encodedData,
      }]);

      if (result instanceof Error) {
        console.error('Failed to publish profile updated event:', result);
        return result;
      }

      // Track publisher address for future reads
      const [account] = await this.walletClient.getAddresses();
      this.addPublisher(account);

      console.log(`📤 Published profile updated: ${event.username}`);
      return result;
    } catch (error) {
      console.error('Error publishing profile updated event:', error);
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  async publishLeaderboardUpdate(event: Omit<SomniaLeaderboardUpdate, 'timestamp'>): Promise<Hex | Error> {
    this.ensureInitialized();

    if (!this.walletClient) {
      return new Error('Wallet client required for publishing events');
    }

    try {
      const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);
      const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);

      const timestamp = BigInt(Date.now());

      const schemaItems = [
        { name: 'updateType', type: 'string', value: event.updateType },
        { name: 'rankings', type: 'bytes', value: Array.from(event.rankings) },
        { name: 'timestamp', type: 'uint256', value: timestamp },
      ];

      const encodedData = encoder.encodeData(schemaItems);
      const dataKey = this.generateDataKey('LEADERBOARD', event.updateType, timestamp);

      const result = await this.sdk!.streams.set([{
        id: dataKey,
        schemaId,
        data: encodedData,
      }]);

      if (result instanceof Error) {
        console.error('Failed to publish leaderboard update:', result);
        return result;
      }

      // Track publisher address for future reads
      const [account] = await this.walletClient.getAddresses();
      this.addPublisher(account);

      console.log(`📤 Published leaderboard update: ${event.updateType}`);
      return result;
    } catch (error) {
      console.error('Error publishing leaderboard update:', error);
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  async publishBatch(events: {
    tips?: Array<Omit<SomniaTipEvent, 'timestamp' | 'txHash'>>;
    profilesCreated?: Array<Omit<SomniaProfileCreatedEvent, 'timestamp' | 'txHash'>>;
    profilesUpdated?: Array<Omit<SomniaProfileUpdatedEvent, 'timestamp' | 'txHash'>>;
    leaderboardUpdates?: Array<Omit<SomniaLeaderboardUpdate, 'timestamp'>>;
  }): Promise<Hex | Error> {
    this.ensureInitialized();

    if (!this.walletClient) {
      return new Error('Wallet client required for publishing events');
    }

    try {
      const dataStreams: Array<{ id: Hex; schemaId: Hex; data: Hex }> = [];
      const timestamp = BigInt(Date.now());
      const txHash = `0x${'0'.repeat(64)}`;

      if (events.tips) {
        const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.TIP_EVENT);
        const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.TIP_EVENT);

        for (const event of events.tips) {
          const schemaItems = [
            { name: 'tipId', type: 'uint256', value: event.tipId },
            { name: 'fromAddress', type: 'address', value: event.fromAddress },
            { name: 'toAddress', type: 'address', value: event.toAddress },
            { name: 'fromUsername', type: 'string', value: event.fromUsername },
            { name: 'toUsername', type: 'string', value: event.toUsername },
            { name: 'amount', type: 'uint256', value: event.amount },
            { name: 'platformFee', type: 'uint256', value: event.platformFee },
            { name: 'recipientAmount', type: 'uint256', value: event.recipientAmount },
            { name: 'message', type: 'string', value: event.message },
            { name: 'timestamp', type: 'uint256', value: timestamp },
            { name: 'txHash', type: 'bytes32', value: txHash },
          ];

          const encodedData = encoder.encodeData(schemaItems);
          const dataKey = this.generateDataKey('TIP', event.tipId.toString());

          dataStreams.push({ id: dataKey, schemaId, data: encodedData });
        }
      }

      if (events.profilesCreated) {
        const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_CREATED);
        const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.PROFILE_CREATED);

        for (const event of events.profilesCreated) {
          const schemaItems = [
            { name: 'userAddress', type: 'address', value: event.userAddress },
            { name: 'username', type: 'string', value: event.username },
            { name: 'creditScore', type: 'uint256', value: event.creditScore },
            { name: 'timestamp', type: 'uint256', value: timestamp },
            { name: 'txHash', type: 'bytes32', value: txHash },
          ];

          const encodedData = encoder.encodeData(schemaItems);
          const dataKey = this.generateDataKey('PROFILE_CREATED', event.username);

          dataStreams.push({ id: dataKey, schemaId, data: encodedData });
        }
      }

      if (events.profilesUpdated) {
        const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.PROFILE_UPDATED);
        const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.PROFILE_UPDATED);

        for (const event of events.profilesUpdated) {
          const schemaItems = [
            { name: 'userAddress', type: 'address', value: event.userAddress },
            { name: 'username', type: 'string', value: event.username },
            { name: 'profileImageIpfs', type: 'string', value: event.profileImageIpfs },
            { name: 'timestamp', type: 'uint256', value: timestamp },
            { name: 'txHash', type: 'bytes32', value: txHash },
          ];

          const encodedData = encoder.encodeData(schemaItems);
          const dataKey = this.generateDataKey('PROFILE_UPDATED', event.username, timestamp);

          dataStreams.push({ id: dataKey, schemaId, data: encodedData });
        }
      }

      if (events.leaderboardUpdates) {
        const schemaId = this.getSchemaId(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);
        const encoder = this.getEncoder(STREAM_SCHEMA_NAMES.LEADERBOARD_UPDATE);

        for (const event of events.leaderboardUpdates) {
          const schemaItems = [
            { name: 'updateType', type: 'string', value: event.updateType },
            { name: 'rankings', type: 'bytes', value: Array.from(event.rankings) },
            { name: 'timestamp', type: 'uint256', value: timestamp },
          ];

          const encodedData = encoder.encodeData(schemaItems);
          const dataKey = this.generateDataKey('LEADERBOARD', event.updateType, timestamp);

          dataStreams.push({ id: dataKey, schemaId, data: encodedData });
        }
      }

      if (dataStreams.length === 0) {
        return new Error('No events provided to publish');
      }

      const result = await this.sdk!.streams.set(dataStreams);

      if (result instanceof Error) {
        console.error('Failed to publish batch events:', result);
        return result;
      }

      console.log(`📤 Published batch of ${dataStreams.length} events`);
      return result;
    } catch (error) {
      console.error('Error publishing batch events:', error);
      return error instanceof Error ? error : new Error(String(error));
    }
  }
}

export const somniaStreamsService = new SomniaStreamsService();

export type { StreamSubscription, ConnectionState };
