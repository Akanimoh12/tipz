import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp,
  Trophy,
  Search,
  ArrowUpDown,
  BookOpen,
  Zap,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Input } from '@/components/atoms/Input';
import { Skeleton } from '@/components/atoms/Skeleton';
import {
  useTopCreators,
  useTopTippers,
  useAllRegisteredUsers,
  useCreatorDirectory,
} from '@/hooks/useLeaderboard';
import { useLeaderboardStream } from '@/hooks/useStreams';

type LeaderboardTab = 'creators' | 'tippers' | 'discover';
type SortField = 'rank' | 'amount' | 'count' | 'score';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const rankEmoji = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
};

const resolveAvatarUrl = (ipfsHash?: string): string | undefined => {
  if (!ipfsHash) {
    return undefined;
  }
  const base = (import.meta.env.VITE_PINATA_GATEWAY_URL as string | undefined) || 'https://gateway.pinata.cloud';
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${sanitizedBase}/ipfs/${ipfsHash}`;
};

const formatTipAmount = (total: bigint) => {
  const numeric = Number(formatEther(total));
  return {
    numeric,
    display: `${numeric.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} SOM`,
  };
};

const formatRelativeFromNow = (timestamp?: bigint): string => {
  if (!timestamp) {
    return 'Recently joined';
  }
  const milliseconds = Number(timestamp) * 1000;
  if (!Number.isFinite(milliseconds)) {
    return 'Recently joined';
  }

  const diff = Date.now() - milliseconds;
  if (diff <= 0) {
    return 'Just now';
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    const value = Math.max(1, minutes);
    return `${value} minute${value === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface DiscoverCreator {
  username: string;
  walletAddress: string;
  creditScore: number;
  followers: number;
  totalTipsCount: number;
  totalTipsValue: number;
  totalTipsDisplay: string;
  avatarUrl?: string;
  joinedAt?: bigint;
  isActive: boolean;
}

interface DiscoverHighlight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  creator: DiscoverCreator;
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('creators');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const { creators, isLoading: creatorsLoading } = useTopCreators(50);
  const { tippers, isLoading: tippersLoading } = useTopTippers(50);
  const { totalRegistrations } = useAllRegisteredUsers();
  const { creators: directoryCreators, isLoading: directoryLoading } = useCreatorDirectory(totalRegistrations, {
    limit: 200,
  });

  useLeaderboardStream({
    enabled: true,
    keepHistory: false,
    onEvent: () => {
      // react-query caches handle refreshing automatically when the contract emits
    },
  });

  const discoverCreators = useMemo<DiscoverCreator[]>(
    () =>
      directoryCreators.map((creator) => {
        const tips = formatTipAmount(creator.totalTipsReceived);
        return {
          username: creator.username,
          walletAddress: creator.walletAddress,
          creditScore: creator.creditScore ?? 0,
          followers: creator.followers,
          totalTipsCount: Number(creator.totalTipsCount),
          totalTipsValue: tips.numeric,
          totalTipsDisplay: tips.display,
          avatarUrl: resolveAvatarUrl(creator.profileImageIpfs),
          joinedAt: creator.createdAt,
          isActive: creator.isActive,
        };
      }),
    [directoryCreators]
  );

  const discoverAvatarLookup = useMemo(() => {
    const map = new Map<string, string>();
    discoverCreators.forEach((creator) => {
      if (creator.avatarUrl) {
        map.set(creator.username.toLowerCase(), creator.avatarUrl);
      }
    });
    return map;
  }, [discoverCreators]);

  const formattedCreators = useMemo(
    () =>
      creators.map((creator) => {
        const amount = formatTipAmount(creator.totalAmount);
        return {
          ...creator,
          totalAmountFormatted: amount.display,
          totalAmountValue: amount.numeric,
          profileImage: creator.profileImage ?? discoverAvatarLookup.get(creator.username.toLowerCase()),
        };
      }),
    [creators, discoverAvatarLookup]
  );

  const formattedTippers = useMemo(
    () =>
      tippers.map((tipper) => {
        const amount = formatTipAmount(tipper.totalAmount);
        return {
          ...tipper,
          totalAmountFormatted: amount.display,
          totalAmountValue: amount.numeric,
          profileImage: tipper.profileImage ?? discoverAvatarLookup.get(tipper.username.toLowerCase()),
        };
      }),
    [tippers, discoverAvatarLookup]
  );

  const leaderboardData = activeTab === 'creators' ? formattedCreators : formattedTippers;
  const isLeaderboardTab = activeTab !== 'discover';

  const filteredLeaderboardData = useMemo(() => {
    if (!isLeaderboardTab) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    const base = leaderboardData.filter((entry) =>
      entry.username.toLowerCase().includes(query)
    );

    const sorted = [...base].sort((a, b) => {
      const aValue = (() => {
        if (sortField === 'amount') return a.totalAmountValue;
        if (sortField === 'count') return a.count;
        if (sortField === 'score') return a.creditScore ?? 0;
        return a.rank;
      })();

      const bValue = (() => {
        if (sortField === 'amount') return b.totalAmountValue;
        if (sortField === 'count') return b.count;
        if (sortField === 'score') return b.creditScore ?? 0;
        return b.rank;
      })();

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [isLeaderboardTab, leaderboardData, searchQuery, sortField, sortOrder]);

  const filteredDiscoverCreators = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return discoverCreators;
    }

    return discoverCreators.filter((creator) =>
      creator.username.toLowerCase().includes(query) ||
      creator.walletAddress.toLowerCase().includes(query)
    );
  }, [discoverCreators, searchQuery]);

  const totalPages = filteredLeaderboardData.length
    ? Math.ceil(filteredLeaderboardData.length / ITEMS_PER_PAGE)
    : 1;

  const paginatedData = filteredLeaderboardData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const discoverHighlights = useMemo<DiscoverHighlight[]>(() => {
    if (!discoverCreators.length) {
      return [];
    }

    const newest = [...discoverCreators]
      .filter((creator) => creator.joinedAt)
      .sort((a, b) => Number(b.joinedAt ?? 0n) - Number(a.joinedAt ?? 0n))[0];

    const highestScore = [...discoverCreators].sort(
      (a, b) => b.creditScore - a.creditScore
    )[0];

    const mostFollowers = [...discoverCreators].sort(
      (a, b) => b.followers - a.followers
    )[0];

    const uniqueByUsername = new Map<string, DiscoverHighlight>();

    if (newest) {
      uniqueByUsername.set(newest.username, {
        id: 'newest',
        title: 'Fresh On Tipz',
        description: formatRelativeFromNow(newest.joinedAt),
        icon: Sparkles,
        accentClass: 'bg-brand/10 text-brand',
        creator: newest,
      });
    }

    if (highestScore && !uniqueByUsername.has(highestScore.username)) {
      uniqueByUsername.set(highestScore.username, {
        id: 'score',
        title: 'Top Credit Score',
        description: `Score ${highestScore.creditScore}/1000`,
        icon: BookOpen,
        accentClass: 'bg-emerald-500/10 text-emerald-500',
        creator: highestScore,
      });
    }

    if (mostFollowers && !uniqueByUsername.has(mostFollowers.username)) {
      uniqueByUsername.set(mostFollowers.username, {
        id: 'followers',
        title: 'Community Favorite',
        description: `${mostFollowers.followers.toLocaleString()} followers`,
        icon: Zap,
        accentClass: 'bg-amber-500/10 text-amber-500',
        creator: mostFollowers,
      });
    }

    return Array.from(uniqueByUsername.values()).slice(0, 3);
  }, [discoverCreators]);

  const isLoading = activeTab === 'discover'
    ? directoryLoading
    : activeTab === 'creators'
      ? creatorsLoading
      : tippersLoading;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleTabChange = (tab: LeaderboardTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  return (
    <>
      <Helmet>
        <title>Leaderboard - Top Creators & Tippers | Tipz</title>
        <meta
          name="description"
          content="Discover the top creators, tippers, and rising talent on Tipz. View real-time rankings, total tips, and credit scores."
        />
        <meta
          name="keywords"
          content="tipz, leaderboard, top creators, top tippers, discover creators, rankings, blockchain"
        />
      </Helmet>

      <div className="container mx-auto px-md py-xl space-y-lg">
        <div className="text-center space-y-sm">
          <div className="flex items-center justify-center gap-sm">
            <Trophy className="w-10 h-10 text-brand" />
            <h1 className="text-h1 font-bold">Leaderboard</h1>
          </div>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            Discover the top creators and tippers on Tipz. Rankings update in real-time, and the Discover tab surfaces new talent worth watching.
          </p>
          <Badge variant="success" className="inline-flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
          </Badge>
        </div>

        <div className="flex justify-center gap-md flex-wrap">
          <Button
            variant={activeTab === 'creators' ? 'primary' : 'secondary'}
            onClick={() => handleTabChange('creators')}
            className="flex items-center gap-sm"
          >
            <TrendingUp className="w-5 h-5" />
            Top Creators
          </Button>
          <Button
            variant={activeTab === 'tippers' ? 'primary' : 'secondary'}
            onClick={() => handleTabChange('tippers')}
            className="flex items-center gap-sm"
          >
            <Trophy className="w-5 h-5" />
            Top Tippers
          </Button>
          <Button
            variant={activeTab === 'discover' ? 'primary' : 'secondary'}
            onClick={() => handleTabChange('discover')}
            className="flex items-center gap-sm"
          >
            <Sparkles className="w-5 h-5" />
            Discover Creators
          </Button>
        </div>

        {isLeaderboardTab ? (
          <Card variant="flat" padding="md">
            <div className="flex flex-col md:flex-row gap-md items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-sm flex-wrap justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('rank')}
                  className="flex items-center gap-xs"
                >
                  Rank
                  {sortField === 'rank' && <ArrowUpDown className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-xs"
                >
                  Amount
                  {sortField === 'amount' && <ArrowUpDown className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('count')}
                  className="flex items-center gap-xs"
                >
                  Tips
                  {sortField === 'count' && <ArrowUpDown className="w-4 h-4" />}
                </Button>
                {activeTab === 'creators' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-xs"
                  >
                    Score
                    {sortField === 'score' && <ArrowUpDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="flat" padding="md">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
              <div className="space-y-xs max-w-xl">
                <div className="inline-flex items-center gap-xs rounded-full bg-brand/10 px-3 py-1 text-brand text-caption font-medium">
                  <Sparkles className="w-4 h-4" />
                  Curated Creator Directory
                </div>
                <p className="text-body text-text-muted">
                  Browse the latest creators joining Tipz. These profiles are fetched directly from Tipz Profile contracts, so you can spot rising stars early.
                </p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search creators or wallet addresses..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>
        )}

        {isLeaderboardTab ? (
          <>
            <Card variant="elevated" padding="none" className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-3 border-primary bg-accent">
                  <tr>
                    <th className="px-md py-md text-left font-bold">Rank</th>
                    <th className="px-md py-md text-left font-bold">User</th>
                    <th className="px-md py-md text-right font-bold">Total Amount</th>
                    <th className="px-md py-md text-center font-bold">Tips Count</th>
                    {activeTab === 'creators' && (
                      <th className="px-md py-md text-center font-bold">Credit Score</th>
                    )}
                    <th className="px-md py-md text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }, (_, index) => index).map((skeletonId) => (
                        <tr key={`skeleton-${skeletonId}`} className="border-b-2 border-primary/20">
                          <td className="px-md py-md">
                            <Skeleton variant="text" width="40px" />
                          </td>
                          <td className="px-md py-md">
                            <div className="flex items-center gap-sm">
                              <Skeleton variant="circular" width="40px" height="40px" />
                              <Skeleton variant="text" width="120px" />
                            </div>
                          </td>
                          <td className="px-md py-md">
                            <Skeleton variant="text" width="100px" className="ml-auto" />
                          </td>
                          <td className="px-md py-md">
                            <Skeleton variant="rectangular" width="80px" height="24px" className="mx-auto" />
                          </td>
                          {activeTab === 'creators' && (
                            <td className="px-md py-md">
                              <Skeleton variant="text" width="60px" className="mx-auto" />
                            </td>
                          )}
                          <td className="px-md py-md">
                            <Skeleton variant="rectangular" width="100px" height="36px" className="mx-auto" />
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === 'creators' ? 6 : 5} className="px-md py-xl text-center">
                        <div className="flex flex-col items-center gap-md">
                          {searchQuery ? (
                            <>
                              <Search className="w-12 h-12 text-primary/30" />
                              <p className="text-body text-primary/70">No results found for "{searchQuery}"</p>
                              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                                Clear search
                              </Button>
                            </>
                          ) : (
                            <>
                              <Trophy className="w-12 h-12 text-primary/30" />
                              <div className="max-w-md">
                                <p className="text-body font-bold mb-xs">
                                  {activeTab === 'creators' ? 'No Creators on Leaderboard Yet' : 'No Tippers Yet'}
                                </p>
                                <p className="text-body-sm text-primary/70 mb-md">
                                  {activeTab === 'creators'
                                    ? totalRegistrations > 0
                                      ? `${totalRegistrations} creator${totalRegistrations === 1 ? '' : 's'} registered! The leaderboard will show creators once they receive their first tip. Be the first to support a creator!`
                                      : 'Creators will appear here once they receive their first tip. Be the first to support a creator!'
                                    : 'Tippers will appear here once they send their first tip. Be the first to tip a creator!'}
                                </p>
                                <Link to={activeTab === 'creators' ? '/dashboard' : '/register'}>
                                  <Button variant="primary" size="sm">
                                    {activeTab === 'creators' ? 'Send a Tip' : 'Get Started'}
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && paginatedData.length > 0 && (
                    <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                      {paginatedData.map((entry) => (
                        <motion.tr
                          key={entry.username}
                          variants={itemVariants}
                          className="border-b-2 border-primary/20 hover:bg-accent transition-colors"
                        >
                          <td className="px-md py-md">
                            <span className="text-h4 font-bold">{rankEmoji(entry.rank)}</span>
                          </td>
                          <td className="px-md py-md">
                            <Link
                              to={`/@${entry.username}`}
                              className="flex items-center gap-sm hover:text-brand transition-colors"
                            >
                              <Avatar
                                src={entry.profileImage}
                                alt={`${entry.username} profile`}
                                fallbackText={entry.username.slice(0, 2).toUpperCase()}
                                size="sm"
                              />
                              <span className="font-medium">@{entry.username}</span>
                            </Link>
                          </td>
                          <td className="px-md py-md text-right">
                            <span className="font-bold text-brand">{entry.totalAmountFormatted}</span>
                          </td>
                          <td className="px-md py-md text-center">
                            <Badge variant="default">{entry.count} tips</Badge>
                          </td>
                          {activeTab === 'creators' && (
                            <td className="px-md py-md text-center">
                              <span className="font-medium">{entry.creditScore}/1000</span>
                            </td>
                          )}
                          <td className="px-md py-md text-center">
                            <Link to={`/@${entry.username}`}>
                              <Button variant="primary" size="sm">
                                View Profile
                              </Button>
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  )}
                </tbody>
              </table>
            </Card>

            <div className="md:hidden space-y-md">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-md">
                {isLoading
                  ? Array.from({ length: 5 }, (_, index) => index).map((skeletonId) => (
                      <Card key={`mobile-skeleton-${skeletonId}`} variant="elevated" padding="md">
                        <div className="space-y-sm">
                          <div className="flex items-center gap-sm">
                            <Skeleton variant="text" width="40px" />
                            <Skeleton variant="circular" width="48px" height="48px" />
                            <Skeleton variant="text" width="100px" />
                          </div>
                          <Skeleton variant="text" width="100%" />
                          <Skeleton variant="rectangular" width="100%" height="36px" />
                        </div>
                      </Card>
                    ))
                  : null}

                {!isLoading && paginatedData.length === 0 && (
                  <Card variant="elevated" padding="lg">
                    <div className="flex flex-col items-center gap-md text-center">
                      {searchQuery ? (
                        <>
                          <Search className="w-12 h-12 text-primary/30" />
                          <p className="text-body text-primary/70">No results found for "{searchQuery}"</p>
                          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                            Clear search
                          </Button>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-12 h-12 text-primary/30" />
                          <div>
                            <p className="text-body font-bold mb-xs">
                              {activeTab === 'creators' ? 'No Creators on Leaderboard Yet' : 'No Tippers Yet'}
                            </p>
                            <p className="text-body-sm text-primary/70 mb-md">
                              {activeTab === 'creators'
                                ? totalRegistrations > 0
                                  ? `${totalRegistrations} creator${totalRegistrations === 1 ? '' : 's'} registered! The leaderboard will show creators once they receive their first tip. Be the first to support a creator!`
                                  : 'Creators will appear here once they receive their first tip. Be the first to support a creator!'
                                : 'Tippers will appear here once they send their first tip. Be the first to tip a creator!'}
                            </p>
                            <Link to={activeTab === 'creators' ? '/dashboard' : '/register'}>
                              <Button variant="primary" size="sm">
                                {activeTab === 'creators' ? 'Send a Tip' : 'Get Started'}
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {!isLoading &&
                  paginatedData.map((entry) => (
                    <motion.div key={entry.username} variants={itemVariants}>
                      <Card variant="elevated" padding="md" className="hover:shadow-brutalist-lg transition-shadow">
                        <div className="space-y-sm">
                          <div className="flex items-center gap-sm">
                            <span className="text-h3 font-bold">{rankEmoji(entry.rank)}</span>
                            <Link to={`/@${entry.username}`} className="flex items-center gap-sm flex-1">
                              <Avatar
                                src={entry.profileImage}
                                alt={`${entry.username} profile`}
                                fallbackText={entry.username.slice(0, 2).toUpperCase()}
                                size="md"
                              />
                              <span className="font-bold">@{entry.username}</span>
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-sm">
                            <div>
                              <p className="text-caption text-text-muted">Total Amount</p>
                              <p className="font-bold text-brand">{entry.totalAmountFormatted}</p>
                            </div>
                            <div>
                              <p className="text-caption text-text-muted">Tips Count</p>
                              <p className="font-bold">{entry.count}</p>
                            </div>
                            {activeTab === 'creators' && (
                              <div className="col-span-2">
                                <p className="text-caption text-text-muted">Credit Score</p>
                                <p className="font-bold">{entry.creditScore}/1000</p>
                              </div>
                            )}
                          </div>

                          <Link to={`/@${entry.username}`} className="block">
                            <Button variant="primary" size="md" className="w-full">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </motion.div>
            </div>

            {!isLoading && filteredLeaderboardData.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center gap-md">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-xs">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-lg">
            {discoverHighlights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                {discoverHighlights.map(({ id, title, description, icon: Icon, accentClass, creator }) => (
                  <Card key={id} variant="elevated" padding="lg" className="h-full">
                    <div className="flex flex-col gap-sm h-full">
                      <div className={`flex items-center gap-xs rounded-full px-3 py-1 text-caption font-medium ${accentClass}`}>
                        <Icon className="w-4 h-4" />
                        {title}
                      </div>
                      <Link
                        to={`/@${creator.username}`}
                        className="flex items-center gap-sm hover:text-brand transition-colors"
                      >
                        <Avatar
                          src={creator.avatarUrl}
                          alt={`${creator.username} profile`}
                          fallbackText={creator.username.slice(0, 2).toUpperCase()}
                          size="md"
                        />
                        <span className="text-h4 font-semibold">@{creator.username}</span>
                      </Link>
                      <p className="text-body-sm text-text-muted flex-1">{description}</p>
                      <div className="flex flex-wrap gap-xs">
                        <Badge variant="outline">Credit {creator.creditScore}</Badge>
                        <Badge variant="outline">{creator.followers.toLocaleString()} followers</Badge>
                        <Badge variant="outline">{creator.totalTipsDisplay}</Badge>
                      </div>
                      <div className="flex gap-sm">
                        <Link to={`/@${creator.username}`} className="flex-1">
                          <Button variant="primary" size="sm" className="w-full">
                            Tip this creator
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {Array.from({ length: 6 }, (_, index) => index).map((skeletonId) => (
                  <Card key={`discover-skeleton-${skeletonId}`} variant="elevated" padding="lg">
                    <div className="space-y-md">
                      <div className="flex items-center gap-sm">
                        <Skeleton variant="circular" width="56px" height="56px" />
                        <div className="flex-1 space-y-xs">
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </div>
                      </div>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rectangular" width="100%" height="36px" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredDiscoverCreators.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md"
              >
                {filteredDiscoverCreators.map((creator) => (
                  <motion.div key={creator.walletAddress} variants={itemVariants}>
                    <Card variant="elevated" padding="lg" className="h-full flex flex-col">
                      <div className="flex items-center gap-sm mb-md">
                        <Avatar
                          src={creator.avatarUrl}
                          alt={`${creator.username} profile`}
                          fallbackText={creator.username.slice(0, 2).toUpperCase()}
                          size="lg"
                        />
                        <div>
                          <Link to={`/@${creator.username}`} className="font-semibold text-h5 hover:text-brand transition-colors">
                            @{creator.username}
                          </Link>
                          <p className="text-caption text-text-muted">{formatRelativeFromNow(creator.joinedAt)}</p>
                        </div>
                      </div>

                      <div className="space-y-sm text-body-sm text-text-muted mb-md">
                        <p className="flex items-center justify-between">
                          <span>Credit score</span>
                          <span className="font-semibold text-text-primary">{creator.creditScore}/1000</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Followers</span>
                          <span className="font-semibold text-text-primary">{creator.followers.toLocaleString()}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Total tips received</span>
                          <span className="font-semibold text-text-primary">{creator.totalTipsDisplay}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Tips count</span>
                          <span className="font-semibold text-text-primary">{creator.totalTipsCount.toLocaleString()}</span>
                        </p>
                      </div>

                      <div className="mt-auto space-y-sm">
                        <Link to={`/@${creator.username}`}>
                          <Button variant="primary" className="w-full">
                            Tip this creator
                          </Button>
                        </Link>
                        <Link to={`/@${creator.username}`}>
                          <Button variant="secondary" className="w-full">
                            View profile
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card variant="elevated" padding="xl" className="text-center">
                <div className="flex flex-col items-center gap-md">
                  <Sparkles className="w-12 h-12 text-brand/60" />
                  <h2 className="text-h4 font-semibold">No creators match that search yet</h2>
                  <p className="text-body text-text-muted max-w-lg">
                    Try a different username or wallet address. New creators join Tipz every day, so check back soon or invite someone you love.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === 'discover' && !directoryLoading && !discoverCreators.length && (
              <Card variant="elevated" padding="xl" className="text-center">
                <div className="flex flex-col items-center gap-md">
                  <Loader2 className="w-12 h-12 animate-spin text-brand" />
                  <h2 className="text-h4 font-semibold">Fetching creator directory…</h2>
                  <p className="text-body text-text-muted max-w-md">
                    Hang tight while we sync with the Tipz profile registry. Creators will appear here as soon as the network responds.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Trophy, Search, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Input } from '@/components/atoms/Input';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useTopCreators, useTopTippers, useAllRegisteredUsers } from '@/hooks/useLeaderboard';
import { useLeaderboardStream } from '@/hooks/useStreams';
import { formatEther } from 'viem';

// Types
type LeaderboardTab = 'creators' | 'tippers';
type SortField = 'rank' | 'amount' | 'count' | 'score';
type SortOrder = 'asc' | 'desc';

// Helper functions
const rankEmoji = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
};

// Get IPFS image URL (currently unused but ready for future enhancement)
// const getIpfsUrl = (ipfsHash?: string): string | undefined => {
//   if (!ipfsHash) return undefined;
//   const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';
//   return `${gatewayUrl}/ipfs/${ipfsHash}`;
// };

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const ITEMS_PER_PAGE = 10;

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('creators');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Get real-time data from contract
  const { creators, isLoading: creatorsLoading } = useTopCreators(50);
  const { tippers, isLoading: tippersLoading } = useTopTippers(50);
  const { totalRegistrations, error: registrationsError } = useAllRegisteredUsers();
  
  // Debug logging
  console.log('[Leaderboard Debug]', {
    totalRegistrations,
    registrationsError,
    creators,
    creatorsCount: creators.length,
    creatorsLoading,
    tippers,
    tippersCount: tippers.length,
    tippersLoading,
  });
  
  // Subscribe to real-time leaderboard updates via Somnia Streams
  useLeaderboardStream({
    enabled: true,
    keepHistory: false,
    onEvent: () => {
      // Trigger refetch when leaderboard updates arrive
      // This will be automatically handled by react-query cache invalidation
    },
  });

  // Format data for display with IPFS images
  const formattedCreators = useMemo(() => 
    creators.map(creator => ({
      ...creator,
      totalAmount: formatEther(creator.totalAmount),
      profileImage: creator.profileImage, // Will be undefined initially, could fetch separately
    })),
    [creators]
  );

  const formattedTippers = useMemo(() => 
    tippers.map(tipper => ({
      ...tipper,
      totalAmount: formatEther(tipper.totalAmount),
      profileImage: tipper.profileImage, // Will be undefined initially, could fetch separately
    })),
    [tippers]
  );

  const isLoading = activeTab === 'creators' ? creatorsLoading : tippersLoading;

  // Get current data based on active tab
  const data = activeTab === 'creators' ? formattedCreators : formattedTippers;

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data.filter((entry) =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortField === 'amount') {
        aVal = Number.parseFloat(a.totalAmount.split(' ')[0]);
        bVal = Number.parseFloat(b.totalAmount.split(' ')[0]);
      } else if (sortField === 'count') {
        aVal = a.count;
        bVal = b.count;
      } else if (sortField === 'score') {
        aVal = a.creditScore || 0;
        bVal = b.creditScore || 0;
      } else {
        // rank or default
        aVal = a.rank;
        bVal = b.rank;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [data, searchQuery, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleTabChange = (tab: LeaderboardTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  return (
    <>
      <Helmet>
        <title>Leaderboard - Top Creators & Tippers | Tipz</title>
        <meta
          name="description"
          content="Discover the top creators and tippers on Tipz. View real-time rankings, total tips, and credit scores."
        />
        <meta name="keywords" content="tipz, leaderboard, top creators, top tippers, rankings, blockchain" />
      </Helmet>

      <div className="container mx-auto px-md py-xl space-y-lg">
        {/* Header */}
        <div className="text-center space-y-sm">
          <div className="flex items-center justify-center gap-sm">
            <Trophy className="w-10 h-10 text-brand" />
            <h1 className="text-h1 font-bold">Leaderboard</h1>
          </div>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            Discover the top creators and tippers on Tipz. Rankings updated in real-time.
          </p>
          <Badge variant="success" className="inline-flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{' '}
            Live
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-md">
          <Button
            variant={activeTab === 'creators' ? 'primary' : 'secondary'}
            onClick={() => handleTabChange('creators')}
            className="flex items-center gap-sm"
          >
            <TrendingUp className="w-5 h-5" />
            Top Creators
          </Button>
          <Button
            variant={activeTab === 'tippers' ? 'primary' : 'secondary'}
            onClick={() => handleTabChange('tippers')}
            className="flex items-center gap-sm"
          >
            <Trophy className="w-5 h-5" />
            Top Tippers
          </Button>
        </div>

        {/* Search and Sort Controls */}
        <Card variant="flat" padding="md">
          <div className="flex flex-col md:flex-row gap-md items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-sm flex-wrap justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('rank')}
                className="flex items-center gap-xs"
              >
                Rank
                {sortField === 'rank' && (
                  <ArrowUpDown className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('amount')}
                className="flex items-center gap-xs"
              >
                Amount
                {sortField === 'amount' && (
                  <ArrowUpDown className="w-4 h-4" />
                )}
              </Button>
              {activeTab === 'creators' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('score')}
                  className="flex items-center gap-xs"
                >
                  Score
                  {sortField === 'score' && (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Desktop Table */}
        <Card variant="elevated" padding="none" className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-3 border-primary bg-accent">
              <tr>
                <th className="px-md py-md text-left font-bold">Rank</th>
                <th className="px-md py-md text-left font-bold">User</th>
                <th className="px-md py-md text-right font-bold">Total Amount</th>
                <th className="px-md py-md text-center font-bold">Tips Count</th>
                {activeTab === 'creators' && (
                  <th className="px-md py-md text-center font-bold">Credit Score</th>
                )}
                <th className="px-md py-md text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }, (_, i) => i + 1).map((skeletonId) => (
                    <tr key={`skeleton-${skeletonId}`} className="border-b-2 border-primary/20">
                      <td className="px-md py-md">
                        <Skeleton variant="text" width="40px" />
                      </td>
                      <td className="px-md py-md">
                        <div className="flex items-center gap-sm">
                          <Skeleton variant="circular" width="40px" height="40px" />
                          <Skeleton variant="text" width="120px" />
                        </div>
                      </td>
                      <td className="px-md py-md">
                        <Skeleton variant="text" width="100px" className="ml-auto" />
                      </td>
                      <td className="px-md py-md">
                        <Skeleton variant="rectangular" width="80px" height="24px" className="mx-auto" />
                      </td>
                      {activeTab === 'creators' && (
                        <td className="px-md py-md">
                          <Skeleton variant="text" width="60px" className="mx-auto" />
                        </td>
                      )}
                      <td className="px-md py-md">
                        <Skeleton variant="rectangular" width="100px" height="36px" className="mx-auto" />
                      </td>
                    </tr>
                  ))
                : null}

              {!isLoading && paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'creators' ? 6 : 5} className="px-md py-xl text-center">
                    <div className="flex flex-col items-center gap-md">
                      {searchQuery ? (
                        <>
                          <Search className="w-12 h-12 text-primary/30" />
                          <p className="text-body text-primary/70">No results found for "{searchQuery}"</p>
                          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                            Clear search
                          </Button>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-12 h-12 text-primary/30" />
                          <div className="max-w-md">
                            <p className="text-body font-bold mb-xs">
                              {activeTab === 'creators' ? 'No Creators on Leaderboard Yet' : 'No Tippers Yet'}
                            </p>
                            <p className="text-body-sm text-primary/70 mb-md">
                              {activeTab === 'creators' 
                                ? totalRegistrations > 0
                                  ? `${totalRegistrations} creator${totalRegistrations === 1 ? '' : 's'} registered! The leaderboard will show creators once they receive their first tip. Be the first to support a creator!`
                                  : "Creators will appear here once they receive their first tip. Be the first to support a creator!"
                                : "Tippers will appear here once they send their first tip. Be the first to tip a creator!"
                              }
                            </p>
                            <Link to={activeTab === 'creators' ? '/dashboard' : '/register'}>
                              <Button variant="primary" size="sm">
                                {activeTab === 'creators' ? 'Send a Tip' : 'Get Started'}
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && paginatedData.length > 0 && (
                <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                  {paginatedData.map((entry) => (
                    <motion.tr
                      key={entry.username}
                      variants={itemVariants}
                      className="border-b-2 border-primary/20 hover:bg-accent transition-colors"
                    >
                      <td className="px-md py-md">
                        <span className="text-h4 font-bold">{rankEmoji(entry.rank)}</span>
                      </td>
                      <td className="px-md py-md">
                        <Link
                          to={`/@${entry.username}`}
                          className="flex items-center gap-sm hover:text-brand transition-colors"
                        >
                          <Avatar
                            src={entry.profileImage}
                            alt={`${entry.username} profile`}
                            fallbackText={entry.username.slice(0, 2).toUpperCase()}
                            size="sm"
                          />
                          <span className="font-medium">@{entry.username}</span>
                        </Link>
                      </td>
                      <td className="px-md py-md text-right">
                        <span className="font-bold text-brand">{entry.totalAmount}</span>
                      </td>
                      <td className="px-md py-md text-center">
                        <Badge variant="default">{entry.count} tips</Badge>
                      </td>
                      {activeTab === 'creators' && (
                        <td className="px-md py-md text-center">
                          <span className="font-medium">{entry.creditScore}/1000</span>
                        </td>
                      )}
                      <td className="px-md py-md text-center">
                        <Link to={`/@${entry.username}`}>
                          <Button variant="primary" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              )}
            </tbody>
          </table>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-md">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-md">
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => i + 1).map((skeletonId) => (
                  <Card key={`mobile-skeleton-${skeletonId}`} variant="elevated" padding="md">
                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm">
                        <Skeleton variant="text" width="40px" />
                        <Skeleton variant="circular" width="48px" height="48px" />
                        <Skeleton variant="text" width="100px" />
                      </div>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="rectangular" width="100%" height="36px" />
                    </div>
                  </Card>
                ))
              : null}

            {!isLoading && paginatedData.length === 0 && (
              <Card variant="elevated" padding="lg">
                <div className="flex flex-col items-center gap-md text-center">
                  {searchQuery ? (
                    <>
                      <Search className="w-12 h-12 text-primary/30" />
                      <p className="text-body text-primary/70">No results found for "{searchQuery}"</p>
                      <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-12 h-12 text-primary/30" />
                      <div>
                        <p className="text-body font-bold mb-xs">
                          {activeTab === 'creators' ? 'No Creators on Leaderboard Yet' : 'No Tippers Yet'}
                        </p>
                        <p className="text-body-sm text-primary/70 mb-md">
                          {activeTab === 'creators' 
                            ? totalRegistrations > 0
                              ? `${totalRegistrations} creator${totalRegistrations === 1 ? '' : 's'} registered! The leaderboard will show creators once they receive their first tip. Be the first to support a creator!`
                              : "Creators will appear here once they receive their first tip. Be the first to support a creator!"
                            : "Tippers will appear here once they send their first tip. Be the first to tip a creator!"
                          }
                        </p>
                        <Link to={activeTab === 'creators' ? '/dashboard' : '/register'}>
                          <Button variant="primary" size="sm">
                            {activeTab === 'creators' ? 'Send a Tip' : 'Get Started'}
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {!isLoading &&
              paginatedData.map((entry) => (
                <motion.div key={entry.username} variants={itemVariants}>
                  <Card variant="elevated" padding="md" className="hover:shadow-brutalist-lg transition-shadow">
                    <div className="space-y-sm">
                      {/* Rank and User */}
                      <div className="flex items-center gap-sm">
                        <span className="text-h3 font-bold">{rankEmoji(entry.rank)}</span>
                        <Link to={`/@${entry.username}`} className="flex items-center gap-sm flex-1">
                          <Avatar
                            src={entry.profileImage}
                            alt={`${entry.username} profile`}
                            fallbackText={entry.username.slice(0, 2).toUpperCase()}
                            size="md"
                          />
                          <span className="font-bold">@{entry.username}</span>
                        </Link>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-sm">
                        <div>
                          <p className="text-caption text-text-muted">Total Amount</p>
                          <p className="font-bold text-brand">{entry.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-caption text-text-muted">Tips Count</p>
                          <p className="font-bold">{entry.count}</p>
                        </div>
                        {activeTab === 'creators' && (
                          <div className="col-span-2">
                            <p className="text-caption text-text-muted">Credit Score</p>
                            <p className="font-bold">{entry.creditScore}/1000</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link to={`/@${entry.username}`} className="block">
                        <Button variant="primary" size="md" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        </div>

        {/* Pagination */}
        {!isLoading && filteredData.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center gap-md">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex gap-xs">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
