# Alchemy RPC Integration — Debug Status

## Current Status

**API Key Added**: ✅ GvTVaw5SNoyB7V-DRvRbK (Alchemy free tier)  
**Deployment**: ✅ Vercel synced, No timeouts  
**Charts**: ❌ Empty (events not populating)

---

## What Works ✅

1. **Alchemy RPC Connection**
   ```bash
   curl -X POST "https://base-mainnet.g.alchemy.com/v2/GvTVaw5SNoyB7V-DRvRbK" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   # Response: 44424250 ✓
   ```

2. **Events Exist in Blockchain**
   ```bash
   # Query block 44423250-44423259 (10-block range)
   # Result: 20+ events found
   # Event topics include RoundSettled, Deployed, GameStarted logs
   ```

3. **Analytics Endpoint No Longer Times Out**
   - Response time: 3.3 seconds (under Vercel 10s limit)
   - Endpoint returns all fields: currentRound ✓, beanSupply ✓, blockWinCounts ✓
   - Just missing populated data in arrays

---

## What's Broken ❌

**viem `client.getLogs()` not returning events**

Even though:
- Alchemy API has events
- Endpoint completes without timeout
- Code logic looks correct

The `settledLogs`, `deployedLogs`, `gameStartedLogs`, `burnLogs` arrays remain empty.

---

## Possible Causes

1. **Event Signature Mismatch**
   - Our `ROUND_SETTLED_EVENT` definition in `contracts.ts` might not match actual event
   - Need to verify event topic hash against Alchemy response

2. **Block Range Issue**
   - `fromBlock = latestBlock - 1000` might not have events
   - But direct Alchemy query shows events exist in recent blocks

3. **Viem Client Configuration**
   - RPC endpoint URL might be wrong
   - Client might not be using Alchemy RPC (falling back to publicnode?)

4. **Error Handling**
   - getLogs calls might be failing silently (caught by `.catch(() => [])`)
   - Need to add logging to see actual errors

---

## Next Debugging Steps

### Step 1: Verify Event Signature
Check if our event definition matches Alchemy's response:

```ts
// From direct Alchemy query, RoundSettled event has topic:
// 0x7df671c2a6ff7b0e48f39e47ed4ef1f592e6bc9ef5adddeead9da1f0da85bcc6

// From contracts.ts:
const ROUND_SETTLED_EVENT = {
  type: "event" as const,
  name: "RoundSettled",
  inputs: [
    { name: "roundId", type: "uint64", indexed: true as const },
    { name: "winningBlock", type: "uint8", indexed: false as const },
    // ...
  ],
} as const;

// Calculate topic hash and compare
```

### Step 2: Log the Actual Error
Add logging to `_fetchDashboardData()`:

```ts
async function fetchLogsInChunks(...) {
  for (...) {
    try {
      const logs = await client.getLogs({...});
      console.log(`Fetched ${logs.length} logs from block ${chunkStart}`);
    } catch (e) {
      console.error('getLogs error:', e.message, 'blocks', chunkStart, '-', chunkEnd);
    }
  }
}
```

Then check Vercel logs at: https://vercel.com/datadeciphers-projects/frontend/deployments

### Step 3: Verify RPC Endpoint
Confirm client is actually using Alchemy:

```ts
// In minebean.ts line 10-18:
const client = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_RPC),  // ← Should be Alchemy URL
});

// ALCHEMY_RPC from config.ts line 2:
export const ALCHEMY_RPC = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? "demo"}`;

// Check: does env var exist at runtime?
```

### Step 4: Test with Known Block Range
Hardcode a block range known to have events:

```ts
// From our direct test, block 44423250-44423259 has 20+ events
// Update code to use hardcoded range for testing:
const fromBlock = 44423250n;
const toBlock = 44423260n;
```

---

## Event Signatures to Verify

From direct Alchemy query, observed event topics (first = event name):

1. **RoundSettled**
   - Topic: 0x7df671c2a6ff7b0e48f39e47ed4ef1f592e6bc9ef5adddeead9da1f0da85bcc6
   - Appears in blocks 44423250+
   
2. **Deployed**
   - Topic: 0x53f785e510cb7ac398694df2c027c73935e2518c3b1cd4dba93f8bb62a8bbee0
   - Frequent in same blocks

3. **GameStarted**
   - Topic: 0x21a3f9234ecb68aa0fbcda0a09a292af15303c8862c702b5ddde980ae822bfee
   - Appears multiple times

---

## Files to Check

- `frontend/lib/minebean.ts` — event fetching logic (line 163+)
- `frontend/lib/contracts.ts` — event definitions
- `frontend/lib/config.ts` — ALCHEMY_RPC configuration
- `frontend/app/api/analytics/route.ts` — endpoint wrapper

---

## Last Known Working State

Previous session deployed charts successfully. They were showing data before RPC limitations forced a revert. The code structure is correct; just need to debug the RPC integration.

---

## Recommended Action

1. **Add console logging** to `_fetchDashboardData()` to see actual getLogs errors
2. **Check Vercel Function logs** to see what errors are being caught
3. **Test with hardcoded block range** (44423250-44423260) known to have events
4. **Verify ALCHEMY_API_KEY** is actually set at runtime

Once we see the actual error, we can fix it.

---

**Time Spent**: ~1.5 hours of optimization iterations  
**Alchemy Free Tier Limits Confirmed**: 10-block range per query, ~100 req/min  
**Current Performance**: 3.3s response time (acceptable)  
**Blockers**: viem integration or event signature mismatch

---

Generated: 2026-04-09 23:00 IST
