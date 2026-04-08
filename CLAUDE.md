# BeanScope

Paid analytics dashboard for MineBean (gamified mining on Base blockchain). Anonymous project by @zzzzhodl.

## Rules
- NEVER use any personal name, "Meridian Intelligence", "Pranshu", or any real identity anywhere in code, UI, or commits
- Anonymous project — brand is "BeanScope" only, X account is @zzzzhodl
- All payments on-chain via Base ETH — no Stripe, no email, no KYC
- Ship fast, iterate fast — this is a short-term narrative play
- Mobile-first (degens use phones)
- No backend server — Next.js API routes + Vercel only
- Cache aggressively — historical on-chain data never changes

## Tech Stack
- Next.js 14 + Tailwind + shadcn/ui
- RainbowKit + wagmi + viem (wallet + Base chain)
- Solidity 0.8.20 (BeanScopeAccess.sol paywall contract)
- Vercel (hosting, free tier)
- Alchemy Base RPC (free tier)
- Vercel KV (cache, free tier)
- recharts or lightweight-charts (graphs)

## Key Contracts
- BEAN token: 0x5c72992b83e74c4d5200a8e8920fb946214a5a5d (Base)
- BeanScopeAccess: TBD (deploy to Base mainnet)
- MineBean game contract: TBD (trace from BEAN minter)

## Git
- Domain: beanscope.xyz
- Repo: E:\BeanScope
- GitHub: TBD (create under anonymous account or datadecipher)
- Commits: no Co-Authored-By with real names
