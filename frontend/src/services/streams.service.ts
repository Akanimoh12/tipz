import {
  STREAMS_ENDPOINT,
  STREAM_SCHEMA_IDS,
  RECONNECTION_CONFIG,
  HEARTBEAT_CONFIG,
  DEDUPLICATION_CONFIG,
  type TipEvent,
  type ProfileEvent,
  type LeaderboardUpdate,
  type StreamEvent,
  type StreamSubscription,
} from '../config/streams.config';

type EventCallback = (event: StreamEvent) => void;

interface PendingSubscription {
  schemaId: string;
  filter?: Record<string, unknown>;
  callback: EventCallback;
}

class StreamsService {
  private ws: WebSocket | null = null;
  private readonly subscriptions: Map<string, StreamSubscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly eventCache: Set<string> = new Set();
  private cacheCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;
  private isManualClose = false;
  private pendingSubscriptions: PendingSubscription[] = [];
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.setupCacheCleanup();
  }

  private setupCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      if (this.eventCache.size > DEDUPLICATION_CONFIG.MAX_CACHE_SIZE) {
        const toDelete = Math.floor(this.eventCache.size * 0.3);
        const values = Array.from(this.eventCache);
        for (let i = 0; i < toDelete; i++) {
          this.eventCache.delete(values[i]);
        }
      }
    }, DEDUPLICATION_CONFIG.WINDOW_MS);
  }

  private generateEventId(event: StreamEvent): string {
    if ('txHash' in event) {
      return event.txHash;
    }
    return `${event.timestamp}-${JSON.stringify(event)}`;
  }

  private isDuplicate(event: StreamEvent): boolean {
    const eventId = this.generateEventId(event);
    if (this.eventCache.has(eventId)) {
      return true;
    }
    this.eventCache.add(eventId);
    setTimeout(() => {
      this.eventCache.delete(eventId);
    }, DEDUPLICATION_CONFIG.WINDOW_MS);
    return false;
  }

  private calculateReconnectDelay(): number {
    const baseDelay =
      Math.min(
        RECONNECTION_CONFIG.INITIAL_DELAY_MS *
          Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, this.reconnectAttempts),
        RECONNECTION_CONFIG.MAX_DELAY_MS
      );
    const jitter = Math.random() * RECONNECTION_CONFIG.JITTER_MS;
    return baseDelay + jitter;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));

        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - reconnecting');
          this.reconnect();
        }, HEARTBEAT_CONFIG.TIMEOUT_MS);
      }
    }, HEARTBEAT_CONFIG.INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'pong') {
        if (this.heartbeatTimeout) {
          clearTimeout(this.heartbeatTimeout);
          this.heartbeatTimeout = null;
        }
        return;
      }

      if (data.type === 'event' && data.payload) {
        const streamEvent = this.parseStreamEvent(data.payload);
        if (streamEvent && !this.isDuplicate(streamEvent)) {
          this.notifySubscribers(streamEvent);
        }
      }
    } catch (error) {
      console.error('Failed to parse stream message:', error);
    }
  }

  private parseStreamEvent(payload: unknown): StreamEvent | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;

    if (data.schemaId === STREAM_SCHEMA_IDS.TIP_EVENT) {
      return data as unknown as TipEvent;
    }

    if (data.schemaId === STREAM_SCHEMA_IDS.PROFILE_EVENT) {
      return data as unknown as ProfileEvent;
    }

    if (data.schemaId === STREAM_SCHEMA_IDS.LEADERBOARD_UPDATE) {
      return data as unknown as LeaderboardUpdate;
    }

    return null;
  }

  private notifySubscribers(event: StreamEvent): void {
    for (const subscription of this.subscriptions.values()) {
      try {
        subscription.callback(event);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return this.connectionPromise || Promise.resolve();
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(STREAMS_ENDPOINT);

        this.ws.onopen = () => {
          console.log('Somnia Streams connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          for (const { schemaId, filter, callback } of this.pendingSubscriptions) {
            this.subscribe(schemaId, callback, filter);
          }
          this.pendingSubscriptions = [];

          resolve();
        };

        this.ws.onmessage = (event) => this.handleMessage(event);

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.stopHeartbeat();
          this.ws = null;
          this.isConnecting = false;

          if (!this.isManualClose) {
            this.reconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private reconnect(): void {
    if (this.reconnectTimeout || this.isManualClose) {
      return;
    }

    if (this.reconnectAttempts >= RECONNECTION_CONFIG.MAX_RETRIES) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  private subscribe(
    schemaId: string,
    callback: EventCallback,
    filter?: Record<string, unknown>
  ): string {
    const subscriptionId = `${schemaId}-${Date.now()}-${Math.random()}`;

    const subscription: StreamSubscription = {
      id: subscriptionId,
      schemaId,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId),
    };

    this.subscriptions.set(subscriptionId, subscription);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          schemaId,
          filter,
        })
      );
    }

    return subscriptionId;
  }

  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          schemaId: subscription.schemaId,
        })
      );
    }
  }

  public async subscribeToTips(
    callback: (event: TipEvent) => void,
    filter?: { username?: string }
  ): Promise<StreamSubscription> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSubscriptions.push({
        schemaId: STREAM_SCHEMA_IDS.TIP_EVENT,
        filter,
        callback: callback as EventCallback,
      });
      await this.connect();
    }

    const subscriptionId = this.subscribe(
      STREAM_SCHEMA_IDS.TIP_EVENT,
      callback as EventCallback,
      filter
    );

    return this.subscriptions.get(subscriptionId)!;
  }

  public async subscribeToProfile(
    username: string,
    callback: (event: ProfileEvent) => void
  ): Promise<StreamSubscription> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSubscriptions.push({
        schemaId: STREAM_SCHEMA_IDS.PROFILE_EVENT,
        filter: { username },
        callback: callback as EventCallback,
      });
      await this.connect();
    }

    const subscriptionId = this.subscribe(
      STREAM_SCHEMA_IDS.PROFILE_EVENT,
      callback as EventCallback,
      { username }
    );

    return this.subscriptions.get(subscriptionId)!;
  }

  public async subscribeToLeaderboard(
    callback: (event: LeaderboardUpdate) => void
  ): Promise<StreamSubscription> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSubscriptions.push({
        schemaId: STREAM_SCHEMA_IDS.LEADERBOARD_UPDATE,
        callback: callback as EventCallback,
      });
      await this.connect();
    }

    const subscriptionId = this.subscribe(
      STREAM_SCHEMA_IDS.LEADERBOARD_UPDATE,
      callback as EventCallback
    );

    return this.subscriptions.get(subscriptionId)!;
  }

  public unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }

  public disconnect(): void {
    this.isManualClose = true;
    this.unsubscribeAll();
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.eventCache.clear();
    this.pendingSubscriptions = [];
  }

  public getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.reconnectTimeout) return 'reconnecting';
    return 'disconnected';
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const streamsService = new StreamsService();
