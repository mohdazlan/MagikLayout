# OscarScript — Winning MIPAC TVET 2026 (AI DigiTeach)

> **What this document is.** A strategic reading of **MagikLayout** against the
> official *Garis Panduan Kategori AI DigiTeach — MIPAC TVET 2026* (CIAST Shah
> Alam), written to become the **basis of a pitch / video script**. It maps every
> project strength onto the exact rubric weightings, tells you where the marks
> actually live, flags the claims you may and may not make, and ends with a
> beat-by-beat script skeleton.
>
> **Sources read:** the competition PDF (5 pp.), plus `MIPAC_TVET_2026.md`,
> `COMPETITION.md`, `PRODUCT.md`, `HANDBOOK.md`, `RAG.md`, `MagicAI.md`, `AR_P0.md`, `DESIGN.md`.
> Numbers and claims below are constrained by the **claim register in
> [RAG.md](RAG.md)** — nothing here overstates what the repository can prove.

---

## 0. A professor's verdict (read this first)

I have reviewed hundreds of student capstone and competition projects. Let me be
direct about where MagikLayout sits.

**The thesis is unusually strong.** Most "AI in education" entries bolt a chatbot
onto a slideshow and hope the novelty carries them. This project does the
opposite, and does the *harder, more defensible* thing: it builds a **faithful,
deterministic simulation of the real JDK layout algorithms** and then makes AI
play a deliberately *subordinate* role — "the engine judges, the AI explains."
That single architectural decision is the difference between a gimmick and an
instrument. It is also, not coincidentally, the exact posture the rubric rewards:
the AI-integration criterion asks for AI that is *relevant, ethical, and adds
clear value* — not AI that is merely present.

**Why it fits this competition specifically.** The AI DigiTeach category is not a
general hackathon; it is a **TVET teaching-and-learning (PdP) video competition**
with a NOSS-anchored instructional-design core. MagikLayout is not a repurposed
consumer app — it was built around a real diploma course (DFP50463, Java GUI &
Event Handling) and an explicit NOSS competency (IT-010-3:2016-C01). It already
speaks the assessor's language. Very few entrants will.

**Where it can lose marks.** Not on engineering — on **framing**. The rubric is
70% *documents and instructional design* and only rewards the technology insofar
as it serves a **single, clearly-scoped PdP objective**. If the team pitches this
as "a clever piece of software," it under-scores. If it pitches this as "a
teaching intervention for one specific misconception, with the engineering as
evidence," it wins its bracket. The video is capped at **3–5 minutes**; the
temptation to show four surfaces will fragment the story. Discipline is the play.

**Predicted scoring posture (my estimate, not a guarantee):** top-quartile on
Content & Instructional Design, AI Integration, Originality/Innovation, and
Potential — *if* the single-objective framing holds. The real risk areas are
Impact (no classroom pilot yet) and the live Q&A, both of which are **defensible
with honest language**, covered in §4 and §6.

---

## 1. The rubric, decoded (what is actually being marked)

The category is scored in three layers. **Everything routes back to these
weights** — write the script to the weights, not to the feature list.

### 1a. Document assessment — 70% of the final mark

