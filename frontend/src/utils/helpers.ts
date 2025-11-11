import { PLATFORM_CONFIG } from './constants';

export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function generateShareText(username: string, amount?: string, message?: string): string {
  const baseText = `I just tipped @${username} on Tipz!`;
  
  if (amount) {
    return `${baseText} ${amount} 💰\n\nSupport creators you love on https://tipz.somnia.network`;
  }
  
  if (message) {
    const truncatedMessage = truncateText(message, 100);
    return `${baseText}\n"${truncatedMessage}"\n\nJoin us at https://tipz.somnia.network`;
  }
  
  return `${baseText}\n\nSupport your favorite creators at https://tipz.somnia.network`;
}

export function calculateFee(amount: number): { fee: number; netAmount: number } {
  const fee = (amount * PLATFORM_CONFIG.FEE_PERCENTAGE) / 100;
  const netAmount = amount - fee;
  
  return {
    fee: Number(fee.toFixed(18)),
    netAmount: Number(netAmount.toFixed(18)),
  };
}

export function calculateFeeFromBigInt(amount: bigint): { fee: bigint; netAmount: bigint } {
  const fee = (amount * BigInt(PLATFORM_CONFIG.FEE_RATE)) / BigInt(10000);
  const netAmount = amount - fee;
  
  return { fee, netAmount };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), waitMs);
  };
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRan: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (lastRan === undefined) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (Date.now() - lastRan! >= limitMs) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limitMs - (Date.now() - lastRan));
    }
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateProfileUrl(username: string): string {
  return `/@${username}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && globalThis.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  return new Promise((resolve, reject) => {
    // Use modern Clipboard API if available, fallback to deprecated execCommand
    if (navigator.clipboard && globalThis.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          textArea.remove();
          resolve();
        })
        .catch((err) => {
          textArea.remove();
          reject(err);
        });
    } else {
      // Fallback for older browsers (execCommand is deprecated but still works)
      try {
        // @ts-ignore - execCommand is deprecated but needed for legacy browser support
        const success = document.execCommand('copy');
        textArea.remove();
        success ? resolve() : reject(new Error('Copy command failed'));
      } catch (err) {
        textArea.remove();
        reject(err);
      }
    }
  });
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate credit score based on X (Twitter) metrics
 * Formula: (followers * 0.5 + posts * 0.3 + replies * 0.2) / normalizer * 1000
 */
export function calculateCreditScore(followers: number, posts: number, replies: number): number {
  const normalizer = 10000;
  const followersWeight = 0.5;
  const postsWeight = 0.3;
  const repliesWeight = 0.2;
  
  const weightedScore =
    followers * followersWeight + posts * postsWeight + replies * repliesWeight;
  
  const score = Math.min((weightedScore / normalizer) * 1000, 1000);
  
  return Math.floor(score);
}
