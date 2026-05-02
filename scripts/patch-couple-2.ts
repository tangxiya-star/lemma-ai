// Patch: regenerate couple:2 with a moderation-safe prompt, then concat all 4 personas.
// The original prompt mentioned "robe" + "recently used by two" + shower, which
// triggered Seedance content moderation. Rewritten as a clean empty-room shot.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { generateShot } from "../lib/seedance/client";
import { BAYVIEW_PHOTOS, PERSONAS, composeShotPrompt, PersonaId } from "../lib/personas";

const execFileP = promisify(execFile);
const RAW = "public/demo-videos/_raw";
const ROOT = "public/demo-videos";

const SAFE_PROMPT =
  "A spa-like bathroom in soft evening light. Glass walls catch a warm glow. Clean folded towels are stacked on the counter. The room is empty, peaceful, restorative. No people. " +
  "Do not introduce any objects, furniture, decor, food, or pets that are not visible in the reference photograph.";

async function main() {
  await mkdir(RAW, { recursive: true });

  // 1. Regenerate couple:2 with safe prompt
  const photo = BAYVIEW_PHOTOS.find((p) => p.tag === "shower_bath")!;
  const persona = PERSONAS.couple;
  const prompt =
    composeShotPrompt(persona, {
      description: SAFE_PROMPT,
      cameraOverride: "slow vertical tilt down, dreamy rack focus",
    });

  console.log("→ regenerating couple:2 (safe prompt)…");
  const t0 = Date.now();
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
  await writeFile(`${RAW}/couple_2.mp4`, buf);
  console.log(`✓ couple:2 done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

  // 2. Concat all 4 personas
  for (const personaId of ["family", "couple", "remote", "business"] as PersonaId[]) {
    const listFile = `${RAW}/${personaId}_list.txt`;
    const lines = [0, 1, 2, 3]
      .map((i) => `file '${process.cwd()}/${RAW}/${personaId}_${i}.mp4'`)
      .join("\n");
    await writeFile(listFile, lines);
    const out = `${ROOT}/${personaId}.mp4`;
    // Re-encode rather than copy: standard model and previous fast outputs may
    // have different params. Re-encoding is safe across all cases.
    await execFileP("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      out,
    ]);
    console.log(`✓ ${personaId} → ${out}`);
  }
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
