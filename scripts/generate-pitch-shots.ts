// Generate the 5 Seedance shots for the Lemma demo video.
// Submits all 5 in parallel, polls until complete, downloads mp4s.
//
// Usage: node --env-file=.env.local --experimental-strip-types scripts/generate-pitch-shots.ts

import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.ARK_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3";
const API_KEY = process.env.ARK_API_KEY!;
const MODEL = process.env.SEEDANCE_MODEL ?? "dreamina-seedance-2-0-260128";
const OUT_DIR = path.resolve("public/demo-videos/shots");

const ABNB =
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original";

// 5 shots — 4 problem hero (same home, different guests) + 1 close.
// Reference images keep the cabin visually consistent across shots 1-4.
const shots = [
  {
    id: "01-couple",
    duration: 8,
    referenceImageUrl: `${ABNB}/0609000d-b3f8-40ac-a563-104ab2182867.jpeg?im_w=1080`,
    prompt:
      "Slow dolly-in from behind a couple standing at the wooden deck railing of a cliff-side cabin overlooking the Pacific Ocean at golden hour. Two glasses of red wine catch warm orange light. The man's arm rests around the woman's shoulders. Distant waves, soft wind moving her hair. Cinematic, shallow depth of field, anamorphic warm tones, A24 vibe. Ambient sound: ocean waves, faint glass clink, gentle wind.",
  },
  {
    id: "02-family",
    duration: 8,
    referenceImageUrl: `${ABNB}/405069b5-f2b5-43ab-a9eb-3aa16ff2c20c.jpeg?im_w=1080`,
    prompt:
      "Wide shot, morning sunlight pours through tall windows into a warm wooden kitchen. A mother in soft linen flips pancakes at the stove while two young children sit at the marble island, giggling. Steam rises from a pan. Camera slowly pushes in past a bowl of fresh berries. Cozy, golden, lived-in. Ambient sound: pancake sizzle, light kid laughter, distant birdsong.",
  },
  {
    id: "03-writer",
    duration: 8,
    referenceImageUrl: `${ABNB}/091631a4-7baa-48a2-aa21-f6acf3844dd0.jpeg?im_w=1080`,
    prompt:
      "Quiet push-in on a woman in her 30s sitting at a window-side wooden desk inside a cabin, typing on a laptop. A ceramic mug steams beside her. Beyond the window, foggy coastline, distant cliffs. Cool morning light, restrained palette, contemplative tone. Camera glides forward slowly. Ambient sound: soft keyboard tapping, distant gull cry, ceramic mug placed down once.",
  },
  {
    id: "04-business",
    duration: 8,
    referenceImageUrl: `${ABNB}/217b792d-daba-4f0d-97ed-74631e327c0e.jpeg?im_w=1080`,
    prompt:
      "Night exterior, 11 PM. A man in a charcoal overcoat with a roller suitcase steps up to a wooden cabin door, the porch lamp glowing amber. He taps a code into a smart lock; a green LED blinks; the door opens to reveal a warm interior with low jazz playing. Steam rising from his breath. Cinematic film noir lighting. Ambient sound: car door, suitcase wheels on stone, key code beep, faint inside jazz.",
  },
  {
    id: "05-close",
    duration: 8,
    referenceImageUrl: `${ABNB}/0609000d-b3f8-40ac-a563-104ab2182867.jpeg?im_w=1080`,
    prompt:
      "Slow zoom-out from a single cliff-side wooden cabin at dawn, soft mist drifting over the Pacific. The cabin glows with warm interior light against cool morning blue. Camera pulls back gracefully revealing the headland and ocean horizon. Ethereal, hopeful, brand-finale aesthetic. Ambient sound: distant waves, soft synth pad, light wind crescendo.",
  },
];

async function createTask(s: typeof shots[number]): Promise<string> {
  const prompt = `${s.prompt} --rt 16:9 --dur ${s.duration} --rs 720p`;
  // Reference images skipped — Airbnb CDN blocks server-side fetches.
  // Text-only prompts are detailed enough for visual continuity across shots.
  const content: any[] = [{ type: "text", text: prompt }];
  const r = await fetch(`${BASE_URL}/contents/generations/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, content, generate_audio: true }),
  });
  if (!r.ok) throw new Error(`task create ${r.status}: ${await r.text()}`);
  const j: any = await r.json();
  return j.id;
}

async function pollTask(taskId: string): Promise<{ url: string; meta: any }> {
  const start = Date.now();
  const timeout = 8 * 60 * 1000; // 8 min
  while (Date.now() - start < timeout) {
    const r = await fetch(`${BASE_URL}/contents/generations/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const j: any = await r.json();
    if (j.status === "succeeded") return { url: j.content.video_url, meta: j };
    if (j.status === "failed") throw new Error(`task ${taskId} failed: ${j.error?.message}`);
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error(`task ${taskId} timed out`);
}

async function downloadMp4(url: string, outPath: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return buf.length;
}

async function runShot(s: typeof shots[number]) {
  const t0 = Date.now();
  console.log(`  [${s.id}] submitting…`);
  const taskId = await createTask(s);
  console.log(`  [${s.id}] task=${taskId} polling…`);
  const { url } = await pollTask(taskId);
  const out = path.join(OUT_DIR, `${s.id}.mp4`);
  const bytes = await downloadMp4(url, out);
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  [${s.id}] ✓ ${(bytes / 1024 / 1024).toFixed(1)}MB in ${sec}s`);
  return { id: s.id, taskId, out };
}

async function main() {
  if (!API_KEY) throw new Error("ARK_API_KEY missing in .env.local");
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${shots.length} Seedance shots in parallel…\n`);
  const t0 = Date.now();
  const results = await Promise.allSettled(shots.map(runShot));
  console.log(`\n=== Done in ${((Date.now() - t0) / 1000).toFixed(1)}s ===`);
  let ok = 0, fail = 0;
  for (const r of results) {
    if (r.status === "fulfilled") { ok++; console.log(`  ✓ ${r.value.id}`); }
    else { fail++; console.log(`  ✗ ${(r.reason as Error).message}`); }
  }
  console.log(`\n${ok} succeeded · ${fail} failed`);
  console.log(`→ Files in ${OUT_DIR}`);
}

main().catch((e) => { console.error("\n✗", e); process.exit(1); });
