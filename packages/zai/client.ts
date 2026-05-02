import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ZAI_API_KEY!,
  baseURL: "https://api.z.ai/api/paas/v4",
});

export async function zaiChat<T>(opts: {
  system: string;
  user: string;
  model?: string;
  jsonSchema?: object;
}): Promise<T> {
  const res = await client.chat.completions.create({
    model: opts.model ?? "glm-4.6",
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: opts.jsonSchema
      ? { type: "json_object" }
      : undefined,
    temperature: 0.7,
  });
  const text = res.choices[0]?.message?.content ?? "";
  return opts.jsonSchema ? (JSON.parse(text) as T) : (text as unknown as T);
}
