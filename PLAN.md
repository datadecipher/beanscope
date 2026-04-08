# BeanScope — MineBean Analytics Dashboard (Base)

## Context

MineBean is a hot gamified mining protocol on Base — 60-second rounds, 5x5 grid, players bet ETH on blocks, 1 winner selected on-chain. BEAN token (0x5c72...5a5d) minted 1/round with "roasting" mechanic (10% claim fee redistributed to holders). Market cap $460K-$2M, volatile, down 72% in 7 days — classic short-term narrative play.

**Goal**: Build "BeanScope" — a paid analytics dashboard. On-chain paywall (ETH payments via Base contract). Maximize revenue in the hype window (2-4 weeks). Ship in 3-4 days.

**No existing competitor tools found.** First-mover advantage.

---

## GPT Audit Feedback (5/10) — What We Accept vs Reject

| Concern | Verdict | Reason |
|---------|---------|--------|
| Business model relies on hype | **Accept** — mitigated by 3-day build, low cost | We know it's short-term. That's the point. |
| Legal compliance gap | **Reject** — this is a simple analytics tool charging ETH for data access. No token issuance, no financial advice, no custody. Same as any SaaS with crypto payments. |
| Frontend paywall bypassable | **Accept** — add light server-side gating via API route | Cheap fix: verify access on API route before returning data |
| Data strategy too thin | **Partially accept** — add Dune for historical backup | Vercel KV + RPC polling is fine for 2-week lifespan |
| Competitive positioning weak | **Reject** — no competitors exist. First-mover IS the positioning. |

---

## Product Features (MVP)

### Free Tier (hook users)
- Live round counter + timer
- Global stats: total rounds, total ETH wagered, total BEAN minted

### Paid Tier
1. **Hot Block Heatmap** — win frequency per grid position (25 blocks). Even if random, degens pay for patterns.
2. **Whale Tracker** — top 20 wallets by ETH deployed, win rates, favorite blocks, live activity
3. **Round History** — last 200 rounds: winning block, pot size, player count, biggest winner
4. **Personal Stats** — connect wallet: your P&L, win rate, BEAN earned, optimal roast claim timing
5. **ROI Calculator** — expected value based on historical player counts and pot sizes

### Paid Tier — Tokenomics Dashboard (BEAN holders love this)
6. **BEAN Supply Tracker** — current circulating supply, total minted, real-time emission rate (1 BEAN/round = ~1,440/day)
7. **Roasting Analytics** — total BEAN roasted (burned via 10% claim fee), daily/weekly burn rate, net emission (minted - roasted), burn-to-mint ratio chart
8. **Supply Charts** — interactive graphs (recharts/lightweight-charts):
   - Circulating supply over time (line chart)
   - Daily emissions vs daily burns (dual bar chart)
   - Cumulative burn chart
   - Net supply change (weekly rolling)
9. **Holder Distribution** — top 50 BEAN holders, % of supply, holder count over time, concentration index (Gini)
10. **Roast Leaderboard** — who earned the most roasted BEAN by holding unclaimed (patience rewards)
11. **Price vs Supply Correlation** — overlay BEAN price (from DEX trades) with supply metrics

All data sourced from on-chain: Transfer events on BEAN contract (mints from zero address, burns/roast fees), balanceOf calls for top holders.

### Stretch (Day 5-7 if hype sustains)
- Telegram alerts: whale enters round, pot > threshold
- "Copy whale" strategy suggestions

---

## Smart Contract: BeanScopeAccess.sol (~70 lines)

```
mapping(address => uint256) accessExpiry
- buyDayPass() payable — extends access by 1 day
- buyWeekPass() payable — extends access by 7 days  
- buyLifetime() payable — sets expiry to max uint256
- hasAccess(address) view — returns bool
- setPrices() onlyOwner — adjust prices dynamically
- withdraw() onlyOwner — pull ETH revenue
```

Deploy on Base mainnet via Remix or Foundry. Test on Base Sepolia first.

---

## Pricing Strategy (dynamic via setPrices)

| Phase | Day Pass | Week Pass | Lifetime | Rationale |
|-------|----------|-----------|----------|-----------|
| Launch (Day 1-7) | 0.01 ETH (~$25) | 0.04 ETH (~$100) | 0.15 ETH (~$375) | Peak hype pricing |
| Week 2-3 | 0.005 ETH | 0.02 ETH | 0.08 ETH | Sustain conversions |
| Week 4+ | 0.002 ETH | 0.01 ETH | 0.05 ETH | Extract tail revenue |

**Conservative revenue**: 200 daily players, 5% convert, avg 0.01 ETH = 0.1 ETH/day (~$250). Over 2-week window: ~$3,500. Whale lifetime passes: +$1,000-2,000. **Total: $4,500-5,500.**

---

## Tech Stack

| Layer | Choice | Cost |
|-------|--------|------|
| Frontend | Next.js 14 + Tailwind + shadcn/ui | Free (Vercel) |
| Wallet | RainbowKit + wagmi + viem | Free |
| RPC | Alchemy Base (free tier) | Free |
| Cache | Vercel KV (free tier) | Free |
| Contract | Solidity 0.8.20, Foundry | Free |
| Domain | beanscope.xyz or similar | ~$5 |
| **Total infra cost** | | **~$5** |

---

## Data Pipeline

