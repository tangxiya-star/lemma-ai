// Rebuild ONLY couple with hyper-specific locked-in cast descriptions to
// maximize Seedance face consistency across shots. Shot 3 (bathroom) stays an
// empty warm-light room — no figures, no presenceLine.

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

// Hyper-specific cast — repeated VERBATIM across all couple shots.
const COUPLE_CAST =
  "A Caucasian couple in their late 20s. The man has short light-brown hair parted slightly to the side, blue eyes, light stubble, wearing a navy-blue henley shirt with the sleeves pushed up to his forearms. The woman has shoulder-length wavy honey-blonde hair, soft blue-green eyes, wearing a cream-colored ribbed cashmere sweater. Both look natural — no glamorous styling, just two real people in love.";

const SHOTS = [
  {
    photoTag: "living_room_warm",
    description: `${COUPLE_CAST} They sit close together on the sofa during golden hour, warm light glowing on their faces. She rests her head on his shoulder; he gently rubs her arm. Quiet, intimate.`,
    cameraOverride: "extremely slow push-in, shallow depth of field, cinematic warmth",
    suppressPresence: false,
  },
  {
    photoTag: "coffee_corner",
    description: `${COUPLE_CAST} They make coffee together at the counter — she leans against him from behind, arms around his waist, while he pours from a chrome kettle. Soft morning sidelight. Tender, unhurried.`,
    cameraOverride: "medium-close gentle handheld",
    suppressPresence: false,
  },
  {
    photoTag: "shower_bath",
    description:
      "An empty spa-like bathroom in soft warm evening light — no figures, no people of any kind. Glass walls catch a gentle warm glow. Clean folded towels are neatly stacked on the counter. Steam from a recently-used shower drifts gently across frame. Atmospheric, restorative.",
    cameraOverride: "slow vertical tilt down from ceiling toward the towels, dreamy soft focus",
    suppressPresence: true,
  },
  {
    photoTag: "art_wall",
    description: `${COUPLE_CAST} They stand hand-in-hand in front of the art wall, looking at the framed pieces together. She points to one; he tilts his head closer. Warm lamp glow on their faces. Backs partially to camera.`,
    cameraOverride: "slow lateral dolly past, capturing them in profile",
    suppressPresence: false,
  },
];

function buildPrompt(persona: PersonaSpec, description: string, cameraOverride: string, suppressPresence: boolean): string {
  const parts = [
    description,
    `Mood: ${persona.mood}.`,
    `Lighting: ${persona.lighting}.`,
    `Camera: ${cameraOverride}.`,
    `Pace: ${persona.pace}.`,
  ];
  if (!suppressPresence) {
    parts.push("Show the couple described in the scene; capture them tenderly, no awkward poses.");
  }
  parts.push(HONESTY);
  return parts.join(" ");
}

async function genShot(i: number, photoTag: string, prompt: string) {
  const photo = BAYVIEW_PHOTOS.find((p) => p.tag === photoTag)!;
  const t0 = Date.now();
  console.log(`→ couple:${i} (${photo.name}) starting`);
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
  await writeFile(`${RAW}/couple_${i}.mp4`, buf);
  console.log(`✓ couple:${i} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

async function concatTrim() {
  const inputs: string[] = [];
  const filterParts: string[] = [];
  for (let i = 0; i < 4; i++) {
    inputs.push("-ss", "1.0", "-i", `${RAW}/couple_${i}.mp4`);
    filterParts.push(`[${i}:v]setpts=PTS-STARTPTS,scale=1920:1080[v${i}]`);
  }
  const filter =
    filterParts.join(";") +
    `;[v0][v1][v2][v3]concat=n=4:v=1:a=0[outv]`;
  const out = `${ROOT}/couple.mp4`;
  await execFileP("ffmpeg", [
    "-y", ...inputs,
    "-filter_complex", filter,
    "-map", "[outv]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    out,
  ]);
  console.log(`✓ couple → ${out}`);
}

async function main() {
  await mkdir(RAW, { recursive: true });
  console.log("Rebuilding couple with hyper-specific locked cast…\n");
  const t0 = Date.now();

  const results = await Promise.allSettled(
    SHOTS.map((s, i) =>
      genShot(i, s.photoTag, buildPrompt(PERSONAS.couple, s.description, s.cameraOverride, s.suppressPresence))
    )
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
