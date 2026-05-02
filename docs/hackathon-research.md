# DEEP RESEARCH REPORT
## Builders of Tomorrow: AI Super Hackathon
### Judges, sponsors, and project direction analysis

---

| | |
|---|---|
| **Event** | Builders of Tomorrow: AI Super Hackathon |
| **Date** | May 2, 2026 |
| **Venue** | Computer History Museum, Mountain View, CA |
| **Hosts** | Beta Fund / Beta University + Seedance 2.0 (BytePlus / ByteDance) |
| **Stakes** | $50K Beta Fund investment + $20K+ cash prizes + 20 teams pitch live to 20+ VCs |
| **Tech constraint** | All video generation must use BytePlus Seed models (Seed 2.0, Seedance 2.0, Seedream 5.0, OmniHuman) |
| **Submission** | 2-min video: 60s live demo + 30s technical architecture + 30s future vision |

---

## 1. Event overview and core insights

### What this hackathon really is

This is not a generic AI hackathon. It is a strategically positioned event with three layers of meaning that any participant should understand before picking a project direction:

#### Layer 1: ByteDance's GTM bet against Sora and Veo

Seedance 2.0 was released by ByteDance on February 7, 2026 as their next-generation cinematic video model, positioned to compete directly with OpenAI's Sora 2 and Google's Veo 3.1. Early benchmarks have it ranked at or above both. The model's distinctive features are omni-reference control (up to 9 images, 3 videos, 3 audio files per generation), native audio-video synchronization via a Dual-Branch Diffusion Transformer, and multi-shot narrative scripting with consistent characters across scenes.

This hackathon is ByteDance's Silicon Valley GTM moment. Every video must be generated with BytePlus Seed models, which means the event is functionally a developer conference plus product demo plus distribution lever, all wrapped in the format of a hackathon. Participants are essentially being recruited to find the killer applications that justify the model.

#### Layer 2: Beta Fund's evolved 2026 thesis

Beta University and Beta Fund have hosted multiple AI hackathons over the past quarter, and their published thesis has shifted noticeably. In their February 9 newsletter following an event co-hosted with Stanford University and Google DeepMind, the consensus was framed as moving past AI as a productivity tool toward AI as foundational infrastructure.

The specific phrases Beta Fund uses to describe winning categories are: **autonomous commerce, agent-native protocols, and deep behavioral evaluation.** They explicitly name velocity of execution and ability to out-ship the competition as the new moat, replacing the old research moat. In the context of judging, this means projects that look like incremental SaaS will lose to projects that look like they are rewriting the underlying logic of an existing system.

#### Layer 3: Two sponsors, two technical commitments

Beyond Beta Fund's overall investment prize, there are two technical sponsor relationships that drive specific prize categories:

- **BytePlus / Seedance 2.0** — Required for all video generation. Strongest features for participants to demonstrate: character consistency across shots, native audio (lip-sync, ambient, music), multi-shot scripting, and the omni-reference @ mention system that lets you tag specific reference assets in prompts.
- **Butterbase** — Backend-as-a-Service for vibe coders. Connects via MCP to Claude Code, Cursor, Codex; provisions Postgres database, JWT auth, S3 storage, REST/GraphQL APIs from natural-language prompts. Special prize: Best Use of Butterbase ($200 credits). Every attendee gets $20 in credits.

### Prize structure (full breakdown)

| Prize | Amount | Decided by |
|---|---|---|
| Beta Fund 2 investment check | Up to $50,000 | Beta Fund partners |
| Judges' Choice 1st place | $5,000 | Judge panel |
| Judges' Choice 2nd place | $3,000 | Judge panel |
| Judges' Choice 3rd place | $2,000 | Judge panel |
| Best Product Continuity (1 week post-event) | $3,000 | Beta Fund |
| Best Social Media Impact (top 3, 1 week post-event) | $1,000 / $600 / $400 | Likes + engagement |
| Audience Favorite 1st | $2,000 | Live audience vote |
| Audience Favorite 2nd | $1,000 | Live audience vote |
| Best Technical Implementation | $1,000 | Technical judges |
| Best GTM Potential | $500 | CFO / business judges |
| Most Innovative | $500 | Judge panel |
| Best Use of Butterbase | $200 in Butterbase credits | Butterbase team |

---

## 2. Judges and speakers — deep profiles

