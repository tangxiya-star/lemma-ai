// Rebuild remote + business with motion-rich prompts.
// Previous outputs felt like an animated slideshow because every shot
// asked for "locked-off / static / architectural" framing AND lacked subject
// motion. Every shot below has explicit object motion + active camera.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { generateShot } from "../lib/seedance/client";
import { BAYVIEW_PHOTOS, PERSONAS, composeShotPrompt, PersonaId } from "../lib/personas";

const execFileP = promisify(execFile);
const RAW = "public/demo-videos/_raw";
const ROOT = "public/demo-videos";
const HONESTY =
  "Do not introduce any objects, furniture, decor, food, or pets that are not visible in the reference photograph.";

// Locked single-character cast — repeated verbatim across all 4 remote shots.
const REMOTE_CAST =
  "A solo professional in their early 30s — short dark hair, wearing a soft grey crewneck sweater. Calm, focused, comfortable being alone.";

const REMOTE_SHOTS = [
  {
    photoTag: "coffee_corner",
    description: `${REMOTE_CAST} They stand at the counter actively pouring fresh coffee from a chrome kettle into a ceramic mug — steam rising vigorously, liquid visibly streaming. Soft morning sidelight.`,
    cameraOverride: "medium handheld, drifting slowly closer to the pour",
  },
  {
    photoTag: "living_room_wide",
    description: `${REMOTE_CAST} They sit cross-legged on the sofa with a laptop, typing — fingers moving steadily across keys. Occasionally they pause to sip from the mug beside them. Even diffuse daylight fills the wide living room around them.`,
    cameraOverride: "slow dolly forward from across the room, ending closer to the laptop",
  },
  {
    photoTag: "art_wall",
    description: `${REMOTE_CAST} They walk slowly past the art wall holding the mug, pausing for a moment to study one piece. Soft daylight, contemplative pace, real walking motion visible.`,
    cameraOverride: "slow lateral tracking shot following them right to left",
  },
  {
    photoTag: "kitchen_clean",
    description: `${REMOTE_CAST} They stand at the kitchen counter actively filling a kettle from the tap — water visibly flowing, then they place the kettle on the stove and turn the dial. Daylight from the window catches the moving water.`,
    cameraOverride: "gentle handheld, drifting close to the hands",
  },
];

// Business: arrival + ambient empty rooms. Empty shots still need *atmospheric*
// motion (light, shadows, mechanical movement) — never a still frame.
const BUSINESS_CAST =
  "A business traveler in their late 30s wearing a charcoal-grey overcoat over a crisp white shirt, holding a small carry-on suitcase. Composed, efficient, slightly tired.";

const BUSINESS_SHOTS = [
  {
    photoTag: "kitchen_clean",
    description:
      "An empty pristine kitchen. Cool morning sunlight is actively shifting across the polished countertop as the camera moves; the shadows of window blinds slowly slide across the floor. Atmospheric motion only — no people, but the light is alive.",
    cameraOverride: "slow steady dolly from left to right across the kitchen, locked horizon",
  },
  {
    photoTag: "living_room_wide",
    description: `${BUSINESS_CAST} They walk into the living room, set the suitcase down beside the sofa, exhale, and slowly remove their overcoat. The whole sequence happens within the shot — visible body movement, suitcase wheels rolling.`,
    cameraOverride: "slow dolly forward at chest height, following them into the room",
  },
  {
    photoTag: "laundry",
    description:
      "An in-unit washer is actively running — visible drum tumbling through the glass door, soft mechanical motion. No people. Cool ambient light. The detail signals frictionless self-service.",
    cameraOverride: "slow push-in toward the washer drum, ending in a gentle close-up",
  },
  {
    photoTag: "vanity",
    description:
      "An empty, clean vanity area. Crisp morning light gradually brightens across the mirror and folded towels as the camera moves; soft steam from a recent shower drifts through frame. Atmospheric, restorative — no people, but the air is in motion.",
    cameraOverride: "slow horizontal pan across the vanity, hotel-style reveal",
  },
];

async function genShot(personaId: PersonaId, shotIndex: number, photoTag: string, description: string, cameraOverride: string) {
  const persona = PERSONAS[personaId];
  const photo = BAYVIEW_PHOTOS.find((p) => p.tag === photoTag)!;
  const prompt = composeShotPrompt(persona, { description, cameraOverride }) + " " + HONESTY;
  const t0 = Date.now();
  console.log(`→ ${personaId}:${shotIndex} (${photo.name}) starting`);
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
  await writeFile(`${RAW}/${personaId}_${shotIndex}.mp4`, buf);
  console.log(`✓ ${personaId}:${shotIndex} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

async function concatTrim(personaId: PersonaId) {
  const inputs: string[] = [];
  const filterParts: string[] = [];
  for (let i = 0; i < 4; i++) {
    inputs.push("-ss", "1.0", "-i", `${RAW}/${personaId}_${i}.mp4`);
    filterParts.push(`[${i}:v]setpts=PTS-STARTPTS,scale=1920:1080[v${i}]`);
  }
  const filter =
    filterParts.join(";") +
    `;[v0][v1][v2][v3]concat=n=4:v=1:a=0[outv]`;

  const out = `${ROOT}/${personaId}.mp4`;
  await execFileP("ffmpeg", [
    "-y",
    ...inputs,
    "-filter_complex", filter,
    "-map", "[outv]",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    out,
  ]);
  console.log(`✓ ${personaId} → ${out}`);
}

async function main() {
  await mkdir(RAW, { recursive: true });
  console.log("Rebuilding remote + business with motion-rich prompts…\n");
  const t0 = Date.now();

  const jobs = [
    ...REMOTE_SHOTS.map((s, i) => () => genShot("remote", i, s.photoTag, s.description, s.cameraOverride)),
    ...BUSINESS_SHOTS.map((s, i) => () => genShot("business", i, s.photoTag, s.description, s.cameraOverride)),
  ];

  await Promise.all(jobs.map((j) => j()));

  console.log(`\nAll new shots done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Concatenating with 1s front-trim…\n`);

  await concatTrim("remote");
  await concatTrim("business");
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
