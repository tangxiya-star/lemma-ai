// Generate the 5 narrator VO clips for the Lemma demo video.
// Usage: npx tsx scripts/generate-vo.ts
import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/demo-videos/vo");

// 5-shot script (4 problem + 1 close). Keep each line short and breathable.
const lines = [
  { id: "01-couple",   text: "Today, every property manager shows one listing video — to every guest." },
  { id: "02-family",   text: "But a family is looking for somewhere warm." },
  { id: "03-writer",   text: "A writer is looking for somewhere quiet." },
  { id: "04-business", text: "Nobody is looking for the same stay." },
  { id: "05-close",    text: "One stay. Told four ways. Lemma." },
];

async function tts(text: string, voiceId: string, key: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      // Narration-tuned settings: stable, slightly less robotic than defaults.
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.30,
        use_speaker_boost: true,
      },
    }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing in .env.local");
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID missing in .env.local");

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${lines.length} clips with voice ${voiceId}\n`);

  for (const l of lines) {
    process.stdout.write(`  ${l.id}  "${l.text.slice(0, 50)}…"  `);
    const t0 = Date.now();
    const audio = await tts(l.text, voiceId, key);
    const out = path.join(OUT_DIR, `${l.id}.mp3`);
    await fs.writeFile(out, audio);
    console.log(`✓ ${audio.length} bytes · ${Date.now() - t0}ms`);
  }

  console.log(`\n→ Saved to ${OUT_DIR}`);
}

main().catch((e) => { console.error("\n✗", e.message); process.exit(1); });
