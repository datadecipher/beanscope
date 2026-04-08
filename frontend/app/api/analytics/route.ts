export const maxDuration = 60;
export const revalidate = 30;

import { fetchDashboardData } from "@/lib/minebean";

// Skip RPC calls at build time — unstable_cache handles runtime caching
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

export async function GET() {
  if (IS_BUILD) {
    return Response.json({ _building: true });
  }
  try {
    const data = await fetchDashboardData();
    return Response.json(data);
  } catch (e) {
    return Response.json(
      { error: "fetch_failed", message: String(e) },
      { status: 500 },
    );
  }
}
