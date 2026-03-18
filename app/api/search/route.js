import { NextResponse } from "next/server";
import { searchAllMarkets } from "@/lib/market-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await searchAllMarkets(payload || {});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "검색 처리 중 오류가 발생했어요.",
      },
      { status: 500 },
    );
  }
}
