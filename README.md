# BeanScope — MineBean Analytics Dashboard

Paid analytics dashboard for MineBean, a gamified mining protocol on Base blockchain. Anonymous project by @zzzzhodl.

**Status**: Deployed at [beanscope.xyz](https://beanscope.xyz)

---

## What is BeanScope?

BeanScope provides deep on-chain analytics for MineBean players:
- **Hot Block Heatmap** — win frequency per grid position
- **Whale Intelligence** — top wallets, win rates, activity tracking
- **Mining Analytics** — ETH deployed, winner frequency, round trends, beanpot growth
- **Tokenomics Dashboard** — BEAN emission, burn rate, supply breakdown, yield analytics
- **Live Round Panel** — countdown timer, current top deployer, hottest block

All data sourced directly from the blockchain. No intermediaries. No API keys required to view on-chain contracts.

---

## Current Deployment Status

### ✅ What's Working
- Dashboard live at `https://beanscope.xyz` (Vercel free tier)
- Wallet connection via RainbowKit + wagmi
- Paywall contract enforcing via Base mainnet (`0x12fc49c7f69bc434caddcaa599cffc06a7d3a701`)
- Access control: superadmin whitelist + on-chain payment checks
- Three payment tiers:
  - **24h Pass**: 0.01 ETH (~$25)
  - **7-Day Pass**: 0.04 ETH (~$100)
  - **Lifetime**: 0.15 ETH (~$375)
- Responsive UI (mobile-first, tested at 375px+)
- Free tier for logged-out users (current round, BEAN supply, last 3 rounds)

### 🔴 What's Blocked
**Charts are empty** — awaiting Alchemy API key to fetch historical events.

Currently, the dashboard returns:
- ✅ Current round number
- ✅ BEAN total supply
- ❌ Round history (empty)
- ❌ Top winners (empty)
- ❌ Block win heatmap (all zeros)
- ❌ Chart data (empty arrays)

All code is written and working. This is purely an RPC limitation.

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 + App Router
- **UI Library**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts (responsive, empty gracefully)
- **Wallet**: RainbowKit + wagmi + viem
- **Hosting**: Vercel (free tier)
- **Cache**: unstable_cache (30s server-side) + ISR

### Blockchain
- **Chain**: Base mainnet
- **Contracts**:
  - BEAN token: `0x5c72992b83e74c4d5200a8e8920fb946214a5a5d`
  - GridMining game: `0x9632495bdb93fd6b0740ab69cc6c71c9c01da4f0`
  - BeanScopeAccess paywall: `0x12fc49c7f69bc434caddcaa599cffc06a7d3a701`
- **RPC**: publicnode (free, limited) + Alchemy (requires API key)

### Data Pipeline
```
RPC Events (getLogs) → Aggregate on-chain data → Cache 30s → API response → Frontend charts
```

**Key stats computed from events**:
- `RoundSettled` → round winners, block win counts, ETH rewarded
- `Deployed` → top deployers, participation counts
- `GameStarted` → round timestamps
- `Transfer` → BEAN burn calculations

---

## Endpoints

### Public Endpoints (No Authentication)

**GET `/api/free-stats`**
- Returns: current round, BEAN supply, round status, recent rounds (last 3)
- Caching: 30s server-side
- Use: Landing page free tier

**GET `/api/analytics`**
- Returns: Full DashboardData (all charts data)
- Caching: 30s server-side cache via unstable_cache
- Use: Dashboard (requires access check)
- Status: Returns structure correctly, but arrays empty until Alchemy key added

### Protected Endpoints (Access Required)

**GET `/api/dashboard?wallet=0x...`**
- Validates wallet has access (superadmin or paid)
- Returns: `{ ok: true }` if allowed, `{ error: "no_access", prices: {...} }` if denied
- Use: Access gating before fetching analytics

---

## File Structure

```
E:\BeanScope/
├── frontend/                          # Next.js app
│   ├── app/
│   │   ├── page.tsx                  # Landing page (hero + free stats + pricing)
│   │   ├── dashboard/page.tsx        # Paid dashboard (Mining & Tokenomics tabs)
│   │   ├── api/
│   │   │   ├── dashboard/route.ts    # Access check endpoint
│   │   │   ├── analytics/route.ts    # Analytics data endpoint (force-dynamic)
│   │   │   └── free-stats/route.ts   # Public free tier endpoint
│   │   ├── layout.tsx                # Providers (RainbowKit, wagmi, etc)
│   │   └── providers.tsx             # Wallet provider setup
│   ├── lib/
│   │   ├── minebean.ts              # Core data layer (event fetching, aggregations)
│   │   ├── config.ts                # RPC URLs, prices
│   │   ├── contracts.ts             # Contract ABIs and addresses
│   │   ├── chain.ts                 # Wagmi chain configuration
│   │   └── whitelist.ts             # Superadmin whitelist
│   ├── components/
│   │   ├── mining-charts.tsx        # 4 charts: ETH deployed, winners frequency, duration, beanpot
│   │   ├── live-round-panel.tsx     # Countdown timer + current stats
│   │   ├── whale-table.tsx          # Top wallets with sortable columns
│   │   ├── tokenomics-charts.tsx    # Emission, supply breakdown, yield stats
│   │   ├── heatmap-grid.tsx         # 5x5 block win heatmap
│   │   ├── round-history.tsx        # Recent rounds table
│   │   └── pricing-cards.tsx        # Buy pass cards
│   ├── .env.local                   # Local env (NEXT_PUBLIC_ACCESS_CONTRACT, etc)
│   └── next.config.ts               # Next.js config
├── contracts/
│   ├── src/BeanScopeAccess.sol      # Paywall contract
│   ├── script/Deploy.s.sol          # Deployment script
│   └── AUDIT.md                     # GPT-4o security audit (9/10)
├── CHANGES.md                        # Detailed changelog of all updates
├── CLAUDE.md                         # Project rules and guidelines
├── SESSION_HANDOFF.md               # Previous session notes
├── ALCHEMY_SETUP.md                 # Step-by-step Alchemy key setup
└── VERIFY_DEPLOYMENT.sh             # Verification script
```

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel CLI (`npm i -g vercel`)

### Local Development
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel
```bash
cd E:\BeanScope
git add -A
git commit -m "Your message"
git push origin main
cd frontend
npx vercel --prod --yes
```

---

## Next Priority: Add Alchemy API Key

**This is the only remaining blocker for full analytics.**

### Steps
1. Get free Alchemy API key from https://www.alchemy.com
2. Add to Vercel:
   ```bash
   cd frontend
   npx vercel env add ALCHEMY_API_KEY production
   # Paste your key
   ```
3. Redeploy:
   ```bash
   npx vercel --prod --yes
   ```
4. Verify:
   ```bash
   bash VERIFY_DEPLOYMENT.sh
   ```

See `ALCHEMY_SETUP.md` for detailed instructions.

---

## Paywall Contracts

### BeanScopeAccess.sol (Paywall)
Contract: `0x12fc49c7f69bc434caddcaa599cffc06a7d3a701` (Base mainnet)

Functions:
- `buyDayPass()` — payable, extends access by 1 day
- `buyWeekPass()` — payable, extends access by 7 days
- `buyLifetime()` — payable, sets expiry to max uint256
- `hasAccess(address)` — view, returns bool
- `withdraw()` — owner only, pull ETH revenue

Prices (configurable):
- Day: 0.01 ETH
- Week: 0.04 ETH
- Lifetime: 0.15 ETH

---

## Testing

### Endpoints
```bash
# Free stats (public)
curl https://beanscope.xyz/api/free-stats

# Analytics (public endpoint, but data requires access)
curl https://beanscope.xyz/api/analytics

# Access check (protected)
curl "https://beanscope.xyz/api/dashboard?wallet=0x0000000000000000000000000000000000000001"
# Expected: { "error": "no_access", "prices": {...} }

# Superadmin bypass
curl "https://beanscope.xyz/api/dashboard?wallet=0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014"
# Expected: { "ok": true }
```

### Verification
```bash
bash VERIFY_DEPLOYMENT.sh
```

---

## Known Limitations

### RPC Rate Limits
- **publicnode**: Blocks `getLogs` from Vercel serverless IPs
- **Alchemy demo key**: Rate-limited (HTTP 429)
- **Solution**: Add real Alchemy API key (free tier sufficient)

### Vercel Timeout
- Hard limit: 10 seconds per request on free tier
- Analytics endpoint: 60-second maxDuration (only works on Vercel, not local)
- Mitigation: 30-second cache + 8-second timeout per RPC call

### Data Freshness
- Events cached for 30 seconds (unstable_cache)
- Historical data is immutable, so caching is safe
- Live round data updates every 30 seconds

---

## Security

### Vulnerabilities Audited
- Contract audit: GPT-4o (9/10) — See `contracts/AUDIT.md`
- No reentrancy issues (simple payment mechanism)
- Access control: on-chain checks via paywall contract
- No private keys stored in repo
- All secrets in Vercel env vars only

### Privacy
- Anonymous project — no user tracking, no emails, no KYC
- All payments on-chain via Base ETH
- No backend database — stateless API routes

---

## Architecture Decisions

### Why Vercel?
- Free tier sufficient for small user base
- Built-in caching (unstable_cache)
- Native Next.js support
- Easy deploy workflow

### Why publicnode + Alchemy?
- publicnode: Free, widely available (but limited)
- Alchemy: Free tier sufficient for ~10 req/sec
- Fallback: Data fetches fail gracefully (return empty arrays)

### Why events-based, not getRound loops?
- Loop approach times out at 20+ calls (Vercel 10s limit)
- Events approach: Single batch getLogs call (3-5s, cached 30s)
- Massively more efficient

### Why unstable_cache instead of Redis?
- Vercel KV (free tier) has rate limits
- unstable_cache: Built-in, revalidates on-demand, no cold starts
- Good enough for analytics use case

---

## Roadmap (Future)

1. **Immediate**: Add Alchemy API key → full charts
2. **Week 2**: Monitor paywall conversion, adjust pricing
3. **Week 3**: Telegram alerts for whales (if hype sustains)
4. **Week 4**: Personal wallet stats tab
5. **Optional**: Price tracking (if BEAN hits a DEX)

---

## Support / Issues

Check `CHANGES.md` for full history of updates and fixes.

For RPC issues, see `ALCHEMY_SETUP.md` for troubleshooting.

---

## Project Info

- **Domain**: beanscope.xyz
- **Repository**: https://github.com/datadecipher/beanscope
- **Deployment**: Vercel (production auto-deploys on `main` push)
- **Blockchain**: Base mainnet
- **Anonymous**: No personal names in codebase, commits, or UI
- **Infra Cost**: ~$5/year (domain only)
- **Revenue Model**: On-chain payments in ETH

---

## Changelog

See `CHANGES.md` for detailed history.

Latest (2026-04-09):
- Advanced analytics overhaul: 4 mining charts, whale intelligence, tokenomics dashboard, live round panel
- Fixed RPC limitations by disabling event fetching until Alchemy key added
- All charts present but data-ready (empty arrays until events populate)

---

Generated: 2026-04-09  
Last Updated: 2026-04-09
