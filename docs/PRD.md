# Lemma — Product Requirements Document

> **Show the right story to the right guest.**
> Persona-aware video generation for short-term rental hosts

---

## Meta

| | |
|---|---|
| **Project codename** | Lemma |
| **Pitch venue** | Beta Fund "Builders of Tomorrow" Hackathon · May 2, 2026 |
| **Build window** | Tonight (May 1 evening) + 6h hackathon day |
| **Required dependency** | Seedance 2.0 (BytePlus ModelArk), Claude Sonnet, Butterbase |
| **Document scope** | Engineering-ready spec for both B-side dashboard and C-side widget |

---

## 1. Executive summary

Lemma is a persona-aware video generation and distribution system. A host uploads photos of their listing once. An AI Director Agent generates multiple persona-specific videos (family, couple, remote worker, business). The host embeds a one-line JavaScript widget on their direct-booking page. When a traveler arrives, they identify their persona and watch the matching video — driving conversion.

### Why Lemma exists

> **Airbnb is discovery. Lemma is conversion.**

Airbnb and similar marketplaces are closed ecosystems where every traveler sees identical content. Hosts who professionalize and drive bookings through direct channels need conversion tooling. Lemma is the conversion layer — adapting media per viewer in surfaces hosts control.

### Three product principles

- **One upload, many stories.** The host's burden does not multiply with persona count.
- **Embed, don't compete.** We don't replace the host's booking page. We add a layer on top.
- **The agent is the product.** Seedance is one tool the agent uses, not the product itself. Without the orchestration, this is just video generation.

---

## 2. Airbnb integration strategy

This is the question every judge will ask. Have the answer ready.

### The constraint

- Airbnb does not permit third-party JavaScript or widgets in listing pages
- VRBO and Booking.com have the same restriction
- Listing-page injection is structurally impossible. Anyone who claims to do this is misleading

### Lemma's path: direct-booking surfaces

| Surface | Embed? | Why |
|---|---|---|
| Host's own direct-booking site | ✅ Yes | Host owns the entire page. Lemma's primary surface. |
| Hostaway listing page | ✅ Yes | Custom HTML embed support. Property managers' default platform. |
| Lodgify, OwnerRez | ✅ Yes | Same as Hostaway. Custom HTML/embed allowed. |
| WordPress / Squarespace site | ✅ Yes | Custom-built host websites. Common for serious hosts. |
| Airbnb listing page | ❌ No | Closed ecosystem. Hosts use Airbnb for discovery, then drive direct bookings. |

### The pitch line (memorize this)

> "While platforms like Airbnb are closed ecosystems, professional hosts drive bookings through direct channels they control. Lemma integrates with those pages via a single script tag. We're not replacing Airbnb — we're powering the conversion layer on the surfaces hosts already own."

### Why this is a strength, not a weakness

This positioning makes Airbnb our "why now," not our competitor. Hosts who pay 15% Airbnb commission want to drive bookings direct to save fees. Lemma makes their direct-booking page convert as well as Airbnb's. Mary Zeng (NewsBreak FP&A) and Michael Pao (marketplace) will both immediately understand this leverage.

---

## 3. Product architecture: two surfaces

Lemma has two distinct frontend surfaces and one shared backend. They serve different users with different goals.

| | B-side: Dashboard | C-side: Widget |
|---|---|---|
| **User** | Property manager / direct-booking host | Traveler arriving on host's booking page |
| **Goal** | Generate adaptive videos and get embed code | Identify persona and watch matching video |
| **Surface** | lemma.app/dashboard | Embedded in host's site via `<script>` |
| **Frequency** | Setup once per listing, occasional regenerate | Every page visit by a potential booker |
| **Visual identity** | Lemma-branded SaaS dashboard | Adapts to host's site (transparent overlay) |

---

## 4. B-side: Dashboard (host-facing)

### 4.1 Information architecture

The Dashboard is a four-step linear flow. No sidebar nav, no settings panel for v1.

```
/dashboard
  ├─ /new                  # New listing — upload + property info
  ├─ /generate/[jobId]     # Generation in progress (live agent trace)
  ├─ /listings/[id]        # Listing detail — preview, regenerate, embed
  └─ /listings/[id]/embed  # Embed code, integration instructions
```

