# Change Log

### 2026-04-09 (Advanced Analytics Overhaul)
- **What**: Full dashboard analytics upgrade — fix heatmap zeros bug, add 4 mining charts, whale intelligence with win rate/sort, live round panel, full tokenomics overhaul (emission curve, yield stats, supply breakdown, burn tracking)
- **Why**: Heatmap showed all zeros because getLogs lookback was only 3000 blocks (~100 min), missing 24h+ rounds. Analytics were too basic to justify paywall.
- **Files**: `frontend/lib/minebean.ts`, `frontend/app/dashboard/page.tsx`, `frontend/components/mining-charts.tsx` (new), `frontend/components/live-round-panel.tsx` (new), `frontend/components/tokenomics-charts.tsx` (new), `frontend/components/whale-table.tsx` (upgraded)

### 2026-04-08 (Deploy fix)
- **What**: Deploy BeanScopeAccess contract to Base mainnet, update env var, redeploy
- **Why**: Previous contract address 0x7e58620... had no bytecode — contract was never deployed. Paywall was not enforcing (everyone got free access). New contract: 0x12fc49c7f69bc434caddcaa599cffc06a7d3a701
- **Files**: `frontend/.env.local`, Vercel env `NEXT_PUBLIC_ACCESS_CONTRACT`

### 2026-04-08 (Fixes v2)
- **What**: Fix Vercel timeouts — split dashboard into ISR analytics + dynamic access-check; switch RPC to publicnode
- **Why**: fetchDashboardData was hitting Vercel 10s limit; multiple public RPCs block Vercel IPs for dynamic routes
- **Files**:
  - Created: `frontend/app/api/analytics/route.ts` (ISR-cached analytics, revalidate=30)
  - Modified: `frontend/app/api/dashboard/route.ts` (now only does access check, fast)
  - Modified: `frontend/app/dashboard/page.tsx` (fetch analytics from /api/analytics after access ok)
  - Modified: `frontend/lib/minebean.ts` (replaced per-round getRound calls with getLogs events; added unstable_cache)
  - Modified: `frontend/lib/config.ts` (switched public RPC to base-rpc.publicnode.com)
- **Note**: hasAccess contract call returns no data — paywall not enforcing. Contract may need redeployment.

### 2026-04-08 (Fixes)
- **What**: Fix dashboard 500, add free analytics tier, superadmin whitelist, favicon, WC env fix, contract audit
- **Why**: Dashboard was broken (ABI mismatch), users needed free preview, admin needed bypass, branding was default
- **Files**:
  - Modified: `frontend/lib/contracts.ts` (fixed getRound ABI — 9 fields, not 14)
  - Modified: `frontend/lib/minebean.ts` (updated RoundData interface, added FreeStatsData + fetchFreeStats)
  - Modified: `frontend/app/page.tsx` (added FreeStats component)
  - Modified: `frontend/app/api/dashboard/route.ts` (superadmin bypass)
  - Modified: `frontend/app/dashboard/page.tsx` (admin badge)
  - Modified: `frontend/app/layout.tsx` (favicon + OG metadata)
  - Modified: `frontend/components/round-history.tsx` (replaced minerCount with totalWinnings)
  - Created: `frontend/lib/whitelist.ts` (superadmin check)
  - Created: `frontend/app/api/free-stats/route.ts` (public analytics endpoint)
  - Created: `frontend/components/free-stats.tsx` (free tier UI)
  - Created: `frontend/app/icon.svg` (BeanScope favicon)
  - Created: `contracts/AUDIT.md` (GPT-4o security audit — 9/10)
  - Vercel: removed/re-added NEXT_PUBLIC_WC_PROJECT_ID (stripped trailing newline)

### 2026-04-08 (Deploy)
- **What**: Deployed BeanScopeAccess contract to Base mainnet + Vercel production deploy + DNS setup
- **Why**: Production launch
- **Files**:
  - Created: `frontend/scripts/deploy.mjs` (contract deployment script)
  - Created: `frontend/.env.local` (contract address + WC project ID)
  - Created: `.gitignore`
  - Contract: `0x7e58620fa1a7211f63adce098b25f2ce7a3d744d` on Base mainnet
  - Vercel: `frontend-rho-neon-83.vercel.app`
  - DNS: beanscope.xyz A record -> 76.76.21.21, www CNAME -> cname.vercel-dns.com
  - GitHub: datadecipher/beanscope

### 2026-04-08
- **What**: Full MVP scaffold — Next.js 16 app with RainbowKit wallet, on-chain data layer, landing page, paid dashboard
- **Why**: Initial BeanScope build per SESSION_BUILD.md plan
- **Files**:
  - Created: `frontend/` (Next.js app via create-next-app)
  - Created: `contracts/src/BeanScopeAccess.sol` (paywall contract)
  - Created: `frontend/lib/contracts.ts` (BEAN, GridMining, BeanScopeAccess ABIs)
  - Created: `frontend/lib/config.ts` (RPC URLs, pricing)
  - Created: `frontend/lib/chain.ts` (wagmi/RainbowKit config)
  - Created: `frontend/lib/minebean.ts` (on-chain data fetching layer)
  - Created: `frontend/app/providers.tsx` (wallet providers)
  - Created: `frontend/app/api/dashboard/route.ts` (paywalled API route)
  - Created: `frontend/components/hero-section.tsx` (landing hero)
  - Created: `frontend/components/stats-bar.tsx` (live stats)
  - Created: `frontend/components/pricing-cards.tsx` (buy pass UI)
  - Created: `frontend/components/heatmap-grid.tsx` (5x5 block win heatmap)
  - Created: `frontend/components/round-history.tsx` (recent rounds table)
  - Created: `frontend/components/whale-table.tsx` (top deployers)
  - Created: `frontend/components/tokenomics-section.tsx` (supply charts)
  - Created: `frontend/app/dashboard/page.tsx` (paid dashboard page)
  - Modified: `frontend/app/layout.tsx` (dark theme, providers, metadata)
  - Modified: `frontend/tsconfig.json` (target ES2020 for BigInt)
