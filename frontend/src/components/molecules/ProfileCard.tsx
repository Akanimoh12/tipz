import { type HTMLAttributes } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent } from './Card';
import { cn } from '@/utils/cn';
import type { Address } from 'viem';

interface ProfileCardProps extends HTMLAttributes<HTMLDivElement> {
  username: string;
  userAddress: Address;
  profileImageIpfs?: string;
  creditScore: number;
  totalTipsCount: number;
  totalTipsReceived: bigint;
  isActive?: boolean;
  onTipClick?: () => void;
  hoverable?: boolean;
}

export function ProfileCard({
  username,
  userAddress,
  profileImageIpfs,
  creditScore,
  totalTipsCount,
  totalTipsReceived,
  isActive = true,
  onTipClick,
  hoverable = true,
  className,
  ...props
}: Readonly<ProfileCardProps>) {
  const formattedTips = (Number(totalTipsReceived) / 1e18).toFixed(4);
  
  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-gray-600';
  };
  const scoreColor = getScoreColor(creditScore);

  return (
    <Card
      variant="default"
      padding="md"
      hoverable={hoverable}
      className={cn('relative', className)}
      {...props}
    >
      <CardContent className="space-y-sm">
        <div className="flex items-start gap-sm">
          <Avatar
            src={profileImageIpfs}
            alt={username}
            fallbackText={username}
            size="lg"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2xs mb-2xs">
              <h3 className="text-h4 font-bold truncate">@{username}</h3>
              {!isActive && (
                <Badge variant="warning" size="sm">Inactive</Badge>
              )}
            </div>
            
            <p className="text-body-sm text-primary/70 truncate font-mono">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-sm pt-sm border-t-3 border-primary">
          <div className="space-y-2xs">
            <div className="flex items-center gap-2xs text-primary/70">
              <TrendingUp className="w-4 h-4" />
              <span className="text-caption font-medium uppercase tracking-wide">Score</span>
            </div>
            <p className={cn('text-h4 font-bold', scoreColor)}>
              {creditScore}
            </p>
          </div>

          <div className="space-y-2xs">
            <div className="flex items-center gap-2xs text-primary/70">
              <Zap className="w-4 h-4" />
              <span className="text-caption font-medium uppercase tracking-wide">Tips</span>
            </div>
            <div>
              <p className="text-h4 font-bold">{totalTipsCount}</p>
              <p className="text-caption text-primary/70">{formattedTips} ETH</p>
            </div>
          </div>
        </div>

        {onTipClick && isActive && (
          <button
            onClick={onTipClick}
            className="w-full mt-sm py-xs px-sm bg-primary text-secondary border-3 border-primary rounded-brutalist shadow-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 font-medium"
          >
            Tip Creator
          </button>
        )}
      </CardContent>
    </Card>
  );
}
