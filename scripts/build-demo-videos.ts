// Build the 4 persona narrative videos from real Seedance shots.
//
// What this does:
//   1. For each persona, run 4 Seedance shots with different reference photos
//      following a hand-curated narrative arc (4 distinct moments per persona).
//   2. Download all 16 raw shot mp4s into public/demo-videos/_raw/.
//   3. ffmpeg-concat each persona's 4 shots into public/demo-videos/{id}.mp4.
//
// Run: npx tsx --env-file=.env.local scripts/build-demo-videos.ts
//
// All 16 Seedance calls fire in parallel — expect ~2-3 minutes wall clock on
// the fast variant. Set FAST=false in env to use the standard model (higher
// quality, ~3x slower).

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { generateShot } from "../lib/seedance/client";
import { PERSONAS, BAYVIEW_PHOTOS, composeShotPrompt, PersonaId } from "../lib/personas";

const execFileP = promisify(execFile);
// Standard model by default for production-quality demo footage.
// Set FAST=true for quick iteration during development.
const FAST = process.env.FAST === "true";
const SHOT_DURATION = 8;

const ROOT = "public/demo-videos";
const RAW = `${ROOT}/_raw`;

type ShotSpec = {
  photoTag: string;
  description: string;
  cameraOverride?: string;
};

// Prop-discipline rule appended to every prompt: do not invent inventory.
// People ARE permitted (aspirational marketing — industry standard for hotels
// and rentals). Objects/decor must already appear in the reference photo.
const HONESTY_RULE =
  "Do not introduce any objects, furniture, decor, food, or pets that are not visible in the reference photograph. People are permitted as aspirational figures.";

// 4 shots × 4 personas. Each row is one shot in the narrative arc.
const STORYBOARDS: Record<PersonaId, ShotSpec[]> = {
  family: [
    {
      photoTag: "living_room_warm",
      description: "A young family of three (a father, mother, and a small child around age 4) sit together on the sofa in this warm living room, soft morning sunlight on their faces. The parents are smiling, the child is leaning into the mother. Mood: warm, safe, full of small joys.",
      cameraOverride: "slow gentle dolly forward, wide framing then easing closer, cinematic",
    },
    {
      photoTag: "tv_corner",
      description: "A small child sits cross-legged on the floor in front of the TV area, watching cartoons. A parent walks past in soft focus in the background, holding a mug. Cozy daytime light.",
      cameraOverride: "low eye-level handheld, gentle movement, shallow depth of field",
    },
    {
      photoTag: "kitchen_clean",
      description: "A parent stands at the kitchen counter pouring milk; a child sits at the counter watching, chin in hands. Bright morning light through the window. The scene is calm, ordinary, intimate.",
      cameraOverride: "slow push-in from across the room, observational",
    },
    {
      photoTag: "art_wall",
      description: "The family of three stands together in front of the art wall, looking at the framed pieces. The child reaches up to point at one. A quiet moment of togetherness, soft daylight.",
      cameraOverride: "slow horizontal tracking past them, framing them in profile",
    },
  ],

  couple: [
    {
      photoTag: "living_room_warm",
      description: "A young couple in their late twenties sit close together on the sofa during golden hour, warm light glowing on their faces. She rests her head on his shoulder. Quiet, intimate, no dialogue — pure mood.",
      cameraOverride: "extremely slow push-in, shallow depth of field, cinematic warmth",
    },
    {
      photoTag: "coffee_corner",
      description: "The same couple makes coffee together at the counter — she leans against him from behind, arms around his waist while he pours. Soft morning light, tender, unhurried.",
      cameraOverride: "medium-close gentle handheld, observational",
    },
    {
      photoTag: "shower_bath",
      description: "Soft evening light fills the spa-like bathroom. Steam from the shower rises gently. A robe hangs on the door. The room is empty but feels recently used by two — a sense of restorative quiet.",
      cameraOverride: "slow vertical tilt down, dreamy rack focus",
    },
    {
      photoTag: "art_wall",
      description: "The couple stands hand-in-hand in front of the art wall, looking at the pieces together. She points to one; he tilts his head. Warm lamp glow. Their backs are mostly to camera.",
      cameraOverride: "slow dolly past, capturing them in profile then moving on",
    },
  ],

  remote: [
    {
      photoTag: "coffee_corner",
      description: "A solo professional in their thirties pours fresh coffee at the counter, alone in the quiet apartment. Morning sunlight from the side, peaceful expression, the ritual of a good workday starting.",
      cameraOverride: "static medium shot, calm and composed",
    },
    {
      photoTag: "living_room_wide",
      description: "The same person sits cross-legged on the sofa with a laptop, deep in focus. The wide living room around them is bathed in even, diffuse daylight. They are alone and absorbed.",
      cameraOverride: "very slow dolly in toward the laptop, then their face, observational",
    },
    {
      photoTag: "art_wall",
      description: "The person stands quietly in front of the art wall during a break, holding a mug, looking at one of the pieces. A moment of contemplation. Pure stillness.",
      cameraOverride: "static composed architectural frame, slight rack focus",
    },
    {
      photoTag: "kitchen_clean",
      description: "Midday. The person stands at the kitchen counter making tea — kettle on the stove, daylight through the window. A short pause from work, calm and earned.",
      cameraOverride: "slow push-in toward the kettle and their hands",
    },
  ],

  business: [
    {
      photoTag: "kitchen_clean",
      description: "Pristine arrival. The kitchen is empty, untouched, polished — cool morning light coming through the window. Hotel-grade clean. No people in this shot.",
      cameraOverride: "precise static architectural frame, locked composition",
    },
    {
      photoTag: "living_room_wide",
      description: "A business traveler in a sharp coat enters the living room with a small carry-on suitcase, sets it down by the sofa, and exhales — relief at a clean, efficient space. Cool daylight, blinds half open.",
      cameraOverride: "slow dolly forward at chest height, fixed composition",
    },
    {
      photoTag: "laundry",
      description: "An in-unit washer and dryer running quietly. No people. The detail says: stay productive, handle your own logistics, no detours required.",
      cameraOverride: "static medium shot, clinical hotel-style framing",
    },
    {
      photoTag: "vanity",
      description: "A clean vanity area with folded towels stacked precisely; mirror catches the cool light. Empty, ready. Hotel-grade.",
      cameraOverride: "slow horizontal tracking, hotel-reveal style",
    },
  ],
};