1. **Find game contract**: trace BEAN token's minter address on BaseScan
2. **Index game events**: `viem.getLogs()` for `RoundCompleted`, `Deployed`, `Rewarded` events
3. **Index token events**: `Transfer` events on BEAN contract (0x5c72...5a5d):
   - Mints: `from = 0x0` (track emission per round/day/week)
   - Roast burns: transfers to fee pool or zero address (track burn rate)
   - Holder transfers: build holder distribution snapshot
4. **DEX price data**: read Uniswap/Aerodrome pool events for BEAN/ETH swaps to chart price
5. **Cache**: store in Vercel KV — rounds by roundId, daily token aggregates by date, holder snapshots hourly
6. **Live poll**: every 10-15s for new events (matches 60s round cadence)
7. **Aggregations**: server-side in API route — supply calculations, burn rates, holder rankings, charts data
8. **Server-side gating** (GPT feedback): Next.js API route checks `hasAccess()` before returning aggregated data. Frontend calls `/api/dashboard` not direct RPC.

---

## Architecture (addressing GPT's bypass concern)

```
User -> Connect Wallet -> Pay ETH (on-chain) -> Access granted in contract
                                                        |
Frontend -> /api/dashboard?wallet=0x... -> API Route checks hasAccess() on-chain
                                                        |
                                           Returns aggregated analytics JSON
                                                        |
                                           Frontend renders dashboard
```

This way data flows through our API route, not directly from RPC to frontend. Simple server-side gate.

---

## File Structure (New Repo: beanscope)

```
beanscope/
  contracts/
    src/BeanScopeAccess.sol
    script/Deploy.s.sol
  app/                          # Next.js App Router
    page.tsx                    # Landing (free stats + buy CTA)
    api/dashboard/route.ts      # Server-side gated data endpoint
    dashboard/page.tsx          # Paid dashboard UI
    layout.tsx                  # Providers (RainbowKit, wagmi)
  lib/
    contracts.ts                # ABIs, addresses
    useAccess.ts                # Hook: check paywall
    minebean.ts                 # Server: fetch & cache round data
    aggregations.ts             # Compute analytics from raw data
  components/
    HeatMap.tsx                 # 5x5 grid visualization
    WhaleTable.tsx              # Top wallets
    RoundHistory.tsx            # Recent rounds table
    PersonalStats.tsx           # Wallet-specific P&L
    PaywallGate.tsx             # Buy access UI
    SupplyChart.tsx             # Circulating supply over time (line)
    EmissionBurnChart.tsx       # Daily mint vs burn (dual bar)
    HolderDistribution.tsx      # Top holders table + pie chart
    RoastLeaderboard.tsx        # Top roast earners
    PriceSupplyOverlay.tsx      # Price vs supply correlation
    TokenStatsCards.tsx         # Summary cards (supply, burned, emission rate)
```

---

## Timeline

| Day | Deliverable |
|-----|------------|
| 1 AM | Deploy BeanScopeAccess.sol to Base. Find game contract, map events on BaseScan. |
| 1 PM | Scaffold Next.js + RainbowKit. Wallet connect + paywall check. |
| 2 | Data fetching (getLogs), round history table, hot block heatmap. |
| 3 | Whale tracker, personal stats, API route gating. Polish UI. |
| 3 PM | Deploy to Vercel. Buy domain. |
| 4 | Launch. Post in MineBean Discord + Twitter. DM top whales. |
| 5-7 | Iterate. Telegram alerts if demand. Adjust prices. |

---

## Marketing (Day 4+)

1. Twitter thread: "I analyzed 10,000 MineBean rounds. Here's what the data shows..." (free data = traffic)
2. Post in MineBean Discord with heatmap screenshot
3. DM top 10 MineBean whales — free lifetime pass in exchange for a tweet
4. Farcaster post (MineBean has Farcaster integration)

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Hype dies before launch | HIGH | 3-day build. Ship ugly but fast. |
| Game contract unverified / no events | MEDIUM | Fall back to parsing calldata. Check BaseScan first. |
| Low conversion | MEDIUM | Free tier hooks users. Aggressive whale outreach. |
| RPC rate limits | LOW | Cache aggressively. Historical data is immutable. |
| Contract bug | LOW | Trivially simple contract (~70 lines). Test on Sepolia. |

---

## GO / NO-GO

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Market (hype exists NOW) | 6 | 15% | 0.90 |
| Pain point (degens want edge) | 7 | 15% | 1.05 |
| Competitive gap (NO tools exist) | 9 | 15% | 1.35 |
| Moat (first-mover, speed) | 5 | 15% | 0.75 |
| Technical feasibility | 9 | 10% | 0.90 |
| Legal (simple analytics tool) | 8 | 10% | 0.80 |
| Unit economics ($5 cost, $4.5K rev) | 8 | 10% | 0.80 |
| Founder-market fit | 6 | 10% | 0.60 |
| **Total** | | | **7.15** |

**Verdict: GO** (above 7.0 threshold). Low cost ($5), high upside ($4.5K+), 3-day build. Worth the bet.

---

## Verification

1. Deploy contract on Base Sepolia, test all 3 pass types
2. Verify game contract events readable via getLogs on Base mainnet
3. Test full flow: connect wallet -> buy pass -> access dashboard -> see data
4. Check mobile responsiveness (degens use phones)
5. Verify withdraw() works to pull revenue

---

## Important Notes

- This is a NEW repo, separate from TaxNoticeAI
- Pranshu's existing stack knowledge (Next.js, Vercel) transfers directly
- Zero ongoing cost — only $5 domain. Revenue is pure profit.
- If hype dies mid-build, abandon with zero sunk cost beyond time
