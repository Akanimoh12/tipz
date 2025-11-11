import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useLiveTickerStream, useTickerAutoScroll } from '@/hooks/useLiveTickerStream';
import { Avatar } from '@/components/atoms/Avatar';
import { Card } from '@/components/molecules/Card';
import { cn } from '@/utils/cn';

interface ActivityFeedProps {
  maxItems?: number;
  showConnectionStatus?: boolean;
  className?: string;
}

export function ActivityFeed({
  maxItems = 10,
  showConnectionStatus = true,
  className,
}: Readonly<ActivityFeedProps>) {
  const { tips, isConnected, connectionState, totalTipsReceived } = useLiveTickerStream({
    windowSize: maxItems,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const { isAutoScrolling, handleUserScroll } = useTickerAutoScroll(containerRef, isConnected);

  return (
    <div className={cn('space-y-sm', className)}>
      {showConnectionStatus && (
        <div className="flex items-center justify-between px-sm py-xs bg-accent border-3 border-primary rounded-brutalist">
          <div className="flex items-center gap-xs">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            <span className="text-body-sm font-medium">
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'connected' && 'Live'}
              {connectionState === 'reconnecting' && 'Reconnecting...'}
              {connectionState === 'disconnected' && 'Offline'}
            </span>
          </div>
          
          <span className="text-body-sm text-primary/70">
            {totalTipsReceived} tips
          </span>
        </div>
      )}

      <Card variant="default" padding="none" className="overflow-hidden">
        <div
          ref={containerRef}
          onScroll={handleUserScroll}
          className="max-h-[600px] overflow-y-auto"
          style={{
            scrollBehavior: isAutoScrolling ? 'smooth' : 'auto',
          }}
        >
          {connectionState === 'connecting' && tips.length === 0 && (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          )}

          {connectionState === 'disconnected' && tips.length === 0 && (
            <div className="flex flex-col items-center justify-center py-xl px-md text-center">
              <AlertCircle className="w-12 h-12 text-primary/30 mb-sm" />
              <p className="text-body text-primary/70">
                Unable to connect to live feed
              </p>
            </div>
          )}

          {tips.length === 0 && connectionState === 'connected' && (
            <div className="flex flex-col items-center justify-center py-xl px-md text-center">
              <Zap className="w-12 h-12 text-primary/30 mb-sm" />
              <p className="text-body text-primary/70">
                Waiting for tips...
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {tips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                className={cn(
                  'border-b-3 border-primary last:border-b-0',
                  index === 0 && 'bg-accent/50'
                )}
              >
                <div className="p-md hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-sm">
                    <Avatar
                      src={undefined}
                      alt={tip.fromUsername}
                      fallbackText={tip.fromUsername}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-xs mb-2xs">
                        <span className="font-bold text-body truncate">
                          @{tip.fromUsername}
                        </span>
                        <span className="text-primary/50">→</span>
                        <span className="font-bold text-body truncate">
                          @{tip.toUsername}
                        </span>
                      </div>

                      {tip.message && (
                        <p className="text-body-sm text-primary/70 mb-xs line-clamp-2">
                          {tip.message}
                        </p>
                      )}

                      <div className="flex items-center gap-sm text-body-sm">
                        <div className="flex items-center gap-2xs">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="font-bold">{tip.amountFormatted} ETH</span>
                        </div>
                        
                        <span className="text-primary/50">•</span>
                        
                        <time className="text-primary/70">
                          {formatRelativeTime(tip.timestamp)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {!isAutoScrolling && tips.length > 3 && (
        <button
          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full py-xs text-body-sm text-primary/70 hover:text-primary underline"
        >
          Scroll to top
        </button>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
