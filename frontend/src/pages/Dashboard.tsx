import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, Zap, Users, ArrowUpRight, ArrowDownRight, UserPlus } from 'lucide-react';
import { StatDisplay } from '@/components/molecules/StatDisplay';
import { ActivityFeed } from '@/components/organisms/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useModalStore } from '@/store';
import { useIsRegistered } from '@/hooks/useProfile';
import { useUserStats, usePlatformStats } from '@/hooks/useUserStats';
import { formatEther } from 'viem';

export function Dashboard() {
  const { isConnected, address } = useAccount();
  const { openWithdrawModal } = useModalStore();
  const { isRegistered, isLoading: checkingRegistration } = useIsRegistered(address);

  // Allow viewing dashboard without connection, but show different content
  const canAccessPersonalData = isConnected && isRegistered;
  const needsRegistration = isConnected && !isRegistered;

  // Get real user stats from contract
  const userStats = useUserStats(address);
  
  // Get platform-wide stats
  const platformStats = usePlatformStats();

  const handleWithdraw = () => {
    openWithdrawModal({
      availableBalance: userStats.withdrawableBalance,
    });
  };

  if (userStats.isLoading || checkingRegistration) {
    return (
      <div className="min-h-screen bg-accent py-xl">
        <div className="container mx-auto px-md">
          <Skeleton variant="rectangular" height="600px" />
        </div>
      </div>
    );
  }

  const hasNoActivity = userStats.tipsCount === 0;

  return (
    <>
      <Helmet>
        <title>Dashboard - Tipz</title>
        <meta name="description" content="View your tipping activity, balance, and statistics on Tipz." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="min-h-screen bg-accent py-xl">
        <div className="container mx-auto px-md">
          {/* Show registration prompt if connected but not registered */}
          {needsRegistration && !checkingRegistration && (
            <Card variant="elevated" padding="md" className="mb-lg border-2 border-brand">
              <div className="flex items-center justify-between gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-h4 font-bold mb-xs">Complete Your Profile</h3>
                    <p className="text-body-sm text-primary/70">
                      Connect your wallet and register to unlock your personal dashboard
                    </p>
                  </div>
                </div>
                <Link to="/register">
                  <Button variant="brand" size="sm">
                    Register Now
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Show connect wallet prompt if not connected */}
          {!isConnected && (
            <Card variant="elevated" padding="md" className="mb-lg border-2 border-primary">
              <div className="flex items-center justify-between gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 font-bold mb-xs">Connect Your Wallet</h3>
                    <p className="text-body-sm text-primary/70">
                      View platform stats below, or connect to see your personal dashboard
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="mb-xl">
            <h1 className="text-h1 font-bold mb-xs">
              {canAccessPersonalData ? 'Your Dashboard' : 'Platform Overview'}
            </h1>
            <p className="text-body text-primary/70">
              {canAccessPersonalData 
                ? "Welcome back! Here's your tipping activity overview."
                : "Explore the Tipz platform stats and top activities."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
            {canAccessPersonalData ? (
              <>
                <StatDisplay
                  icon={Wallet}
                  label="Available Balance"
                  value={formatEther(userStats.withdrawableBalance)}
                  suffix="ETH"
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={ArrowDownRight}
                  label="Tips Received"
                  value={formatEther(userStats.totalReceived)}
                  suffix="ETH"
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={ArrowUpRight}
                  label="Tips Sent"
                  value={formatEther(userStats.totalSent)}
                  suffix="ETH"
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={Users}
                  label="Total Tips"
                  value={userStats.tipsCount}
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />
              </>
            ) : (
              <>
                {/* Platform-wide stats for non-registered users */}
                <StatDisplay
                  icon={Users}
                  label="Total Users"
                  value={platformStats.totalUsers > 0 ? platformStats.totalUsers.toLocaleString() : "Coming Soon"}
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={Zap}
                  label="Total Tips Sent"
                  value={platformStats.totalTips > 0 ? platformStats.totalTips.toLocaleString() : "Coming Soon"}
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={TrendingUp}
                  label="Total Volume"
                  value={platformStats.totalVolume > 0n ? formatEther(platformStats.totalVolume) : "0"}
                  suffix="ETH"
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />

                <StatDisplay
                  icon={Users}
                  label="Active Creators"
                  value={platformStats.activeCreators > 0 ? platformStats.activeCreators.toLocaleString() : "Coming Soon"}
                  className="bg-secondary p-md border-3 border-primary rounded-brutalist shadow-brutalist"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
            <div className="lg:col-span-2">
              <Card variant="default" padding="none">
                <CardHeader>
                  <CardTitle>
                    {canAccessPersonalData ? 'Your Activity Feed' : 'Recent Platform Activity'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {canAccessPersonalData ? (
                    <>
                      {hasNoActivity ? (
                        <div className="text-center py-xl">
                          <Zap className="w-16 h-16 mx-auto mb-md text-primary/30" />
                          <h3 className="text-h4 font-bold mb-xs">No Activity Yet</h3>
                          <p className="text-body text-primary/70 mb-lg max-w-md mx-auto">
                            Start tipping creators to see your activity here. All tips are recorded on-chain.
                          </p>
                          <div className="flex gap-sm justify-center">
                            <Link to="/leaderboard">
                              <Button variant="primary" size="md">
                                <TrendingUp className="w-4 h-4 mr-2xs" />
                                Discover Creators
                              </Button>
                            </Link>
                            <Link to="/">
                              <Button variant="secondary" size="md">
                                Back to Home
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <ActivityFeed maxItems={10} showConnectionStatus />
                      )}
                    </>
                  ) : (
                    <div className="text-center py-xl">
                      <Zap className="w-16 h-16 mx-auto mb-md text-primary/30" />
                      <h3 className="text-h4 font-bold mb-xs">Explore Platform Activity</h3>
                      <p className="text-body text-primary/70 mb-lg max-w-md mx-auto">
                        See recent tips from the community. Connect your wallet and register to track your own activity!
                      </p>
                      <div className="mb-lg">
                        {/* Show global activity feed */}
                        <ActivityFeed maxItems={5} showConnectionStatus={false} />
                      </div>
                      <div className="flex gap-sm justify-center">
                        {isConnected ? (
                          <Link to="/register">
                            <Button variant="primary" size="md">
                              <UserPlus className="w-4 h-4 mr-2xs" />
                              Complete Registration
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="primary" size="md">
                            <Wallet className="w-4 h-4 mr-2xs" />
                            Connect Wallet
                          </Button>
                        )}
                        <Link to="/leaderboard">
                          <Button variant="secondary" size="md">
                            <TrendingUp className="w-4 h-4 mr-2xs" />
                            View Leaderboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-lg">
              {canAccessPersonalData ? (
                <>
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
                          disabled={userStats.withdrawableBalance === BigInt(0)}
                        >
                          <Wallet className="w-4 h-4 mr-2xs" />
                          Withdraw Tips
                        </Button>

                        <Link to="/@me" className="w-full">
                          <Button
                            variant="secondary"
                            size="md"
                            className="w-full"
                          >
                            <Users className="w-4 h-4 mr-2xs" />
                            View My Profile
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
                          {userStats.creditScore}
                        </div>
                        <p className="text-body-sm text-primary/70 mb-md">out of 1000</p>
                        <div className="w-full bg-accent rounded-full h-3 overflow-hidden border-2 border-primary">
                          <div
                            className="h-full bg-green-600 transition-all duration-500"
                            style={{ width: `${(userStats.creditScore / 1000) * 100}%` }}
                          />
                        </div>
                        <p className="text-body-sm text-primary/70 mt-sm">
                          Based on your X (Twitter) profile
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card variant="elevated" padding="md">
                    <CardHeader>
                      <CardTitle>Get Started</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-sm">
                        <Link to="/leaderboard" className="w-full">
                          <Button
                            variant="primary"
                            size="md"
                            className="w-full"
                          >
                            <TrendingUp className="w-4 h-4 mr-2xs" />
                            Explore Creators
                          </Button>
                        </Link>

                        {isConnected ? (
                          <Link to="/register" className="w-full">
                            <Button
                              variant="secondary"
                              size="md"
                              className="w-full"
                            >
                              <UserPlus className="w-4 h-4 mr-2xs" />
                              Register Now
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="secondary"
                            size="md"
                            className="w-full"
                          >
                            <Wallet className="w-4 h-4 mr-2xs" />
                            Connect Wallet
                          </Button>
                        )}

                        <Link to="/" className="w-full">
                          <Button
                            variant="ghost"
                            size="md"
                            className="w-full"
                          >
                            Back to Home
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="default" padding="md">
                    <CardHeader>
                      <CardTitle>Why Register?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-sm text-body-sm text-primary/70">
                        <div className="flex items-start gap-xs">
                          <Zap className="w-4 h-4 mt-xs flex-shrink-0 text-brand" />
                          <p>Receive tips from supporters</p>
                        </div>
                        <div className="flex items-start gap-xs">
                          <TrendingUp className="w-4 h-4 mt-xs flex-shrink-0 text-brand" />
                          <p>Build your credit score</p>
                        </div>
                        <div className="flex items-start gap-xs">
                          <Users className="w-4 h-4 mt-xs flex-shrink-0 text-brand" />
                          <p>Track your tipping activity</p>
                        </div>
                        <div className="flex items-start gap-xs">
                          <Wallet className="w-4 h-4 mt-xs flex-shrink-0 text-brand" />
                          <p>Withdraw your earnings anytime</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
