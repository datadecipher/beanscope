# Change Log

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
