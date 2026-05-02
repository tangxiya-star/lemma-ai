import { NextRequest, NextResponse } from "next/server";
import { list } from "@/lib/butterbase/client";

const DEMO_LISTING_ID = process.env.BUTTERBASE_DEMO_LISTING_ID!;

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id") || DEMO_LISTING_ID;
  const sinceHours = Number(req.nextUrl.searchParams.get("hours") || "24");
  const sinceIso = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();

  try {
    const rows = await list(
      "widget_views",
      {
        listing_id: listingId,
        timestamp: `gte.${sinceIso}`,
      },
      { order: "timestamp.desc", limit: 1000 }
    );

    const counts: Record<string, number> = {
      family: 0,
      couple: 0,
      remote: 0,
      business: 0,
      _skipped: 0,
    };
    for (const r of rows) {
      const p = r.persona_selected;
      if (!p) counts._skipped += 1;
      else counts[p as string] = (counts[p as string] || 0) + 1;
    }

    return NextResponse.json({
      total: rows.length,
      since: sinceIso,
      counts,
      recent: rows.slice(0, 20).map((r) => ({
        persona: r.persona_selected,
        ts: r.timestamp,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
