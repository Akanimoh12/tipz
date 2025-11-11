import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  animate?: boolean;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animate = true,
  className,
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'rounded-brutalist h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-brutalist',
  };

  return (
    <div
      className={cn(
        'bg-accent border-2 border-primary/20',
        animate && 'animate-pulse',
        variants[variant],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? height : undefined),
        height: height || (variant === 'text' ? '1rem' : undefined),
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
