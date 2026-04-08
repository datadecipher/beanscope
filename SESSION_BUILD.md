# Session: Build BeanScope MVP
Use /model sonnet

## Context
You are building BeanScope (E:\BeanScope) — a paid analytics dashboard for MineBean, a gamified mining protocol on Base blockchain. Read CLAUDE.md and PLAN.md for full context.

This is an ANONYMOUS project. NEVER use any personal name, company name, or identity. Brand = "BeanScope". X = @zzzzhodl.

## AUTO-PASS MODE
Run all steps without pausing. Only stop on failure.

## What is MineBean (so you understand the domain)
- Gamified mining on Base: 60-second rounds, 5x5 grid (25 blocks)
- Players deploy ETH on blocks they think will win. 1 winning block selected on-chain randomly per round.
- 1% admin fee, 10% vault fee from losers' ETH. Rest redistributed to winners proportionally.
- 1 BEAN token minted per round, awarded to a winner
- "Roasting" mechanic: claiming BEAN incurs 10% fee redistributed to unclaimed holders
- BEAN contract: 0x5c72992b83e74c4d5200a8e8920fb946214a5a5d on Base
- Game contract: unknown yet — trace from BEAN token's minter on BaseScan

## Step 1: Project Setup
```bash
cd E:\BeanScope
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint
cd frontend
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query recharts
npx shadcn@latest init
```

## Step 2: Smart Contract (BeanScopeAccess.sol)
Create `contracts/src/BeanScopeAccess.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BeanScopeAccess {
    address public owner;
    uint256 public dayPassPrice;
    uint256 public weekPassPrice;
    uint256 public lifetimePrice;
    
    mapping(address => uint256) public accessExpiry;
    
    event AccessGranted(address indexed user, uint256 expiry, uint256 paid);
    event PricesUpdated(uint256 day, uint256 week, uint256 lifetime);
    
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    
    constructor(uint256 _day, uint256 _week, uint256 _lifetime) {
        owner = msg.sender;
        dayPassPrice = _day;
        weekPassPrice = _week;
        lifetimePrice = _lifetime;
    }
    
    function buyDayPass() external payable {
        require(msg.value >= dayPassPrice, "Insufficient ETH");
        _extend(msg.sender, 1 days);
    }
    
    function buyWeekPass() external payable {
        require(msg.value >= weekPassPrice, "Insufficient ETH");
        _extend(msg.sender, 7 days);
    }
    
    function buyLifetime() external payable {
        require(msg.value >= lifetimePrice, "Insufficient ETH");
        accessExpiry[msg.sender] = type(uint256).max;
        emit AccessGranted(msg.sender, type(uint256).max, msg.value);
    }
    
    function hasAccess(address user) external view returns (bool) {
        return accessExpiry[user] >= block.timestamp;
    }
    
    function _extend(address user, uint256 duration) internal {
        uint256 current = accessExpiry[user];
        uint256 start = current > block.timestamp ? current : block.timestamp;
        accessExpiry[user] = start + duration;
        emit AccessGranted(user, accessExpiry[user], msg.value);
    }
    
    function setPrices(uint256 _d, uint256 _w, uint256 _l) external onlyOwner {
        dayPassPrice = _d;
        weekPassPrice = _w;
        lifetimePrice = _l;
        emit PricesUpdated(_d, _w, _l);
    }
    
    function withdraw() external onlyOwner {
        (bool ok,) = payable(owner).call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
```

Deploy via Remix to Base Sepolia first, then Base mainnet. Constructor args:
- dayPassPrice: 10000000000000000 (0.01 ETH)
- weekPassPrice: 40000000000000000 (0.04 ETH)
- lifetimePrice: 150000000000000000 (0.15 ETH)

Save the deployed contract address in `frontend/lib/contracts.ts`.

## Step 3: Discover MineBean Game Contract
Before building the data layer, you MUST find the game contract:
1. Go to BaseScan and look at the BEAN token contract (0x5c72992b83e74c4d5200a8e8920fb946214a5a5d)
2. Find who has minter role or who calls mint() — that's the game contract
3. Read the game contract's ABI/events to understand what events are emitted
4. Document the event signatures in `frontend/lib/contracts.ts`

