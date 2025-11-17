// React hook for managing contract event listener lifecycle

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { contractEventListenerService } from '@/services/contract-event-listener.service';

interface UseContractEventListenerResult {
  isListening: boolean;
  isInitializing: boolean;
  error: Error | null;
  metrics: {
    tipsDetected: number;
    tipsPublished: number;
    profilesCreatedDetected: number;
    profilesCreatedPublished: number;
    profilesUpdatedDetected: number;
    profilesUpdatedPublished: number;
    publishErrors: number;
    queueSize: number;
  };
  start: () => Promise<void>;
  stop: () => void;
  clearQueue: () => void;
  retryQueue: () => Promise<void>;
}

interface UseContractEventListenerOptions {
  /**
   * Auto-start listeners when wallet connects
   * @default true
   */
  autoStart?: boolean;

  /**
   * Enable verbose logging in development
   * @default false
   */
  enableLogging?: boolean;
}

/**
 * Hook to manage contract event listener lifecycle
 * 
 * Automatically starts/stops event listeners based on wallet connection state.
 * Listens to TipSent, ProfileCreated, and ProfileUpdated events and publishes
 * them to Somnia Data Streams.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isListening, metrics, error } = useContractEventListener({
 *     autoStart: true,
 *   });
 * 
 *   if (error) {
 *     console.error('Event listener error:', error);
 *   }
 * 
 *   return (
 *     <div>
 *       {isListening && <span>🟢 Listening to events</span>}
 *       {!isListening && <span>🔴 Not listening</span>}
 *       <p>Tips detected: {metrics.tipsDetected}</p>
 *       <p>Tips published: {metrics.tipsPublished}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useContractEventListener(
  options: UseContractEventListenerOptions = {}
): UseContractEventListenerResult {
  const { autoStart = true, enableLogging = false } = options;

  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState({
    tipsDetected: 0,
    tipsPublished: 0,
    profilesCreatedDetected: 0,
    profilesCreatedPublished: 0,
    profilesUpdatedDetected: 0,
    profilesUpdatedPublished: 0,
    publishErrors: 0,
    queueSize: 0,
  });

  const isStartingRef = useRef(false);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStartedRef = useRef(false);

  /**
   * Start event listeners
   */
  const start = useCallback(async () => {
    if (isStartingRef.current) {
      if (enableLogging) {
        console.log('⏳ Event listeners already starting...');
      }
      return;
    }

    if (!isConnected || !walletClient) {
      const err = new Error('Wallet not connected');
      setError(err);
      throw err;
    }

    try {
      isStartingRef.current = true;
      setIsInitializing(true);
      setError(null);

      await contractEventListenerService.start();

      setIsListening(true);
      setIsInitializing(false);
      hasAutoStartedRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start event listeners');
      setError(error);
      setIsInitializing(false);
      console.error('Failed to start event listeners:', error);
      throw error;
    } finally {
      isStartingRef.current = false;
    }
  }, [isConnected, walletClient, enableLogging]);

  /**
   * Stop event listeners
   */
  const stop = useCallback(() => {
    contractEventListenerService.stop();
    setIsListening(false);
    hasAutoStartedRef.current = false;
  }, []);

  /**
   * Clear event queue
   */
  const clearQueue = useCallback(() => {
    contractEventListenerService.clearQueue();
    setMetrics((prev) => ({ ...prev, queueSize: 0 }));
  }, []);

  /**
   * Manually retry queued events
   */
  const retryQueue = useCallback(async () => {
    await contractEventListenerService.retryQueue();
  }, []);

  /**
   * Update metrics periodically - only when they actually change
   */
  useEffect(() => {
    if (!isListening) {
      return;
    }

    // Update metrics every 5 seconds, but only if they changed
    metricsIntervalRef.current = setInterval(() => {
      const currentMetrics = contractEventListenerService.getMetrics();
      
      // Only update state if metrics actually changed
      setMetrics((prevMetrics) => {
        const hasChanged = 
          currentMetrics.tipsDetected !== prevMetrics.tipsDetected ||
          currentMetrics.tipsPublished !== prevMetrics.tipsPublished ||
          currentMetrics.profilesCreatedDetected !== prevMetrics.profilesCreatedDetected ||
          currentMetrics.profilesCreatedPublished !== prevMetrics.profilesCreatedPublished ||
          currentMetrics.profilesUpdatedDetected !== prevMetrics.profilesUpdatedDetected ||
          currentMetrics.profilesUpdatedPublished !== prevMetrics.profilesUpdatedPublished ||
          currentMetrics.publishErrors !== prevMetrics.publishErrors ||
          currentMetrics.queueSize !== prevMetrics.queueSize;

        return hasChanged ? currentMetrics : prevMetrics;
      });
    }, 5000); // 5 seconds - less aggressive polling

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    };
  }, [isListening]); // Only recreate when listening state changes

  /**
   * Auto-start listeners when wallet connects
   */
  useEffect(() => {
    if (!autoStart || !isConnected || !walletClient) {
      return;
    }

    // Only auto-start once and when not already listening/initializing
    if (!isListening && !isInitializing && !hasAutoStartedRef.current) {
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isConnected, walletClient]);

  /**
   * Stop listeners when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected && isListening) {
      contractEventListenerService.stop();
      setIsListening(false);
      hasAutoStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isListening) {
        contractEventListenerService.stop();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []); // Only run on unmount

  return {
    isListening,
    isInitializing,
    error,
    metrics,
    start,
    stop,
    clearQueue,
    retryQueue,
  };
}
