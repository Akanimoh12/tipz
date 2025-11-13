import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Share2, TrendingUp, Users, Zap, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Address } from 'viem';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { Skeleton } from '@/components/atoms/Skeleton';
import { StatDisplay } from '@/components/molecules/StatDisplay';
import { useModalStore } from '@/store/useModalStore';
import { useLiveTickerStream } from '@/hooks/useLiveTickerStream';
import { xapiService } from '@/services/xapi.service';


interface ProfileData {
  username: string;
  name: string;
  walletAddress: string;
  creditScore: number;
  totalTipsReceived: string;
  totalTipsCount: number;
  followers: number;
  posts: number;
  replies: number;
  profileImageIpfs?: string;
  createdAt: number;
  isActive: boolean;
}

function getCreditScoreTier(score: number): { tier: string; color: string } {
  if (score >= 851) return { tier: '💎 Diamond', color: 'text-blue-600' };
  if (score >= 601) return { tier: '🥇 Gold', color: 'text-yellow-600' };
  if (score >= 301) return { tier: '🥈 Silver', color: 'text-gray-500' };
  return { tier: '🥉 Bronze', color: 'text-orange-600' };
}

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const openTipModal = useModalStore((state) => state.openTipModal);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;

  const { tips: recentTips, isConnected } = useLiveTickerStream({ 
    windowSize: 10,
    enabled: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!cleanUsername) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockProfile: ProfileData = {
          username: cleanUsername,
          name: 'Demo Creator',
          walletAddress: '0x1234567890123456789012345678901234567890',
          creditScore: 750,
          totalTipsReceived: '45.5',
          totalTipsCount: 120,
          followers: 1250,
          posts: 450,
          replies: 320,
          profileImageIpfs: '',
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          isActive: true,
        };

        setProfile(mockProfile);
        setNotFound(false);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [cleanUsername]);

  const handleTipClick = () => {
    if (!profile) return;

    openTipModal({
      toUsername: profile.username,
      toAddress: profile.walletAddress as Address,
      profileImageIpfs: profile.profileImageIpfs,
      creditScore: profile.creditScore,
    });
  };

  const handleShare = () => {
    const url = `${globalThis.location.origin}/@${cleanUsername}`;
    const shareText = `Check out @${cleanUsername}'s creator profile on Tipz! Support amazing creators on Somnia Network 💫\n\n${url}\n\n#Tipz #Somnia`;

    if (navigator.share) {
      navigator.share({
        title: `${profile?.name} on Tipz`,
        text: shareText,
        url,
      }).catch(() => {
        copyToClipboard(url);
      });
    } else {
      const xShareUrl = xapiService.getShareUrl(shareText);
      window.open(xShareUrl, '_blank', 'width=550,height=420');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Profile link copied to clipboard!');
    });
  };

  if (notFound) {
    return (
      <>
        <Helmet>
          <title>Profile Not Found - Tipz</title>
        </Helmet>

        <div className="min-h-screen bg-secondary py-2xl">
          <div className="container mx-auto px-md max-w-2xl">
            <Card variant="elevated" padding="lg" className="text-center p-xl">
              <AlertCircle className="w-16 h-16 mx-auto mb-md text-primary/40" />
              <h1 className="text-h2 font-bold mb-sm">Profile Not Found</h1>
              <p className="text-body text-primary/70 mb-xl">
                The profile <span className="font-mono">@{cleanUsername}</span> doesn't exist or has
                been deactivated.
              </p>
              <Link to="/">
                <Button variant="brand">Back to Home</Button>
              </Link>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-secondary py-2xl">
        <div className="container mx-auto px-md max-w-4xl">
          <Card variant="elevated" padding="lg">
            <div className="flex items-start gap-lg mb-xl">
              <Skeleton variant="circular" width="120px" height="120px" />
              <div className="flex-1 space-y-md">
                <Skeleton variant="text" width="200px" height="32px" />
                <Skeleton variant="text" width="300px" height="24px" />
                <Skeleton variant="rectangular" width="100%" height="80px" />
              </div>
            </div>
            <Skeleton variant="rectangular" width="100%" height="400px" />
          </Card>
        </div>
      </div>
    );
  }

  const scoreTier = getCreditScoreTier(profile.creditScore);
  const memberSince = formatDistanceToNow(profile.createdAt, { addSuffix: true });

  return (
    <>
      <Helmet>
        <title>@{profile.username} - Tipz</title>
        <meta name="description" content={`Support @${profile.username} on Tipz`} />
        <meta property="og:title" content={`@${profile.username} on Tipz`} />
        <meta property="og:description" content={`Support @${profile.username} with instant tips on Somnia`} />
        <meta property="og:type" content="profile" />
        <link rel="canonical" href={`https://tipz.app/@${profile.username}`} />
      </Helmet>

      <div className="min-h-screen bg-secondary py-xl">
        <div className="container mx-auto px-md max-w-4xl">
          {/* Profile Header */}
          <Card variant="elevated" padding="lg" className="mb-lg">
            <div className="flex flex-col md:flex-row items-start gap-lg">
                            <Avatar
                src={profile.profileImageIpfs}
                alt={`${profile.username} profile`}
                fallbackText={profile.username.slice(0, 2).toUpperCase()}
                size="xl"
              />

              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-sm mb-md">
                  <div>
                    <h1 className="text-h2 font-bold">@{profile.username}</h1>
                    <p className="text-body-lg text-primary/70">{profile.name}</p>
                  </div>

                  <div className="flex gap-sm">
                    <Button variant="brand" size="lg" onClick={handleTipClick}>
                      <Zap className="w-5 h-5 mr-2xs" />
                      Send Tip
                    </Button>
                    <Button variant="primary" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Credit Score Badge */}
                <div className="inline-flex items-center gap-xs px-md py-xs border-3 border-primary rounded-brutalist mb-md">
                  <TrendingUp className={`w-4 h-4 ${scoreTier.color}`} />
                  <span className="text-body-sm font-medium">
                    Credit Score: <span className={scoreTier.color}>{profile.creditScore}/1000</span>
                  </span>
                  <span className="text-body-sm text-primary/60">•</span>
                  <span className={`text-body-sm font-bold ${scoreTier.color}`}>
                    {scoreTier.tier}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                  <StatDisplay
                    icon={Users}
                    label="Followers"
                    value={profile.followers.toLocaleString()}
                  />
                  <StatDisplay
                    icon={Zap}
                    label="Tips Received"
                    value={profile.totalTipsCount.toString()}
                  />
                  <StatDisplay
                    icon={TrendingUp}
                    label="Total STT"
                    value={Number.parseFloat(profile.totalTipsReceived).toFixed(2)}
                  />
                  <StatDisplay
                    icon={TrendingUp}
                    label="Posts"
                    value={profile.posts.toLocaleString()}
                  />
                </div>

                <div className="mt-md pt-md border-t-3 border-primary/10">
                  <div className="flex items-center gap-md text-body-sm text-primary/60">
                    <span>Member {memberSince}</span>
                    <span>•</span>
                    <span className="font-mono text-caption">
                      {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Tips Section */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-h3 font-bold">Recent Tips</h2>
              {isConnected && (
                <div className="flex items-center gap-xs text-body-sm text-primary/70">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live Updates</span>
                </div>
              )}
            </div>

            {recentTips.length > 0 ? (
              <div className="space-y-sm">
                {recentTips.slice(0, 10).map((tip) => (
                  <Card
                    key={tip.id}
                    variant="elevated"
                    padding="md"
                    className="hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-md">
                      <div className="flex items-start gap-sm flex-1">
                        <Avatar
                          alt={tip.fromUsername}
                          fallbackText={tip.fromUsername}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-xs mb-xs">
                            <span className="font-medium">@{tip.fromUsername}</span>
                            <span className="text-primary/40">→</span>
                            <span className="font-medium">@{tip.toUsername}</span>
                          </div>
                          {tip.message && (
                            <p className="text-body-sm text-primary/70 mb-xs">{tip.message}</p>
                          )}
                          <p className="text-caption text-primary/50">
                            {formatDistanceToNow(tip.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-body font-bold text-brand">
                          {tip.amountFormatted} STT
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-xl">
                <Zap className="w-12 h-12 mx-auto mb-sm text-primary/20" />
                <p className="text-body text-primary/60 mb-sm">No tips yet</p>
                <p className="text-body-sm text-primary/40">
                  Be the first to support @{profile.username}!
                </p>
                <Button variant="brand" className="mt-md" onClick={handleTipClick}>
                  Send First Tip
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
