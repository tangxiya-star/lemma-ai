// Rebuild family + couple with locked character descriptions for consistency.
// Trim 1s off the front of every shot to remove the static intro Seedance leaves.
// Reuse existing remote + business raw shots — only re-concat them.

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

// === Locked character descriptions — repeated verbatim across every shot. ===
const FAMILY_CAST =
  "An East Asian family of three: a father in his early 30s with short black hair wearing a soft beige sweater; a mother in her early 30s with shoulder-length black hair wearing a cream-colored blouse; their 4-year-old daughter with shoulder-length straight black hair wearing a pale yellow dress.";

const COUPLE_CAST =
  "A young Caucasian couple in their late 20s. The man has short brown hair and a light stubble, wearing a navy henley shirt. The woman has long wavy blonde hair, wearing a cream-colored cashmere sweater. They look comfortable, in love, unrushed.";

const FAMILY_SHOTS = [
  {
    photoTag: "living_room_warm",
    description: `${FAMILY_CAST} They sit close together on the sofa in this warm living room — soft morning sunlight on their faces. The parents smile; the daughter leans into her mother's shoulder.`,
    cameraOverride: "slow gentle dolly forward, wide framing easing closer, cinematic warmth",
  },
  {
    photoTag: "tv_corner",
    description: `${FAMILY_CAST} The daughter sits cross-legged on the floor in front of the small TV, watching cartoons. Her mother walks past in soft focus in the background carrying a mug.`,
    cameraOverride: "low eye-level handheld, gentle movement, shallow depth of field",
  },
  {
    photoTag: "kitchen_clean",
    description: `${FAMILY_CAST} The father stands at the kitchen counter pouring milk; the daughter sits on a stool watching, chin in hands; the mother is faintly visible at the edge of frame. Bright morning light through the window.`,
    cameraOverride: "slow push-in from across the room, observational",
  },
  {
    photoTag: "art_wall",
    description: `${FAMILY_CAST} All three stand together in front of the art wall, looking at the framed pieces. The daughter reaches up to point at one. A quiet moment of togetherness.`,
    cameraOverride: "slow horizontal tracking past them, framing them in profile",
  },
];

const COUPLE_SHOTS = [
  {
    photoTag: "living_room_warm",
    description: `${COUPLE_CAST} They sit close together on the sofa during golden hour, warm light glowing on their faces. She rests her head on his shoulder.`,
    cameraOverride: "extremely slow push-in, shallow depth of field, cinematic warmth",
  },
  {
    photoTag: "coffee_corner",
    description: `${COUPLE_CAST} They make coffee together at the counter — she leans against him from behind, arms around his waist while he pours. Soft morning light, tender, unhurried.`,
    cameraOverride: "medium-close gentle handheld, observational",
  },
  {
    photoTag: "shower_bath",
    description:
      "A spa-like bathroom in soft evening light. Glass walls catch a warm glow. Clean folded towels are stacked on the counter. The room is empty, peaceful, restorative. No people in this shot.",
    cameraOverride: "slow vertical tilt down, dreamy rack focus",
  },
  {
    photoTag: "art_wall",
    description: `${COUPLE_CAST} They stand hand-in-hand in front of the art wall, looking at the pieces together. She points to one; he tilts his head closer.`,
    cameraOverride: "slow dolly past, capturing them in profile",
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

// Concat with 1s front-trim per shot using ffmpeg's concat filter (re-encode).
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

  console.log("Regenerating family + couple with locked characters…\n");
  const t0 = Date.now();

  const jobs = [
    ...FAMILY_SHOTS.map((s, i) => () => genShot("family", i, s.photoTag, s.description, s.cameraOverride)),
    ...COUPLE_SHOTS.map((s, i) => () => genShot("couple", i, s.photoTag, s.description, s.cameraOverride)),
  ];

  await Promise.all(jobs.map((j) => j()));

  console.log(`\nAll new shots done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Concatenating with 1s front-trim…\n`);

  for (const id of ["family", "couple", "remote", "business"] as PersonaId[]) {
    await concatTrim(id);
  }
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
