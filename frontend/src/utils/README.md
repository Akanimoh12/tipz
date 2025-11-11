# Utility Functions

Pure utility functions for the Tipz platform. All functions are side-effect free and fully typed.

## Files

### validation.ts
Zod schemas for runtime validation:
- `sttAmountSchema` - Validates tip amounts (0.001 - 1,000,000 STT)
- `usernameSchema` - Validates usernames (3-20 chars, alphanumeric + underscore)
- `imageFileSchema` - Validates image uploads (< 2MB, JPEG/PNG/WebP/GIF)
- `ethereumAddressSchema` - Validates Ethereum addresses using viem
- `tipMessageSchema` - Validates tip messages (max 280 chars)
- `profileDataSchema` - Complete profile registration validation
- `withdrawalSchema` - Validates withdrawal requests

### formatters.ts
Display formatting functions:
- `formatSTT(weiAmount, decimals?, displayDecimals?)` - Format wei to STT with units
- `formatAddress(address, startChars?, endChars?)` - Truncate addresses (0x1234...5678)
- `formatDate(date)` - Relative time format ("2 hours ago")
- `formatNumber(value, notation?)` - Format numbers with commas
- `formatCreditScore(score, maxScore?)` - Format score as "750/1000"
- `formatPercentage(value, decimals?)` - Format as percentage
- `formatCurrency(amount, currency?)` - Format with currency symbol
- `formatCompactNumber(value)` - Format with K/M/B suffixes

### security.ts
Input sanitization and XSS prevention:
- `sanitizeMessage(input)` - DOMPurify wrapper, strips all HTML
- `validateInput(input)` - Checks for dangerous patterns
- `escapeHtml(text)` - Escape HTML entities
- `sanitizeUrl(url)` - Validate and sanitize URLs
- `stripHtml(html)` - Remove HTML tags, keep content

### constants.ts
Application constants:
- `APP_ROUTES` - All route paths
- `PLATFORM_CONFIG` - Fee rates, min/max amounts
- `IPFS_CONFIG` - Gateway URLs, file size limits
- `CREDIT_SCORE_CONFIG` - Score calculation weights and tiers
- `VALIDATION_RULES` - Validation constraints
- `API_ENDPOINTS` - RPC and API URLs
- `CONTRACT_ADDRESSES` - Deployed contract addresses
- `CHAIN_CONFIG` - Chain IDs, currency symbol
- `PAGINATION` - Page size defaults
- `SOCIAL_LINKS` - Platform social media links
- `TOAST_DURATION` - Notification durations

### helpers.ts
General utility functions:
- `truncateText(text, maxLength, ellipsis?)` - Truncate with ellipsis
- `generateShareText(username, amount?, message?)` - Generate X share text
- `calculateFee(amount)` - Calculate platform fee (2%)
- `calculateFeeFromBigInt(amount)` - Fee calculation for bigint
- `sleep(ms)` - Promise-based delay
- `debounce(func, waitMs)` - Debounce function calls
- `throttle(func, limitMs)` - Throttle function calls
- `getInitials(name)` - Extract initials from name
- `generateProfileUrl(username)` - Generate profile URL
- `copyToClipboard(text)` - Copy to clipboard (fallback for old browsers)
- `isValidUrl(url)` - Validate URL format
- `calculateCreditScore(followers, posts, replies)` - Calculate X credit score

### error-handling.ts
Contract error parsing and user-friendly messages:
- `parseContractError(error)` - Parse viem contract errors
- `getUserFriendlyMessage(error)` - Get user-facing error message
- `isUserRejectionError(error)` - Check if user rejected transaction
- `isInsufficientFundsError(error)` - Check for insufficient balance
- `formatErrorForLogging(error)` - Format error for logging
- **Classes:**
  - `AppError` - Base application error
  - `NetworkError` - Network request failures
  - `ValidationError` - Validation failures

## Usage Examples

### Validation
```typescript
import { sttAmountSchema, usernameSchema } from '@/utils/validation';

const result = sttAmountSchema.safeParse(0.5);
if (result.success) {
  console.log('Valid amount:', result.data);
}

const username = usernameSchema.parse('alice_42'); // throws if invalid
```

### Formatting
```typescript
import { formatSTT, formatAddress, formatDate } from '@/utils/formatters';

formatSTT(1500000000000000000n); // "1.5 STT"
formatAddress('0x1234567890abcdef1234567890abcdef12345678'); // "0x1234...5678"
formatDate(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### Security
```typescript
import { sanitizeMessage, validateInput } from '@/utils/security';

const clean = sanitizeMessage('<script>alert("xss")</script>Hello'); // "Hello"
const safe = validateInput('normal text'); // true
const unsafe = validateInput('<script>alert(1)</script>'); // false
```

### Error Handling
```typescript
import { parseContractError, getUserFriendlyMessage } from '@/utils/error-handling';

try {
  await sendTip(amount);
} catch (error) {
  const friendly = getUserFriendlyMessage(error);
  toast.error(friendly); // "Insufficient Funds"
}
```

### Helpers
```typescript
import { calculateFee, generateShareText, debounce } from '@/utils/helpers';

const { fee, netAmount } = calculateFee(100); // { fee: 2, netAmount: 98 }
const shareText = generateShareText('alice', '5 STT');
const debouncedSearch = debounce(searchFunction, 300);
```

## Testing

All utility functions should have corresponding unit tests. Example:

```typescript
import { describe, it, expect } from 'vitest';
import { formatSTT } from './formatters';

describe('formatSTT', () => {
  it('formats wei to STT correctly', () => {
    expect(formatSTT(1500000000000000000n)).toBe('1.5 STT');
  });

  it('handles zero amount', () => {
    expect(formatSTT(0n)).toBe('0 STT');
  });

  it('handles very small amounts', () => {
    expect(formatSTT(50000000000000n)).toBe('< 0.0001 STT');
  });
});
```

## Design Principles

1. **Pure Functions** - No side effects, same input = same output
2. **Type Safety** - Strict TypeScript, no `any` types
3. **Single Responsibility** - Each function does one thing well
4. **Named Exports** - Never use default exports
5. **Clear Names** - Function names explain intent
6. **Minimal Comments** - Code is self-documenting
7. **Error Handling** - Explicit error handling, no silent failures
8. **Composability** - Functions compose well together

## Performance Considerations

- Debounce/throttle for expensive operations
- Memoization avoided (premature optimization)
- BigInt used for precise STT calculations
- Date formatting uses `date-fns` (tree-shakeable)
- DOMPurify configured for minimal overhead

## Security Notes

- All user input sanitized before display
- XSS protection via DOMPurify
- URL validation prevents javascript: protocol
- HTML escaping for raw text display
- Contract errors never expose sensitive data
