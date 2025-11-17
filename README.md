# Tipz - Turn Your X Influence Into On-Chain Reputation

**Tokenize your X (Twitter) social presence and unlock Web3 opportunities based on your real influence.**

Tipz transforms your X account into verifiable on-chain reputation, enabling instant peer-to-peer support powered by Somnia's real-time blockchain infrastructure.

---

## 🎯 The Problem

Millions of creators and active X users have built genuine influence and communities, but:
- **Their social capital is locked in Web2** - followers, engagement, and credibility only exist on centralized platforms
- **No way to monetize influence directly** - traditional monetization requires intermediaries, sponsorships, or platform-specific programs
- **Social reputation is not portable** - influence on X doesn't translate to opportunities in Web3, DeFi, or on-chain ecosystems
- **Supporters lack direct ways to show appreciation** - likes and retweets don't provide tangible value to creators

**The opportunity**: 100M+ X users who could benefit from on-chain reputation but have never entered Web3.

---

## 💡 Our Solution

**Tipz converts your X social metrics into verifiable on-chain reputation** that unlocks new opportunities:

### For Creators & Influencers:
✅ **Tokenize Your Influence** - Your followers, posts, and engagement become an on-chain credit score  
✅ **Receive Direct Support** - Supporters send tips instantly without intermediaries (2% platform fee)  
✅ **Build Verifiable Reputation** - Your on-chain profile proves your influence across Web3  
✅ **Unlock Future Opportunities** - Higher credit scores can enable lending, governance rights, exclusive access, and more

### For Supporters:
✅ **Support Creators Directly** - Send appreciation in seconds with crypto  
✅ **Build Your Own Reputation** - Active supporters earn on-chain credit too  
✅ **Transparent & Fair** - All transactions recorded on blockchain, no hidden fees

### The Magic:
**Simply connect your X account** → Your social metrics (followers, posts, engagement) are analyzed → **Instant on-chain credit score** → Start receiving/sending tips immediately.

**Not just tipping. It's bringing your Web2 influence into Web3.**

## 🔥 Why Somnia Network + Data Streams?

**Tipz is powered by Somnia's revolutionary real-time blockchain infrastructure:**

### ⚡ Real-Time Everything
Traditional blockchains are slow. Somnia delivers **sub-second finality** and real-time data streaming:
- **Instant tip notifications** - See support as it happens (~2-3 second latency)
- **Live leaderboards** - Rankings update in real-time without page refresh
- **Activity feeds stream continuously** - Like social media, but fully on-chain

### 🎮 Somnia Data Streams in Action

**What are Data Streams?**  
Think of it like Twitter's real-time feed, but for blockchain data. Instead of refreshing to see new transactions, data flows to your screen instantly.

**How Tipz Uses It:**
1. **Someone tips you** → Contract emits event → Somnia Streams captures it → **You see notification in 2 seconds**
2. **Leaderboard updates** → New tips change rankings → Streams push update → **Everyone sees live rankings**
3. **Profile changes** → User updates profile → Event published → **All viewers see changes instantly**

**Traditional Blockchain Experience:**
```
Transaction happens → Wait 10-60 seconds → Manually refresh page → See update
```

**Tipz on Somnia Experience:**
```
Transaction happens → See update instantly (2-3 seconds) → No refresh needed
```

### 💰 Extremely Low Fees
- **Tip 100 STT, creator receives 98 STT** (2% platform fee only)
- **Gas fees are negligible** on Somnia (fractions of a cent)
- **No hidden costs** - What you send is what they get

### 🌐 EVM Compatible
- Use familiar tools: MetaMask, WalletConnect, Ethers/Viem
- Solidity smart contracts
- Easy for developers to build on

**This isn't just faster blockchain - it's blockchain that feels like Web2 social media.**

---

## 🏗️ Architecture

### On-Chain Reputation System

Your X account metrics are tokenized into an **on-chain credit score** (0-1000):