Use `curl` to fetch from BaseScan API:
```bash
# Get BEAN token contract creation tx
curl "https://api.basescan.org/api?module=contract&action=getabi&address=0x5c72992b83e74c4d5200a8e8920fb946214a5a5d&apikey=YourApiKeyToken"
```

If the contract is not verified, trace Transfer events where `from=0x0000...` to find the minter address.

## Step 4: Wallet + Provider Setup
Set up RainbowKit with Base chain in `frontend/app/layout.tsx` and `frontend/app/providers.tsx`.
- Chain: Base (id: 8453)
- Only need: wallet connect, no extra chains

## Step 5: Data Layer (`frontend/lib/minebean.ts`)
Build server-side data fetching:
1. Use viem `createPublicClient` with Base RPC (Alchemy)
2. Fetch `Transfer` events from BEAN contract (mints = from 0x0, burns/roast)
3. Fetch game contract events (rounds, deployments, rewards) — event signatures from Step 3
4. Aggregate into: round history, hot blocks, whale stats, token supply metrics
5. Cache results in Vercel KV with TTL (rounds: forever, aggregates: 60s)

## Step 6: API Route with Paywall (`frontend/app/api/dashboard/route.ts`)
```typescript
// 1. Get wallet address from query param
// 2. Call hasAccess(wallet) on BeanScopeAccess contract
// 3. If no access: return { error: "no_access", prices: { day, week, lifetime } }
// 4. If access: return full aggregated dashboard data
```

## Step 7: Landing Page (`frontend/app/page.tsx`)
Dark theme, crypto-native design. Show:
- Hero: "See what whales see." + connect wallet CTA
- Free stats: live round counter, total ETH wagered, total BEAN minted
- Pricing cards: Day / Week / Lifetime with buy buttons (call contract directly)
- Preview screenshots of the paid dashboard (heatmap, whale table)

## Step 8: Paid Dashboard (`frontend/app/dashboard/page.tsx`)
Tabs or sections:
1. **Mining Analytics**: Hot block heatmap (5x5 grid colored by win frequency), round history table, whale tracker table
2. **Tokenomics**: BEAN supply tracker cards, emission vs burn chart (recharts BarChart), circulating supply line chart, holder distribution table + pie chart, roast leaderboard
3. **My Stats**: Personal P&L, win rate, BEAN earned (requires connected wallet)

Use recharts for all charts. shadcn/ui for tables, cards, tabs.

## Step 9: Styling
- Dark theme (zinc-900/950 backgrounds, emerald/green accents — bean theme)
- Mobile-first: all grids responsive, tables horizontally scrollable
- The 5x5 heatmap should be a CSS grid that works on mobile
- Loading skeletons while data fetches
- No footer credits, no "built by", no personal attribution

## Step 10: Deploy
1. `git init` in E:\BeanScope, create GitHub repo (public or private — your call)
2. Push to GitHub
3. Connect to Vercel, deploy
4. Set env vars on Vercel: ALCHEMY_API_KEY, NEXT_PUBLIC_ACCESS_CONTRACT (deployed address), KV connection string
5. Buy domain (see suggestions below) and point to Vercel

## Domain Suggestions (all likely available as of April 8, 2026)
- beanscope.xyz (~$1.58)
- beanscan.xyz (~$1.58)  
- beanwatch.xyz (~$1.58)
- beanpulse.xyz (~$1.58)
- beandash.xyz (~$1.58)
- beanstats.xyz (~$1.58)
- minescope.xyz (~$1.58)
- beanscope.app (~$15)

**Domain: beanscope.xyz** (BOUGHT - point DNS to Vercel)

## Post-Deploy: Marketing from @zzzzhodl
1. Twitter thread from @zzzzhodl: "Analyzed 10,000+ MineBean rounds. Built a dashboard. Here's what the data shows..." with heatmap screenshot
2. Post in MineBean Discord
3. DM top MineBean whales — free lifetime pass for a tweet
4. Farcaster cast (MineBean has FC integration)

## Important
- ZERO personal identity anywhere. Git commits use generic name.
- No Meridian, no Pranshu, no real company
- If game contract events can't be decoded, fall back to parsing raw tx calldata
- Ship ugly but fast — polish later if traction exists
- This is a 3-4 day sprint. Don't over-engineer.
