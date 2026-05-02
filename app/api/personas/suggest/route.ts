import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-5";

const SYSTEM = `You are a film director hired to pitch short-form video concepts for a short-term rental listing.

Your job: given the listing's name, vibe, location, and a description of its photos, propose 3–5 traveler personas who would be the strongest match for THIS specific home. Each persona must be tailored to the listing — not generic ("Family", "Couple") but specific ("Empty-nest couples seeking quiet weekends", "Surf weekenders with one car").

For each persona return:
- id: lowercase-kebab-case slug (≤24 chars)
- name: 2–4 words, evocative, specific
- desc: one short sentence, the kind of trip they'd plan
- why: ONE sentence pointing to specific features of THIS home that fit them ("Fireplace + standing desk", "Cliff break 3-min walk", etc.)

Return ONLY a valid JSON array, no prose. Aim for 4 personas. Avoid duplication. Avoid generic "Business" unless the listing genuinely fits remote pros.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "Untitled");
  const vibe = String(body.vibe || "");
  const location = String(body.location || "");
  const features = Array.isArray(body.features) ? body.features : [];
  const photoSummary = String(body.photoSummary || "");

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 500 });
  }

  const userPrompt = `Listing: ${name}
Location: ${location || "(not provided)"}
Vibe: ${vibe || "(not provided)"}
Detected features: ${features.length ? features.join(", ") : "(none specified)"}
Photo summary: ${photoSummary || "10 photos uploaded showing interior, exterior, kitchen, bedrooms"}

Return 4 tailored personas as JSON.`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    // Strip markdown fences if present, then parse.
    const jsonText = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const personas = JSON.parse(jsonText);
    return NextResponse.json({ personas });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