| # | Criterion (BM) | English gloss | Weight | Where MagikLayout wins |
|---|---|---|---|---|
| 1 | Laporan Projek | Project report: clarity, structure, innovation; must **state AI prompt/usage logs** | **15%** | `COMPETITION.md`, `HANDBOOK.md`, `RAG.md` are already report-grade; the coach's per-request **logging** (`src/coach/log.ts`) is a literal AI-usage log |
| 2 | Pematuhan | Compliance: **ethics & ethical AI** | **5%** | "Engine judges, AI explains" is an ethics *architecture*, not a paragraph; no AI in the grading path |
| 3 | Kandungan & Reka Bentuk PdP | Accurate content, focused on **ONE** NOSS skill; systematic design (set induction → content → activity → closure) | **20%** | BorderLayout SOUTH-collision lesson, NOSS-mapped, Bloom-tagged Recall→Apply→Analyze |
| 4 | Keaslian, Kreativiti, Inovasi | Originality + **storyboard** (pre/prod/post); original work | **10%** | First-party engine (no CSS fake), original AR target card, faithful `intDiv` fidelity |
| 5 | Keberkesanan Integrasi AI | AI **supports the objective, improves understanding, adds ethical/relevant value** | **20%** | The Coach turns deterministic findings into Socratic hints; RAG coach cites governed sources |
| 6 | Video Projek (Hasil) | 3–5 min, clear professional visual/audio/edit | **10%** | Apple-calm design language films cleanly; live reflowing canvas is inherently cinematic |
| 7 | Impak & Kebolehgunaan | Effective in real PdP; engages learners; supports TVET skill training; expandable | **10%** | Runs in-browser, offline core, zero install, WCAG AA; **pilot is planned, not done** |
| 8 | Potensi Penggunaan Meluas | Potential across topics/courses/contexts | **10%** | Challenges are pure data; new managers benefit every surface at once |

**Two hard gates hide in this table:**
- **Criterion 1 explicitly requires the AI prompt / usage log to appear in the
  report.** Many teams will forget this and leave marks on the table. You already
  have it (`src/coach/log.ts` records code, chunk ids, model, corpus version,
  latency, outcome). *Put a screenshot of one log record in the report.*
- **Criterion 3 rewards focus on ONE skill.** MagikLayout's temptation is breadth.
  The winning move is to declare the single objective up front:
  *"By the end, the learner can predict and repair a `BorderLayout` region
  collision."* Everything else is supporting evidence for that one objective.

### 1b. Pitching assessment — its own 100%, then weighted 30%

| # | Criterion | Weight | Script implication |
|---|---|---|---|
| 1 | Penyampaian (delivery: clear, organized, confident, on time) | 20% | Rehearse to the clock; the 3–5 min cap is a scored constraint |
| 2 | Penguasaan Projek (command of objective, method, function, result) | **25%** | The single **largest** pitching line-item — own the *why*, not just the *what* |
| 3 | Demonstrasi & Pembuktian (proof it works) | 20% | Live demo or recorded proof of the reflow + a graded challenge + AR target-found |
| 4 | Nilai Inovasi & Impak (uniqueness, benefit, potential, TVET impact) | 20% | Lead with "faithful engine + subordinate AI" — the one-sentence moat |
| 5 | Sesi Soal Jawab (accurate, clear, professional, convincing) | 15% | Pre-load the honest answers in §6 — especially the "is this really RAG?" trap |

**Penguasaan (25%) is the heaviest single item in the entire competition.**
Judges reward the team that understands *why every decision was made*. This is
where the "CSS would teach a lie" argument earns its keep — it demonstrates
pedagogical intent, not just coding ability.

### 1c. Overall = **70% documents + 30% pitching**

Read plainly: **the report and instructional design win or lose this before you
ever pitch.** The pitch defends a lead the documents must first build. Budget
your effort accordingly.

---

## 2. The five strengths that win marks (ranked by leverage)

These are ordered by *marks-per-unit-effort*, not by how impressive they sound.

### Strength 1 — "The engine judges, the AI explains" (hits 20% + 20% + 5%)
The deterministic engine grades; the AI only phrases a Socratic hint from the
engine's structured findings. It **cannot** grade, reveal the answer, or write
Java. This single design decision simultaneously scores:
- **AI Integration (20%)** — AI adds value *relevantly* without owning correctness.
- **Content & Design (20%)** — feedback always matches real Swing, so the lesson
  is never contradicted by the tool.
- **Compliance / Ethical AI (5%)** — the safeguard against "an AI confidently
  teaching *wrong* Swing" is *structural*, not a promise.