```
Credit Score Formula:
- Followers (50%): followerCount / 10 = up to 500 points
- Post Engagement (30%): (posts + replies * 1.5) / 5 = up to 300 points  
- Account Age (20%): Time-weighted scoring = up to 200 points
```

**Credit Score Tiers:**
- 🥉 **Bronze (0-300)**: New or small accounts
- 🥈 **Silver (301-600)**: Growing influence
- 🥇 **Gold (601-850)**: Established creators
- 💎 **Diamond (851-1000)**: Top-tier influencers

**Your score increases as:**
- ✅ You receive more tips (proof of value)
- ✅ Your X metrics grow
- ✅ You actively participate in the ecosystem

### Smart Contract System

```
┌─────────────────┐
│  TipzProfile    │ ← Stores on-chain reputation
│  0x1894d97...   │   • X username → wallet mapping
└────────┬────────┘   • Credit scores
         │            • Profile metadata (IPFS)
         │
┌────────▼────────┐
│   TipzCore      │ ← Handles all tipping
│   0xc594207... │   • Send/receive tips
└────────┬────────┘   • Leaderboards
         │            • Transaction history
         │
┌────────▼────────┐
│ Somnia Streams  │ ← Real-time data layer
│   SDK v0.10.1   │   • Live tip notifications
└─────────────────┘   • Instant UI updates
                      • No manual refresh needed
```

**Deployed Contracts (Somnia Testnet Dream):**
- **TipzProfile**: `0x1894d977FDDd22D4dB7f7734507e070fD1d38672`
- **TipzCore**: `0xc5942079739F1872fA5FE464d73328c0DeDc664A`
- **Network**: Somnia Testnet Dream
- **Chain ID**: 50312
- **Currency**: STT (Somnia Test Tokens)
- **Explorer**: https://somniascan.io

---

## 🚀 How It Works (User Journey)

### Step 1: Connect & Tokenize (30 seconds)
1. Visit Tipz and click "Register"
2. Connect your wallet (MetaMask/WalletConnect)
3. Authenticate with your X account
4. Your X metrics are analyzed on-chain
5. **Instant credit score generated** - Your influence is now tokenized!

### Step 2: Set Your Identity
1. Choose your unique Tipz username (can be different from X handle)
2. Upload profile picture (stored on IPFS)
3. Your on-chain profile is created

### Step 3: Share & Receive
1. Share your Tipz profile: `tipz.app/@yourusername`
2. Supporters send tips directly to your wallet
3. See tips arrive in real-time via Somnia Streams
4. Withdraw anytime - it's your money, instantly

### 💝 For Supporters: How to Tip Creators

**Show appreciation beyond likes and retweets!**

1. **Find Creators You Love**
   - Browse the leaderboard
   - Visit any creator's profile at `tipz.app/@username`
   - Discover creators through X/social media

2. **Send Your Tip**
   - Click "Send Tip" button on their profile
   - Enter amount (as low as 0.001 STT - no minimum restrictions!)
   - Add an optional message to show your support
   - Confirm transaction in your wallet

3. **Instant Impact**
   - Creator receives 98% of your tip (2% platform fee)
   - They see notification in **2-3 seconds** via real-time streams
   - Your support is recorded on-chain forever
   - You build your own reputation as an active supporter

4. **Track Your Impact**
   - See all creators you've supported
   - View your total contributions
   - Earn reputation points for being an active tipper
   - Appear on supporter leaderboards

**No subscriptions. No monthly commitments. Just direct, instant appreciation whenever you want.**

---

**No accounts, no sign-ups, no waiting - pure Web3.**

---

## 🎯 Tech Stack (For Developers)

### Smart Contracts
- **Blockchain:** Somnia Network (EVM-compatible)
- **Language:** Solidity ^0.8.20
- **Framework:** Foundry
- **Contracts:** TipzCore, TipzProfile

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Web3:** Wagmi v2, Viem v2, RainbowKit
- **Real-Time:** Somnia Data Streams SDK v0.10.1
- **Storage:** IPFS via Pinata
- **Styling:** Tailwind CSS (Brutalist Design)

