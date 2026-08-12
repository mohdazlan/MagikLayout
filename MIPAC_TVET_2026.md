# LayoutLab — MIPAC TVET 2026 Submission

> **MIPAC TVET 2026 · CIAST** — *Innovation in Methodology, Pedagogy and AI for Creative TVET*
> Live build: **https://magik-layout.mhdazlan.cc**

---

## Registration details

| Field | Value |
|---|---|
| **Project title** | *LayoutLab — An Interactive Java Swing Layout Trainer with a Deterministic Engine, an AI Coach, and a NOSS-aligned AR Lab* *(confirm/trim before submitting)* |
| **Team name** | Grup Nelang PMU |
| **Competition category** | Immersive Digital Teaching Aid |
| **Institution** | Politeknik Mukah |
| **Course context** | DFP50463 Java Based Application Development (GUI & Event Handling) |
| **NOSS alignment (AR module)** | IT-010-3:2016 — Pembangunan Aplikasi, Tahap 3 · CU IT-010-3:2016-C01 (Application Prototype Development) |

---

## Abstract (ready to paste)

First-year polytechnic students learning Java graphical user interfaces struggle with one invisible idea: they do not position components directly — *layout managers* do — and the rules of `BorderLayout`, `FlowLayout` and `GridLayout` are not obvious from source code and appear only at run time. **LayoutLab** makes those rules visible across three browser-based surfaces driven by one deterministic engine. In the **Playground**, students drag Swing components onto a live canvas and watch faithful re-implementations of the actual JDK layout algorithms reflow the interface in real time, beside the exact, compilable Java the layout produces. **Challenges** turns this into graded practice — ten exercises in three formats (order-the-code, predict-the-reflow, rebuild-the-target) — all scored by the *same* engine that renders the canvas, so feedback is deterministic and always matches real Swing. An opt-in, bilingual (Bahasa Malaysia / English) **AI Layout Coach** turns the engine's precise findings into Socratic hints under a strict guardrail — the engine judges, the AI only explains — so the model never fabricates a grade. Finally, a **NOSS-aligned AR Lab** uses image-tracking augmented reality (working on iPhone/Safari) to let a student construct, resize and repair a `BorderLayout` prototype anchored to a printed target through three assessed missions, with bilingual spoken guidance and deterministic Java evidence generated from the same code generator. LayoutLab runs in the browser, works offline (core), requires no installation, and meets WCAG AA.

---

## The three surfaces (all built and demonstrable today)

| Surface | Route | What it is |
|---|---|---|
| **Playground** | `#/` | Free exploration — drag/click components, switch layout managers, resize the frame, read live compilable Java. |
| **Challenges** | `#/challenges` | Ten graded exercises across three modes (Parsons, Reflow, Reverse), each scored by the same engine, with the opt-in bilingual AI Coach. |
| **AR Lab** | `#/ar-lab` | A NOSS-aligned image-tracking AR module: point a phone at a printed target and complete three assessed missions on a `BorderLayout` prototype. |

---

## How LayoutLab answers the three MIPAC pillars

### 1. Methodology
- **Faithful JDK layout engine, not a CSS fake.** The canvas is driven by first-party JavaScript ports of the actual `BorderLayout` / `FlowLayout` / `GridLayout` algorithms — a tool that approximated layout with CSS would teach a model that breaks the moment the student compiles real Java.
- **One engine, many consumers.** The same engine renders the Playground, grades every Challenge, *and* generates the AR Lab's Java evidence. There is no second source of truth and no pixel-matching.
- **Deterministic, compilable code generation** on every action; the code panel is ground truth.

### 2. Pedagogy
- **"Show why, not just what."** Error states are teaching moments — e.g. a second component added to an occupied `BorderLayout` region is named and recoverable, not silently lost.
- **Ten graded exercises, three formats** (Parsons ×3, Reflow ×3, Reverse ×4), Bloom-tagged (Recall → Apply → Analyze), fully keyboard- and screen-reader-operable.
- **Locally grounded content** — e.g. a **Mukah Airport canteen receipt** exercise — so the layout lesson rides on a familiar Sarawak context.

