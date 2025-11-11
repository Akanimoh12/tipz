import { formatUnits } from 'viem';
import { formatDistanceToNow } from 'date-fns';

export function formatSTT(weiAmount: bigint, decimals: number = 18, displayDecimals: number = 4): string {
  const formatted = formatUnits(weiAmount, decimals);
  const number = Number.parseFloat(formatted);
  
  if (number === 0) return '0 STT';
  if (number < 0.0001) return '< 0.0001 STT';
  
  return `${number.toFixed(displayDecimals).replace(/\.?0+$/, '')} STT`;
}

export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (Number.isNaN(dateObj.getTime())) return 'Invalid date';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatNumber(value: number, notation: 'standard' | 'compact' = 'standard'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    notation,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCreditScore(score: number, maxScore: number = 1000): string {
  const clampedScore = Math.max(0, Math.min(score, maxScore));
  return `${clampedScore}/${maxScore}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format large numbers with K, M, B suffixes for compact display
 * @example formatCompactNumber(1500) // "1.5K"
 * @example formatCompactNumber(2500000) // "2.5M"
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 1000000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${(value / 1000000000).toFixed(1)}B`;
}