### 4.2 Frame B1: Landing / Sign in

Marketing site with clear value prop and one CTA. Goal: convince host that Lemma will increase their direct-booking conversion.

#### Layout

- **Hero**: dual-screen comparison auto-loop. Left = traditional listing video (one story). Right = Lemma (3 personas cycling). Auto-narrated with caption: "Same listing. Different stories."
- **Subheadline**: "Lemma generates persona-specific videos for your direct-booking page. Embed in 60 seconds. Watch your conversion lift."
- **Primary CTA**: "Generate yours →"
- **Secondary CTA**: "Watch 60s demo" (links to a Loom or Seedance-generated explainer)
- **Trust strip**: "Powered by Seedance 2.0 · Built for Hostaway, Lodgify, custom WordPress"
- **Footer**: Pricing ($30/listing one-time + $30/month), email signup, Twitter, made-with-care credit

#### Visual treatment

- Background: deep `#0E0E0F`
- Hero text: warm off-white `#F5F2EC`
- Accent: coral `#E85D24`
- Hero typography: Fraunces (serif, italic emphasis on "Different"), Inter for everything else

### 4.3 Frame B2: New listing — upload screen

#### Layout

- Two-column: left = inputs, right = persona selection
- Top header: "Step 1 of 2 · Tell us about your listing"

#### Left column

- Listing name (text input, e.g. "The Cabin in Bolinas")
- Location (text input with autocomplete, optional)
- Vibe selector (dropdown: cozy cabin / modern loft / beach house / urban apartment / boutique / luxury)
- Photo dropzone — drag-and-drop, 10 minimum, 20 max. Thumbnail grid below with reorder.

#### Right column — persona panel

- Sticky panel, 380px wide
- Heading: "Who do you want to attract?"
- 4 persona cards (selectable, default 3 selected based on vibe):
  - **Family** — Kid-friendly, spacious, safe
  - **Solo / Remote worker** — Quiet, focused, restorative
  - **Couple** — Romantic, intimate, escape
  - **Business** — Professional, productive
- Each card: icon + name + 1-line description + checkbox
- Bottom CTA: "Generate [N] videos →" with cost estimate "~90s · ~$2-4 in compute"

#### Behavior

- Photos upload to Butterbase S3 immediately on drop
- CTA disabled until 10+ photos uploaded and ≥1 persona selected
- On submit: `POST /api/generate` → returns `jobId` → navigate to `/generate/[jobId]`

### 4.4 Frame B3: Generation screen

This is the highest-leverage screen for demo impact. The 60-90 seconds of generation must be made watchable. The transparent reasoning trace replaces a generic spinner.

#### Layout

- **Top**: header with job title ("Director agent at work") and elapsed time / ETA
- **Middle**: 3-column persona track grid (one per selected persona). Each track shows current shot, progress bar, and reasoning excerpt.
- **Bottom**: full-width agent reasoning console (terminal-style monospace, auto-scrolling)

#### Per-persona track

- Persona name + status badge (queued / rendering shot N / done)
- Preview thumbnail (placeholder until shot 1 lands, then live thumbnail)
- 4-segment shot progress bar — fills as each shot generates
- Brief description of shots being generated (e.g. "4 shots: kid bedroom, safe deck, beach, kitchen")

#### Reasoning console

Streams events from server via Server-Sent Events. Format:

```
✓ Analyzing 10 photos for The Cabin in Bolinas
  → Detected: cabin, ocean view, 2 bedroom, fireplace, deck

→ generate_persona_brief(persona: "family")
  Brief: warm, safe, spacious. Highlight: kid bedroom + beach.

→ write_shot_script(persona: "family")
  Shot 1: kid bedroom morning light
  Shot 2: deck with safety railing
  Shot 3: kitchen wide
  Shot 4: beach at golden hour

→ generate_video_shot(shot_index: 1, ratio: "16:9")
✓ Shot 1 generated · qa_check passed

→ generate_video_shot(shot_index: 2)
⚠ qa_check failed: lighting drift. Regenerating...
✓ Shot 2 regenerated · qa_check passed
```

#### Visual treatment