> **Script line:** *"We inverted the usual risk. In most AI tutors, the AI decides
> if you're right — and sometimes it's confidently wrong. Here, a deterministic
> engine that mirrors the real JDK decides correctness. The AI is only ever the
> voice explaining a verdict it did not make."*

### Strength 2 — Faithful JDK layout engine, not a CSS approximation (hits 10% + 25%-pitch)
The canvas runs first-party JavaScript **ports of the real BorderLayout /
FlowLayout / GridLayout algorithms** — including `intDiv` truncation and manager
*generations* (a component added before `setLayout` becomes invisible, exactly as
in the JDK). A CSS-flexbox fake would teach a mental model that breaks the moment
the student compiles real code.
- Scores **Originality/Innovation (10%)** — this is genuine, non-trivial original
  engineering, not a template.
- Scores **Penguasaan (25% pitch)** — it is the clearest possible proof the team
  understands the domain deeply.

> **Script line:** *"An approximation would have shipped faster and taught a lie.
> We compute layout the way the JDK computes it — pixel for pixel — because a tool
> that contradicts the compiler isn't a teacher, it's a trap."*

### Strength 3 — One engine, four surfaces, one source of truth (hits 10% + 10%)
The *same* engine renders the Playground, grades every Challenge, **and** generates
the AR Lab's Java evidence. No screenshots, no second source of truth, no pixel
matching.

The Classroom surface is now the **AI Debugging Studio**, not a set of teacher
tabs. Its 12 missions turn engine truth into a visible learning loop: see,
predict, inspect, repair, verify, then explain. This is the strongest live proof
of AI integration: Haiku appears only after retrieval and never owns the grade.
Use one complete mission in the video, then scan the catalogue briefly. See
[MagicAI.md](MagicAI.md) for the exact claim boundary and demonstration order.
- Scores **Potensi Penggunaan Meluas (10%)** — new content is pure data; a new
  layout manager upgrades *every* surface at once. Growth is additive.
- Scores **Impak/Kebolehgunaan (10%)** — a challenge can never be "correct on
  screen but marked wrong," so the tool is trustworthy in a real lab.

### Strength 4 — NOSS-anchored, single-objective instructional design (hits 20%)
The lesson is scoped to one competency (**IT-010-3:2016-C01**) and one
misconception (the BorderLayout SOUTH collision), with a systematic arc and
Bloom-tagged difficulty (Recall → Apply → Analyze). This is exactly what
Criterion 3 asks for and what most entrants will *not* supply.

> **Script line:** *"One competency. One misconception. One repair the learner can
> perform by the end. Everything you see serves that single objective."*

### Strength 5 — The AR Lab as the *immersive* differentiator, kept in its lane (hits 10% + 20%-pitch)
Image-tracking AR that runs on **iPhone/Safari** (MindAR + three.js, where WebXR
is unavailable), with three assessed missions and **five media elements** (text,
tracked 3D, animation, bilingual device speech, scored interaction) — exceeding
the required three. It is the "immersive" proof the category name implies.
**Frame it as an optional transfer activity, not the headline** — because it is
not yet classroom-validated (see §4).

---

## 3. Relevance to the competition — the professor's argument

**Is this project *relevant* to AI DigiTeach? Emphatically yes — and for a reason
subtler than "it uses AI."**

The category rewards AI that is *integrated into PdP with clear, ethical,
relevant value*. There are two failure modes assessors see constantly:

1. **AI-as-decoration** — a chatbot pasted onto content that would teach the same
   with or without it. Scores low on "adds clear value."
2. **AI-as-oracle** — AI that generates the content or grades the learner, and so
   inherits the risk of hallucinating wrong domain facts. Scores low on ethics
   the moment a judge finds one wrong answer.

MagikLayout sidesteps **both**. The AI is neither decorative nor authoritative:
it is a *scoped explainer* over a deterministic ground truth. That is a genuinely
sophisticated stance on educational AI, and it is defensible under hostile
questioning in a way that "we used GPT to make quizzes" is not.

