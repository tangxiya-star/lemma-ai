import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

// Vision step uses Claude (vision-strong). Text-only steps elsewhere use Z.AI.
// 4.6 may 404 on some accounts/SDK versions; 4.5 is the safe default.
const MODEL = process.env.CLAUDE_VISION_MODEL ?? "claude-sonnet-4-5";

const SYSTEM = `You are a film director pitching short-form video concepts for a short-term rental listing.

You will see ACTUAL photos of THIS home, plus host-supplied name, vibe, and location.

CRITICAL: ground every claim in what you see in the photos. If photos contradict the host's text (e.g. host says "ocean cabin" but photos show a small city apartment), TRUST THE PHOTOS. Do not invent features (no fireplace, no deck, no view) unless visible.

Return a JSON object with two fields:
{
  "observed": "<one sentence describing literally what you see across the photos — room types, light, surfaces, signals of how it actually lives. No marketing language.>",
  "personas": [
    {
      "id": "kebab-case-slug",
      "name": "2–4 words, evocative, specific to what's actually shown",
      "desc": "one sentence about the trip they'd plan",
      "why": "ONE sentence citing concrete features you SAW (\"in-unit washer-dryer\", \"south window with desk\", \"compact galley kitchen\") + a regional/lifestyle fit",
      "archetype": "family" | "couple" | "remote" | "business"
    },
    ... 3 more
  ]
}

Personas must reflect what the photos actually support. If the home is a basic city apartment, propose city-apartment personas (weekend visitors, laundry-day workers, between-flights stopovers) — NOT cabin/coast/forest fantasies.

Return exactly 4 personas, each with a UNIQUE archetype. Output ONLY the JSON object, no prose, no markdown fences.`;

// Server-side fetch + base64 — bypasses any CDN hotlink rules that block
// Anthropic's image fetcher when it tries to pull URLs directly.
async function fetchAsBase64(url: string): Promise<{
  data: string;
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        // Some CDNs (Airbnb muscache) require a real-ish UA + referer.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "image/jpeg").toLowerCase();
    const media_type = (
      ct.includes("png")
        ? "image/png"
        : ct.includes("gif")
          ? "image/gif"
          : ct.includes("webp")
            ? "image/webp"
            : "image/jpeg"
    ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_500_000) return null; // Anthropic per-image cap ~5MB
    return { data: buf.toString("base64"), media_type };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "Untitled");
  const vibe = String(body.vibe || "");
  const location = String(body.location || "");
  const features = Array.isArray(body.features) ? body.features : [];
  const photoUrls: string[] = Array.isArray(body.photoUrls) ? body.photoUrls : [];

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 500 });
  }

  // Fetch + base64 up to 6 photos in parallel.
  const fetched = await Promise.all(
    photoUrls.slice(0, 6).map(fetchAsBase64)
  );
  const images = fetched.filter(
    (f): f is { data: string; media_type: any } => f !== null
  );

  if (images.length === 0) {
    return NextResponse.json(
      {
        error:
          "Could not fetch any photos server-side. Check that photo URLs are publicly reachable.",
      },
      { status: 400 }
    );
  }

  const userText = `Listing name (host-supplied): ${name}
Location (host-supplied): ${location || "(not provided)"}
Vibe (host-supplied): ${vibe || "(not provided)"}
Host-noted features: ${features.length ? features.join(", ") : "(none)"}

Above are ${images.length} actual photos of this home. GROUND IN PHOTOS — if photos disagree with the host's text, trust the photos. Return the JSON object.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.media_type,
                data: img.data,
              },
            })),
            { type: "text" as const, text: userText },
          ],
        },
      ],
    });

    const text = msg.content
      .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Try parsing the whole thing as the new {observed, personas} shape.
    let observed = "";
    let personas: any[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        personas = parsed;
      } else {
        observed = String(parsed.observed || "");
        personas = Array.isArray(parsed.personas) ? parsed.personas : [];
      }
    } catch {
      // Fall back: extract the personas array from the blob.
      const arr = cleaned.match(/\[[\s\S]*\]/);
      if (arr) personas = JSON.parse(arr[0]);
      const obs = cleaned.match(/"observed"\s*:\s*"([^"]+)"/);
      if (obs) observed = obs[1];
    }

    return NextResponse.json({
      observed,
      personas,
      model: MODEL,
      photosSeen: images.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
