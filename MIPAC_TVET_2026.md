# LayoutLab — MIPAC TVET 2026 Submission

> **MIPAC TVET 2026 · CIAST** — *Innovation in Methodology, Pedagogy and AI for Creative TVET*
> Phase 1 — Registration

---

## Registration details

| Field | Value |
|---|---|
| **Project title** | *LayoutLab — Coding the Blueprint: an interactive Swing GUI layout trainer with an AI coach* *(confirm/edit before submitting)* |
| **Team name** | Grup Nelang PMU |
| **Competition category** | Immersive Digital Teaching Aid |
| **Institution** | Politeknik Mukah |
| **Course context** | DFP50463 Java Based Application Development, Practical Work 1 (GUI & Event Handling) |

---

## Abstract (ready to paste)

Students meeting Java Swing for the first time struggle with one invisible idea: they do not place components, *layout managers* do — and the rules of `BorderLayout`, `FlowLayout` and `GridLayout` are non-obvious. Most learn by trial-and-recompile, which is slow and builds no mental model. **LayoutLab** is a browser-based teaching aid that makes those rules visible. Students drag Swing components onto a live canvas and watch **faithful re-implementations of the real JDK layout algorithms** reflow the interface in real time, beside the exact, compilable Java the layout produces. A **Challenges** mode turns this into graded practice — ten exercises across three formats (order-the-code, predict-the-reflow, rebuild-the-target), all scored by the *same* engine that renders the canvas, so feedback is deterministic and always matches real Swing. The project's MIPAC innovation is an **AI Layout Coach**: an opt-in, bilingual (Bahasa Malaysia / English) tutor that turns the engine's precise, structured feedback into Socratic, plain-language guidance — while a strict guardrail keeps the deterministic engine as the sole judge of correctness, so the AI *explains* but never *hallucinates* a grade. LayoutLab runs fully in the browser with no installation, works offline, and meets WCAG AA accessibility, making it deployable in any polytechnic lab.

