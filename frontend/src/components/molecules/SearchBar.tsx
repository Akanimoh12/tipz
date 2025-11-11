import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch: (query: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
  showClear?: boolean;
}

export function SearchBar({
  onSearch,
  debounceMs = 300,
  isLoading = false,
  showClear = true,
  placeholder = 'Search...',
  className,
  ...props
}: Readonly<SearchBarProps>) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative flex items-center gap-xs px-sm py-xs',
          'border-3 border-primary bg-secondary rounded-brutalist',
          'transition-shadow duration-150',
          isFocused && 'shadow-brutalist'
        )}
      >
        <Search
          className={cn(
            'w-5 h-5 shrink-0 transition-colors',
            isFocused ? 'text-primary' : 'text-primary/50'
          )}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-body text-primary placeholder:text-primary/50',
            'min-w-0'
          )}
          {...props}
        />

        {isLoading && (
          <Loader2
            className="w-5 h-5 shrink-0 text-primary/50 animate-spin"
            aria-label="Searching"
          />
        )}

        {showClear && query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-2xs rounded hover:bg-accent transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-primary/70" />
          </button>
        )}
      </div>
    </div>
  );
}
