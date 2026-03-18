import { NextResponse } from "next/server";
import { getHomepageFeed } from "@/lib/market-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getHomepageFeed();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "홈 피드를 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}
