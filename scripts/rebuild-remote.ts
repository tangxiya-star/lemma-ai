// Rebuild ONLY remote with hyper-specific locked-in cast (Caucasian male,
// matching the look the user identified in earlier shots) for consistency.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { generateShot } from "../lib/seedance/client";
import { BAYVIEW_PHOTOS, PERSONAS, PersonaSpec } from "../lib/personas";

const execFileP = promisify(execFile);
const RAW = "public/demo-videos/_raw";
const ROOT = "public/demo-videos";
const HONESTY =
  "Do not introduce any objects, furniture, decor, food, or pets that are not visible in the reference photograph.";

// Repeated VERBATIM in every shot prompt to maximize face consistency.
const REMOTE_CAST =
  "A Caucasian man in his early 30s. Short light-brown hair, blue eyes, light stubble, lean build. Wearing a soft heather-grey crewneck sweater over a plain white t-shirt and dark jeans. He looks calm, focused, comfortable being alone — a quiet professional in his element.";

const SHOTS = [
  {
    photoTag: "coffee_corner",
    description: `${REMOTE_CAST} He stands at the counter pouring fresh coffee from a chrome kettle into a ceramic mug — visible liquid stream, steam rising vigorously. Soft morning sidelight on his face.`,
    cameraOverride: "medium handheld, drifting slowly closer to the pour",
  },
  {
    photoTag: "living_room_wide",
    description: `${REMOTE_CAST} He sits cross-legged on the sofa with a laptop, typing — fingers moving steadily across keys. Occasionally he pauses to sip from the mug beside him. Even diffuse daylight fills the wide living room around him.`,
    cameraOverride: "slow dolly forward from across the room, ending closer to the laptop",
  },
  {
    photoTag: "art_wall",
    description: `${REMOTE_CAST} He walks slowly past the art wall holding the mug, pausing to study one piece. Soft daylight, contemplative pace, real walking motion visible.`,
    cameraOverride: "slow lateral tracking shot following him right to left",
  },
  {
    photoTag: "kitchen_clean",
    description: `${REMOTE_CAST} He stands at the kitchen counter actively filling a kettle from the tap — water visibly flowing, then he places the kettle on the stove and turns the dial. Daylight from the window catches the moving water.`,
    cameraOverride: "gentle handheld, drifting close to his hands",
  },
];

function buildPrompt(persona: PersonaSpec, description: string, cameraOverride: string): string {
  return [
    description,
    `Mood: ${persona.mood}.`,
    `Lighting: ${persona.lighting}.`,
    `Camera: ${cameraOverride}.`,
    `Pace: ${persona.pace}.`,
    "Show the solo person described in the scene focused and at ease, alone in the space.",
    HONESTY,
  ].join(" ");
}

async function genShot(i: number, photoTag: string, prompt: string) {
  const photo = BAYVIEW_PHOTOS.find((p) => p.tag === photoTag)!;
  const t0 = Date.now();
  console.log(`→ remote:${i} (${photo.name}) starting`);
  const res = await generateShot({
    prompt,
    referenceImageUrl: photo.url,
    duration: 8,
    aspectRatio: "16:9",
    resolution: "1080p",
    generateAudio: false,
    fast: false,
  });
  const buf = Buffer.from(await (await fetch(res.videoUrl)).arrayBuffer());
  await writeFile(`${RAW}/remote_${i}.mp4`, buf);
  console.log(`✓ remote:${i} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

async function concatTrim() {
  const inputs: string[] = [];
  const filterParts: string[] = [];
  for (let i = 0; i < 4; i++) {
    inputs.push("-ss", "1.0", "-i", `${RAW}/remote_${i}.mp4`);
    filterParts.push(`[${i}:v]setpts=PTS-STARTPTS,scale=1920:1080[v${i}]`);
  }
  const filter =
    filterParts.join(";") +
    `;[v0][v1][v2][v3]concat=n=4:v=1:a=0[outv]`;
  const out = `${ROOT}/remote.mp4`;
  await execFileP("ffmpeg", [
    "-y", ...inputs,
    "-filter_complex", filter,
    "-map", "[outv]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    out,
  ]);
  console.log(`✓ remote → ${out}`);
}

async function main() {
  await mkdir(RAW, { recursive: true });
  console.log("Rebuilding remote with locked Caucasian male cast…\n");
  const t0 = Date.now();

  const results = await Promise.allSettled(
    SHOTS.map((s, i) => genShot(i, s.photoTag, buildPrompt(PERSONAS.remote, s.description, s.cameraOverride)))
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`⚠ ${failed.length} shots failed:`);
    failed.forEach((f) => console.error("  ", (f as PromiseRejectedResult).reason?.message ?? f));
  }
  console.log(`\nGeneration done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Concatenating…\n`);
  await concatTrim();
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
