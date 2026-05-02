"use client";

import { useEffect, useRef, useState } from "react";
import {
  Star,
  MapPin,
  Wifi,
  Coffee,
  Home,
  Settings,
  Code2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";

const ABNB =
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original";
const photos = [
  `${ABNB}/0609000d-b3f8-40ac-a563-104ab2182867.jpeg?im_w=1440`,
  `${ABNB}/091631a4-7baa-48a2-aa21-f6acf3844dd0.jpeg?im_w=720`,
  `${ABNB}/0a5f395f-2db9-4d9d-a807-452e440c9c2b.jpeg?im_w=720`,
  `${ABNB}/1f5b6a20-a368-4609-a1b3-bc7b8e69f1c5.jpeg?im_w=720`,
  `${ABNB}/217b792d-daba-4f0d-97ed-74631e327c0e.jpeg?im_w=720`,
];

export default function DemoListing() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [headerCode, setHeaderCode] = useState("");
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const injectedRef = useRef<HTMLScriptElement | null>(null);

  function publish() {
    // Remove any previously injected scripts so re-publishing works cleanly.
    if (injectedRef.current) {
      injectedRef.current.remove();
      injectedRef.current = null;
    }
    document
      .querySelectorAll('[data-lemma-injected="1"]')
      .forEach((el) => el.remove());
    document.querySelectorAll(".lm-fab, #lm-card").forEach((el) => el.remove());

    // Parse the textarea to find a script tag and re-create it so the browser executes it.
    const wrapper = document.createElement("div");
    wrapper.innerHTML = headerCode;
    const tpl = wrapper.querySelector("script");

    if (!tpl) {
      setToast("No <script> tag found in your code.");
      setTimeout(() => setToast(null), 2400);
      return;
    }

    const real = document.createElement("script");
    for (const a of Array.from(tpl.attributes)) {
      real.setAttribute(a.name, a.value);
    }
    real.textContent = tpl.textContent || "";
    real.setAttribute("data-lemma-injected", "1");
    document.head.appendChild(real);
    injectedRef.current = real;

    setPublished(true);
    setEditorOpen(false);
    setToast("Custom code published. Visitors will see it on next load.");
    setTimeout(() => setToast(null), 3200);
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#0a0a0a]">
      {/* Top bar — Squarespace-style "you're editing your site" strip */}
      <div className="bg-[#0a0a0a] text-[#f4efe6] text-[11px] uppercase tracking-[0.22em] py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Editing · bayviewretreat.com</span>
        </div>
        <div className="text-[#f4efe6]/50">Squarefront · Site Builder</div>
      </div>

      <header className="border-b border-black/10 sticky top-0 bg-[#faf7f2]/90 backdrop-blur z-30">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="font-display text-xl tracking-tight">
            bayviewretreat<span className="text-black/40">.com</span>
          </div>
          <nav className="text-[11px] uppercase tracking-[0.22em] text-black/60 flex gap-6">
            <a>Stay</a>
            <a>Amenities</a>
            <a>Reviews</a>
            <a>Book</a>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-black/50 mb-4">
          <MapPin className="w-3.5 h-3.5" /> Mendocino, California
        </div>
        <h1 className="font-display text-6xl tracking-tight mb-3">
          Bayview <em className="italic">Retreat.</em>
        </h1>
        <div className="flex items-center gap-3 text-sm text-black/60 mb-8">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" /> 4.97
          </span>
          <span>·</span>
          <span>128 reviews</span>
          <span>·</span>
          <span>Superhost</span>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden mb-12 h-[460px]">
          <img src={photos[0]} className="col-span-2 row-span-2 w-full h-full object-cover" />
          <img src={photos[1]} className="w-full h-full object-cover" />
          <img src={photos[2]} className="w-full h-full object-cover" />
          <img src={photos[3]} className="w-full h-full object-cover" />
          <img src={photos[4]} className="w-full h-full object-cover" />
        </div>

        {/* Anchor where the widget renders the inline player after a persona is picked */}
        <div id="lemma-widget-anchor" />

        <div className="grid md:grid-cols-3 gap-12 pt-8 border-t border-black/10">
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-black/45 mb-3">
                Hosted by Marie
              </div>
              <h2 className="font-display text-3xl mb-3">A quiet bayside home</h2>
              <p className="text-black/70 leading-relaxed text-lg">
                Cliffside windows, a sun-soaked workspace, and the slow rhythm of the
                Pacific. Bayview Retreat is built for unhurried days and easy mornings —
                wake to fog drifting over the headland, walk to the village for coffee,
                come back to a fire and a record on the turntable.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-3">
                <Feature icon={<Home className="w-4 h-4" />} label="Entire home · 3BR" />
                <Feature icon={<Wifi className="w-4 h-4" />} label="Fast Wi-Fi · 400 Mbps" />
                <Feature icon={<Coffee className="w-4 h-4" />} label="Espresso bar" />
                <Feature icon={<Star className="w-4 h-4" />} label="Superhost · 4.97" />
              </div>
            </div>

            <div>
              <h3 className="font-display text-2xl mb-4">Reviews</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Review name="Daniel" date="April 2026" body="The kind of place that makes you cancel the rest of the trip and just stay." />
                <Review name="Priya" date="March 2026" body="Wi-Fi is real, the desk faces the water, and Marie is the most thoughtful host." />
              </div>
            </div>
          </div>

          <aside className="border border-black/10 rounded-3xl p-6 h-fit shadow-sm bg-white sticky top-24">
            <div className="font-display text-3xl">
              $284{" "}
              <span className="text-base font-normal text-black/50 font-sans">/ night</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="border border-black/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/50">Check-in</div>
                <div>Jun 12</div>
              </div>
              <div className="border border-black/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/50">Check-out</div>
                <div>Jun 17</div>
              </div>
            </div>
            <div className="border border-black/10 rounded-xl p-3 mt-2 text-sm flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-black/50">Guests</span>
              <span className="flex items-center gap-1">2 <ChevronDown className="w-3.5 h-3.5" /></span>
            </div>
            <button className="mt-4 w-full py-3 rounded-full bg-black text-[#faf7f2]">
              Reserve your stay
            </button>
            <div className="text-xs text-black/50 text-center mt-2">You won't be charged yet</div>
          </aside>
        </div>
      </section>

      <footer className="border-t border-black/10 mt-20 py-10 text-center text-[11px] uppercase tracking-[0.22em] text-black/40">
        © Bayview Retreat · Built with Squarefront
      </footer>

      {/* Floating "Edit site" button — host-mode only */}
      <button
        onClick={() => setEditorOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-black text-[#f4efe6] rounded-full pl-3 pr-5 py-3 flex items-center gap-2.5 shadow-2xl hover:bg-[#0a0a0a] text-[11px] uppercase tracking-[0.22em]"
      >
        <span className="w-7 h-7 rounded-full bg-[#f4efe6]/10 grid place-items-center">
          <Settings className="w-3.5 h-3.5" />
        </span>
        Edit site
      </button>

      {/* Code Injection drawer (Squarespace-style) */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditorOpen(false)}
          />
          <div className="w-full max-w-xl bg-[#0a0a0a] text-[#f4efe6] h-full overflow-y-auto border-l border-white/10">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/55">
                    Settings · Advanced
                  </div>
                  <div className="font-display text-lg">Code Injection</div>
                </div>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-[#f4efe6]/65 leading-relaxed">
                Paste custom HTML or scripts into your site's{" "}
                <span className="text-[#f4efe6]">&lt;head&gt;</span>. Code added here
                runs on every page of bayviewretreat.com.
              </p>

              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/50 mb-2">
                  Header
                </div>
                <textarea
                  value={headerCode}
                  onChange={(e) => setHeaderCode(e.target.value)}
                  spellCheck={false}
                  placeholder={`<!-- e.g. analytics, chat widgets, custom scripts -->\n<script src="https://yoursite.com/widget.js"></script>`}
                  className="w-full h-56 rounded-xl bg-black border border-white/10 p-4 font-mono text-xs text-[#f4efe6]/90 placeholder:text-[#f4efe6]/25 resize-none focus:outline-none focus:border-white/30"
                />
              </div>

              <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm group">
                <summary className="cursor-pointer text-[#f4efe6]/70 hover:text-[#f4efe6] flex items-center gap-2 list-none">
                  <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180" />
                  <span className="text-[11px] uppercase tracking-[0.22em]">
                    Don't have a script? Use the Lemma demo snippet
                  </span>
                </summary>
                <div className="mt-3 text-xs text-[#f4efe6]/55 leading-relaxed">
                  Open the Lemma dashboard, copy the embed snippet for this listing,
                  and paste it above. For this demo:
                  <button
                    onClick={() => {
                      const origin =
                        typeof window !== "undefined" ? window.location.origin : "";
                      setHeaderCode(
                        `<script src="${origin}/widget.js" data-listing-id="demo-123"></script>`,
                      );
                    }}
                    className="mt-3 text-[10px] uppercase tracking-[0.28em] underline underline-offset-4 text-[#f4efe6]/85 hover:text-[#f4efe6]"
                  >
                    Insert demo snippet →
                  </button>
                </div>
              </details>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={publish}
                  className="px-5 py-2.5 rounded-full bg-[#f4efe6] text-black text-xs font-medium hover:bg-white flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> Save & Publish
                </button>
                <button
                  onClick={() => setEditorOpen(false)}
                  className="text-[11px] uppercase tracking-[0.22em] text-[#f4efe6]/55 hover:text-[#f4efe6]"
                >
                  Cancel
                </button>
                {published && (
                  <span className="ml-auto text-[10px] uppercase tracking-[0.28em] text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-[#f4efe6] rounded-2xl px-5 py-3.5 text-sm shadow-2xl border border-white/10 max-w-sm">
          {toast}
        </div>
      )}
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-black/10">
      <div className="text-black/70">{icon}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function Review({ name, date, body }: { name: string; date: string; body: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-black/10 grid place-items-center text-xs font-display">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-black/45">{date}</div>
        </div>
      </div>
      <p className="text-sm text-black/70 leading-relaxed">{body}</p>
    </div>
  );
}
