import { NextResponse } from "next/server";
import { suggestDaangnRegions } from "@/lib/market-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const suggestions = await suggestDaangnRegions(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        suggestions: [],
        message: error instanceof Error ? error.message : "당근 지역 후보를 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}