async function main() {
  await mkdir(RAW, { recursive: true });

  console.log(`Building 16 shots (${FAST ? "fast" : "standard"} model)…\n`);
  const t0 = Date.now();

  // Fire all 16 shots in parallel.
  const jobs = Object.entries(STORYBOARDS).flatMap(([personaId, shots]) =>
    shots.map((shot, i) => ({
      personaId: personaId as PersonaId,
      shotIndex: i,
      shot,
    }))
  );

  const results = await Promise.allSettled(
    jobs.map(async (j) => {
      const persona = PERSONAS[j.personaId];
      const photo = BAYVIEW_PHOTOS.find((p) => p.tag === j.shot.photoTag);
      if (!photo) throw new Error(`No photo with tag ${j.shot.photoTag}`);

      const prompt =
        composeShotPrompt(persona, {
          description: j.shot.description,
          cameraOverride: j.shot.cameraOverride,
        }) + " " + HONESTY_RULE;

      const tStart = Date.now();
      console.log(`→ ${j.personaId}:${j.shotIndex} (${photo.name})  starting`);

      const res = await generateShot({
        prompt,
        referenceImageUrl: photo.url,
        duration: SHOT_DURATION,
        aspectRatio: "16:9",
        resolution: "1080p",
        generateAudio: false,
        fast: FAST,
      });

      const elapsed = ((Date.now() - tStart) / 1000).toFixed(0);
      console.log(`✓ ${j.personaId}:${j.shotIndex} done in ${elapsed}s`);

      const buf = Buffer.from(await (await fetch(res.videoUrl)).arrayBuffer());
      const outPath = `${RAW}/${j.personaId}_${j.shotIndex}.mp4`;
      await writeFile(outPath, buf);

      return { ...j, file: outPath };
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} shots failed:`);
    failures.forEach((f) => console.error("  ", (f as PromiseRejectedResult).reason));
    process.exit(1);
  }

  console.log(`\nAll 16 shots done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Concatenating…\n`);

  // Concat 4 shots per persona using ffmpeg's concat demuxer.
  for (const personaId of Object.keys(STORYBOARDS) as PersonaId[]) {
    const listFile = `${RAW}/${personaId}_list.txt`;
    const lines = STORYBOARDS[personaId]
      .map((_, i) => `file '${process.cwd()}/${RAW}/${personaId}_${i}.mp4'`)
      .join("\n");
    await writeFile(listFile, lines);

    const out = `${ROOT}/${personaId}.mp4`;
    // -c copy is fastest but requires identical codec params; Seedance shots
    // are uniform so this works. If it ever fails, swap to re-encode:
    //   -c:v libx264 -preset veryfast -crf 22
    await execFileP("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c", "copy",
      out,
    ]);
    console.log(`✓ ${personaId} → ${out}`);
  }

  console.log(`\n✅ Done. Total ${((Date.now() - t0) / 1000).toFixed(0)}s.`);
  console.log(`   public/demo-videos/{family,couple,remote,business}.mp4`);
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
