# Tipz - Somnia Tipping Platform

A decentralized tipping platform built on Somnia Network, enabling instant, low-cost creator support with real-time streaming and Web3 social integration.

## Overview

Tipz is a brutalist-designed Web3 tipping platform that connects supporters with creators through blockchain technology. Built with Solidity smart contracts on Somnia Network and a React TypeScript frontend featuring real-time data streams.

## Tech Stack

### Smart Contracts
- **Blockchain:** Somnia Network (EVM-compatible)
- **Framework:** Foundry
- **Language:** Solidity ^0.8.20
- **Contracts:** TipzCore, TipzProfile, TipzRewards

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Brutalist theme)
- **Web3:** Wagmi v2, Viem, RainbowKit
- **State Management:** Zustand + TanStack Query v5
- **Real-time:** Somnia Data Streams SDK
- **Storage:** Pinata Web3 (IPFS)
- **Forms:** React Hook Form + Zod
- **UI Components:** Headless UI, Lucide React, Framer Motion
- **Testing:** Vitest, Playwright, Testing Library

### Design System
- **Colors:** Black (#000000), White (#FFFFFF), Off-White (#FAFAFA)
- **Borders:** 3px solid black
- **Shadows:** Brutalist offset (4px, 6px, 8px)
- **Typography:** Space Grotesk (headings), Inter (body), JetBrains Mono (code)
- **No gradients, glows, or soft effects**

## Prerequisites

- **Node.js:** v18 or higher
- **npm:** v9 or higher
- **Foundry:** Latest version ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- **Git:** For version control

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tipz.git
cd tipz
```

### 2. Smart Contract Setup

```bash
# Navigate to contract directory
cd contract

# Install Foundry dependencies
forge install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
- `SOMNIA_TESTNET_RPC_URL` - Somnia testnet RPC endpoint
- `SOMNIA_MAINNET_RPC_URL` - Somnia mainnet RPC endpoint
- `PRIVATE_KEY` - Deployer wallet private key (DO NOT COMMIT)
- `PLATFORM_WALLET_ADDRESS` - Address to receive platform fees
- `PLATFORM_FEE_RATE` - Fee rate in basis points (e.g., 200 = 2%)

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
- `VITE_SOMNIA_TESTNET_RPC_URL` - Somnia testnet RPC URL
- `VITE_SOMNIA_MAINNET_RPC_URL` - Somnia mainnet RPC URL
- `VITE_SOMNIA_TESTNET_CHAIN_ID` - Testnet chain ID
- `VITE_SOMNIA_MAINNET_CHAIN_ID` - Mainnet chain ID
- `VITE_SOMNIA_STREAMS_ENDPOINT` - Somnia Data Streams WebSocket endpoint
- `VITE_PINATA_API_KEY` - Pinata API key for IPFS
- `VITE_PINATA_API_SECRET` - Pinata API secret
- `VITE_PINATA_GATEWAY_URL` - Pinata gateway URL
- `VITE_X_API_CLIENT_ID` - X (Twitter) API client ID
- `VITE_X_API_CLIENT_SECRET` - X API client secret
- `VITE_TIPZ_PROFILE_ADDRESS` - TipzProfile contract address (after deployment)
- `VITE_TIPZ_CORE_ADDRESS` - TipzCore contract address (after deployment)
- `VITE_TIPZ_REWARDS_ADDRESS` - TipzRewards contract address (after deployment)

## Development

### Smart Contracts

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-path test/Counter.t.sol

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $SOMNIA_TESTNET_RPC_URL --broadcast

# Verify contract
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain-id <CHAIN_ID>
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## Project Structure

```
tipz/
├── contract/                    # Foundry smart contracts
│   ├── src/
│   │   ├── interfaces/         # Contract interfaces
│   │   ├── libraries/          # Shared libraries
│   │   ├── TipzCore.sol       # Core tipping logic
│   │   ├── TipzProfile.sol    # User profile management
│   │   └── TipzRewards.sol    # Rewards distribution
│   ├── test/                   # Contract tests
│   ├── script/                 # Deployment scripts
│   └── foundry.toml           # Foundry configuration
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components (atomic design)
│   │   │   ├── atoms/        # Basic UI elements
│   │   │   ├── molecules/    # Composite components
│   │   │   ├── organisms/    # Complex components
│   │   │   └── layouts/      # Page layouts
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API & blockchain services
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand state stores
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration files
│   │   └── App.tsx           # Root component
│   ├── public/               # Static assets
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── vite.config.ts        # Vite configuration
│   └── package.json          # Dependencies
│
├── BUILD_PROMPTS.md           # Development prompts (15 phases)
├── project_structure.md       # Complete architecture spec
└── README.md                  # This file
```

## Testing

### Smart Contracts

```bash
cd contract

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testTipCreator

# Generate coverage report
forge coverage
```

### Frontend

```bash
cd frontend

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage
npm run test:coverage

# Run E2E tests (once configured)
npm run test:e2e
```

## Deployment

### Smart Contracts

1. **Deploy to Somnia Testnet:**

```bash
cd contract
forge script script/Deploy.s.sol \
  --rpc-url $SOMNIA_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

2. **Save Contract Addresses:**
After deployment, update `.env` files with deployed contract addresses.

3. **Verify Contracts:**

```bash
forge verify-contract <ADDRESS> <CONTRACT_NAME> \
  --chain-id <CHAIN_ID> \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Frontend

1. **Build Production Bundle:**

```bash
cd frontend
npm run build
```

2. **Test Production Build:**

```bash
npm run preview
```

3. **Deploy to Hosting:**
Upload `dist/` folder to your hosting provider (Vercel, Netlify, AWS, etc.)

## Environment Configuration

### Development
- Connects to Somnia testnet
- Uses test wallets and faucet funds
- Hot reload enabled
- Source maps enabled

### Production
- Connects to Somnia mainnet
- Real funds and transactions
- Minified and optimized bundles
- Error tracking enabled (optional Sentry)

## Key Features

- ✅ **Instant Tips:** Send cryptocurrency tips to creators with zero delay
- ✅ **Real-time Streaming:** Live ticker showing recent tips across platform
- ✅ **Creator Profiles:** Rich profiles with IPFS-stored metadata
- ✅ **Credit Score System:** On-chain reputation tracking
- ✅ **Rewards Program:** Loyalty rewards for frequent supporters
- ✅ **Social Integration:** X (Twitter) authentication and sharing
- ✅ **Brutalist UI:** Clean, accessible, black/white design
- ✅ **Web3 Native:** RainbowKit wallet connection
- ✅ **Low Fees:** Somnia Network's efficient EVM execution

## Documentation

- **BUILD_PROMPTS.md:** 15 sequential development prompts for implementation
- **project_structure.md:** Complete architectural specification (no code, pure structure)
- **Foundry Book:** https://book.getfoundry.sh/
- **Wagmi Docs:** https://wagmi.sh/
- **Viem Docs:** https://viem.sh/
- **Somnia Docs:** https://docs.somnia.network/

## Troubleshooting

### Common Issues

**1. npm install fails:**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**2. Foundry compilation errors:**
```bash
# Update Foundry
foundryup
# Clean and rebuild
forge clean
forge build
```

**3. RPC connection errors:**
- Verify RPC URLs in `.env`
- Check Somnia network status
- Ensure sufficient balance for gas

**4. Wallet connection issues:**
- Clear browser cache
- Reinstall wallet extension
- Check network configuration in wallet

**5. IPFS upload failures:**
- Verify Pinata API keys
- Check file size limits
- Review Pinata dashboard for errors

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Contact

- **Website:** https://tipz.somnia.network
- **X (Twitter):** @TipzPlatform
- **Discord:** https://discord.gg/tipz
- **Email:** support@tipz.somnia.network

## Acknowledgments

- Somnia Network team for blockchain infrastructure
- Foundry for smart contract development tools
- Pinata for decentralized storage
- RainbowKit for wallet connection UI
