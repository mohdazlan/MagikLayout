# LayoutLab — Product & Build Spec
*A companion playground for learning Java Swing layout managers by playing with them.*
(Historical spec. The name was later decided: the product is **MagikLayout**, and "LayoutLab" is kept only as a module and asset name.)

> **Current implementation update.** The original four speculative AI prompts in
> Section 7 have been consolidated into the visual-first, 12-mission **AI
> Debugging Studio** at `#/classroom`. It uses deterministic structural grading,
> metadata-first RAG, optional Claude Haiku composition, bilingual hint ladders,
> guardrails, and visible evidence. Lesson Pack and Class Session are hidden.
> [MagicAI.md](MagicAI.md) is authoritative where this historical spec differs.

---

## 1. One-line thesis

The tool students open **before** they're ready for WindowBuilder — a sandbox that shows *why* a component lands where it lands, not a builder that hides the why to ship faster.

## 2. Who it's for

Primary: first/second-year polytechnic diploma students taking a Java GUI course, first contact with event-driven layout, often working through a lab exercise with a deadline in days. Secondary: the lecturer, who needs the tool to slot into an existing scaffolded curriculum without contradicting it.

Design consequence: every screen should assume the visitor has a code editor open in another window and a lab sheet next to it. This is a *reference companion*, not a marketing site — optimize for "get the answer to my confusion in under 30 seconds," not for dwell time.

## 3. Information architecture

```
/                  → Landing: what this is, jump straight to Playground or Concepts
/concepts          → Layout manager library (index)
/concepts/:layout  → One explainer page per manager (BorderLayout, FlowLayout,
                     GridLayout, BoxLayout, GridBagLayout, CardLayout)
/playground        → The Lego builder (core feature)
/playground?load=X → Deep link into playground pre-loaded with a concept example
/challenges        → Reverse-engineer mode: screenshot → rebuild → AI grades
/challenges/:id     → One challenge
```

Keep it this flat. No auth, no dashboard, no accounts in v1 — every gate you add is one more reason a student doesn't open it during a 20-minute study break.

## 4. Screen-by-screen

**Landing (`/`)**
Hero is a *live thesis*, not a headline: an actual mini interactive layout manager embedded above the fold that reflows in real time as the visitor drags a slider or resizes the frame. That's the entire pitch delivered without a sentence of copy. Below: three entry cards — "Learn the concepts," "Play in the sandbox," "Test yourself."

**Concepts Library (`/concepts`)**
Grid of six cards, one per layout manager, each with a tiny animated preview (loops a 3-second reflow demo) instead of a static icon.

**Concept page (`/concepts/:layout`)**
Head-First-style explainer matching Azlan's existing print materials: plain-language mental model first, then the constraint rules, then a live embedded mini-playground scoped to *just that manager*, then a "try it yourself" link into the full Playground pre-loaded with this manager active. Mirror the tone of the existing Week 1/Week 2 notes — this page is the digital sibling of those chapters, not a replacement.

**The Playground (`/playground`)** — see Section 5, this is the core feature.

**Challenges (`/challenges`)**
Card grid, difficulty-tagged (matches Bloom's levels you already use: Recall / Apply / Analyze). Each challenge shows a target screenshot; student builds it in an embedded Playground instance; AI grader checks structural equivalence, not pixels.

## 5. The Playground — core mechanic

Three-pane layout:

```
┌─────────────┬──────────────────────────┬─────────────┐
│  Palette     │      Canvas               │  Code panel │
│  (components  │  (drop target, shows      │  (live Java │
│   + layout    │   live layout result)     │   snippet)  │
│   manager     │                          │             │
│   switcher)   │                          │  [AI Coach  │
│               │                          │   strip     │
│               │                          │   below]    │
└─────────────┴──────────────────────────┴─────────────┘
```

- **Palette**: draggable JButton, JLabel, JTextField, JCheckBox, JComboBox, JPanel (nested container). Layout manager selector as a segmented control at the top of the canvas, Apple-settings-style, not a dropdown — this is a first-class decision the student is making, don't bury it.
- **Canvas**: the actual drop target. Resizable via a draggable frame edge, because *resize behavior* is half of what layout managers teach — a screenshot-only tool that never resizes is only teaching half the lesson.
- **Code panel**: regenerates on every drop, syntactically real, compilable Java using only `java.awt`/`javax.swing` — no third-party libraries, matching the "vanilla" philosophy already established for the course. Diff-highlight the lines that changed on the last action, briefly, so the student connects their click to the code delta.
- **AI Coach strip**: collapsed by default, expands with one line of live commentary after each drop (see Section 7).

**Critical technical requirement — do not skip this:** CSS flexbox/grid do **not** behave like `FlowLayout`, `GridBagLayout`, or `BorderLayout`. If the canvas is implemented as "approximate with flexbox," it will teach students an incorrect mental model that contradicts what actually happens when they compile the real code — which directly undermines the whole reason this tool exists. Reimplement each layout manager's actual sizing/positioning algorithm (preferred/minimum/maximum size resolution, `GridBagConstraints` weight/anchor/fill resolution, `FlowLayout` wrap behavior, `BorderLayout`'s five-region resize rules) as small, isolated JS functions — one module per manager — and lay out the canvas DOM nodes by direct pixel calculation from that algorithm, not by asking CSS to approximate it. This is the single highest-leverage engineering decision in the whole project; get it right before building any AI feature on top of it.

## 6. Design direction (Apple-style, made specific)

