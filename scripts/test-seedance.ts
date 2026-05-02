// Quick smoke test for the Seedance client.
// Run: npx tsx --env-file=.env.local scripts/test-seedance.ts

import { generateShot } from "../lib/seedance/client";

async function main() {
  console.log("→ Submitting Seedance task (fast variant)...");
  const t0 = Date.now();

  // Bayview Retreat — living room reference (IMG_4449)
  const referenceImageUrl =
    "https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original/5679b926-bceb-4af5-b912-c9847bb8444a.jpeg?im_w=720";

  const result = await generateShot(
    {
      prompt:
        "Slow dolly forward through this sunlit living room, soft morning light, calm minimal mood, gentle handheld feel",
      referenceImageUrl,
      duration: 5,
      aspectRatio: "16:9",
      resolution: "720p",
      generateAudio: true,
      fast: true,
    },
    {
      pollIntervalMs: 4000,
      timeoutMs: 6 * 60 * 1000,
      onProgress: (status) => {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        console.log(`  [${elapsed}s] status=${status.status}`);
      },
    }
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n✓ Done in ${elapsed}s`);
  console.log(`  taskId:     ${result.taskId}`);
  console.log(`  duration:   ${result.durationSeconds}s`);
  console.log(`  resolution: ${result.resolution}`);
  console.log(`  ratio:      ${result.aspectRatio}`);
  console.log(`  tokens:     ${result.totalTokens ?? "n/a"}`);
  console.log(`  videoUrl:   ${result.videoUrl}\n`);
  console.log("⚠ video_url is a TOS presigned URL — download within ~24h.");
}

main().catch((err) => {
  console.error("✗ Test failed:", err);
  process.exit(1);
});
