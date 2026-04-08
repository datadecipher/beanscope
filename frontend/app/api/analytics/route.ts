export const maxDuration = 30;
export const revalidate = 30;

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