Each judge is profiled with their professional background, public investment thesis or design priorities, and the specific signals they will be looking for during demos. The image submitted lists 22 featured speakers and judges, and the Luma agenda confirms 11 of them as the official Demo Day judging panel.

### Venture capital judges

*These judges control the $50K Beta Fund investment decision and the Judges' Choice rankings.*

#### Warren Shaeffer — Partner, Pear VC

- **Background**: Partner on Pear VC's investing team, leading consumer investments and the PearX small-batch accelerator. Repeat consumer founder — co-founded Vidme (scaled to 30M MAU, NEA-backed, acquired by Giphy) and Knowable (audio-first learning platform, acquired by Medium where he became VP). Harvard grad, ex-a16z scout, ex-First Round Capital (Angel Track), ex-JPMorgan IB.
- **Stated thesis**: "Privilege expansion" — democratizing what was previously reserved for a privileged few. Recently invested in Moda (AI design tool) with the framing that "in a world of AI slop, taste is the new bottleneck." Also active in consumer health, evidenced by his attendance at the Stanford Health Conference focused on extending healthspan and access to advanced diagnostics.
- **Most-repeated advice**: "Reduce time-to-magic." The product can be complicated under the hood but should feel simple, delightful, and magical to the user as fast as possible. Explicitly cites TikTok's onboarding as the gold standard.
- **What he wants to see**: Consumer or prosumer products with a 5-second wow moment, products that take an elite or expensive experience and make it broadly accessible, and founders with bias for action plus deep intrinsic drive.
- **Investment range**: Pre-seed, will fund a few wildly ambitious teams in any 30-day window. Recent thread: "Exceptional pre-seed consumer and prosumer founders wanted."

#### Jack Feng — General Partner, Llama Ventures

- **Background**: Serial entrepreneur. Co-founded WandouLabs, SoftBank-backed at $100M+, acquired by Alibaba. CEO of iHealth Labs in Silicon Valley, where he led development of the orange-box COVID-19 home test adopted by 80%+ of US households. His second venture surpassed $1B in cumulative revenue. Recognized by Silicon Valley Business Journal as a 2025 Power 100 Leader.
- **Firm thesis**: Llama Ventures is a 2024-founded SV firm investing in AI-native companies where founders combine cutting-edge AI with deep domain expertise. Sectors: industrial automation, healthcare, fintech, climate, enterprise software, developer tools, consumer AI, EdTech, media, AI infrastructure, deep tech hardware. Pre-seed to seed.
- **Notable portfolio**: xAI, Anthropic, Fasikl, Ditto AI, Mage AI, Photon. The Anthropic and xAI exposure signals access to top-tier deal flow.
- **Operating style**: Self-described "technical founders ourselves, so we get the tech." Show up when needed, stay out of the way otherwise. Strong preference for founders who "form their own convictions and act with discipline."
- **What he wants to see**: Not AI wrappers, but AI plus genuine domain insight. The hackathon project should solve a problem the founder uniquely understands.

#### Thomas Joshi — Investor, NEA (New Enterprise Associates)

- **Background**: Joined NEA in 2025 as Associate on the Technology Investing Team. Bachelor's in Artificial Intelligence from Columbia. Co-author of Stanford DSPy, the most popular open-source software to come out of Stanford AI, used by Meta and Microsoft. Previously held AI Researcher, AI Engineering, and finance positions.
- **Personal stated thesis**: Daily focus on three things, particularly as related to Sovereign AI: Compute, Data, Energy. Sees optimizations in gigawatt training campuses, creative power procurement and cooling, high-reliability networking and data orchestration inside datacenters.
- **On the AI utility problem**: "We have a working recipe for capability, but the second half is about defining the right problems and owning evaluation so products create real economic value. We need to treat evaluation, task design, and human-in-the-loop feedback as its own new layer." Specifically calls out living benchmarks, longitudinal memory and agency, outcome-grounded metrics that run inside production workflows, not just in a lab.
- **Firm context**: NEA manages $28B+ AUM as of mid-2025. AI portfolio includes Together AI, Sakana AI, Mythic. Stage-agnostic from seed to IPO with $50M-$300M+ check sizes at growth, but Thomas at the Associate level evaluates earlier deals.
- **What he wants to see**: Not a demo. He wants evidence the team has thought about evaluation, real production deployment, and outcome metrics. The technical depth signal matters more to him than to most judges.