- Console background: near-black `#060607`
- Reasoning text: muted `#999`
- Tool calls: coral `#E85D24`
- Success: green `#4ADE80`
- Warning: amber
- Persona track active state: coral border, pulsing dot

### 4.5 Frame B4: Listing detail — preview & embed

Where the host lands after generation completes. Shows all generated videos, allows in-context preview as a traveler would see it, and provides embed code.

#### Layout

- Header: listing name, generation metadata ("3 personas · generated 87s · $2.40")
- Main: "Preview as a traveler" — interactive widget preview
- Side panel: per-persona detail (script, highlights, regenerate this persona)
- Footer: "Get embed code" CTA, opens modal with code snippet

#### Embed modal

Code snippet ready to paste into host's website:

```html
<!-- Lemma adaptive video widget -->
<script src="https://lemma.app/widget.js"
        data-listing-id="bolinas-cabin-001"
        data-position="hero"
        async></script>
```

- Copy-to-clipboard button
- Tabs for different platforms: "Hostaway · Lodgify · WordPress · Custom HTML" with platform-specific instructions
- Live preview showing how the widget will look on a sample booking page

---

## 5. C-side: Widget (traveler-facing)

The widget is what travelers see embedded on the host's booking page. It must be unobtrusive, fast, and create a delightful moment of personalization.

### 5.1 Widget lifecycle

- **Phase 1 — Idle**: Widget loads as a passive video element showing the listing's default video (host's chosen default persona)
- **Phase 2 — Engagement**: After 3 seconds, a subtle CTA appears: "See this for your trip" (or shows immediately on user scroll/hover)
- **Phase 3 — Persona selection**: Modal overlays the video with a single question and 4 persona options
- **Phase 4 — Personalized playback**: Modal closes, matching video plays autoplay. Persona-specific CTA appears below ("Reserve your romantic escape" vs "Book this family-friendly cabin")
- **Phase 5 — Conversion**: CTA links to host's booking flow with persona context appended as URL parameter (for analytics)

### 5.2 Widget UI specification

#### Container

- Default position: hero block on host's listing page
- Default dimensions: 100% width × 56.25% (16:9 aspect)
- Min width: 320px (mobile), max width: 1400px
- Loads asynchronously to not block host page render

#### Idle state (default video player)

- Default video: host-selected default persona video (or generic if none)
- Native HTML5 controls (play/pause, fullscreen)
- Top-right corner: small "Lemma" badge (subtle, can be removed for paying tier)
- Bottom-right corner: "See this for your trip" pill button (appears after 3s, soft pulse)

#### Persona selection modal

- Triggered by clicking "See this for your trip" or after 5 seconds of dwell time
- Semi-transparent overlay (`rgba(0,0,0,0.85)`) on video
- Question: "Who are you traveling with?" in serif font (Fraunces 28px)
- 4 persona buttons in 2×2 grid (mobile: 1 column)
- Each button: large emoji icon + persona name + 1-line description
- Subtle dismiss option: "Skip — show me default"

#### Personalized playback state

- Modal fades out, persona video starts autoplay
- Top: small badge "Showing: Couple's escape" with "change" link
- Below video: persona-tinted CTA (e.g. coral if couple, sage if solo)
- CTA copy varies by persona: "Reserve your romantic escape" / "Book your remote work retreat" / "Reserve this family cabin"

### 5.3 Widget JavaScript API

For developers integrating Lemma:

```html
<!-- Minimum integration -->
<script src="https://lemma.app/widget.js"
        data-listing-id="bolinas-cabin-001"
        async></script>

<!-- Advanced integration -->
<script src="https://lemma.app/widget.js"
        data-listing-id="bolinas-cabin-001"
        data-position="hero"
        data-show-modal="auto"
        data-default-persona="couple"
        data-cta-url="/book"
        data-theme="dark"
        async></script>

<!-- Programmatic API -->
<script>
  Lemma.show({ listingId: '...', persona: 'family' });
  Lemma.on('persona-selected', (p) => analytics.track('lemma_persona', p));
</script>
```

Data attribute reference:
- `data-position`: `hero | sidebar | inline`
- `data-show-modal`: `auto | manual | never`
- `data-default-persona`: initial video shown
- `data-cta-url`: where CTA navigates to
- `data-theme`: `dark | light | auto`