### Real-Time Data Flow
```
Smart Contract Event → Somnia Streams SDK → React Hooks → UI Update
                    ↓
              (~2-3 seconds total)
```

---

## 📖 Vision & Roadmap

### Current Status: Live on Somnia Testnet

**What's Working Now:**
- ✅ X account tokenization with credit scores
- ✅ Instant peer-to-peer tipping
- ✅ Real-time activity feeds via Somnia Streams
- ✅ Live leaderboards
- ✅ Profile system with IPFS storage
- ✅ On-chain reputation tracking

### Upcoming Features

**Phase 1: Enhanced Reputation (Q1 2026)**
- 🔄 Dynamic credit score updates based on tip activity
- 🔄 Reputation badges for top supporters
- 🔄 Historical reputation tracking
- 🔄 Cross-platform reputation (beyond X)

**Phase 2: Unlock Web3 Opportunities (Q2 2026)**
- 🔮 **Credit Score-Based Lending** - Borrow against your reputation
- 🔮 **DAO Governance Weight** - Vote power based on influence
- 🔮 **Exclusive Access** - Gated communities by credit tier
- 🔮 **Creator NFTs** - Mintable reputation tokens

**Phase 3: Scale to Millions (Q3 2026)**
- 🚀 Mainnet launch on Somnia
- 🚀 Mobile app (iOS/Android)
- 🚀 Browser extension for one-click tipping
- 🚀 Integration with other social platforms

**The Goal**: Make on-chain reputation as common as having an X account.

---

## 🎮 Try It Now

