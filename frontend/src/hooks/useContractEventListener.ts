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

      if (enableLogging) {
        console.log('🚀 Starting contract event listeners...');
      }

      await contractEventListenerService.start();

      setIsListening(true);
      setIsInitializing(false);

      if (enableLogging) {
        console.log('✅ Event listeners started');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start event listeners');
      setError(error);
      setIsInitializing(false);
      console.error('❌ Failed to start event listeners:', error);
      throw error;
    } finally {
      isStartingRef.current = false;
    }
  }, [isConnected, walletClient, enableLogging]);

  /**
   * Stop event listeners
   */
  const stop = useCallback(() => {
    if (enableLogging) {
      console.log('🛑 Stopping contract event listeners...');
    }

    contractEventListenerService.stop();
    setIsListening(false);

    if (enableLogging) {
      console.log('✅ Event listeners stopped');
    }
  }, [enableLogging]);

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
   * Update metrics periodically
   */
  useEffect(() => {
    if (!isListening) {
      return;
    }

    // Update metrics every 2 seconds
    metricsIntervalRef.current = setInterval(() => {
      const currentMetrics = contractEventListenerService.getMetrics();
      setMetrics(currentMetrics);
    }, 2000);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    };
  }, [isListening]);

  /**
   * Auto-start listeners when wallet connects
   */
  useEffect(() => {
    if (!autoStart) {
      return;
    }

    if (isConnected && walletClient && !isListening && !isInitializing) {
      void start();
    }
  }, [autoStart, isConnected, walletClient, isListening, isInitializing, start]);

  /**
   * Stop listeners when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected && isListening) {
      stop();
    }
  }, [isConnected, isListening, stop]);

  /**
   * Handle account changes - restart listeners
   */
  useEffect(() => {
    if (isListening && address) {
      if (enableLogging) {
        console.log('👤 Account changed, restarting listeners...');
      }
      stop();
      // Will auto-restart via autoStart effect
    }
  }, [address, isListening, stop, enableLogging]);

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
