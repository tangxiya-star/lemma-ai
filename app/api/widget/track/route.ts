import { NextRequest, NextResponse } from "next/server";
import { insert } from "@/lib/butterbase/client";

const DEMO_LISTING_ID = process.env.BUTTERBASE_DEMO_LISTING_ID!;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const persona = body.persona_selected ?? null;
  const listingId = body.listing_id || DEMO_LISTING_ID;
  const ua = req.headers.get("user-agent") || "";

  try {
    const row = await insert("widget_views", {
      listing_id: listingId,
      persona_selected: persona,
      user_agent: ua.slice(0, 500),
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
