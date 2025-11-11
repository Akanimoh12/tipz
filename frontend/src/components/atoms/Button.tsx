import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium border-3 border-primary rounded-brutalist transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      brand: 'bg-brand !text-primary shadow-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutalist',
      primary: 'bg-secondary !text-primary shadow-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutalist',
      secondary: 'bg-primary !text-secondary shadow-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutalist',
      ghost: 'bg-transparent !text-primary hover:bg-accent active:bg-primary/10 disabled:hover:bg-transparent',
    };

    const sizes = {
      sm: 'px-sm py-2xs text-body-sm',
      md: 'px-md py-xs text-body',
      lg: 'px-lg py-sm text-body-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
