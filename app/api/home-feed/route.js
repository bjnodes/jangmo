import { NextResponse } from "next/server";
import { searchAllMarkets } from "@/lib/market-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEED_SEED_QUERIES = ["아이폰", "자전거"];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));
    const limit = Math.max(1, Math.min(60, Number(searchParams.get("limit") || 30)));

    const responses = await Promise.all(
      FEED_SEED_QUERIES.map((query) =>
        searchAllMarkets({
          query,
          sort: "latest",
          pageSize: 36,
          maxJoongnaPages: 3,
          maxBunjangPages: 3,
          variantLimit: 2,
          targetItems: 120,
        }).catch(() => ({
          query,
          providers: [],
          items: [],
        })),
      ),
    );

    const allItems = [];
    const seen = new Set();

    responses
      .flatMap((entry) => entry.items || [])
      .sort((left, right) => (right.timestampMs || 0) - (left.timestampMs || 0))
      .forEach((item) => {
        const key = item.url || `${item.providerId}:${item.title}:${item.price}`;
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        allItems.push(item);
      });

    const items = allItems.slice(offset, offset + limit);

    return NextResponse.json({
      items,
      offset,
      limit,
      total: allItems.length,
      hasMore: offset + items.length < allItems.length,
      nextOffset: offset + items.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "홈 피드를 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}
