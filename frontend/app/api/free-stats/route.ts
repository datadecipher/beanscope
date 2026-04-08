import { fetchFreeStats } from "@/lib/minebean";

export const revalidate = 30;

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