### 3. AI
- **AI Layout Coach — "the engine judges, the AI explains."** Opt-in and bilingual, it turns the deterministic grader's structured findings into a short Socratic hint. The AI never decides correctness and never writes the student's layout, which structurally prevents the failure mode that makes AI risky in education: an AI confidently teaching *wrong* Swing behaviour. (Grading and AR assessment use **no generative AI** at all.)

---

## The AR Lab (headline immersive module)

Built for the **Immersive Digital Teaching Aid** category and mapped to **NOSS IT-010-3:2016-C01** (Implement Application Prototype Mock-Up Flow):

- **Image-tracking AR that works on iPhone.** Uses MindAR image tracking (compiled from an original, high-detail LayoutLab target card) plus three.js — so it runs in **iOS Safari**, where WebXR is unavailable. A printable target (`public/ar/layoutlab-target.png`) anchors a virtual `JFrame` and its five regions to the real world.
- **Three assessed missions**, each advanced only by tapping the mission-relevant tracked 3D object (raycast against the meshes — image tracking, spatial anchoring, animation and touch are *necessary*, not decorative):
  1. Place a title in the correct region (`NORTH`).
  2. Tap the region that absorbs space (`CENTER`) and watch the virtual frame resize.
  3. Reveal a two-button collision in `SOUTH` (X-ray), then activate the AR repair control to construct a nested `JPanel` holding both buttons.
- **Five media/learning elements** (exceeds the required three): text, tracked 3D graphics, animation, user-triggered **bilingual spoken instruction** (device speech, `ms-MY` / `en-MY`), and interactive assessment with scoring/retries.
- **Deterministic evidence.** Mission state is converted into the same Swing component tree the Java generator uses; students expand **"Java evidence"** to see and record the generated `javax.swing` code — no AI in the grading path.
- **On-device acceptance test** is defined in `AR_P0.md` (iPhone 13 / Safari, HTTPS, target-found → 3/3 → Java evidence → camera released on exit).

---

## What is built today (verifiable)

| Area | Status |
|---|---|
| Playground: BorderLayout / FlowLayout / GridLayout, drag + click-to-add, nested panels, frame resize, live Java, undo/redo | ✅ Built |
| Challenges: 10 exercises, 3 modes, deterministic graders, congratulation/teaching notes | ✅ Built |
| AI Layout Coach (opt-in, bilingual, engine-judges/AI-explains) integrated in all three challenge modes | ✅ Built |
| AR Lab: NOSS-aligned, MindAR image tracking, 3 assessed missions, bilingual audio, Java evidence | ✅ Built |
| Accessibility: WCAG AA contrast, full keyboard paths, reduced-motion support | ✅ Verified (core) |
| Public deployment at magik-layout.mhdazlan.cc | ✅ Live |

**Engineering credibility:** React 19 + TypeScript (strict) + Vite. **75 automated tests pass**; type-check and production build are clean. The **core bundle is ~84 KB gzipped**; three.js (~115 KB) and the MindAR runtime (~357 KB) are **code-split** and load only when a student opens the AR Lab, so the Playground/Challenges bundle is unaffected.

---

## Honest status statement

LayoutLab's Methodology and Pedagogy surfaces (Playground + ten graded Challenges) are **built, tested, and demonstrable today** at a public URL. The **AI Layout Coach** is implemented and integrated across all three modes; one live-model round-trip against a production key should be confirmed before a recorded demonstration. The **AR Lab** is implemented and deployed with a defined on-device acceptance test; it has **not yet been classroom-validated** — a pilot at Politeknik Mukah is the planned next step. This document states current fact and does not claim any capability that is not yet running.

*Prepared for MIPAC TVET 2026 · Team Grup Nelang PMU, Politeknik Mukah.*