#### Peter Pan — Founding & Managing Partner, Hat-Trick Capital

- **Background**: Founded Hat-Trick Capital in late 2021. 10+ years strategy and finance experience at Amazon Corporate Development, AWS, and AWS Startup initiatives.
- **Firm thesis**: Silicon Valley-based, family-office-backed venture fund with $100M+ AUM. Invests in immigrant founders and visionary leaders "ruthless in execution." Three sectors only: agentic AI/SaaS, robotics, and consumer tech. Pre-seed to Series A, $500K to $3M check size.
- **Stated focus**: "Agentic systems capable of autonomous decision-making and execution are poised to transform traditional SaaS." Both B2B (enterprise AI copilots) and B2C (consumer assistants). Robotics infrastructure for next-gen automation. Consumer products that create lasting habit changes.
- **Recent panel framing**: "What does AI look like when it leaves the screen? Cars that see, wearables that listen, robots that move." Strong interest in multimodal intelligence becoming embodied — edge inference, real-time, limited compute.
- **What he wants to see**: Genuine agentic loop (not just an API call), or a clear path from software to physical-world action. Bonus signal: immigrant founder narrative.

#### Michael Pao — Stealth founder, ex-Greylock EIR

- **Background**: HBS MBA. 4+ years at Uber, where he was Head of Product on the Growth team and previously general manager of Boston (one of Uber's most thriving hubs). Led growth in India and China. Spearheaded surge pricing and #UberIceCream. Joined Greylock Partners as EIR in 2016 to start a new marketplace company. More recently was Head of Product and Neighbor Experience at Nextdoor.
- **Demonstrated expertise**: Marketplace mechanics. He is the rare judge who built the supply-side and demand-side of a billion-dollar marketplace. His written thesis: most marketplaces are supply-constrained in the early phases — many marketplace companies over-emphasize demand acquisition early, which is the wrong order.
- **What he wants to see**: Two-sided dynamics. If your project has any marketplace component (creator + buyer, agent + tool provider, supply + demand), he is the judge most able to spot whether you understand which side to build first. Will reward projects that show clear thinking on cold-start.

#### Chris Pitchford — Co-Founder & CEO, Brev.io

- **Background**: Repeat enterprise founder. Co-founded Shyft (worker shift mobile app, scaled, exited). Was VP of Sales at Ally.io (OKR software, acquired by Microsoft, where he became VP Sales). EIR at Techstars. CRO at VComply. Brev.io is his current company — "Business Performance OS" using LLMs to automate Weekly/Monthly Business Reviews, integrating Jira, Salesforce, Gong.
- **Note on the image**: The judge image lists him as "Co-Founder of Brev.io (A16Z)," suggesting Brev.io has a16z investment connection. This is consistent with the trend of a16z backing LLM-native enterprise tools.
- **Strength as a judge**: Enterprise GTM and sales motion. He has actually sold software to large enterprises, both as a sales leader and as a founder. He will scrutinize: Who is the buyer? What is the wedge? How do you reach the decision-maker? What is the pricing model?
- **What he wants to see**: Clear ICP, evidence the founder understands enterprise sales motion (or knows it doesn't apply), unit economics that work at scale.

#### Perseus Y — Scout, A16Z

- **Role context**: a16z scouts are typically active angel investors with strong networks in technology ecosystems, invited to deploy a16z capital. Each scout writes checks of $10K-$25K per deal and can do up to ~8 deals per year. The program is by-invitation-only.
- **Mechanics**: If a16z is particularly bullish on a deal a scout sources, the firm tops it up with larger follow-on capital from main funds. Scouts get quarterly portfolio reviews with a16z partners.
- **What he wants to see**: Founder-quality signals — the scout program is built around the assumption that scouts can identify exceptional founding teams in their networks. Less about thesis fit, more about the team being the type a16z would want to back.

#### Artin Bogdanov — Co-Founder & CEO, SUN (a16z SR006)

- **Background**: Harvard Extension School BA in CS with minor in Psychology. Previous roles at Forbes, Walmart, Onollo, Adobe Commerce. Now CEO of SUN, an audio AI / personalized audio app for student founders, currently in a16z speedrun cohort SR006 (Winter/Spring 2026).
- **Public takeaways from being inside a16z speedrun (his words)**: "Speed is a moat. You ship, learn, and adjust in days. Clarity beats complexity — if people don't understand what you're building in seconds, you've already lost them. Distribution is not optional. The bar is high."
- Recently launched SUN on Product Hunt and reached top 2.
- **What he wants to see**: Founders moving at a16z speedrun pace. Clarity of pitch in seconds. Visible distribution thinking, not vague "we will go viral." His view as an active founder is more peer-judgment than VC-judgment.

#### Joana Ferreira — Co-Founder & CTO, Cascade (a16z speedrun)

- **Background**: Built ML systems for Google Search and for the UK's largest trading scaleup. Co-founded Cascade with Hannia, who scaled Google Pay India from 0 to 100M users.
- **Cascade's traction**: AI prediction layer for construction projects. Went from 0 to $201K cARR in 3 months. 15 enterprise companies signed, 11 in the last month, with first 3 customers more than doubling their spend. Customers built JFK and LGA airports, Four Seasons and Ritz hotels, data centers and nuclear reactors.
- **What she wants to see**: Vertical AI applied to a real industry, with evidence of paying enterprise customers (or a clear path to them). She is the proof that vertical AI plus rapid revenue is a winning narrative in this room.

#### Wei Guo — General Partner, Uphonest Capital

- **Note**: Listed on the Luma agenda as a Demo Day judge but not present in the speakers image. Uphonest Capital is a US-China cross-border early-stage fund focused on AI, fintech, and consumer technology, with a portfolio that has historically included Boston Dynamics and other deep tech.
- **What he likely wants to see**: Cross-border applicability and technical depth. Strong fit for technical founders with global market vision.

### Technical judges

*These judges are the primary filter for the Best Technical Implementation prize and will heavily influence Judges' Choice on technical merit.*

#### JiaZhou Gao — Technical Staff, Anthropic

- **Role**: Anthropic Technical Staff. Anthropic engineers focus heavily on agentic systems, context engineering, evaluation rigor, and Claude's product surface (including Claude Code, MCP, computer use).
- **What he likely wants to see**: Thoughtful use of LLMs as orchestrators rather than text generators. Strong agent loop design with tool use, error handling, and human-in-the-loop checkpoints. Evidence of evaluation thinking. Bonus: clean, well-designed prompts and demonstrable understanding of when to use Claude vs. other models.

#### JiaCheng Feng — Technical Staff, OpenAI

- **Note**: Listed on the Luma agenda but not in the speakers image. As OpenAI Technical Staff, his lens is similar to Anthropic's but with deeper exposure to the GPT and Sora model families. Will assess whether the project leverages AI in a way that pushes against state-of-the-art capabilities or falls back on lazy prompting.

#### Eric Liang — AI Researcher

- **What he likely wants to see**: Researcher's eye for novelty, reproducibility, and rigor. Will be most engaged by projects that demonstrate insights into model behavior, novel agentic patterns, or interesting evaluation methodologies.

#### Xinyun Chang — Engineer, Gemini (Google DeepMind)

- **What she likely wants to see**: Multimodal engineering quality, given her direct work on Gemini's multimodal capabilities. Strong fit for projects that combine vision, video, audio, and language thoughtfully.

#### Other technical / engineering speakers

- **Dean Fanggohans (Engineer, Cursor)**: Cursor is the dominant AI-powered IDE. His view will be heavily shaped by developer experience and code quality.
- **Bhavna H. (Engineering Lead, Salesforce)**: Enterprise SaaS engineering lens — scalability, security, integration complexity.
- **Jyoti Yadav (Senior Data Science Manager, Atlassian)**: Data science and ML productionization at scale.
- **Virat Gohil (Architect Lead, Apple)**: System architecture and platform thinking.

### Business and capital readiness judges

*These judges directly influence the Best GTM Potential prize and bring a financial discipline lens to overall judging.*

#### Marry Zeng (Mary Zeng) — Head of FP&A, IR & Corporate Development, NewsBreak

- **Note on title**: The image lists her as "CFO at NewsBreak (2B Val)"; her LinkedIn shows current title as Head of FP&A, IR, Corporate Development. NewsBreak is a $2B-valued digital media platform with 45M MAU.
- **Background**: Wharton MBA. UC Berkeley undergrad. Previously Senior Director of FP&A at Palo Alto Networks (Network Security business), M&A Director at Juniper Networks, TMT Sector Director at Hywin Financial Holding Group, M&A practice builder at Credit Suisse Beijing. Has executed acquisitions exceeding $1.5 billion.
- **Current focus at NewsBreak**: FP&A, IR, capital strategy, M&A. NewsBreak is actively expanding into short-form drama content and AI publisher tools (Aigeon Newsletters), making AI-video startups potentially adjacent to their corporate development pipeline.
- **What she wants to see**: Unit economics, capital efficiency, clear path to revenue. She comes from a world where M&A multiples are real numbers, not hand-waving. The Best GTM Potential prize is hers to lose.

#### Valen Tong — CFO, MasterClass ($3B Val)

- **Context**: MasterClass is a premium content subscription business at scale. CFO of a $3B-valued content business will scrutinize creator economics, content production cost, LTV / CAC, churn, and content moat dynamics.
- **What she wants to see**: Anyone building creator-economy or content-driven AI applications gets her natural attention. Strong signal for AI video tools that meaningfully reduce content production cost while maintaining quality.

#### Arun Balaraman — Board Advisor at Start X, Advisor at Stanford University GSB

- **Background**: Stanford MBA (1995-1997). Workshop facilitator for Stanford ENGR248: Principled Entrepreneurial Decisions. Start X is Stanford's nonprofit accelerator for Stanford-affiliated entrepreneurs.
- **What he likely wants to see**: Sound business fundamentals, principled decision-making, defensible scaling thesis. Less about hype, more about durable business model.

### Other speakers and judges (per the speakers image)

- **Nicholas Deng (Harvard PhD)**: Academic / research credibility lens.
- **Willow Jarvis (Founder, Butterbase, SPC)**: Sponsor founder. Decides Best Use of Butterbase prize. MIT BS and MEng in CS. Previously founded Nira (real-time access control for cloud apps) and various AI agents. Currently building Butterbase as the AI-optimized BaaS for vibe coders. Will favor projects that deeply integrate Butterbase via MCP, not just bolt it on.
- **Alessa Cross (AI Contributor)**: Likely a content / community presence; less direct judging weight.

---

## 3. Sponsor deep-dive: what they actually want

### BytePlus / Seedance 2.0 / ByteDance Seed team

Seedance 2.0 was officially released February 7, 2026 by ByteDance, designed for professional film, e-commerce, and advertising production. It received public attention from Elon Musk and went viral in China, with comparisons to DeepSeek's impact. CTOL benchmarked it as "the most advanced AI video generation model available," surpassing OpenAI's Sora 2 and Google's Veo 3.1 in practical testing.

#### Killer features to demonstrate

- **Omni-reference @ mention system**: Up to 12 reference files per generation (9 images + 3 videos at 15s max each + 3 audio at 15s max each). Tag references in prompts using `@character1`, `@audio1`, `@video1`, `@style_image`. Example: `@character1 dancing to @audio1's beat, following @video1's choreography, in @style_image's visual aesthetic.`
- **Native audio synthesis**: Dual-Branch Diffusion Transformer architecture generates synchronized audio and video simultaneously — dialogue with lip-sync, ambient sound, music, sound effects all render together in one pass. This eliminates the post-production audio patching that plagued earlier models.
- **Character consistency across multi-shot**: Faces, clothing, even small text remain consistent throughout multi-scene videos. Solves the longstanding character drift problem.
- **Multi-shot scripting**: Describe a video as a sequence of named shots — timing, camera angle, movement, atmosphere — directly in the prompt. The model generates a video that follows the script.
- **Flexible format and duration**: Seven aspect ratios (16:9, 9:16, 1:1, 4:3, 3:4, 21:9, adaptive), durations 4-15 seconds per shot. First-frame and last-frame anchoring for chained sequences.
- **Speed and cost**: Sub-2-minute generation per 720p clip. Under $1 per typical 8-10 second video on the Segmind API. 60 seconds for a multi-scene 2K sequence (30% faster than Seedance 1.0).

#### Where the BytePlus Seed family fits beyond Seedance

- **Seedream 5.0**: ByteDance's image generation companion line.
- **OmniHuman**: Talking avatar / digital human generation, suitable for any project that needs a synthetic presenter.
- **Seed1.6**: LLM with adaptive thinking, multimodal capabilities.
- **UI-TARS-2**: Native GUI agent model for virtual environment task execution.
- **ByteDance Volcano Engine API endpoints**: `docs.byteplus.com/en/docs/ModelArk` for the full API reference.

#### What BytePlus likely wants out of this hackathon

Marketing collateral, killer-app discovery, and developer ecosystem activation in Silicon Valley. Projects that show off Seedance's distinctive features (multi-shot, character consistency, native audio) will be celebrated more than projects that treat it as a black-box video API.

### Butterbase

Butterbase is the AI-optimized backend-as-a-service for vibe coders. It connects via MCP server to AI coding tools (Claude Code, Cursor, Codex), reads frontend code, and automatically provisions: PostgreSQL database, JWT-based authentication, S3-compatible storage, REST/GraphQL APIs, real-time sync, globally deployed edge functions.

The vibe coder framing is deliberate: Butterbase is built for frontend-first developers and indie founders who want to ship full-stack apps in minutes without DevOps. The competitive frame is Supabase (also Postgres-based) and Firebase, but with deeper AI-tool integration.

#### How to maximize the Butterbase prize

- Sign up at `dashboard.butterbase.ai` before the hackathon. Generate API key. Follow the one-step agent setup.
- Tell your AI agent: "With Butterbase, let's build..." — let it provision schema, auth, storage automatically.
- Use Builders Club Discord `#butterbase-support` for live technical help.
- Every attendee gets $20 in credits redeemable during the hackathon to kickstart builds.

#### What Willow Jarvis (Butterbase founder) wants to see

- Genuine MCP integration, not just storing one row in a Postgres table.
- Deployment story — Butterbase covers database, auth, storage, functions, APIs. The richer the use, the stronger the case.
- Visible AI-tool flow: "I prompted Cursor with Butterbase context, it provisioned X, Y, Z, and we shipped in N hours."

### Beta Fund and Beta University

Beta University is described as "the largest pre-accelerator in Silicon Valley." 8-week free program, no equity taken (only $599 refundable deposit). Notable alumni: Adsgency AI (HF0), Tutti AI (Berkeley SkyDeck), Openmart (YC), VideoTutor ($11M Seed), Insforge ($1.5M Pre-seed), SCAM AI (Berkeley SkyDeck).

#### Beta Fund's evolved 2026 thesis (from their newsletter analysis)

- **From productivity tool to foundational infrastructure**: Winners of 2026 will be those who rewrite the underlying logic of the old world.
- **Three project archetypes they explicitly highlight**: Autonomous commerce, agent-native protocols, deep behavioral evaluation.
- **Velocity as moat**: Traditional research moat replaced by sheer execution velocity and ability to out-ship competition.
- **Memory as the soul of agentic stack**: They recently invested $25K in an AI Data Technician team focused on "institutionalizing domain knowledge" via memory infrastructure. They view memory infrastructure as a defensible moat.
- **Burn multiple over potential**: Recent panel called out that investors have pivoted from "potential" to the Burn Multiple (Burn vs revenue growth) — operational rigor matters more than story.

---

## 4. Judge focus matrix

Mapping the judging panel into thematic clusters reveals which project archetypes will get the most votes from the most judges. The hackathon has 11 official Demo Day judges plus a wider speakers panel that influences audience and informal judging.

| Cluster | Judges who lean here | What wins this cluster |
|---|---|---|
| **Video and creator AI** | BytePlus / Seedance team, NewsBreak (Mary Zeng), MasterClass (Valen Tong), Warren Shaeffer (consumer taste) | Visible Seedance 2.0 features (omni-reference, native audio, multi-shot consistency); creator-economy GTM; scroll-stopping output quality |
| **Agentic and infra** | Peter Pan (Hat-Trick), Thomas Joshi (NEA), JiaZhou Gao (Anthropic), Eric Liang (researcher), JiaCheng Feng (OpenAI) | Genuine agent loop with tool use; eval rigor; production-deployable architecture; not just an API wrapper |
| **Marketplace and consumer** | Warren Shaeffer (Pear), Michael Pao (ex-Greylock), Perseus Y (a16z scout), Artin Bogdanov (a16z SR006) | Time-to-magic; clear distribution thesis; supply-side cold-start logic; 'privilege expansion' framing |
| **Vertical AI applications** | Jack Feng (Llama Ventures), Joana Ferreira (Cascade), Bhavna H. (Salesforce eng), Jyoti Yadav (Atlassian), Wei Guo (Uphonest) | Real-industry pain owned by founder's domain expertise; visible early customer signal; defensible vertical moat |
| **Capital readiness and exit math** | Mary Zeng (NewsBreak FP&A/M&A), Valen Tong (MasterClass CFO), Arun Balaraman (Stanford GSB), Chris Pitchford (Brev.io) | Unit economics that scale; clear ICP and wedge; defensible burn multiple; M&A or growth narrative believable to a CFO |

### Cluster intersection logic

A project that hits one cluster wins one or two judges. A project that genuinely hits two clusters wins broad approval. A project that hits three or more across the right combinations is the type of submission that wins both Judges' Choice and the $50K investment check.

The strongest two-cluster combinations for this specific hackathon, given the BytePlus constraint:

- **Video and creator AI + Marketplace and consumer** → a creator-facing AI video tool with real distribution thesis.
- **Video and creator AI + Agentic and infra** → an agentic system that uses Seedance as one of its tools to autonomously produce video output.
- **Video and creator AI + Vertical AI** → Seedance applied to a specific industry (healthcare patient education, real estate listing video, e-commerce product demo).

---

## 5. Strategic implications for project selection

### Hard constraints

- Video generation must use BytePlus Seed family (Seed 2.0, Seedance 2.0, Seedream 5.0, OmniHuman). Non-negotiable.
- 2-minute submission format: 60s live demo + 30s technical architecture + 30s future vision. Tight.
- Build window: 9AM to 3PM on May 2 (6 hours active build time). Pre-event scaffolding strongly advised.
- 20 teams selected to pitch live. Pre-selection happens via the registration / Betahacks.org submission flow before the day.

### Optimization variables

- **Number of clusters hit (1-5)**: More is better. Two is the realistic floor for a strong showing.
- **Demo legibility in 60 seconds**: Warren's time-to-magic and Artin's clarity-beats-complexity converge here. Cut everything that doesn't serve the wow moment.
- **Visible Seedance feature usage**: Multi-shot, omni-reference, native audio. The more visibly distinctive Seedance features show up in the demo, the higher the technical and sponsor scores.
- **Butterbase integration depth**: Even a moderate integration unlocks the $200 Butterbase prize without much marginal effort.
- **Distribution / GTM signal**: Even pre-launch, having a Discord with N waitlist members or a partnership letter beats abstract market sizing.

### Three meta-tactics

1. **Submit a Seedance-generated 2-min video.** If your pitch video itself is generated with Seedance 2.0, you've already proven you can use the tool — separate from the demo. This is the strongest signal for Best Technical Implementation.
2. **Lead the 30-second vision section with a distribution story.** "I have N indie founders in Discord waiting for beta" is worth more than "we will serve millions of creators." Specific over speculative.
3. **Bind Butterbase.** The opportunity cost of using Butterbase is essentially zero (it accelerates the build) and the prize is locked. No reason not to.

---

## 6. Source notes

This research was synthesized from public sources collected on April 30, 2026. Primary sources include:

- Luma event page (`luma.com/gcha8090`) for the official agenda and judge list
- Beta University Substack newsletter for the Beta Fund 2026 thesis evolution
- Pear VC team page and Warren Shaeffer's LinkedIn / X for his investment thesis
- NEA team page for Thomas Joshi's stated focus areas
- Llama Ventures website and Tracxn / PitchBook for Jack Feng's portfolio and thesis
- Hat-Trick Capital website and Peter Pan's panel appearances for Hat-Trick's sector focus
- Greylock Perspectives blog and Crunchbase for Michael Pao's marketplace expertise
- Brev.io / The Org / GeekWire for Chris Pitchford's enterprise GTM background
- a16z speedrun website and SR006 cohort posts for Artin Bogdanov and Joana Ferreira context
- BytePlus / Seedance 2.0 product pages (`byteplus.com`, `seedance2.ai`, `higgsfield.ai/seedance/2.0`) for technical capabilities
- Butterbase docs (`docs.butterbase.ai`) and Crunchbase for sponsor positioning
- Mary Zeng and Valen Tong LinkedIn for CFO-track backgrounds
- Reuters, eWeek, CTOL benchmarks for Seedance 2.0 competitive positioning vs Sora 2 and Veo 3.1

> **Caveat**: Judge information is based on publicly available signals as of late April 2026. Individual judges' priorities on the day may shift based on what they've recently seen, market conditions, or emerging trends. This document should be read as directional, not deterministic.
