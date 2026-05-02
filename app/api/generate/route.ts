import { NextRequest, NextResponse } from "next/server";
import { store, defaultPersonas, Listing } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const listingId: string = body.listingId || `listing-${Date.now()}`;
  const name: string = body.name || "Untitled Listing";

  // Step 1: "analyze images"
  await sleep(400);
  const analysis = {
    features: ["natural_light", "workspace", "cozy_bed", "ocean_view"],
    vibe: "calm_minimal",
  };

  // Step 2-4: personas + scripts + video URLs
  await sleep(400);
  const personas = defaultPersonas();

  const listing: Listing = {
    listingId,
    name,
    features: analysis.features,
    vibe: analysis.vibe,
    personas,
    createdAt: Date.now(),
  };
  store.set(listingId, listing);

  return NextResponse.json(listing);
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("listingId") || "demo-123";
  const listing = store.get(id) || store.get("demo-123");
  return NextResponse.json(listing);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
