import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium border-2 border-primary rounded-brutalist';

  const variants = {
    default: 'bg-secondary text-primary',
    success: 'bg-green-100 text-green-900 border-green-900',
    warning: 'bg-yellow-100 text-yellow-900 border-yellow-900',
    error: 'bg-red-100 text-red-900 border-red-900',
    info: 'bg-blue-100 text-blue-900 border-blue-900',
  };

  const sizes = {
    sm: 'px-2xs py-[2px] text-caption',
    md: 'px-xs py-2xs text-body-sm',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