**On TVET fit specifically:** the rubric wants skill-training relevance and
expandability to other TVET institutions. Java GUI programming is a real NOSS
competency taught across polytechnics; the tool needs no install, runs offline at
its core, and meets WCAG AA — so a second lecturer at a second institution can
run it tomorrow with no procurement. The *potential-to-scale* claim is credible
precisely because the barriers (accounts, servers, licences) were designed away.

**One caution I will repeat.** Relevance is necessary, not sufficient. The
project is relevant; whether it *wins* depends on holding the single-objective
line in a 3–5 minute film. A relevant project that tries to show everything reads
as unfocused — and Criterion 3 penalizes exactly that.

---

## 4. Honest limits — and how to turn each into a strength

Judges trust teams that name their own limits. The claim register in
[RAG.md](RAG.md) is your discipline; use its language verbatim.

| Limit (true today) | Do **not** say | **Do** say (script-safe) |
|---|---|---|
| No classroom pilot has run | "Students learned more" / "improves outcomes" | "Formative design is complete; a pilot at Politeknik Mukah (8–15 learners, five-item pre/post) is the planned next step." |
| AR not classroom-validated | "The AR works for everyone" | "Technical acceptance is confirmed on iPhone 13 / Safari (`AR_P0.md`); classroom validation is the next milestone." |
| Challenges coach is **not** RAG | "Every AI Coach is RAG" | "The *Challenges* coach is grounded contextual prompting. The *AI Debugging Studio* uses `coach-rag`: runtime retrieval over a governed corpus with citations." |
| No live-model evaluation yet | "The AI is never wrong" | "The evaluation gate proves *no* model output can reach a student unchecked (0% leakage, 0% contradiction across 138 cases)." |
| Not market-leading | "Market-leading" | "Differentiated — the white space is faithful-engine-plus-subordinate-AI." |

**The reframe that wins:** a project honest about its evidence *out-scores* a
project that overclaims and gets caught in Q&A. Criterion 5 (Q&A, 15%) and
Compliance (5%) both reward exactly this discipline. Turn "we haven't piloted
yet" into "here is our pre-registered evidence plan" — that reads as rigor, not
weakness.

---

## 5. The 3–5 minute video — a beat-by-beat script skeleton

Format gates (from the PDF): **`.mp4/.mov/.avi`, 1080p, 16:9, 3–5 min, YouTube
public/unlisted**. Storyboard across **pre-production / production / post** is
itself marked (Criterion 4) — *storyboard the video and keep the board as a
support document.*

Target runtime **4:30**. One objective. One through-line. Resist the fourth
surface on camera unless it earns its seconds.

| Beat | Time | On screen | Narration intent |
|---|---|---|---|
| **1. The invisible problem** | 0:00–0:35 | A student compiles; a component lands "in the wrong place" | Name the misconception: *students don't place components — layout managers do* |
| **2. The objective** | 0:35–0:55 | One line of text: the NOSS competency + the single repair goal | State the ONE thing the learner will be able to do (Criterion 3) |
| **3. Show why, live** | 0:55–1:50 | Playground: drag, switch manager, **drag the frame edge** and watch reflow, code updating in lockstep | The reflow *is* the lesson; resize is half of it |
| **4. The teaching moment** | 1:50–2:25 | BorderLayout SOUTH collision → tutor-voice hint naming the rule | Error states are pedagogy, not failure |
| **5. Graded practice + the AI's real role** | 2:25–3:15 | A Challenge fails → engine finding → **Ask the coach** → Socratic hint (bilingual toggle) | "Engine judges, AI explains" — say it on camera |
| **6. Immersive transfer (AR)** | 3:15–3:55 | Phone at printed target → *Target found* → one mission → **Java evidence** expands | Optional transfer activity; deterministic evidence, no AI in grading |
| **7. Ethics, access, honest close** | 3:55–4:30 | WCAG AA / keyboard / offline; the honest-status line | Close on the evidence posture: built + tested today, pilot planned |