---

## 6. AI Director Agent

The agent is the technical core of Lemma. It is what differentiates this from a video generation wrapper. Without the orchestration, this is just Seedance + a UI.

### 6.1 Agent identity

> "You are the Lemma Director Agent. Your job is to take a host's listing and produce persona-specific cinematic videos. You think about who the audience is, what they care about, and how to tell that story with the visual material available. You don't just generate video — you direct."

### 6.2 The four-stage agent loop

The agent operates as a four-stage reasoning loop. Each stage is a tool call with structured input/output. The agent is **multi-model**: vision tasks use Claude, creative text tasks use z.ai GLM, video generation uses Seedance — each model used where it is strongest.

| Stage | Tool | Model | Input | Output |
|---|---|---|---|---|
| **1. Understand** | `analyze_photos` | Claude Sonnet (vision) | Photo URLs | Spatial features, vibe, lighting, room types, highlights |
| **2. Brief** | `generate_persona_brief` | **z.ai GLM-4.6** | Persona + scene analysis | Creative brief: angle, narrative tone, highlighted features, music/audio direction |
| **3. Script** | `write_shot_script` | **z.ai GLM-4.6** | Brief + photos | 4-shot script with camera direction, mood, voiceover line |
| **4. Direct** | `generate_video_shot + qa_check` | Seedance + Claude vision | Script + reference images | Generated video shots + QA pass/fail; regenerate failures |

### 6.3 Tool definitions (TypeScript)

```typescript
// Tool 1: Scene Understanding
{
  name: "analyze_photos",
  description: "Analyze listing photos to identify rooms, features, vibe.",
  input_schema: {
    photo_urls: string[]
  },
  output: {
    rooms: string[],          // ["bedroom", "kitchen", "deck", ...]
    features: string[],       // ["fireplace", "ocean_view", ...]
    vibe: string,             // "cozy_cabin"
    lighting: string,         // "warm_natural"
    family_friendly: boolean,
    has_workspace: boolean,
    has_outdoor_space: boolean
  }
}

// Tool 2: Persona Brief
{
  name: "generate_persona_brief",
  description: "Write a creative brief tailored to a specific persona.",
  input_schema: {
    persona: "family" | "solo" | "couple" | "business",
    listing_analysis: object
  },
  output: {
    angle: string,            // "romantic escape from the city"
    tone: string,             // "warm, intimate, cinematic"
    must_show: string[],      // ["fireplace", "deck_sunset"]
    avoid: string[],          // ["children_room"]
    music_direction: string,
    voiceover_style: string
  }
}

// Tool 3: Shot Script
{
  name: "write_shot_script",
  description: "Produce a 4-shot script for the persona's video.",
  input_schema: {
    brief: object,
    available_photos: string[]
  },
  output: {
    shots: [{
      index: number,
      reference_photo: string,
      duration_seconds: number,
      camera: string,         // "slow dolly forward"
      description: string,
      voiceover: string
    }]
  }
}

// Tool 4: Generate Video Shot (calls Seedance)
{
  name: "generate_video_shot",
  description: "Render one video shot using Seedance 2.0.",
  input_schema: {
    shot_prompt: string,
    reference_image_url: string,
    duration: number,
    aspect_ratio: "16:9" | "9:16" | "1:1",
    generate_audio: boolean
  },
  output: { video_url: string, duration: number }
}

// Tool 5: QA Check
{
  name: "qa_check",
  description: "Verify generated shot matches the brief.",
  input_schema: {
    video_url: string,
    expected: object
  },
  output: {
    passed: boolean,
    issues: string[],
    suggestion: string
  }
}

// Tool 6: Concatenate
{
  name: "concatenate_shots",
  description: "Merge shots into final video with audio mix.",
  input_schema: {
    shot_urls: string[],
    output_format: string
  },
  output: { final_video_url: string }
}
```

### 6.4 Agent system prompt

