// force-dynamic: no build-time pre-render; unstable_cache inside fetchDashboardData handles 30s caching
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { fetchDashboardData } from "@/lib/minebean";

export async function GET() {
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
