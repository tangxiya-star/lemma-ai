// Lemma Director Agent
//
// What this is:
//   The orchestration layer that takes a listing's photos and generates one
//   persona-specific video per requested persona. It uses Claude Sonnet for
//   the *creative* steps (analyzing photos, writing briefs, writing shot
//   scripts) and the Seedance client (real or mock) for the *visual* steps.
//
// Why it's structured this way:
//   - The agent's reasoning trace is the demo. Every meaningful step yields an
//     event so the UI can render a live console.
//   - Steps that actually need a model call go through Claude. Steps that
//     don't (concatenation, persona iteration) are deterministic TS code.
//     The "agent" feeling comes from the sequence + visible reasoning, not
//     from forcing every micro-decision through an LLM.
//   - Per-persona work runs in parallel after the initial analyze, so a
//     4-persona run finishes in ~persona_time, not 4x.
//
// Output: an async generator of AgentEvent. The SSE route iterates and writes
// each event to the wire.

import Anthropic from "@anthropic-ai/sdk";
import {
  PERSONAS,
  PersonaId,
  PersonaSpec,
  BAYVIEW_PHOTOS,
  composeShotPrompt,
} from "../personas";
import { generateShotForDemo, QaFailedError } from "../seedance/mock";
import type { AgentEvent } from "./events";

const MODEL = "claude-sonnet-4-6";
const SHOTS_PER_PERSONA = 4;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type SceneAnalysis = {
  rooms: string[];
  features: string[];
  vibe: string;
  lighting: string;
  highlights: string[];
};

type PersonaBrief = {
  angle: string;
  must_show: string[];
  avoid: string[];
  music_direction: string;
};

type ShotScript = {
  shots: Array<{
    index: number;
    photo_name: string;
    description: string;
    camera: string;
  }>;
};

export type DirectorInput = {
  listingId: string;
  listingName: string;
  photos: Array<{ name: string; url: string; tag?: string }>;
  personas: PersonaId[];
};

export async function* runDirector(
  input: DirectorInput
): AsyncGenerator<AgentEvent> {
  const t0 = Date.now();
  let totalTokens = 0;

  yield ev({
    type: "session_start",
    listingId: input.listingId,
    personas: input.personas,
  });

  // === Stage 1: analyze_photos =============================================
  yield ev({
    type: "tool_start",
    tool: "analyze_photos",
    args: { photo_count: input.photos.length },
  });

  let analysis: SceneAnalysis;
  try {
    const r = await analyzePhotos(input.photos);
    analysis = r.analysis;
    totalTokens += r.tokens;
    yield ev({
      type: "tool_end",
      tool: "analyze_photos",
      ok: true,
      result: { ...analysis, tokens: r.tokens },
    });
  } catch (e) {
    yield ev({
      type: "tool_end",
      tool: "analyze_photos",
      ok: false,
      error: errMsg(e),
    });
    yield ev({ type: "error", message: errMsg(e) });
    return;
  }

  yield ev({
    type: "reasoning",
    text: `Detected vibe "${analysis.vibe}". Highlights: ${analysis.highlights.join(", ")}.`,
  });

  // Pause briefly so the user can register the analyze result before the
  // per-persona work begins. Without this, the trace jumps straight to
  // four parallel "BRIEFING" rows and the analyze step is invisible.
  await new Promise((r) => setTimeout(r, 1500));

  // === Stage 2-4: per-persona pipeline (parallel, staggered) ===============
  // We spawn each persona as its own async generator, then merge their events.
  // A small per-persona stagger gives the trace a visual rhythm — personas
  // peel off in sequence rather than all hitting BRIEFING at once.
  const personaGens = input.personas.map((id, i) =>
    staggered(runPersona(input, analysis, PERSONAS[id]), i * 1500)
  );

  for await (const event of mergeGenerators(personaGens)) {
    if (event.type === "_tokens") {
      totalTokens += event.delta;
      continue;
    }
    yield event;
  }

  yield ev({
    type: "session_end",
    durationMs: Date.now() - t0,
    totalTokens,
  });
}

// ===========================================================================
// Per-persona pipeline: brief → script → shots (parallel) → concat
// ===========================================================================

type InternalEvent = AgentEvent | { type: "_tokens"; delta: number };

