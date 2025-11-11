import { useRef, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLiveTickerStream } from '@/hooks/useLiveTickerStream';
import { Avatar } from '@/components/atoms/Avatar';

export function LiveTickerSection() {
  const { tips, isConnected } = useLiveTickerStream({ windowSize: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const inView = useInView(containerRef);

  useEffect(() => {
    if (inView && tips.length > 0) {
      controls.start({
        x: [0, -50 * tips.length],
        transition: {
          duration: tips.length * 3,
          ease: 'linear',
          repeat: Infinity,
        },
      });
    }
  }, [inView, tips.length, controls]);

  if (!isConnected || tips.length === 0) {
    return null;
  }

  const duplicatedTips = [...tips, ...tips];

  return (
    <section className="py-lg bg-primary overflow-hidden">
      <div className="mb-md text-center">
        <div className="inline-flex items-center gap-2xs px-sm py-xs bg-secondary border-2 border-secondary rounded-brutalist">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-body-sm font-medium text-primary">Live Tips</span>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <motion.div animate={controls} className="flex gap-md">
          {duplicatedTips.map((tip, index) => (
            <div
              key={`${tip.id}-${index}`}
              className="flex-shrink-0 bg-secondary border-3 border-secondary rounded-brutalist p-sm flex items-center gap-sm min-w-[300px]"
            >
              <Avatar
                src={undefined}
                alt={tip.fromUsername}
                fallbackText={tip.fromUsername}
                size="sm"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2xs">
                  <span className="text-body-sm font-medium truncate">
                    @{tip.fromUsername}
                  </span>
                  <span className="text-body-sm text-primary/50">→</span>
                  <span className="text-body-sm font-medium truncate">
                    @{tip.toUsername}
                  </span>
                </div>
                
                {tip.message && (
                  <p className="text-body-sm text-primary/70 truncate">{tip.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2xs text-primary font-bold">
                <Zap className="w-4 h-4" fill="currentColor" />
                <span className="text-body-sm">{tip.amountFormatted} ETH</span>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-primary to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-primary to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
