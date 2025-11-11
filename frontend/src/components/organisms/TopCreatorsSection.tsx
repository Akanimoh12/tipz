import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { ProfileCard } from '@/components/molecules/ProfileCard';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useModalStore } from '@/store';

interface TopCreator {
  username: string;
  userAddress: `0x${string}`;
  profileImageIpfs?: string;
  creditScore: number;
  totalTipsCount: number;
  totalTipsReceived: bigint;
}

interface TopCreatorsSectionProps {
  creators?: TopCreator[];
  isLoading?: boolean;
  error?: Error | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function TopCreatorsSection({ creators = [], isLoading, error }: Readonly<TopCreatorsSectionProps>) {
  const { openTipModal } = useModalStore();

  const handleTipClick = (creator: TopCreator) => {
    openTipModal({
      toUsername: creator.username,
      toAddress: creator.userAddress,
      profileImageIpfs: creator.profileImageIpfs,
      creditScore: creator.creditScore,
    });
  };

  return (
    <section className="py-2xl bg-secondary">
      <div className="container mx-auto px-md">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h2 className="text-h1 font-bold mb-sm">Top Creators</h2>
            <p className="text-body-lg text-primary/70">
              Discover the most tipped creators on Tipz
            </p>
          </div>

          <Link to="/leaderboard">
            <Button variant="ghost" size="md">
              <TrendingUp className="w-4 h-4 mr-2xs" />
              View All
            </Button>
          </Link>
        </div>

        {error && (
          <div className="text-center py-xl">
            <p className="text-body text-red-600 mb-md">Failed to load creators</p>
            <Button variant="secondary" size="sm" onClick={() => globalThis.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg">
            {Array.from({ length: 6 }, (_, i) => `creator-skeleton-${i}`).map((key) => (
              <div key={key} className="space-y-sm">
                <Skeleton variant="rectangular" height="200px" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && creators.length === 0 && (
          <div className="text-center py-xl">
            <Zap className="w-12 h-12 mx-auto mb-md text-primary/30" />
            <p className="text-body text-primary/70">No creators found</p>
          </div>
        )}

        {!isLoading && !error && creators.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg"
          >
            {creators.slice(0, 6).map((creator) => (
              <motion.div key={creator.username} variants={itemVariants}>
                <ProfileCard
                  username={creator.username}
                  userAddress={creator.userAddress}
                  profileImageIpfs={creator.profileImageIpfs}
                  creditScore={creator.creditScore}
                  totalTipsCount={creator.totalTipsCount}
                  totalTipsReceived={creator.totalTipsReceived}
                  isActive
                  onTipClick={() => handleTipClick(creator)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
