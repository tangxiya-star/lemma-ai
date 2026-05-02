// A/B/C comparison of the Family opening shot to decide visual strategy.
// Run: npx tsx --env-file=.env.local scripts/test-family-variants.ts

import { writeFile, mkdir } from "node:fs/promises";
import { generateShot } from "../lib/seedance/client";
import { BAYVIEW_PHOTOS } from "../lib/personas";

const OUT = "public/demo-videos/_variants";

const photo = BAYVIEW_PHOTOS.find((p) => p.tag === "living_room_warm")!;

const variants = [
  {
    label: "A_props_5s",
    duration: 5,
    prompt:
      "A bright family living room. Soft golden morning light fills the windows. A child's plush toy sits on the sofa, a small drawing taped to the wall. Mood: warm, safe, lived-in. Camera: wide stable framing, slow dolly forward. Pace: unhurried.",
  },
  {
    label: "B_hand_10s",
    duration: 10,
    prompt:
      "A bright family living room. Warm morning light through the windows. In the lower-right corner, a small child's hand and forearm visible briefly, reaching toward a sunlit spot — the rest of the child is OUT OF FRAME. No other invented objects. Slow wide dolly forward over 10 seconds. The light shifts subtly as if a curtain moves. Mood: warm, lived-in, full of small joys. Show ONLY items visible in the reference photo plus the child's hand.",
  },
  {
    label: "C_atmosphere_10s",
    duration: 10,
    prompt:
      "A bright family living room. Soft warm morning light slowly intensifies through the windows over 10 seconds, as if the sun is rising. A gentle breeze ripples the curtains. Camera: very slow stable dolly forward, wide framing. No people, no animals, no invented objects — show ONLY items already in the reference photograph. Atmosphere should feel safe, warm, full of possibility — emotion comes from light and motion, not props.",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Generating 3 variants of Family opening shot…\n`);
  const t0 = Date.now();

  const results = await Promise.allSettled(
    variants.map(async (v) => {
      console.log(`→ ${v.label}  (${v.duration}s)`);
      const r = await generateShot({
        prompt: v.prompt,
        referenceImageUrl: photo.url,
        duration: v.duration,
        aspectRatio: "16:9",
        resolution: "720p",
        generateAudio: false,
        fast: true,
      });
      const buf = Buffer.from(await (await fetch(r.videoUrl)).arrayBuffer());
      const outPath = `${OUT}/${v.label}.mp4`;
      await writeFile(outPath, buf);
      console.log(`✓ ${v.label} → ${outPath}`);
      return { label: v.label, file: outPath };
    })
  );

  console.log(`\nAll done in ${((Date.now() - t0) / 1000).toFixed(0)}s.\n`);
  for (const r of results) {
    if (r.status === "rejected") console.log(`✗ failed: ${r.reason}`);
  }
  console.log("Open these to compare:");
  console.log("  http://localhost:3000/demo-videos/_variants/A_props_5s.mp4");
  console.log("  http://localhost:3000/demo-videos/_variants/B_hand_10s.mp4");
  console.log("  http://localhost:3000/demo-videos/_variants/C_atmosphere_10s.mp4");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
