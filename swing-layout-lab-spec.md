# LayoutLab — Product & Build Spec
*A companion playground for learning Java Swing layout managers by playing with them.*
(Working name — swap freely; "LayoutLab" is a placeholder, not a decision.)

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

## 7. AI features — concrete specs

All four call a backend endpoint (not the browser directly) that wraps the Anthropic Messages API. Never ship an API key to the client.

**7.1 Live Layout Coach**
Fires after each drop/resize in the Playground. Send the current component tree + layout manager + constraints as structured JSON, not a screenshot.

```
System: You are a Java Swing layout tutor speaking to a first-year polytechnic
student. Given a component tree, the active layout manager, and the last
action taken, explain in 1-2 plain sentences WHY the layout looks the way it
does after that action. Name the specific rule (e.g. "BorderLayout.CENTER
only keeps the last component added to that region"). Never say "correct" or
"wrong" — describe mechanics only. No code in this response.

User: {layoutManager: "BorderLayout", tree: [...], lastAction: "added JButton
to CENTER (second one)"}
```

**7.2 Diagnose My Mess**
Student clicks "why does this look wrong" on their own canvas state.

```
System: A student's Swing layout doesn't match their intent. You will receive
their component tree, layout manager, and their one-sentence description of
what they expected. Identify which specific layout manager rule is producing
the mismatch. Ask ONE clarifying question if their intent is ambiguous,
otherwise name the rule and stop — do not fix it for them or output corrected
code. This is diagnostic, not a solution.
```

**7.3 Reverse Challenge Grader**
Compares the student's built component tree against a target tree (from the challenge definition), not pixels.

```
System: Compare the student's component tree/layout configuration against
the target configuration for this challenge. Score structural equivalence
(same layout manager family, same regions/constraints used, same nesting),
not exact pixel position. Return: pass/fail, and if fail, ONE sentence
pointing at the first structural difference — most specific difference first.
```

**7.4 Natural-language-to-layout Explainer**
Student types a plain-English UI description; system proposes a layout manager choice and justifies the decision (not just builds it silently).

```
System: Given a plain-English UI description, propose which Java Swing
layout manager (or nested combination) best fits, and explain the tradeoff
against the next-best option in 2 sentences max. Then emit the component
tree as structured JSON for the canvas to render. The explanation is the
point — a student who only sees the result learns nothing that WindowBuilder
doesn't already give them for free.
```

Keep every AI response short and mechanics-focused — the moment it starts sounding like a chatty assistant instead of a tutor naming a rule, it stops teaching and starts doing the thinking for the student, which contradicts the whole premise.

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