**Live Demo:** [tipz.somnia.network](https://tipz.somnia.network) *(Testnet)*

**Quick Start (No Developer Skills Needed):**

**For Creators:**
1. Visit the app
2. Click "Connect Wallet" (use MetaMask)
3. Click "Register" and connect X
4. Your credit score generates instantly
5. Share your profile and start receiving tips!

**For Supporters:**
1. Visit the app and connect your wallet
2. Browse creators on the leaderboard
3. Click any profile and "Send Tip"
4. Enter amount and send - they'll see it in 2 seconds!
5. Build your own reputation as an active supporter

**Get Test Tokens:**
- Somnia Faucet: [faucet.somnia.network](https://faucet.somnia.network)
- Need help? Discord: [discord.gg/tipz](https://discord.gg/tipz)

---

## ✨ Key Features

### For Everyone:
- 🎯 **One-Click X Tokenization** - Connect X account, get instant on-chain credit score
- ⚡ **Real-Time Updates** - See tips, rankings, and activity as they happen (Somnia Streams)
- 💸 **Instant Payments** - No delays, no intermediaries, just peer-to-peer value transfer
- 🌐 **No Web3 Experience Needed** - If you can use X, you can use Tipz

### For Creators:
- 📊 **Verifiable Reputation** - Your influence lives on-chain, provable anywhere in Web3
- 💰 **Direct Support** - Receive 98% of every tip (2% platform fee)
- 🚀 **Future Opportunities** - Higher credit scores unlock DeFi, DAOs, exclusive communities
- 🔗 **Shareable Profiles** - `tipz.app/@yourusername` works anywhere

### For Supporters:
- ❤️ **Show Real Appreciation** - Tip creators you love, move beyond likes and retweets
- 💸 **Send Tips Instantly** - Support anyone with crypto in seconds, no minimums
- 🏆 **Build Your Reputation** - Active tippers earn on-chain credit scores too
- 📈 **Track Your Impact** - See all creators you've supported and total contributions
- 🎯 **Optional Messages** - Add personal notes with your tips to connect with creators
- 🌟 **Supporter Leaderboards** - Get recognized for being an active community supporter

### Technical Excellence:
- ⚡ **Sub-3-Second Latency** - Somnia Streams make it feel instant
- 🔒 **Fully Decentralized** - No backend servers, pure blockchain
- 💎 **IPFS Storage** - Profile images stored permanently
- 🎨 **Brutalist Design** - Clean, fast, accessible UI
- 📱 **Mobile-Friendly** - Works seamlessly on all devices

## 🌊 Deep Dive: Somnia Data Streams

**Why real-time matters for social reputation:**

Imagine tipping your favorite creator and waiting 30 seconds to see if it worked. That's how most blockchains feel. Tipz feels like X/Twitter because of **Somnia Data Streams**.

### What Problems Do Streams Solve?

**Traditional Blockchain UX:**
```
❌ Send transaction → Wait → Manually refresh → Hope it worked → Check again
❌ Leaderboards outdated by 30+ seconds
❌ Feels slow and clunky
❌ Users give up
```

**Tipz on Somnia Streams:**
```
✅ Send tip → See confirmation in 2 seconds → Rankings update automatically
✅ Activity feed flows like social media
✅ Feels instant and responsive
✅ Users stay engaged
```

### How We Use Streams (Technical Flow)

1. **Event Detection**
   ```
   User sends tip → TipzCore emits TipSent event → Event listener catches it
   ```

2. **Stream Publishing**
   ```
   Event data → Transform to schema → Publish to "tips" stream
   ```

3. **Real-Time Delivery**
   ```
   React hooks poll stream (1-second intervals) → New data? → Update UI
   ```

4. **User Experience**
   ```
   Total time: 2-3 seconds from transaction to UI update
   ```

### Real-World Impact

**Example: Live Leaderboard**
- Someone tips a creator
- Their total increases
- Ranking changes
- **Everyone viewing the leaderboard sees the update within 3 seconds**
- No page refresh needed
- Feels like live sports scores

**Example: Tip Notifications**
- Creator receives tip
- Notification appears instantly on their dashboard
- Shows who tipped, how much, with message
- **Happens while they're still on the page**
- Just like social media notifications

### Developer Benefits

```typescript
// Simple hook, real-time data
const { tips } = useLiveTickerStream({ 
  windowSize: 10,  // Last 10 tips
  enabled: true    // Auto-updates
});

// That's it. No complex polling, no websockets to manage
```

### The Stack
- **SDK**: Somnia Data Streams v0.10.1
- **Schemas**: Type-safe tip, profile, and leaderboard events
- **Polling**: 1-second intervals (configurable)
- **Publishing**: Automatic from contract events
- **React Integration**: Custom hooks for each stream type

**Result**: Blockchain that feels like Web2, but with Web3 benefits.

## 📚 Documentation & Resources

### Project Documentation
- **BUILD_PROMPTS.md** - Complete 15-phase development guide
- **SOMNIA_STREAMS_INTEGRATION_PROMPTS.md** - Streams integration steps
- **project_structure.md** - Full architecture specification
- **SOMNIA_DOCS_FEEDBACK.md** - Integration learnings and feedback

### External Resources
- [Somnia Network Documentation](https://docs.somnia.network/)
- [Somnia Data Streams SDK](https://github.com/somnia-network/streams-sdk)
- [Foundry Book](https://book.getfoundry.sh/) (Smart contracts)
- [Wagmi Documentation](https://wagmi.sh/) (React hooks)
- [Viem Documentation](https://viem.sh/) (Ethereum interactions)
- [RainbowKit Docs](https://www.rainbowkit.com/) (Wallet connections)

### Developer Community
- **Discord**: [discord.gg/tipz](https://discord.gg/tipz)
- **GitHub Issues**: [github.com/Akanimoh12/tipz/issues](https://github.com/Akanimoh12/tipz/issues)
- **X (Twitter)**: [@TipzPlatform](https://twitter.com/TipzPlatform)

## 💬 Frequently Asked Questions

### For Users

**Q: Why am I not on the leaderboard?**  
A: Leaderboards display after you've received tips. Register your profile and share your `@username` to start receiving support!

**Q: What's the difference between my X username and Tipz username?**  
A: Your X username verifies your social presence. Your Tipz username is your on-chain identity (like `tipz.app/@alice`). You choose your Tipz username during registration.

**Q: How is my credit score calculated?**  
A: 
- **50%** - X Followers count
- **30%** - Engagement rate (likes, retweets)
- **20%** - Account age
- **Scale**: 0-1000 points
- **Tiers**: Bronze (0-300), Silver (301-600), Gold (601-850), Diamond (851-1000)

**Q: Where do test tokens come from?**  
A: Use the [Somnia Faucet](https://faucet.somnia.network) to get free STT (Somnia Test Tokens) for the testnet.

**Q: Is this live on mainnet?**  
A: Currently on Somnia Testnet. Mainnet launch planned for Q3 2026.

**Q: What fees do you charge?**  
A: 2% platform fee on tips. Creators receive 98% of every tip sent.

**Q: How do I add Somnia Testnet to MetaMask?**  
A: 
- Network Name: Somnia Testnet Dream
- RPC URL: `https://dream-rpc.somnia.network`
- Chain ID: `50312`
- Currency: STT

**Q: Can I use this on mobile?**  
A: Yes! Tipz works on all devices. Use a mobile wallet like MetaMask Mobile or Trust Wallet.

---

## 🤝 Contributing

We welcome contributions from the community!

**Ways to Contribute:**
- 💡 **Share Ideas** - Suggest features in [GitHub Issues](https://github.com/Akanimoh12/tipz/issues)
- 🐛 **Report Bugs** - Help us improve by reporting issues
- 📝 **Improve Docs** - Make our documentation better
- 🎨 **Design** - Contribute UI/UX improvements
- � **Code** - For developers: Check our [GitHub](https://github.com/Akanimoh12/tipz) for contribution guidelines

**Every contribution helps build the future of on-chain reputation!**

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ Can include in proprietary projects
- ⚠️ Provided "as is" without warranty
- 📄 Must include original copyright notice

---

## 📞 Get In Touch

### For Users
- **Website**: [tipz.somnia.network](https://tipz.somnia.network)
- **Support Email**: support@tipz.somnia.network
- **X (Twitter)**: [@TipzPlatform](https://twitter.com/TipzPlatform)

### For Developers
- **GitHub Issues**: [Report bugs or request features](https://github.com/Akanimoh12/tipz/issues)
- **Discord**: [Join developer discussions](https://discord.gg/tipz)
- **Technical Questions**: Tag `@TipzDev` on X

### For Partnerships
- **Business Inquiries**: partnerships@tipz.somnia.network
- **Integration Support**: integrations@tipz.somnia.network

---

## 🙏 Acknowledgments

**Built with incredible tools and support from:**

- **[Somnia Network](https://somnia.network)** - For pioneering real-time blockchain infrastructure and Data Streams technology
- **[Foundry](https://github.com/foundry-rs/foundry)** - Rock-solid smart contract development framework
- **[Pinata](https://pinata.cloud)** - Reliable decentralized storage via IPFS
- **[RainbowKit](https://rainbowkit.com)** - Beautiful wallet connection experience
- **[Wagmi](https://wagmi.sh) & [Viem](https://viem.sh)** - Powerful React + Ethereum tooling

**Special Thanks:**
- Somnia team for technical support during integration
- Early testers who provided invaluable feedback
- Open-source community for dependencies and inspiration

---

## 🚀 Join the Movement

**We're not just building a tipping app.**  
We're building the bridge that brings 100 million X users into Web3.

**Your role:**
1. **Use Tipz** - Tokenize your X account today
2. **Share your profile** - Show others what portable reputation looks like
3. **Tip creators** - Support people whose content you value
4. **Spread the word** - Every new user strengthens the network

**Together, we make on-chain reputation as common as having a social media profile.**

---

*Built with ❤️ by the Tipz team | Powered by Somnia Network | Making Web3 feel like Web2*
