import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTipAmount, formatTimestamp } from '../services/contract.service';
import { useTipStream } from './useStreams';
import type { TipEvent } from '../services/streams-adapter.service';

const TICKER_WINDOW_SIZE = 10;

export interface LiveTipDisplay {
  id: string;
  fromUsername: string;
  toUsername: string;
  amount: string;
  amountFormatted: string;
  message: string;
  timestamp: Date;
  txHash: string;
}

interface UseLiveTickerStreamOptions {
  windowSize?: number;
  enabled?: boolean;
  onNewTip?: (tip: LiveTipDisplay) => void;
}

interface UseLiveTickerStreamResult {
  tips: LiveTipDisplay[];
  latestTip: LiveTipDisplay | null;
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  totalTipsReceived: number;
  clearTips: () => void;
}

export function useLiveTickerStream(
  options: UseLiveTickerStreamOptions = {}
): UseLiveTickerStreamResult {
  const { windowSize = TICKER_WINDOW_SIZE, enabled = true, onNewTip } = options;

  const [tips, setTips] = useState<LiveTipDisplay[]>([]);
  const [latestTip, setLatestTip] = useState<LiveTipDisplay | null>(null);
  const [totalTipsReceived, setTotalTipsReceived] = useState(0);

  const onNewTipRef = useRef(onNewTip);

  useEffect(() => {
    onNewTipRef.current = onNewTip;
  }, [onNewTip]);

  const transformTipEvent = useCallback((event: TipEvent): LiveTipDisplay => {
    return {
      id: event.id,
      fromUsername: event.fromUsername,
      toUsername: event.toUsername,
      amount: event.amount.toString(),
      amountFormatted: formatTipAmount(event.amount),
      message: event.message,
      timestamp: formatTimestamp(BigInt(event.timestamp)),
      txHash: event.txHash,
    };
  }, []);

  const handleTipEvent = useCallback(
    (event: TipEvent) => {
      const displayTip = transformTipEvent(event);

      setLatestTip(displayTip);
      setTotalTipsReceived((prev) => prev + 1);

      setTips((prevTips) => {
        const newTips = [displayTip, ...prevTips];
        return newTips.slice(0, windowSize);
      });

      if (onNewTipRef.current) {
        try {
          onNewTipRef.current(displayTip);
        } catch (error) {
          console.error('Error in onNewTip callback:', error);
        }
      }
    },
    [transformTipEvent, windowSize]
  );

  const { connectionState, isConnected } = useTipStream({
    onEvent: handleTipEvent,
    enabled,
    keepHistory: false,
  });

  const clearTips = useCallback(() => {
    setTips([]);
    setLatestTip(null);
    setTotalTipsReceived(0);
  }, []);

  return {
    tips,
    latestTip,
    isConnected,
    connectionState,
    totalTipsReceived,
    clearTips,
  };
}

export function useLiveTickerAnimation(tips: LiveTipDisplay[]) {
  const [animatingTip, setAnimatingTip] = useState<string | null>(null);

  useEffect(() => {
    if (tips.length > 0) {
      const latestTipId = tips[0].id;
      setAnimatingTip(latestTipId);

      const timeout = setTimeout(() => {
        setAnimatingTip(null);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [tips]);

  return { animatingTip };
}

export function useTickerAutoScroll(
  containerRef: React.RefObject<HTMLElement>,
  isEnabled: boolean = true
) {
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEnabled || !isAutoScrolling || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }, [containerRef, isAutoScrolling, isEnabled]);

  const handleUserScroll = useCallback(() => {
    setIsAutoScrolling(false);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoScrolling,
    handleUserScroll,
    pauseAutoScroll: () => setIsAutoScrolling(false),
    resumeAutoScroll: () => setIsAutoScrolling(true),
  };
}