Per the brief's own instruction, "Apple official website" is a real pin, not a free axis — but "Apple-style" still needs translating into an actual token system so it doesn't default to generic light-mode-SaaS. Suggested starting point (adjust after building the real hero):

- **Color**: nearly-white background (`#FBFBFD`, Apple's own off-white, not pure `#FFFFFF`), near-black text (`#1D1D1F`), one restrained accent used *only* for interactive/active states (a blue near `#0071E3` reads as "Apple," but consider swapping for a color tied to Java itself — a warm coffee-brown or duke-orange — so the site doesn't read as a skin over Apple's actual site). Layout manager categories can each get a subtle identifying hue used only in small tags/borders, never as backgrounds.
- **Type**: a confident, wide-set system sans for display (SF Pro if licensing allows, otherwise Inter *only* if paired deliberately with real weight/tracking variation — flag as a place Impeccable's `/typeset` command should intervene, since "Inter for everything" is exactly the anti-pattern it's built to catch). Generous type scale, generous line-height, lots of negative space — the Apple tell isn't the font, it's the restraint.
- **Layout**: full-bleed sections, huge top/bottom padding between them, center-aligned hero content, then the Playground itself breaks that pattern deliberately (data-density is appropriate there — it's a tool, not a marketing section).
- **Signature element**: the live, draggable reflow demo in the hero. That's the one moment of boldness — keep everything else quiet around it.
- **Motion**: layout reflows should *ease*, not snap — a 150-200ms transition on component position changes turns "components jumped somewhere" into "I watched why they moved there," which is a real pedagogical function, not decoration.

## 7. AI features — current implementation

The production direction is no longer four unrelated prompt buttons. It is one
coherent **AI Debugging Studio** at `#/classroom`, with 12 visual missions and a
repeatable learner loop:

1. render a deliberately broken Swing component tree;
2. ask the learner to predict the cause;
3. show a mission-specific deterministic inspector;
4. let the learner complete a two-stage structural repair;
5. grade the repaired tree with `gradeReverse()`;
6. retrieve approved bilingual passages for the engine's misconception code;
7. optionally let Claude Haiku compose one Socratic hint from those passages;
8. guard the response and expose its source/citation evidence;
9. regenerate authoritative Java and the component tree deterministically.

The browser never receives the Anthropic key. It sends retrieved passages and
engine findings to `coach-rag`; the Edge Function refuses empty passages. The
model does not grade, select sources, generate the solution, or override engine
truth. The full mission matrix, hint ladder, fallback rules, and implementation
map are in [MagicAI.md](MagicAI.md).

## 8. Suggested stack

- Frontend: React + TypeScript, custom layout-engine modules (Section 5) — no charting/UI kit needed beyond what you hand-roll for the canvas.
- Code panel: a small Java-code-templater keyed off the component tree state (not an LLM call — this should be deterministic and instant, keep AI for explanation, not for generating the ground-truth code).
- Backend: a thin serverless endpoint (Vercel/Cloudflare function is enough) proxying the four prompts above to the Anthropic API.
- Hosting: static frontend + serverless function is enough for v1 traffic; no database needed until you add accounts/progress tracking in a later phase.

## 9. Build phases

**Phase 1 (MVP):** BorderLayout + FlowLayout + GridLayout only, in the Playground, with live code panel, no AI yet. Prove the layout-engine-accuracy requirement in Section 5 works before adding anything else on top of it.

**Phase 2:** Add GridBagLayout and BoxLayout (the two genuinely hard ones), add the Concepts Library pages, wire in the Layout Coach (7.1).

**Phase 3:** Challenges mode + Diagnose My Mess + Reverse Grader + NL-to-layout. This is also the point to consider CLO/PLO-tagged difficulty gating if you want it MQA-legible for other lecturers.

## 10. Where Impeccable fits

Impeccable is a design-quality layer for Claude Code, not a UI generator — it won't invent the Playground's interaction design, but it will stop the surrounding site (landing, concepts pages, challenge cards) from defaulting to generic AI-slop SaaS look while Claude Code is generating it.

Sequence:
1. `npx impeccable install` from the project root, once the repo exists.
2. `/impeccable init` inside Claude Code — when it asks about audience/brand/voice, feed it Section 2 and Section 6 of this doc directly so `PRODUCT.md`/`DESIGN.md` are seeded correctly from the start, rather than generic defaults.
3. Build the Playground first (Section 5) with Anthropic's baseline `frontend-design` skill active — Impeccable builds on top of that skill, so both should be present.
4. Once each screen has a first pass, run `/impeccable critique` for a UX-hierarchy read, then `/impeccable polish` as the final pass before moving to the next screen. Don't run `/polish` too early — it's a finishing tool, not a first-draft tool.
5. `/impeccable audit` on the Concepts and Landing pages specifically before shipping — those are the pages most likely to drift toward "Inter + purple gradient + nested cards" since they're conventional content pages, unlike the Playground which is inherently custom.

## 11. First prompt to paste into Claude Code

```
I'm building LayoutLab, a companion learning tool for a Java Swing course
(spec attached as swing-layout-lab-spec.md). Start with Phase 1 only:
a working Playground with BorderLayout, FlowLayout, and GridLayout, a
faithful JS reimplementation of each manager's real layout algorithm
(NOT css flexbox/grid approximation — see Section 5), a draggable palette,
and a live-updating real Java code panel. No AI features yet. Apple-style
visual direction per Section 6. Ask me clarifying questions before you
start if anything in the spec is ambiguous.
```

Attach this spec file alongside that prompt so Claude Code has the full context in-repo, not just in the first message.