```
You are the Lemma Director Agent.

Given a short-term rental listing's photos and a target persona,
produce a cinematic video that tells THAT persona's story about
THIS specific property.

Available tools:
- analyze_photos
- generate_persona_brief
- write_shot_script
- generate_video_shot
- qa_check
- concatenate_shots

Process:
1. Call analyze_photos first.
2. For each persona requested, call generate_persona_brief.
3. Call write_shot_script using the brief.
4. For each shot:
   - Call generate_video_shot with reference image and prompt
   - Call qa_check
   - If qa_check fails, regenerate once with adjusted prompt
5. When all shots pass, call concatenate_shots.

Stream your reasoning as you go. The user is watching.

Constraints:
- 4 shots per video
- 6-8 seconds per shot
- Use Seedance multi-shot syntax
- Use omni-reference: pass the most representative photo as @reference1
- Always generate native audio for narration
- Match the music direction in the brief

The agent is the product. Your decisions are visible to the user.
Make them good.
```

### 6.5 Agent execution flow

```
Upload photos
   ↓
[Director Agent starts]
   ↓
analyze_photos(photo_urls)
   ↓
For each persona in [family, solo, couple]:
   |
   ├─ generate_persona_brief(persona, listing_analysis)
   |
   ├─ write_shot_script(brief, photos)
   |
   ├─ For each shot in script:
   |    |
   |    ├─ generate_video_shot(shot_prompt, reference)
   |    |
   |    ├─ qa_check(video_url, brief)
   |    |
   |    └─ If failed → regenerate with adjusted prompt
   |
   └─ concatenate_shots(shot_urls)
   ↓
[All personas done]
   ↓
Store videos in Butterbase
   ↓
Return videos to client
```

### 6.6 Why this is genuinely agentic

This is the answer to "is there an agent here?":

- **Real reasoning**: agent decides which photos best serve each persona. Different personas may use different photos as primary reference.
- **Real tool use**: agent makes 15-30 tool calls per generation, with structured I/O between them.
- **Real self-correction**: `qa_check` failures trigger automatic regeneration with adjusted prompts.
- **Real planning**: agent determines shot ordering based on narrative arc, not just photo order.
- **Visible traces**: user sees each step happening, not a black-box "generating..." spinner.

> **"This is not a single prompt. It is a multi-step reasoning and orchestration system."**

---

## 7. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | Next.js 14 (App Router) | Server components, edge runtime, Vercel deploy. Cursor writes Next.js fluently. |
| **Styling** | Tailwind + shadcn/ui | Existing muscle memory. shadcn = high-quality components, copy not install. |
| **Animation** | Framer Motion | Generation screen + persona transitions need polished motion. Critical for demo quality. |
| **State** | Zustand | Lighter than Redux. One store per page is enough. |
| **Backend** | Butterbase via MCP | Auto-provisions Postgres, auth, S3, REST API. Sponsor prize ($200 credits). |
| **Agent runtime** | Claude Sonnet 4.5 (Anthropic) | Strong tool use, reliable streaming. Anthropic judge present (JiaZhou Gao). |
| **Vision** | Claude Sonnet 4.5 multimodal | Used for `analyze_photos` and `qa_check`. Multimodal in same model family as agent runtime. |
| **Creative text** | z.ai GLM-4.6 | Used for `generate_persona_brief` and `write_shot_script`. Strong structured creative output. Sponsor integration. |
| **Video** | Seedance 2.0 via BytePlus ModelArk | Required by hackathon. Direct API access more reliable than wrappers. |
| **Server streaming** | Server-Sent Events (SSE) | Stream agent reasoning to client in real time. Native to Next.js Edge functions. |
| **Widget delivery** | Vanilla JS bundle on Vercel | Widget must be tiny (~30KB) and dependency-free for embed. |
| **Hosting** | Vercel | git push to deploy. Edge runtime for low-latency widget serving. |
| **Email** | Resend | Free tier covers waitlist + transactional emails. |
| **Analytics** | Plausible + custom events | Track persona selection rate, conversion lift per persona. |

### 7.1 Project structure

