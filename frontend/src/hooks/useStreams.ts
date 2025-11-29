import { useCallback, useEffect, useRef, useState } from 'react';
import { streamsService } from '../services/streams-adapter.service';
import type { StreamSubscription } from '../services/streams-adapter.service';
import type { StreamEvent } from '../config/streams.config';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

type SubscribeFactory<T extends StreamEvent> = (callback: (event: T) => void) => Promise<StreamSubscription>;

interface UseStreamsOptions<T extends StreamEvent> {
  onEvent?: (event: T) => void;
  enabled?: boolean;
  keepHistory?: boolean;
  historyLimit?: number;
}

interface UseStreamsResult<T extends StreamEvent> {
  events: T[];
  latestEvent: T | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  error: Error | null;
  clearEvents: () => void;
  reconnect: () => Promise<void>;
}

export function useStreams<T extends StreamEvent>(
  subscribeFactory: SubscribeFactory<T>,
  options: UseStreamsOptions<T> = {}
): UseStreamsResult<T> {
  const {
    onEvent,
    enabled = true,
    keepHistory = true,
    historyLimit = 50,
  } = options;

  const [events, setEvents] = useState<T[]>([]);
  const [latestEvent, setLatestEvent] = useState<T | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  const subscriptionRef = useRef<StreamSubscription | null>(null);
  const onEventRef = useRef(onEvent);
  const subscribeFactoryRef = useRef(subscribeFactory);
  const connectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  const [subscriptionKey, setSubscriptionKey] = useState(0);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      streamsService.initialize().catch((initError) => {
        console.error('Failed to initialize Somnia Streams SDK:', initError);
        setError(initError instanceof Error ? initError : new Error('SDK initialization failed'));
      });
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const handleEvent = useCallback(
    (event: T) => {
      setLatestEvent(event);
      setError(null);

      if (keepHistory) {
        setEvents((prev) => [event, ...prev].slice(0, historyLimit));
      }

      const handler = onEventRef.current;
      if (handler) {
        try {
          handler(event);
        } catch (err) {
          console.error('Error in onEvent callback:', err);
          setError(err instanceof Error ? err : new Error('Unknown error in callback'));
        }
      }
    },
    [keepHistory, historyLimit]
  );

  const checkConnectionState = useCallback(() => {
    setConnectionState(streamsService.getConnectionState());
  }, []);

  useEffect(() => {
    subscribeFactoryRef.current = subscribeFactory;

    if (!enabled) {
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
        connectionIntervalRef.current = null;
      }
      cleanupSubscription();
      clearEvents();
      setConnectionState('disconnected');
      return;
    }

    let cancelled = false;

    const establishSubscription = async () => {
      setConnectionState((prev) => (prev === 'reconnecting' ? 'reconnecting' : 'connecting'));

      try {
        await streamsService.initialize();
        if (cancelled) {
          return;
        }

        const subscription = await subscribeFactoryRef.current(handleEvent);
        if (cancelled) {
          subscription.unsubscribe();
          return;
        }

        cleanupSubscription();
        subscriptionRef.current = subscription;
        checkConnectionState();
        setError(null);
      } catch (err) {
        console.error('Failed to setup stream subscription:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to connect'));
          setConnectionState('disconnected');
        }
      }
    };

    void establishSubscription();

    if (connectionIntervalRef.current) {
      clearInterval(connectionIntervalRef.current);
    }

    connectionIntervalRef.current = setInterval(() => {
      if (!cancelled) {
        checkConnectionState();
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
        connectionIntervalRef.current = null;
      }
      cleanupSubscription();
    };
  }, [enabled, subscribeFactory, handleEvent, checkConnectionState, cleanupSubscription, clearEvents, subscriptionKey]);

  const reconnect = useCallback(async () => {
    if (!enabled) {
      return;
    }

    clearEvents();
    cleanupSubscription();
    setConnectionState('reconnecting');
    setSubscriptionKey((key) => key + 1);
  }, [cleanupSubscription, clearEvents, enabled]);

  return {
    events,
    latestEvent,
    connectionState,
    isConnected: connectionState === 'connected',
    error,
    clearEvents,
    reconnect,
  };
}

export function useTipStream(options?: UseStreamsOptions<import('../config/streams.config').TipEvent>) {
  const subscribeFactory = useCallback(
    (callback: (event: import('../config/streams.config').TipEvent) => void) =>
      streamsService.subscribeToTips(callback),
    []
  );

  return useStreams(subscribeFactory, options);
}

export function useProfileStream(
  username: string,
  options?: UseStreamsOptions<import('../config/streams.config').ProfileEvent>
) {
  const subscribeFactory = useCallback(
    (callback: (event: import('../config/streams.config').ProfileEvent) => void) =>
      streamsService.subscribeToProfile(username, callback),
    [username]
  );

  return useStreams(subscribeFactory, options);
}

export function useLeaderboardStream(
  options?: UseStreamsOptions<import('../config/streams.config').LeaderboardUpdate>
) {
  const subscribeFactory = useCallback(
    (callback: (event: import('../config/streams.config').LeaderboardUpdate) => void) =>
      streamsService.subscribeToLeaderboard(callback),
    []
  );

  return useStreams(subscribeFactory, options);
}
