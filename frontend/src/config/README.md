# Configuration Files

Configuration files for Somnia blockchain integration, wallet connectivity, and application settings.

## Files

### somnia.config.ts
Somnia blockchain network configurations using viem's `defineChain`:

**Exports:**
- `somniaTestnet` - Testnet chain configuration (chain ID, RPC, explorer)
- `somniaMainnet` - Mainnet chain configuration
- `SOMNIA_NETWORKS` - Object containing both networks
- `DEFAULT_CHAIN` - Selected based on `VITE_DEFAULT_NETWORK` env var
- `SUPPORTED_CHAINS` - Array of supported chains for Wagmi
- `CURRENCY_SYMBOL` - "STT"
- `CURRENCY_DECIMALS` - 18
- `CURRENCY_NAME` - "Somnia Token"

**Environment Variables:**
- `VITE_SOMNIA_TESTNET_CHAIN_ID` (required)
- `VITE_SOMNIA_TESTNET_RPC_URL` (required)
- `VITE_SOMNIA_MAINNET_CHAIN_ID`
- `VITE_SOMNIA_MAINNET_RPC_URL`
- `VITE_SOMNIA_TESTNET_EXPLORER_URL`
- `VITE_SOMNIA_MAINNET_EXPLORER_URL`
- `VITE_DEFAULT_NETWORK` - "testnet" or "mainnet"

### wagmi.config.ts
Wagmi configuration with wallet connectors using RainbowKit:

**Features:**
- HTTP transports for both testnet and mainnet
- Cookie-based storage for connection persistence
- Wallet connectors:
  - **Recommended:** MetaMask, WalletConnect
  - **Other:** Rainbow, Trust Wallet

**Exports:**
- `wagmiConfig` - Wagmi client configuration

**Environment Variables:**
- `VITE_WALLETCONNECT_PROJECT_ID` (required) - Get from https://cloud.walletconnect.com

### rainbowkit.config.tsx
RainbowKit provider with custom brutalist theme:

