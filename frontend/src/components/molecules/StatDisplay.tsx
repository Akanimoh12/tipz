import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatDisplayProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: TrendDirection;
  };
  suffix?: string;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}

export function StatDisplay({
  icon: Icon,
  label,
  value,
  trend,
  suffix,
  className,
  iconClassName,
  valueClassName,
}: Readonly<StatDisplayProps>) {
  const getTrendIcon = (direction?: TrendDirection) => {
    if (!direction) return null;
    if (direction === 'up') return TrendingUp;
    if (direction === 'down') return TrendingDown;
    return Minus;
  };
  
  const TrendIcon = getTrendIcon(trend?.direction);

  const getTrendColor = (direction?: TrendDirection) => {
    if (direction === 'up') return 'text-green-600';
    if (direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={cn('flex flex-col space-y-xs', className)}>
      <div className="flex items-center gap-2xs">
        <Icon className={cn('w-4 h-4 text-primary/70', iconClassName)} aria-hidden="true" />
        <span className="text-body-sm font-medium text-primary/70 uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-xs">
        <span className={cn('text-h2 font-bold', valueClassName)}>
          {value}
        </span>
        {suffix && (
          <span className="text-body text-primary/70">{suffix}</span>
        )}
      </div>

      {trend && TrendIcon && (
        <div className={cn('flex items-center gap-2xs', getTrendColor(trend.direction))}>
          <TrendIcon className="w-4 h-4" aria-hidden="true" />
          <span className="text-body-sm font-medium">
            {trend.value > 0 && '+'}
            {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
