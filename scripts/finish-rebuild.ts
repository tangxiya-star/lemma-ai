// Finish the family + couple rebuild that crashed on couple:2.
// - Rebuilds all 4 family shots with locked East Asian cast (still missing).
// - Rebuilds couple:2 with a moderation-safe prompt that says nothing about
//   "couple" or "two people" and explicitly disables the persona presenceLine
//   (which would otherwise re-inject "show the couple" and re-trigger NSFW).
// - Skips couple 0/1/3 (already done).
// - Concats remote + business with 1s trim too, using their existing raw shots.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { generateShot } from "../lib/seedance/client";
import { BAYVIEW_PHOTOS, PERSONAS, PersonaSpec, PersonaId } from "../lib/personas";

const execFileP = promisify(execFile);
const RAW = "public/demo-videos/_raw";
const ROOT = "public/demo-videos";
const HONESTY =
  "Do not introduce any objects, furniture, decor, food, or pets that are not visible in the reference photograph.";

const FAMILY_CAST =
  "An East Asian family of three: a father in his early 30s with short black hair wearing a soft beige sweater; a mother in her early 30s with shoulder-length black hair wearing a cream-colored blouse; their 4-year-old daughter with shoulder-length straight black hair wearing a pale yellow dress.";

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

// Custom prompt builder that lets us suppress the persona's presenceLine when
// we want a truly empty room (avoids the "show the couple" auto-injection).
function buildPrompt(
  persona: PersonaSpec,
  description: string,
  cameraOverride: string,
  options: { suppressPresence?: boolean } = {}
): string {
  const parts = [
    description,
    `Mood: ${persona.mood}.`,
    `Lighting: ${persona.lighting}.`,
    `Camera: ${cameraOverride}.`,
    `Pace: ${persona.pace}.`,
  ];
  if (!options.suppressPresence) {
    // duplicate of personas.ts presenceLine — kept inline so the script is self-contained
    const presence: Record<string, string> = {
      implied_traces: "Show the people described in the scene naturally and warmly.",
      silhouette_or_hands: "Show the couple described in the scene; capture them tenderly, no awkward poses.",
      fresh_traces: "Show the solo person described in the scene focused and at ease, alone in the space.",
      none: "No people in this shot — pristine, untouched space.",
    };
    parts.push(presence[persona.humanPresence]);
  }
  parts.push(HONESTY);
  return parts.join(" ");
}

async function genShot(
  personaId: PersonaId,
  shotIndex: number,
  photoTag: string,
  prompt: string
) {
  const photo = BAYVIEW_PHOTOS.find((p) => p.tag === photoTag)!;
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
    "-y", ...inputs,
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
  console.log("Filling in missing shots…\n");
  const t0 = Date.now();

  const safeBathroomPrompt = buildPrompt(
    PERSONAS.couple,
    "An empty spa-like bathroom in soft warm evening light — no figures, no people of any kind. Glass walls catch a gentle warm glow. Clean folded towels are neatly stacked on the counter. Steam from a recently-used shower drifts gently across frame. Atmospheric and restorative.",
    "slow vertical tilt down from ceiling toward the towels, dreamy soft focus",
    { suppressPresence: true }
  );

  const jobs = [
    // 4 family shots (locked cast)
    ...FAMILY_SHOTS.map((s, i) => () =>
      genShot("family", i, s.photoTag, buildPrompt(PERSONAS.family, s.description, s.cameraOverride))
    ),
    // couple:2 only — moderation-safe
    () => genShot("couple", 2, "shower_bath", safeBathroomPrompt),
  ];

  // allSettled so one failure doesn't kill the others.
  const results = await Promise.allSettled(jobs.map((j) => j()));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`\n⚠ ${failed.length} shots still failed:`);
    failed.forEach((f) => console.error("  ", (f as PromiseRejectedResult).reason?.message ?? f));
  }

  console.log(`\nShot generation done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Concatenating all 4 personas…\n`);

  for (const id of ["family", "couple", "remote", "business"] as PersonaId[]) {
    await concatTrim(id);
  }
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
