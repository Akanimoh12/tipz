import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import { Navigate, Link } from 'react-router-dom';
import { TrendingUp, Wallet, Zap, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StatDisplay } from '@/components/molecules/StatDisplay';
import { ActivityFeed } from '@/components/organisms/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useModalStore } from '@/store';
import { formatEther } from 'viem';

export function Dashboard() {
  const { isConnected } = useAccount();
  const { openWithdrawModal } = useModalStore();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  // Mock data - replace with actual hooks
  const stats = {
    totalReceived: BigInt('1250000000000000000'), // 1.25 ETH
    totalSent: BigInt('500000000000000000'), // 0.5 ETH
    withdrawableBalance: BigInt('1225000000000000000'), // 1.225 ETH (98% of received)
    tipsCount: 45,
    creditScore: 750,
    isLoading: false,
  };

  const handleWithdraw = () => {
    openWithdrawModal({
      availableBalance: stats.withdrawableBalance,
    });
  };

  if (stats.isLoading) {
    return (
      <div className="min-h-screen bg-accent py-xl">
        <div className="container mx-auto px-md">
          <Skeleton variant="rectangular" height="600px" />
        </div>
      </div>
    );
  }

  const hasNoActivity = stats.tipsCount === 0;

  return (
    <>
      <Helmet>
        <title>Dashboard - Tipz</title>
        <meta name="description" content="View your tipping activity, balance, and statistics on Tipz." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="min-h-screen bg-accent py-xl">
        <div className="container mx-auto px-md">
          <div className="mb-xl">
            <h1 className="text-h1 font-bold mb-xs">Dashboard</h1>
            <p className="text-body text-primary/70">
              Welcome back! Here's your tipping activity overview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
            <StatDisplay
              icon={Wallet}
              label="Available Balance"
              value={formatEther(stats.withdrawableBalance)}
              suffix="ETH"
              className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
            />

            <StatDisplay
              icon={ArrowDownRight}
              label="Tips Received"
              value={formatEther(stats.totalReceived)}
              suffix="ETH"
              trend={{ value: 12.5, direction: 'up' }}
              className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
            />

            <StatDisplay
              icon={ArrowUpRight}
              label="Tips Sent"
              value={formatEther(stats.totalSent)}
              suffix="ETH"
              className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
            />

            <StatDisplay
              icon={Users}
              label="Total Tips"
              value={stats.tipsCount}
              trend={{ value: 8.3, direction: 'up' }}
              className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
            <div className="lg:col-span-2">
              <Card variant="default" padding="none">
                <CardHeader>
                  <CardTitle>Activity Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasNoActivity ? (
                    <div className="text-center py-xl">
                      <Zap className="w-16 h-16 mx-auto mb-md text-primary/30" />
                      <h3 className="text-h4 font-bold mb-xs">No Activity Yet</h3>
                      <p className="text-body text-primary/70 mb-lg max-w-md mx-auto">
                        Start tipping creators to see your activity here. All tips are recorded on-chain.
                      </p>
                      <Link to="/">
                        <Button variant="primary" size="md">
                          <Zap className="w-4 h-4 mr-2xs" />
                          Explore Creators
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ActivityFeed maxItems={10} showConnectionStatus />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-lg">
              <Card variant="elevated" padding="md">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-sm">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={handleWithdraw}
                      disabled={stats.withdrawableBalance === BigInt(0)}
                    >
                      <Wallet className="w-4 h-4 mr-2xs" />
                      Withdraw Tips
                    </Button>

                    <Link to="/profile" className="w-full">
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full"
                      >
                        <Users className="w-4 h-4 mr-2xs" />
                        View Profile
                      </Button>
                    </Link>

                    <Link to="/leaderboard" className="w-full">
                      <Button
                        variant="ghost"
                        size="md"
                        className="w-full"
                      >
                        <TrendingUp className="w-4 h-4 mr-2xs" />
                        Leaderboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Credit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-h1 font-bold mb-xs text-green-600">
                      {stats.creditScore}
                    </div>
                    <p className="text-body-sm text-primary/70 mb-md">out of 1000</p>
                    <div className="w-full bg-accent rounded-full h-3 overflow-hidden border-2 border-primary">
                      <div
                        className="h-full bg-green-600 transition-all duration-500"
                        style={{ width: `${(stats.creditScore / 1000) * 100}%` }}
                      />
                    </div>
                    <p className="text-body-sm text-primary/70 mt-sm">
                      Based on your X (Twitter) profile
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
