// force-dynamic: no build-time pre-render; unstable_cache inside fetchDashboardData handles 30s caching
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { fetchDashboardData } from "@/lib/minebean";

export async function GET() {
  try {
    // Wrap in timeout to prevent hangs from blocking responses
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("RPC timeout")), 8000)
    );
    const data = await Promise.race([fetchDashboardData(), timeoutPromise]);
    return Response.json(data);
  } catch (e) {
    return Response.json(
      { error: "fetch_failed", message: String(e) },
      { status: 500 },
    );
  }
}