**Theme Customization:**
- Black accent color (#000000)
- White modal background (#FFFFFF)
- Sharp borders (small border radius)
- No blur overlay
- Compact modal size

**Exports:**
- `RainbowKitConfig` - Provider component wrapping children

### app.config.ts
Application-wide configuration constants:

**Exports:**
- `APP_CONFIG` - App name, description, URL
- `PLATFORM_FEE` - Fee rate (2% = 200 basis points)
- `TIP_LIMITS` - Min/max tip amounts (wei and STT)
- `WITHDRAWAL_LIMITS` - Minimum withdrawal amount
- `CREDIT_SCORE_TIERS` - Bronze/Silver/Gold/Platinum tiers with colors
- `CREDIT_SCORE_WEIGHTS` - Formula weights (50% followers, 30% posts, 20% replies)
- `IPFS_GATEWAYS` - Primary Pinata gateway + 4 fallbacks
- `FILE_UPLOAD` - Max size (2MB), allowed types
- `VALIDATION_CONSTRAINTS` - Username, message, bio length limits
- `PAGINATION_CONFIG` - Page sizes for different views
- `CACHE_CONFIG` - TanStack Query stale times
- `STREAMS_CONFIG` - Somnia Streams endpoint and reconnection settings
- `SOCIAL_SHARE` - Twitter intent URL, hashtags
- `TOAST_CONFIG` - Notification durations and position
- `ANIMATION_CONFIG` - Animation durations and easing
- `LINKS` - Documentation, social media, legal pages

**Validation:**
Validates required environment variables at startup (except in test mode):
- `VITE_SOMNIA_TESTNET_RPC_URL`
- `VITE_SOMNIA_TESTNET_CHAIN_ID`
- `VITE_WALLETCONNECT_PROJECT_ID`

## Usage

### Importing Config
```typescript
import { 
  somniaTestnet, 
  DEFAULT_CHAIN,
  APP_CONFIG,
  PLATFORM_FEE,
  TIP_LIMITS 
} from '@/config';
```

### Using with Wagmi Hooks
```typescript
import { useAccount, useBalance } from 'wagmi';
import { DEFAULT_CHAIN } from '@/config';

function WalletInfo() {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address, chainId: DEFAULT_CHAIN.id });
  
  return <div>{balance?.formatted} {DEFAULT_CHAIN.nativeCurrency.symbol}</div>;
}
```

### Fee Calculation
```typescript
import { PLATFORM_FEE, TIP_LIMITS } from '@/config';

const tipAmount = 100;
const fee = (tipAmount * PLATFORM_FEE.RATE) / PLATFORM_FEE.BASIS_POINTS;
const netAmount = tipAmount - fee;

console.log(`Fee: ${fee} STT, Net: ${netAmount} STT`);
```

### Credit Score Tiers
```typescript
import { CREDIT_SCORE_TIERS } from '@/config';

function getCreditTier(score: number) {
  for (const tier of Object.values(CREDIT_SCORE_TIERS)) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  return CREDIT_SCORE_TIERS.BRONZE;
}

const tier = getCreditTier(650);
console.log(tier.label); // "Gold"
console.log(tier.color); // "#FFD700"
```

### IPFS Gateway with Fallback
```typescript
import { IPFS_GATEWAYS } from '@/config';

async function loadImage(ipfsHash: string) {
  const gateways = [IPFS_GATEWAYS.PRIMARY, ...IPFS_GATEWAYS.FALLBACKS];
  
  for (const gateway of gateways) {
    try {
      const url = `${gateway}/ipfs/${ipfsHash}`;
      const response = await fetch(url);
      if (response.ok) return url;
    } catch {
      continue;
    }
  }
  
  throw new Error('Failed to load image from all gateways');
}
```

## Provider Setup (main.tsx)

The application is wrapped with multiple providers in this order:

1. **WagmiProvider** - Wallet connection and blockchain interaction
2. **QueryClientProvider** - TanStack Query for server state management
3. **RainbowKitProvider** - Wallet connection UI with brutalist theme
4. **Toaster** - react-hot-toast for notifications

```typescript
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitConfig>
      <App />
      <Toaster {...toastOptions} />
    </RainbowKitConfig>
  </QueryClientProvider>
</WagmiProvider>
```

## Environment Variables

### Required
Must be set for the app to start:
- `VITE_SOMNIA_TESTNET_RPC_URL`
- `VITE_SOMNIA_TESTNET_CHAIN_ID`
- `VITE_WALLETCONNECT_PROJECT_ID`

### Optional
Have sensible defaults or are optional:
- `VITE_SOMNIA_MAINNET_RPC_URL`
- `VITE_SOMNIA_MAINNET_CHAIN_ID`
- `VITE_DEFAULT_NETWORK` (defaults to "testnet")
- `VITE_APP_URL`
- `VITE_PINATA_GATEWAY_URL`
- `VITE_SOMNIA_STREAMS_ENDPOINT`

### Getting WalletConnect Project ID
1. Visit https://cloud.walletconnect.com
2. Sign up for free account
3. Create new project
4. Copy Project ID
5. Add to `.env` as `VITE_WALLETCONNECT_PROJECT_ID`

## TanStack Query Configuration

Default query options:
- `refetchOnWindowFocus: false` - Don't refetch when window regains focus
- `retry: 1` - Retry failed queries once
- `staleTime: 30000` - Consider data fresh for 30 seconds

Custom stale times in `CACHE_CONFIG`:
- Profile data: 5 minutes
- Tips data: 30 seconds
- Leaderboard: 2 minutes
- Balance: 10 seconds

## Toast Notifications

Brutalist theme applied to all toasts:
- 3px black border
- White background
- Black text
- 4px border radius
- Inter font family
- Top-right position

Duration by type:
- Success: 3 seconds
- Error: 5 seconds
- Info/Warning: 4 seconds

## Design Philosophy

1. **Pure Configuration** - No business logic in config files
2. **Type Safety** - Use `as const` for immutable configs
3. **Environment Variables** - Sensitive data from env vars
4. **Validation** - Required vars validated at startup
5. **Fallbacks** - Sensible defaults where possible
6. **Documentation** - Clear error messages for missing config
7. **Constants** - Avoid magic numbers, centralize all values

## Security Notes

- Private keys never in frontend code
- RPC URLs from environment variables
- Contract addresses validated before use
- IPFS gateway fallbacks prevent single point of failure
- WalletConnect Project ID is public (not sensitive)

## Testing

Skip validation in test mode:
```typescript
if (import.meta.env.MODE !== 'test') {
  validateRequiredEnvVars();
}
```

Mock config in tests:
```typescript
vi.mock('@/config', () => ({
  DEFAULT_CHAIN: mockChain,
  PLATFORM_FEE: { RATE: 200 },
}));
```
