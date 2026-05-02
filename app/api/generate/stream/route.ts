// SSE endpoint that streams the Director Agent's reasoning trace.
//
// Client usage:
//   const es = new EventSource(`/api/generate/stream?listingId=bayview-001`);
//   es.addEventListener("agent", (e) => {
//     const event = JSON.parse(e.data); // typed as AgentEvent
//   });
//   es.addEventListener("done", () => es.close());
//
// We use a single named "agent" event to keep parsing simple — the discriminated
// union in AgentEvent already encodes the sub-types.

import { NextRequest } from "next/server";
import { runDirector } from "@/lib/agent/director";
import { BAYVIEW_PHOTOS, PersonaId } from "@/lib/personas";
import { store, defaultPersonas, Listing } from "@/lib/store";

export const runtime = "nodejs"; // Anthropic SDK + long-lived streams: prefer node runtime
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const listingId = sp.get("listingId") || `listing-${Date.now()}`;
  const listingName = sp.get("name") || "Bayview Retreat";
  const personasParam = sp.get("personas");
  const personas: PersonaId[] = personasParam
    ? (personasParam.split(",") as PersonaId[])
    : ["family", "couple", "remote", "business"];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventName: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Heartbeat every 15s so proxies/CDNs don't kill the connection.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      try {
        for await (const event of runDirector({
          listingId,
          listingName,
          photos: BAYVIEW_PHOTOS,
          personas,
        })) {
          send("agent", event);

          // Persist the listing once all personas finish so the listing
          // detail page can read it from the store.
          if (event.type === "session_end") {
            const listing: Listing = {
              listingId,
              name: listingName,
              features: ["natural_light", "workspace", "cozy_bed", "ocean_view"],
              vibe: "calm_minimal",
              personas: defaultPersonas().filter((p) =>
                personas.includes(p.id as PersonaId)
              ),
              createdAt: Date.now(),
            };
            store.set(listingId, listing);
            send("done", { listingId });
          }
        }
      } catch (err) {
        send("agent", {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
          ts: Date.now(),
        });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering if behind a proxy
    },
  });
}
