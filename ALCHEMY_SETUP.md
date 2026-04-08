# Adding Alchemy API Key to Enable Full Analytics

## Current Status
- Dashboard deployed at `https://beanscope.xyz` ✅
- Paywall enforcing (contract checks working) ✅
- Analytics endpoint responding with basic data (currentRound, beanSupply) ✅
- **Charts empty** — awaiting Alchemy API key to fetch historical events

---

## Step 1: Get Free Alchemy API Key

1. Go to **https://www.alchemy.com**
2. Sign up (or log in if you have an account)
3. Create a new app:
   - App Name: `BeanScope`
   - Chain: **Base**
   - Environment: **Production**
4. Copy the API key (looks like: `abcd1234efgh5678ijkl9...`)

---

## Step 2: Add to Vercel Environment

Run this command from your local machine (must have Vercel CLI installed):

```bash
cd E:\BeanScope\frontend
npx vercel env add ALCHEMY_API_KEY production
```

When prompted, paste your Alchemy API key and press Enter.

**Verify it was added:**
```bash
npx vercel env list production
```

You should see `ALCHEMY_API_KEY` in the list.

---

## Step 3: Redeploy to Vercel

```bash
cd E:\BeanScope
git status  # should show no changes
cd frontend
npx vercel --prod --yes
```

Wait for the deployment to complete (2-3 minutes).

---

## Step 4: Verify Charts Are Populated

Once deployed, test that events are now being fetched:

```bash
curl https://beanscope.xyz/api/analytics | node -e "
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const r = JSON.parse(data);
  console.log('✓ currentRound:', r.currentRound);
  console.log('✓ blockWinCounts:', r.blockWinCounts.some(x => x > 0) ? 'POPULATED' : 'EMPTY');
  console.log('✓ roundHistory length:', r.roundHistory?.length || 0);
  console.log('✓ topWinners length:', r.topWinners?.length || 0);
  console.log('✓ totalETHRewarded:', r.totalETHRewarded);
  console.log('✓ beanSupply:', r.beanSupply);
});
"
```

**Expected output once working:**
```
✓ currentRound: 52405
✓ blockWinCounts: POPULATED  (should have non-zero values)
✓ roundHistory length: 200+
✓ topWinners length: 20
✓ totalETHRewarded: 1234.5678
✓ beanSupply: 68014.65
```

---

## What Happens When Alchemy Key Is Added

When the key is active, `frontend/lib/minebean.ts` will:
1. Fetch **RoundSettled** events (last 30,000 blocks) → populate roundHistory, topWinners, blockWinCounts, totalETHRewarded
2. Fetch **Deployed** events → populate topDeployers, calculate win rates, lastSeen timestamps
3. Fetch **GameStarted** events → map round timestamps
4. Fetch **Transfer** events to address(0) → calculate burnedSupply

This feeds all charts in the dashboard:
- **Mining Analytics tab**: ETH Deployed, Winners Frequency, Round Duration, Beanpot Growth (all populated)
- **Whale Table**: Full stats with win rates and activity (sortable)
- **Tokenomics tab**: All charts with historical data

---

## Troubleshooting

### "API returns same data as before (empty arrays)"
- Verify Alchemy key was added to Vercel: `npx vercel env list production`
- Check that Vercel build succeeded (look at Vercel dashboard)
- Verify no typos in the key
- Wait 30 seconds for cache to refresh, then test again

### "Slow responses from /api/analytics"
- Alchemy free tier has rate limits (~8 req/sec)
- This is normal for first few seconds after key is added
- Subsequent requests are cached for 30 seconds
- No action needed; it will normalize

### "Still getting 429 errors"
- Alchemy free tier might be throttled
- Try upgrading to Alchemy's "Growth" plan (free trial available)
- Or contact Alchemy support to increase rate limits

---

## Technical Details (For Reference)

The code in `frontend/lib/minebean.ts` is already written to use the Alchemy RPC when available:

```ts
const ALCHEMY_RPC = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? "demo"}`;
```

When `ALCHEMY_API_KEY` is set in Vercel env, it will use your key instead of the rate-limited demo key.

The analytics endpoint (`frontend/app/api/analytics/route.ts`) has:
- 60-second maxDuration (Vercel limit)
- 8-second timeout per RPC call (fallback to empty data if RPC hangs)
- 30-second server-side cache (`unstable_cache`)

Event fetching is parallelized to maximize throughput while staying under rate limits.

---

## That's It!

Once the Alchemy key is added and Vercel redeploys, all analytics features will be live. Charts will populate within 30 seconds of first request.