*(≈190 words — trim to the form's limit if needed.)*

---

## How LayoutLab answers the three MIPAC pillars

MIPAC asks for innovation in **Methodology**, **Pedagogy**, and **AI**. Here is an honest map of each, with what is **delivered today** versus **in active development for MIPAC**.

### 1. Methodology — *delivered*
- **Faithful JDK layout engine, not a CSS fake.** The canvas is driven by first-party JavaScript ports of the actual `BorderLayout` / `FlowLayout` / `GridLayout` algorithms. A tool that approximated layout with CSS flexbox would teach a mental model that *breaks* the moment the student compiles real Java — LayoutLab refuses that shortcut. This is the single highest-leverage decision in the project.
- **One engine, two consumers.** The same engine that renders the Playground also *grades* every challenge. There is no second source of truth, no screenshots, no pixel-matching — a challenge can never be "right on screen but marked wrong."
- **Deterministic, compilable code generation.** Every action regenerates real `javax.swing` / `java.awt` Java that compiles first try. The code panel is ground truth.

### 2. Pedagogy — *delivered*
- **"Show why, not just what."** When a student adds a second component to an occupied `BorderLayout` region and it vanishes, LayoutLab doesn't just fail silently — it names the rule and offers recovery. Error states are teaching moments.
- **Ten graded exercises, three formats:**
  - **Parsons (order-the-code)** ×3 — arrange shuffled Java statements; graded with true Swing semantics, reports the first statement that diverges from a correct solution.
  - **Reflow (predict-the-reflow)** ×3 — predict where a component lands after a resize, then watch the real reflow animate.
  - **Reverse (rebuild-the-target)** ×4 — drag components to reconstruct a shown target; graded on structural equivalence, with the student's live generated Java shown alongside and a congratulation plus **teaching notes** on completion.
- **Locally grounded content.** Exercises use scenarios a Sarawak polytechnic student recognises — including a **Mukah Airport canteen receipt** form with a points-redemption scheme — so the layout lesson rides on a familiar context.
- **Bloom-tagged difficulty** (Recall → Apply → Analyze) and full keyboard + screen-reader operability so the aid is inclusive.

### 3. AI — *the MIPAC innovation, in active development*
> **Status: designed, not yet shipped.** Everything above runs today; the AI Layout Coach is the feature being built for this competition. This document describes it honestly as a plan, not a claim.

**AI Layout Coach** — an opt-in, bilingual natural-language tutor layered over the existing modes.

- **Grounded, not guessing.** The deterministic engine already computes *precise* structured feedback: the exact structural diff between a student's build and the target, the first diverging statement in a Parsons attempt, which component is hidden and in which region. The AI's job is to turn those hard facts — plus the student's own generated Java — into a short, Socratic hint: *"Both buttons went into SOUTH, but a BorderLayout region shows only the last component added — where could the two buttons live together instead?"*
- **The integrity guardrail — "the engine judges, the AI explains."** The AI **never** decides correctness and **never** writes the student's layout for them. Grading stays 100% deterministic. This preserves LayoutLab's founding principle (real code is ground truth) while adding genuine AI pedagogy — and it structurally prevents the failure mode that makes AI risky in education: an AI confidently teaching *wrong* Swing behaviour.
- **Bilingual (BM / English)** to fit Malaysian TVET classrooms.
- **Adaptive scaffolding** — hints escalate from a nudge to a worked explanation only as the student stays stuck, so the AI supports the struggle instead of short-circuiting it.

*Architecture note (for the build phase): LayoutLab is a client-only app, so the AI provider key will sit behind a minimal serverless proxy or a runtime user-supplied key — never embedded in the shipped bundle.*

---

## What is delivered today (verifiable)

| Area | Status |
|---|---|
| Playground: BorderLayout / FlowLayout / GridLayout, drag + click-to-add, nested panels, frame resize | ✅ Shipped |
| Live compilable Java codegen with change-highlighting and one-click Copy | ✅ Shipped |
| Undo/redo (50-step), hidden-component tutor, keyboard shortcuts, two-step Reset | ✅ Shipped |
| Challenges: 10 exercises, 3 modes, deterministic graders, live code + congratulation notes | ✅ Shipped |
| Accessibility: WCAG AA contrast, full keyboard paths, reduced-motion support | ✅ Verified |
| Runs in-browser, offline, no install, no backend | ✅ Shipped |
| **AI Layout Coach** | 🔧 In development for MIPAC |

**Engineering credibility:** React 19 + TypeScript (strict) + Vite; dependencies are **only** `react` and `react-dom` (no UI kit, no state library); **56 automated tests pass**; production bundle ≈ **87 KB gzipped**; type-check and build are clean.

---

## Fit with the category and TVET context

- **Digital teaching aid.** LayoutLab is purpose-built as a lab companion for the exact Politeknik Java GUI syllabus (DFP50463) — it answers a confused student's layout question in under 30 seconds, without gating, login, or install.
- **Zero-cost deployment.** A single static build runs on any lab PC's browser, offline. No server, no database, no license.
- **Inclusive by design.** Full keyboard operation and screen-reader labels mean the aid works for every student in the cohort.

> On the *"Immersive"* category label: LayoutLab is immersive in the **hands-on, interactive** sense (live manipulation + instant real-code feedback), not AR/VR. If the category is strictly extended-reality, flag this — the entry may sit better under an interactive-courseware category.

---

## Roadmap

| Phase | Deliverable |
|---|---|
| **Now (shipped)** | Playground + 10-exercise Challenges + deterministic engine |
| **MIPAC build** | AI Layout Coach (grounded, bilingual, engine-judged) |
| **Next** | More local-context challenge packs; lecturer authoring of challenges from a canvas; progress tracking |

---

## Honest status statement

LayoutLab's Methodology and Pedagogy innovations are **built, tested, and demonstrable today**. The AI pillar is a **designed feature entering development** for MIPAC, with a concrete architecture and a defensible integrity model. This document represents current fact; it does not claim any capability that is not yet running.

*Prepared for MIPAC TVET 2026 registration · Team Grup Nelang PMU, Politeknik Mukah · 2026-07-30*
