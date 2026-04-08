export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { fetchFreeStats } from "@/lib/minebean";

export async function GET() {
  try {
    const data = await fetchFreeStats();
    return Response.json(data);
  } catch (e) {
    return Response.json(
      { error: "fetch_failed", message: String(e) },
      { status: 500 },
    );
  }
}
