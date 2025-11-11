import { useEffect, useRef, useState, useCallback } from 'react';
import { streamsService } from '../services/streams.service';
import type { StreamEvent, StreamSubscription } from '../config/streams.config';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

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
}

export function useStreams<T extends StreamEvent>(
  subscribe: (callback: (event: T) => void) => Promise<StreamSubscription>,
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
  const connectionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const handleEvent = useCallback(
    (event: T) => {
      setLatestEvent(event);
      setError(null);

      if (keepHistory) {
        setEvents((prev) => {
          const newEvents = [event, ...prev];
          return newEvents.slice(0, historyLimit);
        });
      }

      if (onEventRef.current) {
        try {
          onEventRef.current(event);
        } catch (err) {
          console.error('Error in onEvent callback:', err);
          setError(err instanceof Error ? err : new Error('Unknown error in callback'));
        }
      }
    },
    [keepHistory, historyLimit]
  );

  const checkConnectionState = useCallback(() => {
    const state = streamsService.getConnectionState();
    setConnectionState(state);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const setupSubscription = async () => {
      try {
        setConnectionState('connecting');
        const subscription = await subscribe(handleEvent);

        if (mounted) {
          subscriptionRef.current = subscription;
          checkConnectionState();
        } else {
          subscription.unsubscribe();
        }
      } catch (err) {
        console.error('Failed to setup stream subscription:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to connect'));
          setConnectionState('disconnected');
        }
      }
    };

    void setupSubscription();

    connectionCheckInterval.current = setInterval(checkConnectionState, 1000);

    return () => {
      mounted = false;
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, subscribe, handleEvent, checkConnectionState]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  return {
    events,
    latestEvent,
    connectionState,
    isConnected: connectionState === 'connected',
    error,
    clearEvents,
  };
}

export function useTipStream(options?: UseStreamsOptions<import('../config/streams.config').TipEvent>) {
  return useStreams(
    (callback) => streamsService.subscribeToTips(callback),
    options
  );
}

export function useProfileStream(
  username: string,
  options?: UseStreamsOptions<import('../config/streams.config').ProfileEvent>
) {
  const subscribe = useCallback(
    (callback: (event: import('../config/streams.config').ProfileEvent) => void) =>
      streamsService.subscribeToProfile(username, callback),
    [username]
  );

  return useStreams(subscribe, options);
}

export function useLeaderboardStream(
  options?: UseStreamsOptions<import('../config/streams.config').LeaderboardUpdate>
) {
  return useStreams(
    (callback) => streamsService.subscribeToLeaderboard(callback),
    options
  );
}