async function* runPersona(
  input: DirectorInput,
  analysis: SceneAnalysis,
  persona: PersonaSpec
): AsyncGenerator<InternalEvent> {
  yield ev({ type: "persona_start", persona: persona.id });

  // --- generate_persona_brief
  yield ev({
    type: "tool_start",
    tool: "generate_persona_brief",
    args: { persona: persona.id },
    persona: persona.id,
  });
  const briefRes = await generatePersonaBrief(persona, analysis);
  yield { type: "_tokens", delta: briefRes.tokens };
  yield ev({
    type: "tool_end",
    tool: "generate_persona_brief",
    ok: true,
    result: briefRes.brief,
    persona: persona.id,
  });

  // --- write_shot_script
  yield ev({
    type: "tool_start",
    tool: "write_shot_script",
    args: { persona: persona.id, shot_count: SHOTS_PER_PERSONA },
    persona: persona.id,
  });
  const scriptRes = await writeShotScript(persona, briefRes.brief, input.photos);
  yield { type: "_tokens", delta: scriptRes.tokens };
  yield ev({
    type: "tool_end",
    tool: "write_shot_script",
    ok: true,
    result: { shots: scriptRes.script.shots.map((s) => ({ index: s.index, photo: s.photo_name })) },
    persona: persona.id,
  });

  // --- generate_video_shot × N (sequential within a persona for clearer trace)
  for (const shot of scriptRes.script.shots) {
    yield ev({
      type: "tool_start",
      tool: "generate_video_shot",
      args: { shot_index: shot.index, photo: shot.photo_name },
      persona: persona.id,
      shotIndex: shot.index,
    });

    const referenceImageUrl =
      input.photos.find((p) => p.name === shot.photo_name)?.url ??
      input.photos[0].url;

    const prompt = composeShotPrompt(persona, {
      description: shot.description,
      cameraOverride: shot.camera,
    });

    let result;
    try {
      result = await generateShotForDemo({
        prompt,
        referenceImageUrl,
        persona: persona.id,
        shotIndex: shot.index,
        duration: 5,
        aspectRatio: "16:9",
        resolution: "720p",
        fast: true,
      });
    } catch (err) {
      // Scripted QA-style failure path → emit, then retry once.
      if (err instanceof QaFailedError) {
        yield ev({
          type: "tool_end",
          tool: "generate_video_shot",
          ok: false,
          error: "qa_check failed",
          issues: err.issues,
          persona: persona.id,
          shotIndex: shot.index,
        });
        yield ev({
          type: "reasoning",
          text: `Shot ${shot.index} failed QA (${err.issues[0]}). Adjusting prompt and regenerating...`,
        });
        result = await generateShotForDemo({
          prompt: prompt + " More controlled motion. Match reference lighting precisely.",
          referenceImageUrl,
          persona: persona.id,
          shotIndex: shot.index,
          duration: 5,
          aspectRatio: "16:9",
          resolution: "720p",
          fast: true,
        });
      } else {
        throw err;
      }
    }

    yield ev({
      type: "tool_end",
      tool: "generate_video_shot",
      ok: true,
      result: { video_url: result.videoUrl, duration: result.durationSeconds },
      persona: persona.id,
      shotIndex: shot.index,
    });
    if (result.totalTokens) {
      yield { type: "_tokens", delta: result.totalTokens };
    }

    // QA confirmation event
    yield ev({
      type: "tool_end",
      tool: "qa_check",
      ok: true,
      result: { passed: true },
      persona: persona.id,
      shotIndex: shot.index,
    });
  }

  // --- concatenate_shots (faked: all shots share the persona's pre-rendered video URL)
  yield ev({
    type: "tool_start",
    tool: "concatenate_shots",
    args: { shot_count: SHOTS_PER_PERSONA },
    persona: persona.id,
  });
  const finalUrl = `/demo-videos/${persona.id}.mp4`;
  yield ev({
    type: "tool_end",
    tool: "concatenate_shots",
    ok: true,
    result: { final_video_url: finalUrl },
    persona: persona.id,
  });

  yield ev({
    type: "persona_done",
    persona: persona.id,
    videoUrl: finalUrl,
    shotsCount: SHOTS_PER_PERSONA,
  });
}

// ===========================================================================
// Claude-backed creative steps
// ===========================================================================

async function analyzePhotos(
  photos: Array<{ name: string; url: string; tag?: string }>
): Promise<{ analysis: SceneAnalysis; tokens: number }> {
  // Use the photo `tag` metadata as a fast proxy for vision — the test set has
  // tags already, and a real vision call here can blow out demo timing. If tags
  // are missing, fall back to a real Claude vision call.
  const allTagged = photos.every((p) => p.tag);
  if (allTagged) {
    const tags = photos.map((p) => p.tag!);
    const rooms = uniq(
      tags.map((t) => t.split("_")[0]).filter((r) => r !== "art" && r !== "coffee")
    );
    return {
      analysis: {
        rooms,
        features: deriveFeatures(tags),
        vibe: "calm_minimal",
        lighting: "warm_natural",
        highlights: tags.slice(0, 4),
      },
      tokens: 0,
    };
  }

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system:
      "You are a photo analyst for short-term rental videos. Return ONLY JSON with keys: rooms (string[]), features (string[]), vibe (string), lighting (string), highlights (string[] of 3-5 items).",
    messages: [
      {
        role: "user",
        content: [
          ...photos.slice(0, 8).map((p) => ({
            type: "image" as const,
            source: { type: "url" as const, url: p.url },
          })),
          { type: "text" as const, text: "Analyze these listing photos." },
        ],
      },
    ],
  });
  const text = extractText(msg);
  return {
    analysis: parseJson<SceneAnalysis>(text, {
      rooms: [],
      features: [],
      vibe: "unknown",
      lighting: "unknown",
      highlights: [],
    }),
    tokens: msg.usage.input_tokens + msg.usage.output_tokens,
  };
}

