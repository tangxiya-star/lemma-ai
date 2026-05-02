// Seedance 2.0 client — BytePlus ModelArk
// Docs: https://docs.byteplus.com/en/docs/ModelArk
//
// Video generation is async: submit a task → poll for completion → receive video URL.
// IMPORTANT: returned video_url is a TOS presigned URL valid ~24h. Persist the file, don't store the URL.

const BASE_URL = process.env.ARK_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3";
const API_KEY = process.env.ARK_API_KEY;
const MODEL = process.env.SEEDANCE_MODEL ?? "dreamina-seedance-2-0-260128";
const MODEL_FAST = process.env.SEEDANCE_MODEL_FAST ?? "dreamina-seedance-2-0-fast-260128";

export type AspectRatio = "16:9" | "9:16" | "1:1";
export type Resolution = "480p" | "720p" | "1080p";

export type GenerateShotInput = {
  prompt: string;
  referenceImageUrl?: string;
  duration?: number;        // seconds (default 5)
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  generateAudio?: boolean;
  fast?: boolean;           // use fast model variant
};

export type GenerateShotResult = {
  videoUrl: string;
  durationSeconds: number;
  resolution: string;
  aspectRatio: string;
  taskId: string;
  totalTokens?: number;
};

type TaskStatus =
  | { id: string; status: "queued" | "running" }
  | {
      id: string;
      status: "succeeded";
      content: { video_url: string };
      duration: number;
      resolution: string;
      ratio: string;
      usage?: { total_tokens: number };
    }
  | { id: string; status: "failed"; error: { code: string; message: string } };

function authHeaders(): Record<string, string> {
  if (!API_KEY) throw new Error("ARK_API_KEY is not set");
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Seedance prompt syntax: inline flags --rt 16:9 --dur 8 --rs 720p
function buildPrompt(input: GenerateShotInput): string {
  const parts = [input.prompt.trim()];
  if (input.aspectRatio) parts.push(`--rt ${input.aspectRatio}`);
  if (input.duration) parts.push(`--dur ${input.duration}`);
  if (input.resolution) parts.push(`--rs ${input.resolution}`);
  return parts.join(" ");
}

export async function createVideoTask(input: GenerateShotInput): Promise<string> {
  const content: Array<Record<string, unknown>> = [
    { type: "text", text: buildPrompt(input) },
  ];
  if (input.referenceImageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: input.referenceImageUrl },
      role: "reference_image",
    });
  }

  const res = await fetch(`${BASE_URL}/contents/generations/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: input.fast ? MODEL_FAST : MODEL,
      content,
      ...(input.generateAudio !== undefined ? { generate_audio: input.generateAudio } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Seedance task create failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function getVideoTask(taskId: string): Promise<TaskStatus> {
  const res = await fetch(`${BASE_URL}/contents/generations/tasks/${taskId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Seedance task fetch failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as TaskStatus;
}

export async function generateShot(
  input: GenerateShotInput,
  opts: {
    pollIntervalMs?: number;
    timeoutMs?: number;
    onProgress?: (status: TaskStatus) => void;
  } = {}
): Promise<GenerateShotResult> {
  const pollInterval = opts.pollIntervalMs ?? 4000;
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000;

  const taskId = await createVideoTask(input);
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const task = await getVideoTask(taskId);
    opts.onProgress?.(task);

    if (task.status === "succeeded") {
      return {
        videoUrl: task.content.video_url,
        durationSeconds: task.duration,
        resolution: task.resolution,
        aspectRatio: task.ratio,
        taskId,
        totalTokens: task.usage?.total_tokens,
      };
    }
    if (task.status === "failed") {
      throw new Error(`Seedance task ${taskId} failed: ${task.error.message}`);
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }
  throw new Error(`Seedance task ${taskId} timed out after ${timeout}ms`);
}
