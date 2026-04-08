Use /model sonnet

# Session: BeanScope Advanced Analytics Overhaul

## AUTO-PASS MODE
Run all steps without pausing. Only stop on failure.

## Context
BeanScope is live at beanscope.xyz (Vercel). Paywall is now enforcing via contract 0x12fc49c7f69bc434caddcaa599cffc06a7d3a701 on Base mainnet.
- GitHub: datadecipher/beanscope
- Repo: E:\BeanScope
- GridMining: 0x9632495bdb93fd6b0740ab69cc6c71c9c01da4f0 (Base mainnet)
- BEAN token: 0x5c72992b83e74c4d5200a8e8920fb946214a5a5d (Base mainnet)
- RPC: base-rpc.publicnode.com (publicnode — don't change, others block Vercel IPs)
- Data fetching: getLogs-based (NOT getRound loops — times out at 20+ calls)
- All analytics served from /api/analytics (ISR, revalidate=30) to avoid Vercel timeout

## Current State (What Exists)
- `frontend/lib/minebean.ts` — core data layer: fetchDashboardData(), getLogs for RoundSettled/Deployed events, unstable_cache
- `frontend/lib/contracts.ts` — ABIs for GridMining (getRound returns 9 fields), BEAN token, BeanScopeAccess
- `frontend/app/api/analytics/route.ts` — ISR endpoint returning DashboardData
- `frontend/components/tokenomics-section.tsx` — Basic: supply pie chart, block win bar chart, 3 static stat cards
- `frontend/components/heatmap-grid.tsx` — 5x5 block win heatmap (25 blocks), shows win counts, zero right now
- `frontend/components/round-history.tsx` — Table of recent rounds
- `frontend/components/whale-table.tsx` — Top deployers by total ETH
- `frontend/app/dashboard/page.tsx` — Two tabs: "mining" and "tokenomics", fetches /api/analytics after access check

## Known Bug: Heatmap shows all zeros
The blockWinCounts array (25 blocks) is populated from RoundSettled events' `winningBlock` field.
Likely the field is not being parsed correctly from the event logs. Before adding new features:
1. Read `frontend/lib/minebean.ts` fully
2. Check how blockWinCounts is computed — verify the ABI field name for winningBlock in the RoundSettled event
3. Fix it so heatmap shows real data
4. Test: `curl https://beanscope.xyz/api/analytics | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const r=JSON.parse(d); console.log('blockWinCounts:', r.blockWinCounts);})"`

## What to Build: Advanced Analytics

The goal is to make the dashboard worth paying for. Users are on-chain degens — they want deep data, charts, and edge they can't get elsewhere. Two tabs to overhaul:

---

### Tab 1: Mining Analytics (overhaul)

#### 1a. Fix heatmap (bug above first)

#### 1b. Over-time charts (add to DashboardData, fetch from getLogs)
- **ETH Deployed per Round** — line chart, x=roundId, y=totalDeployed (ETH). Shows momentum/whale activity over time.
- **Winners Over Time** — bar chart showing topMiner address frequency (how many rounds each wallet has won). Deduplicate to top 10 winners.
- **Round Duration Trend** — line chart of (endTime - startTime) per round in hours. Shows if rounds are getting longer/shorter.
- **Beanpot Growth** — line chart of beanpotAmount per round. Shows jackpot accumulation.

#### 1c. Whale Intelligence (upgrade WhaleTable)
Currently shows: address, totalETH, rounds count.
Add:
- **Win rate** = rounds won / rounds participated (need to cross-reference topMiner from RoundSettled with deployer logs)
- **Last active** = timestamp of most recent round they participated in
- **Avg ETH per round** = totalETH / rounds
- Sort options: by totalETH (default), by win rate, by last active

#### 1d. Current Round Live Panel
- Time remaining (countdown) with progress bar
- Current top deployer address (from getCurrentRound state if available, or last block event)
- ETH deployed so far in current round
- Which block is currently "hottest" (most ETH on it if available, or most wins historically)

---

### Tab 2: Tokenomics (full overhaul)

The current tokenomics tab is near-useless (static cards, basic pie). Replace with:

#### 2a. Emission Schedule
- **Minted Over Time** — cumulative line chart: x=roundId, y=cumulative BEAN minted. Each round mints 1 BEAN to winner + beanpot share.
- **Emission Rate** — BEAN minted per round (flat 1 + beanpot fraction). Show it's decelerating as supply approaches cap.
- **Rounds Until Max Supply** — derived stat: (3,000,000 - currentSupply) / avg emission per round.

#### 2b. Yield / Rewards Analytics
- **Total ETH rewarded to miners** — sum of topMinerReward across all rounds
- **Avg ETH yield per round** — totalWinnings / roundCount
- **Best round ever** — round with highest totalWinnings (ETH), show roundId + amount
- **Total beanpot distributed** — sum of beanpotAmount across settled rounds

#### 2c. Burn Mechanics (if any)
Check if the BEAN token contract has a burn() or burnFrom() function. If yes:
- Fetch Transfer events to address(0) to compute total burned
- Show: Total Burned, % of max supply burned, Circulating = minted - burned
If no burn function exists, show "No burn mechanism — deflationary only via mining cost"

#### 2d. Supply Breakdown (upgrade pie)
Replace current 2-slice pie with:
- Minted (green)
- Burned (red, if applicable)  
- Beanpot locked (yellow) — beanpotAmount of current round
- Unminted (dark)

#### 2e. Historical BEAN Price (if data available)
If there's a DEX pool for BEAN/ETH or BEAN/USDC on Base, fetch price from the pool's slot0 (Uniswap v3) or reserves (v2). Show a price line chart over time.
- Check: look for Uniswap v3 pool factory events with BEAN token address
- If no pool found, skip this section (don't show placeholder)

---

## Implementation Plan

### Step 1: Fix heatmap bug
Read minebean.ts, find blockWinCounts computation, fix the event field parsing.

### Step 2: Extend DashboardData interface in minebean.ts
Add new fields to DashboardData:
```ts
roundHistory: RoundData[];  // all rounds (not just recent)
topWinners: { address: string; wins: number; rounds: number; totalETH: string; winRate: number; lastSeen: number; avgETH: string }[];
emissionCumulative: { roundId: number; cumSupply: number }[];
totalETHRewarded: string;
avgYieldPerRound: string;
bestRound: { roundId: number; totalWinnings: string };
totalBeanpotDistributed: string;
burnedSupply: string;  // "0" if no burn
```

### Step 3: Fetch new data in fetchDashboardData()
All via getLogs (not getRound loops). Use existing RoundSettled/RoundDeployed event pattern.
For burn: check BEAN token Transfer events to address(0x000...0).
Keep using unstable_cache with revalidate=30.

### Step 4: Build new components
- `components/mining-charts.tsx` — ETH deployed/round, winners frequency, round duration, beanpot growth charts
- `components/whale-table.tsx` — upgrade existing with win rate, last active, avg ETH, sort
- `components/tokenomics-charts.tsx` — emission cumulative, yield stats, supply breakdown (upgraded pie)
- `components/live-round-panel.tsx` — current round countdown + top deployer

### Step 5: Update dashboard/page.tsx
Integrate new components into the two tabs. Mining tab gets live panel + 4 charts + upgraded whale table. Tokenomics tab gets emission chart + yield cards + upgraded supply pie + burn section.

### Step 6: Deploy
```bash
cd E:\BeanScope && git add -A && git commit -m "Advanced analytics: mining charts, tokenomics, whale intel, emission schedule"
git push origin main
cd frontend && npx vercel --prod --yes --force
```

### Step 7: Verify
```bash
curl -s https://beanscope.xyz/api/analytics | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const r=JSON.parse(d); console.log('blockWinCounts:', r.blockWinCounts, 'topWinners:', r.topWinners?.length, 'roundHistory:', r.roundHistory?.length);})"
```

---

## Constraints
- No backend server — Next.js API routes only
- ISR (revalidate=30) for all heavy data — never dynamic (ƒ) routes for analytics
- getLogs only — no getRound loops
- RPC: base-rpc.publicnode.com — don't change
- Mobile-first — all charts must work at 375px (use ResponsiveContainer from recharts)
- Anonymous — no personal names anywhere
- Update CHANGES.md after all changes

## What NOT to Do
- Don't use getRound in a loop (times out at 20+ calls)
- Don't use llamarpc or mainnet.base.org (blocked by Vercel)
- Don't put analytics in dynamic routes
- Don't use cacheComponents:true in next.config.ts
