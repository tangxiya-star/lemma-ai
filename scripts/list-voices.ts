// Quick: print every voice in your ElevenLabs account so you can grab your cloned voice_id.
// Usage: npx tsx scripts/list-voices.ts
async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not set in .env.local");

  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data: any = await r.json();

  const cloned = data.voices.filter((v: any) => v.category === "cloned" || v.category === "professional");
  const others = data.voices.filter((v: any) => v.category !== "cloned" && v.category !== "professional");

  console.log("\n=== YOUR CLONED VOICES ===\n");
  if (cloned.length === 0) console.log("(none found)");
  for (const v of cloned) {
    console.log(`  ${v.name.padEnd(24)}  ${v.voice_id}   [${v.category}]`);
  }

  console.log(`\n=== OTHER (${others.length} default voices, hidden — pass --all to see) ===\n`);
  if (process.argv.includes("--all")) {
    for (const v of others) console.log(`  ${v.name.padEnd(24)}  ${v.voice_id}`);
  }

  console.log("\n→ Paste your voice_id into .env.local as ELEVENLABS_VOICE_ID");
}
main().catch((e) => { console.error(e); process.exit(1); });
