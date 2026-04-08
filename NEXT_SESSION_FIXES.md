Use /model sonnet

# Session: BeanScope Fixes — Free Tier, Favicon, WC, Superadmin, Contract Audit

## AUTO-PASS MODE
Run all steps without pausing. Only stop on failure.

## Context
BeanScope is deployed at beanscope.xyz (Vercel). Read `CLAUDE.md` and `CHANGES.md` for full context.
- Contract: `0x7e58620fa1a7211f63adce098b25f2ce7a3d744d` on Base mainnet
- GitHub: datadecipher/beanscope
- Vercel project: datadeciphers-projects/frontend
- This is ANONYMOUS — no personal names, no company names.

## Bug 1: WalletConnect 403 — Newline in env var
The `NEXT_PUBLIC_WC_PROJECT_ID` env var on Vercel has a trailing newline (`%0A` in URLs).
Fix:
```bash
cd E:\BeanScope/frontend
# Remove old env var and re-add without newline
npx vercel env rm NEXT_PUBLIC_WC_PROJECT_ID production --yes
printf '8a252b1f684e98e1ef2261842e367196' | npx vercel env add NEXT_PUBLIC_WC_PROJECT_ID production
```
Also go to https://cloud.reown.com and add `beanscope.xyz` and `*.vercel.app` to the project's allowed domains.

## Fix 2: Free Analytics Tier
Users need to see value before paying. Add a free tier that shows LIMITED data without wallet connection or payment:
- **Free (no login)**: Show on landing page (`/`):
  - Current round status (live/ended, time remaining)
  - Total BEAN supply
  - Total miners count (current round)
  - Last 3 rounds summary (winner, total deployed — no details)
  - 5x5 heatmap for CURRENT round only (no historical)
- **Paid (after buying pass)**: Full dashboard (`/dashboard`):
  - All historical rounds
  - Whale tracking table
  - Detailed tokenomics charts
  - Per-wallet analytics
  - Full heatmap history

Implementation:
1. Create `app/api/free-stats/route.ts` — public endpoint, no paywall check
   - Fetch: current round from GridMining, BEAN totalSupply, current round heatmap
   - Cache aggressively (30s revalidate)
2. Update `app/page.tsx` landing page to show free stats below the hero
3. Add components: `components/free-stats.tsx` — renders the free data
4. Keep `/dashboard` as paid-only (existing behavior)

The landing page should feel like a real analytics tool, not just a paywall. Users see enough to want more.

## Fix 3: Favicon + Branding
Replace the default Next.js/Vercel favicon with a BeanScope branded one.
1. Create a simple SVG favicon — a coffee bean with a magnifying glass or scope crosshair, in emerald green (#10b981) on transparent
2. Save as `frontend/app/favicon.ico` (replace existing) and `frontend/app/icon.svg`
3. Add to `frontend/app/layout.tsx` metadata:
   ```tsx
   icons: {
     icon: [
       { url: '/favicon.ico' },
       { url: '/icon.svg', type: 'image/svg+xml' },
     ],
     apple: '/apple-touch-icon.png',
   },
   ```
4. Also create `frontend/app/apple-touch-icon.png` (180x180) and `frontend/app/opengraph-image.png` (1200x630) for social sharing

## Fix 4: Superadmin Whitelist
Whitelist `0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014` so it always has dashboard access without paying.

1. Create `frontend/lib/whitelist.ts`:
   ```ts
   const SUPERADMINS: string[] = [
     "0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014",
   ];

   export function isSuperAdmin(address: string): boolean {
     return SUPERADMINS.some(a => a.toLowerCase() === address.toLowerCase());
   }
   ```

2. Update `frontend/app/api/dashboard/route.ts` — check `isSuperAdmin(wallet)` BEFORE the on-chain `hasAccess` check. If superadmin, skip paywall entirely.

3. Update `frontend/app/dashboard/page.tsx` — if connected wallet is superadmin, show "Admin" badge and skip the "buy pass" prompt.

## Fix 5: Contract Audit via GPT
Send the contract source to OpenAI for security review:
```bash
python -c "
import json, os, urllib.request
contract = open('E:/BeanScope/contracts/src/BeanScopeAccess.sol').read()
body = json.dumps({
  'model': 'gpt-4o',
  'messages': [
    {'role': 'system', 'content': 'You are a Solidity security auditor. Review this smart contract for vulnerabilities, reentrancy, access control issues, integer overflow, and gas optimization. Score 1-10 and list all findings.'},
    {'role': 'user', 'content': contract}
  ],
  'temperature': 0.2
}).encode()
req = urllib.request.Request('https://api.openai.com/v1/chat/completions', body, {
  'Content-Type': 'application/json',
  'Authorization': f'Bearer {os.environ[\"OPENAI_API_KEY\"]}'
})
resp = json.loads(urllib.request.urlopen(req).read())
print(resp['choices'][0]['message']['content'])
"
```
Save audit results to `contracts/AUDIT.md`. Fix any critical/high findings before proceeding.

## Fix 6: Dashboard API 500 Error
The `/api/dashboard` endpoint returns 500 with error: `Position 319 is out of bounds (0 < position < 288)`.
This is from `getRound()` — the ABI's tuple definition doesn't match the actual contract return data.
- Read `frontend/lib/minebean.ts` and `frontend/lib/contracts.ts`
- Check the actual GridMining contract at `0x9632495bdb93fd6b0740ab69cc6c71c9c01da4f0` on Basescan
- Compare the ABI with the actual contract's `getRound` function signature
- Fix the ABI to match the real contract
- Test with: `curl "https://beanscope.xyz/api/dashboard?wallet=0x0000000000000000000000000000000000000001"`

## Step 7: Redeploy
After all fixes:
```bash
cd E:\BeanScope
git add -A
git commit -m "Add free analytics tier, fix WC config, favicon, superadmin whitelist"
git push origin main
cd frontend
npx vercel --prod --yes --force
```

## Step 8: Verify
```bash
curl -s https://beanscope.xyz/api/free-stats | head -5
curl -s "https://beanscope.xyz/api/dashboard?wallet=0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014" | head -5
```

## IMPORTANT
- Anonymous project — no personal names anywhere
- Git user.name = "zzzzhodl", email = "noreply@beanscope.xyz"
- No Co-Authored-By with real names
- Update CHANGES.md after all fixes
