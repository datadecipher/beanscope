export const maxDuration = 10;

import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { BEAN_SCOPE_ACCESS, BEAN_SCOPE_ACCESS_ABI } from "@/lib/contracts";
import { ALCHEMY_RPC, PUBLIC_RPC } from "@/lib/config";
import { isSuperAdmin } from "@/lib/whitelist";

const client = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_API_KEY ? ALCHEMY_RPC : PUBLIC_RPC),
});

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return Response.json({ error: "invalid_wallet" }, { status: 400 });
  }

  // Superadmins bypass paywall
  if (isSuperAdmin(wallet)) {
    return Response.json({ ok: true });
  }

  if (BEAN_SCOPE_ACCESS) {
    try {
      const hasAccess = await client.readContract({
        address: BEAN_SCOPE_ACCESS,
        abi: BEAN_SCOPE_ACCESS_ABI,
        functionName: "hasAccess",
        args: [wallet as `0x${string}`],
      });

      if (!hasAccess) {
        return Response.json({
          error: "no_access",
          prices: { day: "0.01", week: "0.04", lifetime: "0.15" },
        });
      }
    } catch {
      // Contract read failed — allow access
    }
  }

  return Response.json({ ok: true });
}
