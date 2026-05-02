// Generate one shot per persona (4 total) in parallel using fast Seedance.
// Run: npx tsx --env-file=.env.local scripts/test-personas.ts

import { generateShot } from "../lib/seedance/client";
import { PERSONAS, findPhoto, composeShotPrompt, PersonaSpec } from "../lib/personas";

// One signature scene per persona — enough to validate that prompts pull videos apart.
const SIGNATURE_SCENE: Record<string, { description: string; photoHint?: string }> = {
  family: {
    description:
      "A bright living room. The camera glides past a child's plush toy left on the sofa, toward sunlit windows.",
  },
  couple: {
    description:
      "A sunlit sofa corner at golden hour. Two coffee cups rest on the side table. A hand reaches in to pick one up.",
  },
  remote: {
    description:
      "A quiet counter. Steam rises from a fresh coffee next to a half-open laptop. Soft daylight, no movement except the rising steam.",
  },
  business: {
    description:
      "An immaculate kitchen. Crisp morning light hits a clean counter. The camera locks off in a precise architectural frame.",
  },
};

async function runOne(persona: PersonaSpec) {
  const scene = SIGNATURE_SCENE[persona.id];
  const photo = findPhoto(persona.heroPhotoHint);
  if (!photo) throw new Error(`No photo for hint ${persona.heroPhotoHint}`);

  const prompt = composeShotPrompt(persona, scene);
  const t0 = Date.now();
  console.log(`[${persona.id}] → submit (ref: ${photo.name})`);

  const result = await generateShot(
    {
      prompt,
      referenceImageUrl: photo.url,
      duration: 5,
      aspectRatio: "16:9",
      resolution: "720p",
      generateAudio: true,
      fast: true,
    },
    {
      pollIntervalMs: 5000,
      timeoutMs: 6 * 60 * 1000,
    }
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`[${persona.id}] ✓ ${elapsed}s — ${result.videoUrl}`);
  return { persona: persona.id, ...result, prompt };
}

async function main() {
  console.log("Submitting 4 persona tasks in parallel (fast variant)...\n");
  const t0 = Date.now();

  const results = await Promise.allSettled(
    Object.values(PERSONAS).map((p) => runOne(p))
  );

  console.log(`\n=== All done in ${((Date.now() - t0) / 1000).toFixed(0)}s ===\n`);
  for (const r of results) {
    if (r.status === "fulfilled") {
      console.log(`✓ ${r.value.persona}`);
      console.log(`  prompt: ${r.value.prompt}`);
      console.log(`  url:    ${r.value.videoUrl}\n`);
    } else {
      console.log(`✗ failed: ${r.reason}\n`);
    }
  }
  console.log("⚠ All URLs are TOS presigned — valid ~24h. Download to keep.");
}

main().catch((err) => {
  console.error("✗ Test failed:", err);
  process.exit(1);
});