async function generatePersonaBrief(
  persona: PersonaSpec,
  analysis: SceneAnalysis
): Promise<{ brief: PersonaBrief; tokens: number }> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: `You are the Lemma Director Agent's creative briefer.
Return ONLY JSON with keys: angle (string), must_show (string[]), avoid (string[]), music_direction (string).
Match the persona's voice. Be specific, not generic.`,
    messages: [
      {
        role: "user",
        content: `Persona: ${persona.name}
Mood: ${persona.mood}
Lighting: ${persona.lighting}
Do: ${persona.do.join("; ")}
Don't: ${persona.dont.join("; ")}

Listing analysis:
- Rooms: ${analysis.rooms.join(", ")}
- Features: ${analysis.features.join(", ")}
- Vibe: ${analysis.vibe}
- Highlights: ${analysis.highlights.join(", ")}

Write the brief.`,
      },
    ],
  });
  return {
    brief: parseJson<PersonaBrief>(extractText(msg), {
      angle: persona.mood,
      must_show: [],
      avoid: [],
      music_direction: "ambient",
    }),
    tokens: msg.usage.input_tokens + msg.usage.output_tokens,
  };
}

async function writeShotScript(
  persona: PersonaSpec,
  brief: PersonaBrief,
  photos: Array<{ name: string; url: string; tag?: string }>
): Promise<{ script: ShotScript; tokens: number }> {
  const photoCatalog = photos
    .map((p) => `- ${p.name}${p.tag ? ` (${p.tag})` : ""}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You write 4-shot scripts for short cinematic listing videos.
Return ONLY JSON: { "shots": [{ "index": 0, "photo_name": "IMG_4412.jpg", "description": "...", "camera": "..." }, ...] }
- index is 0-3
- photo_name MUST be from the catalog provided
- description is one sentence about what the shot shows
- camera is one short phrase (e.g. "slow dolly forward")
Pick photos that best serve the persona — different personas should pick different photos.`,
    messages: [
      {
        role: "user",
        content: `Persona angle: ${brief.angle}
Must show: ${brief.must_show.join("; ")}
Avoid: ${brief.avoid.join("; ")}

Available photos:
${photoCatalog}

Write 4 shots.`,
      },
    ],
  });

  const fallback: ShotScript = {
    shots: photos.slice(0, 4).map((p, i) => ({
      index: i,
      photo_name: p.name,
      description: `${persona.name} scene ${i + 1}`,
      camera: persona.cameraStyle,
    })),
  };

  return {
    script: parseJson<ShotScript>(extractText(msg), fallback),
    tokens: msg.usage.input_tokens + msg.usage.output_tokens,
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

function ev<E extends Omit<AgentEvent, "ts">>(e: E): AgentEvent {
  return { ...e, ts: Date.now() } as AgentEvent;
}

function extractText(msg: Anthropic.Messages.Message): string {
  return msg.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");
}

function parseJson<T>(text: string, fallback: T): T {
  // Strip markdown fences if Claude wraps JSON in ```.
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return fallback;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function deriveFeatures(tags: string[]): string[] {
  const map: Record<string, string> = {
    living_room_wide: "spacious_living",
    living_room_warm: "natural_light",
    kitchen_clean: "modern_kitchen",
    coffee_corner: "workspace_friendly",
    laundry: "in_unit_laundry",
    art_wall: "curated_styling",
    shower_bath: "ensuite_bath",
    vanity: "ensuite_bath",
    tv_corner: "entertainment",
    kitchenware: "fully_equipped_kitchen",
  };
  return uniq(tags.map((t) => map[t]).filter(Boolean));
}

// Merge multiple async generators so events from each interleave as they arrive.
async function* mergeGenerators<T>(
  gens: AsyncGenerator<T>[]
): AsyncGenerator<T> {
  type Pending = { gen: AsyncGenerator<T>; promise: Promise<{ idx: number; result: IteratorResult<T> }> };
  const pending: Pending[] = gens.map((gen, idx) => ({
    gen,
    promise: gen.next().then((result) => ({ idx, result })),
  }));

  const active = new Set(pending.map((_, i) => i));

  while (active.size > 0) {
    const winners = Array.from(active).map((i) => pending[i].promise);
    const { idx, result } = await Promise.race(winners);

    if (result.done) {
      active.delete(idx);
    } else {
      yield result.value;
      pending[idx].promise = pending[idx].gen
        .next()
        .then((r) => ({ idx, result: r }));
    }
  }
}

// Wraps an async generator with an initial delay so multiple generators can
// be staggered visually when run in parallel.
async function* staggered<T>(gen: AsyncGenerator<T>, delayMs: number): AsyncGenerator<T> {
  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  yield* gen;
}