```
lemma/
├── apps/
│   ├── dashboard/                # B-side Next.js app
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   └── page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── generate/[jobId]/page.tsx
│   │   │   │   └── listings/[id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── embed/page.tsx
│   │   │   └── api/
│   │   │       ├── generate/route.ts
│   │   │       ├── generate/stream/route.ts
│   │   │       └── upload/route.ts
│   │   └── components/
│   │
│   ├── widget/                   # C-side embeddable widget
│   │   ├── src/
│   │   │   ├── widget.ts         # Entry point
│   │   │   ├── modal.ts
│   │   │   ├── player.ts
│   │   │   └── api.ts
│   │   └── dist/widget.js        # Built bundle (deployed to Vercel)
│   │
│   └── widget-test/              # Mock booking page for demo
│       └── page.tsx
│
├── packages/
│   ├── agent/                    # Director agent (shared)
│   │   ├── director.ts
│   │   ├── tools/
│   │   │   ├── analyze.ts
│   │   │   ├── brief.ts
│   │   │   ├── script.ts
│   │   │   ├── seedance.ts
│   │   │   └── qa.ts
│   │   └── personas.ts
│   │
│   ├── seedance/                 # Seedance API client
│   │   └── client.ts
│   │
│   └── butterbase/               # Butterbase MCP client
│       └── client.ts
│
└── package.json (workspaces)
```

### 7.2 Data model

```sql
-- Butterbase tables provisioned via MCP

users {
  id: uuid (pk)
  email: string
  created_at: timestamp
}

listings {
  id: uuid (pk)
  user_id: uuid (fk)
  name: string
  vibe: string
  default_persona: string
  created_at: timestamp
}

photos {
  id: uuid (pk)
  listing_id: uuid (fk)
  s3_url: string
  order: int
}

generation_jobs {
  id: uuid (pk)
  listing_id: uuid (fk)
  status: enum
  personas: string[]
  agent_trace: jsonb
  created_at: timestamp
}

videos {
  id: uuid (pk)
  listing_id: uuid (fk)
  persona: string
  format: string
  s3_url: string
  duration_seconds: int
  shots: jsonb
  created_at: timestamp
}

widget_views {
  id: uuid (pk)
  listing_id: uuid (fk)
  persona_selected: string
  timestamp: timestamp
  user_agent: string
}
```

---

## 8. MVP scope (hackathon)

### 8.1 Must ship

- **B-side** — Upload screen (functional), Generation screen (live agent reasoning trace), Listing preview (persona switcher)
- **C-side** — Widget JS file deployed to Vercel, embeddable on a mock booking page
- **Mock booking page** — A fake "Bolinas Cabin" booking site with widget embedded, used for demo
- **1 demo listing** — Bolinas cabin with 3 pre-rendered persona videos
- **Director agent** — Real tool use loop, real reasoning trace; shot generation can be mocked behind pre-rendered videos for demo speed
- **Butterbase storage** — at minimum store videos and listing data

### 8.2 Hackathon nice-to-have (if time)

- Sign-up flow (skipping for demo)
- Multiple personas in same demo (can prerecord)
- Format selector (16:9 / 9:16 / 1:1)
- Embed code generator with platform tabs

### 8.3 Out of scope (post-hackathon)

- Real-time on-demand generation (always pre-generate for now)
- Multi-user / authentication
- Conversion analytics dashboard
- Native integrations (Hostaway API, Lodgify API)
- Custom persona creation
- A/B testing infrastructure

---

## 9. Demo strategy

### 9.1 Demo flow (60 seconds)

| Time | What happens |
|---|---|
| 0:00–0:08 | **Hook**: "Same Bolinas cabin. But three different travelers see three different videos." |
| 0:08–0:18 | **B-side**: drop 10 photos into upload screen, click generate. |
| 0:18–0:35 | **Generation screen**: Director agent reasoning trace visible. "It's analyzing photos. Writing 3 persona briefs. Orchestrating Seedance." |
| 0:35–0:48 | **Switch to mock booking page** (URL bar shows bolinasfamily.com). Widget loads. "Now I'm a traveler arriving on the host's site." |
| 0:48–0:55 | **Click each persona**, show 3 different videos for same house. |
| 0:55–1:00 | **Wrap**: "Same listing. Three stories. The host uploaded once." |

### 9.2 30-second technical narrative

> "Lemma is built around a Director Agent with tool use. The agent analyzes photos through Claude Sonnet vision, generates persona-specific creative briefs, writes multi-shot scripts, then orchestrates Seedance 2.0 with shot-by-shot QA. If a shot fails character consistency, the agent regenerates it. The agent is the product. Seedance is one of its tools."

