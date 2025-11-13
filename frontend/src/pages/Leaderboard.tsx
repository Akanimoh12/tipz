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
import { useTopCreators, useTopTippers } from '@/hooks/useLeaderboard';
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
  
  // Subscribe to real-time leaderboard updates via Somnia Streams
  useLeaderboardStream({
    enabled: true,
    keepHistory: false,
    onEvent: () => {
      // Trigger refetch when leaderboard updates arrive
      // This will be automatically handled by react-query cache invalidation
    },
  });

  // Format data for display
  const formattedCreators = useMemo(() => 
    creators.map(creator => ({
      ...creator,
      totalAmount: formatEther(creator.totalAmount),
    })),
    [creators]
  );

  const formattedTippers = useMemo(() => 
    tippers.map(tipper => ({
      ...tipper,
      totalAmount: formatEther(tipper.totalAmount),
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
                      <Search className="w-12 h-12 text-primary/30" />
                      <p className="text-body text-primary/70">No results found</p>
                      {searchQuery && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                          Clear search
                        </Button>
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
                  <Search className="w-12 h-12 text-primary/30" />
                  <p className="text-body text-primary/70">No results found</p>
                  {searchQuery && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
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