**Production notes for the editor:**
- The design language (near-white, single Duke-Orange accent, hairlines, no
  shadows) **films exceptionally clean** — let whitespace breathe; don't add
  motion graphics that fight the calm. Criterion 6 rewards clarity, not flourish.
- Capture the reflow at 60fps; the sub-200ms ease-out is the money shot.
- Bilingual (BM/EN) captions reinforce the TVET-Malaysia fit at no story cost.
- Keep a **prompt/usage-log screenshot** on hand for the *report* (Criterion 1),
  not the video.

---

## 6. Pitch & Q&A war-room (defend the 30%)

Lead the pitch with the **one-sentence moat**, then prove command (Penguasaan,
25%). Anticipated questions and the honest, winning answers:

- **"Isn't this just a UI builder like WindowBuilder?"**
  *No — the opposite. Builders hide the why to ship faster; we expose the why. We
  are the tool a student opens* before *they're ready for a builder.*

- **"You call it AI — but the grading isn't AI. Is that a cop-out?"**
  *It's the design. Grading must be deterministic to be trustworthy in a lab. The
  AI's job is pedagogical phrasing, where a language model genuinely helps and
  where being occasionally imperfect is safe because it can't change a verdict.*

- **"Is the coach really RAG?"** (the trap)
  *Two coaches. The Challenges coach is grounded contextual prompting — we say so
  plainly. The AI Debugging Studio retrieves from a governed, versioned corpus at
  request time and cites chunk ids — that one is RAG, and the gate reports 100%
  retrieval precision with zero contradictions across 138 cases.*

- **"Where's your evidence students learn better?"**
  *We separate three kinds of evidence and won't blend them. We have technical
  acceptance and a passing evaluation gate today. Causal learning evidence needs a
  same-learner pre/post design — it's designed (8–15 learners, five-item pre/post)
  and it's our next step. We won't claim a gain we haven't measured.*

- **"Can other institutions actually use this?"**
  *Yes — no install, no accounts, offline core, WCAG AA. New exercises are pure
  data; a new layout manager upgrades every surface at once. The barriers to a
  second lecturer running it were designed away.*

**The closing line for both video and pitch:**
> *"MagikLayout makes the invisible rules of Swing visible — with an engine that
> tells the truth about Java, and an AI that knows its place. It's built, it's
> tested, it's live today; the classroom pilot is the next honest step."*

---

## 7. Pre-submission checklist (don't drop free marks)

- [ ] **Report** states the **AI prompt / usage log** with a real `log.ts` record
      screenshot *(Criterion 1 — explicitly required)*.
- [ ] Report has **background → development process → impact** structure, PDF/Word.
- [ ] **Extended Abstract** submitted (the abstract in `MIPAC_TVET_2026.md` is ready).
- [ ] **Project poster** produced.
- [ ] **Storyboard** (pre/production/post) attached as a support document *(feeds
      Criterion 4)*.
- [ ] Video is **1080p, 16:9, 3–5 min**, uploaded **YouTube public/unlisted**.
- [ ] Single **PdP objective** declared in the first minute and never diluted.
- [ ] Every claim cross-checked against **[RAG.md](RAG.md)**; run `npm test` and
      `npm run eval:rag` and quote the fresh numbers.
- [ ] One live-model coach round-trip confirmed before recording the demo.
- [ ] Team can answer the five Q&A questions in §6 in one breath each.

---

*Prepared as the script foundation for Team **Grup Nelang PMU**, Politeknik Mukah
— MIPAC TVET 2026, Kategori AI DigiTeach. All claims bounded by the register in
[RAG.md](RAG.md). Live build: https://magik-layout.mhdazlan.cc*
