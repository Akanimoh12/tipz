import { useState, type ImgHTMLAttributes } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
}

export function Avatar({ src, alt, size = 'md', fallbackText, className, ...props }: AvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-caption',
    md: 'text-body-sm',
    lg: 'text-body',
    xl: 'text-h4',
  };

  const showFallback = !src || imageError;
  const fallbackInitials = fallbackText
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center border-3 border-primary bg-accent rounded-brutalist overflow-hidden',
        sizes[size],
        className
      )}
      aria-label={alt}
    >
      {!showFallback && (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-primary/10" />
          )}
          <img
            src={src}
            alt={alt}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            {...props}
          />
        </>
      )}
      {showFallback && (
        <>
          {fallbackInitials ? (
            <span className={cn('font-bold text-primary', textSizes[size])}>
              {fallbackInitials}
            </span>
          ) : (
            <User className={cn('text-primary', iconSizes[size])} aria-hidden="true" />
          )}
        </>
      )}
    </div>
  );
}