### 9.3 30-second vision

> "Lemma is one application of a bigger technology: persona-aware video generation as infrastructure. Today we serve direct-booking hosts and property managers. Tomorrow the same engine powers personalized product videos on Shopify, personalized recruiting outreach, real estate listings. Every place where one piece of content has to convince many different people. The world is moving from one-size-fits-all media to per-viewer media. We're the infrastructure."

### 9.4 Mock metrics for the pitch

These are illustrative only. Use them in vision/positioning, never as claimed real data.

- Conversion lift: +28% (illustrative)
- Engagement (avg. watch time): +45% (illustrative)
- Booking intent (CTA click): +22% (illustrative)

---

## 10. Execution plan

### 10.1 Tonight (May 1 evening)

| Time | Hours | What ships |
|---|---|---|
| Now → 9 PM | 1h | Sign up: BytePlus ModelArk, Butterbase, Vercel. Get API keys. Test 1 Seedance call end-to-end. |
| 9–11 PM | 2h | Generate 3-9 persona videos for Bolinas cabin demo. Cache locally. |
| 11 PM–1 AM | 2h | Build Adaptive Listing preview screen (single page, persona switcher, video player). Demo's hero screen. |
| 1–2 AM | 1h | Build mock booking page wrapping the widget preview. Fake URL bar. Make it look like a real direct-booking site. |
| **2 AM hard stop** | — | **Sleep. 5 hours minimum. No exceptions.** |

### 10.2 Hackathon day (May 2)

| Time | Block | What |
|---|---|---|
| 9–10 AM | Setup | Test demo end-to-end on venue wifi. Confirm pre-rendered videos play. Re-test Seedance API. |
| 10 AM–12 PM | Polish | Add upload screen + generation screen if missing. Polish reasoning trace UI. Add Lemma branding. |
| 12–1 PM | Pitch rehearsal | Lunch + run through pitch 3 times. Time it. |
| 1–2:30 PM | Submission video | Record 2-min submission video. Use Seedance for the title card / opening. |
| 2:30–3 PM | Submit | Submit before 3PM hard deadline. |
| 3:10–4:20 PM | Demo Day | Live pitch in front of 20+ VCs. |

---

## 11. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Seedance API quota / rate limit blocks demo | High | Pre-render 3 persona videos tonight. Cache them. Demo runs offline if needed. |
| Cannot finish all 4 dashboard frames in time | High | Prioritize: Adaptive Preview > Generation > Mock Booking Page > Upload. Last frame can be skipped. |
| Judges ask "why won't host use Dreamina/Sora directly?" | Medium | Pitch frames Lemma as conversion engine for booking page, not video tool. Per-viewer adaptation is moat. |
| Judges ask about Airbnb integration | High | Have section 2 pitch line memorized: "Airbnb is discovery, Lemma is conversion. We power direct-booking pages, not Airbnb pages." |
| Network failure at venue | Medium | All demo videos pre-cached locally. Demo runs without internet. |
| Mock metrics challenged as fake | Low | Frame as "projected based on personalized video case studies in adjacent industries" — never claim real Lemma data. |

---

## 12. Post-hackathon roadmap

### Week 1 (May 3–9)

- Recap thread on X / LinkedIn / 小红书. Show what shipped. Drive waitlist signups.
- Onboard first 10 waitlist hosts. Generate their listings. Capture before/after.
- Add Stripe. Charge first paying customers.
- Cold email 5 property manager firms.

### Month 1

- Native Hostaway / Lodgify embed integration
- Conversion analytics dashboard
- Add Business persona (4 total)
- First $1K MRR

### Month 3

- First 5 property manager pilots
- Format selector for hosts (host can preset 16:9 / 9:16 / 1:1)
- First 100 paying listings, $10K MRR

### Year 1 vision

- Per-viewer media as infrastructure layer
- Vertical expansion: real estate listings (closest adjacent)
- Engine API: third-party developers build their own per-viewer applications
- Seed round, target $2-3M from hackathon judges' warm intros

---

*This document is the engineering spec for Lemma's hackathon MVP. It is not a final product spec. After May 9, it gets rewritten based on what real customers say.*
