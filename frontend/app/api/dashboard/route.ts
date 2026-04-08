import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { BEAN_SCOPE_ACCESS, BEAN_SCOPE_ACCESS_ABI } from "@/lib/contracts";
import { ALCHEMY_RPC, PUBLIC_RPC } from "@/lib/config";
import { fetchDashboardData } from "@/lib/minebean";

const client = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_API_KEY ? ALCHEMY_RPC : PUBLIC_RPC),
});

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return Response.json({ error: "invalid_wallet" }, { status: 400 });
  }

  // Check access on-chain (skip if contract not deployed yet)
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
      // Contract not deployed or read failed — allow access during dev
    }
  }

  try {
    const data = await fetchDashboardData();
    return Response.json(data);
  } catch (e) {
    return Response.json(
      { error: "fetch_failed", message: String(e) },
      { status: 500 }
    );
  }
}
