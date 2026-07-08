# LayoutLab — Companion Handbook

> A pocket guide to what LayoutLab is, how every part of it works, how it's put
> together, and where it can go next. Written to sit beside the tool while you
> learn, teach, or extend it.

---

## Part I — What LayoutLab Is

LayoutLab is a browser-based sandbox for learning **Java Swing layout managers**.
It exists to answer one question faster than trial-compiling can: *"Why did Swing
put my component **there**?"*

It does this with a single, uncompromising design decision: the canvas is driven
by **faithful JavaScript reimplementations of the real JDK layout algorithms**
(BorderLayout, FlowLayout, GridLayout), never by CSS flexbox or grid. CSS would
teach a mental model that breaks the moment the student compiles real code.
Everything the student sees on screen is what Swing actually does — pixel for
pixel — and the Java panel shows the deterministic, compilable code that expresses
it.

**Two surfaces, one engine:**

| Surface | Route | What it's for |
|---|---|---|
| **Playground** | `#/` | Free exploration — drag, resize, switch managers, read the code. |
| **Challenges** | `#/challenges` | Graded practice — three exercise modes, all scored by the same engine. |

The engine that lays out the Playground is the *same* engine that grades every
challenge. There is no second source of truth, no screenshots, and no LLM anywhere
in the layout or grading path.

---

## Part II — The Playground (`#/`)

The Playground is a three-pane workspace: **Palette** (left) · **Stage** (center)
· **Code** (right).

### The Palette
Six Swing components, each addable two ways:

- **JButton** — a push button (editable text)
- **JLabel** — a text label (editable text)
- **JTextField** — a text input (compared by `columns`)
- **JCheckBox** — a labelled checkbox (editable text)
- **JComboBox** — a dropdown
- **JPanel** — a nestable container with its *own* layout manager

**To add a component:**
- **Click** a palette item → it drops into the currently selected container.
- **Drag** a palette item onto the canvas → it drops into the exact region/container
  under the cursor, with a live preview of where it will land.
- **Keyboard**: Tab to a palette button, press **Enter/Space**.

### The Stage (live canvas)
A simulated `JFrame` whose title bar shows live dimensions (`LayoutLab — 480 × 340`).
Components are positioned **exclusively** by the layout engine's computed pixels —
CSS never decides a position.

- **Select** a component: click it, or Tab to it.
- **Edit text** (JButton/JLabel/JCheckBox): double-click, or select + Enter.
- **Delete**: select + **Delete/Backspace**, or use the hidden-component chip's ✕.
- **Resize the frame**: drag the **E**, **S**, or **SE** edge handle — or Tab to a
  handle and use **Arrow keys** (hold **Shift** for 1px steps). *Resizing is half
  the lesson*: it's how you see which regions stretch and which hold their size.

### The Layout Controls
A macOS-style **segmented switcher** (ARIA radiogroup, arrow-key navigable) chooses
the active container's manager, with contextual knobs:

- **BorderLayout** — `hgap`, `vgap`
- **FlowLayout** — `align` (LEFT/CENTER/RIGHT), `hgap`, `vgap`
- **GridLayout** — `rows`, `cols` (mutual-zero guarded), `hgap`, `vgap`

Because a **JPanel** carries its own layout, you can nest panels and give each a
different manager — the same way real Swing UIs are composed.

### The Code Panel
Deterministic, compilable `javax.swing` / `java.awt` Java, regenerated on every
action:

- **Diff flash** — lines that changed since the last action flash Duke Orange, then
  fade, so you can trace *this action → this code*.
- **Selection sync** — selecting a component highlights its variable in the code.
- **Copy** — one click (with "Copied ✓") takes ground-truth Java back to your IDE.

### The Hint Strip (the tutor voice)
A context-aware line beneath the canvas that does three jobs:

1. **Manager tip** — on switching managers, a one-time 5s teaching sentence
   ("Drag the frame edge — NORTH and SOUTH keep their height, CENTER absorbs
   everything else").
2. **Selection feedback** — what you can do with the selected component.
3. **The vanish explanation** — LayoutLab's single most important teaching moment.
   When you add a second component to an occupied BorderLayout region, Swing makes
   the first one invisible. Instead of a silent mystery, the strip leads with the
   *rule* — "BorderLayout shows only the **last** component added to each region —
   drag a hidden one to a free region, or delete it" — and shows a chip for each
   hidden component (click to select, ✕ to delete).

### Undo / Redo / Reset
- **Undo / Redo**: buttons in the header, or **⌘Z / ⇧⌘Z** globally (50-step history;
  suppressed while typing in a field so it doesn't eat your text).
- **Reset**: a **two-step confirm** — first click arms it ("Reset" → "Clear all?"),
  second click within 3s clears; it auto-disarms after 3s or on blur. A destructive
  wipe never happens on a single stray click.

### Keyboard Shortcuts panel
The header **`?`** opens a native-Popover shortcuts card (Esc to dismiss) listing
every interaction, so nothing is mouse-only or hidden.

---

## Part III — The Challenges (`#/challenges`)

The Challenges area turns the engine into an **assessment tool**. Every mode is
graded deterministically by comparing trees or engine-computed rectangles — never
by pixels or AI. The intro says it plainly: *"What you see is what Swing does."*

Challenges are tagged by **Bloom difficulty**: **Recall → Apply → Analyze**.

### Mode 1 — Parsons ("order the code")
You get a tray of shuffled **code magnets** — real Java statements
(`new JButton(...)`, `frame.setLayout(...)`, `panel.add(b, BorderLayout.NORTH)`).
Drag them into the correct order to build the target UI.

- The target is never stored as pixels — it's **derived by executing the magnets in
  canonical order** through the same model, so the layout is always internally
  consistent.
- Grading executes your order statement-by-statement with **true Swing semantics**:
  `add()` re-parents, using a variable before declaring it is an error, and — the
  subtle one — a component added *before* `setLayout(new BorderLayout())` is
  **unmanaged and invisible**, exactly as in the JDK.
- On failure the grader reports the **first divergence**: the earliest statement
  after which your order can no longer reach the target.
- Equivalence is exactly as order-sensitive as Swing: BorderLayout adds to
  *different* regions commute; adds within a region and all Flow/Grid adds do not.

*Shipped: "Name prompt with a button row" (Apply), "Browser toolbar — setLayout
timing" (Analyze).*

### Mode 2 — Reflow ("predict the reflow")
A read-only code snippet renders a frame at a start size. You drag a **ghost** of
one component to where you predict it will be **after** the frame resizes, then
submit.

- Grading compares your ghost's center against the engine-computed rectangle at the
  end size, within a per-challenge tolerance (default ±24px per axis).
- Either way, the tool then **animates the true reflow** so you watch the real
  answer, followed by an engine-derived lesson sentence naming the rule you just
  saw ("BorderLayout gives EAST its preferred width and pins it to the right edge —
  CENTER absorbs all the extra width").

*Shipped: "Pinned to the edge" (Apply), "The wrap" (Analyze).*

### Mode 3 — Reverse ("rebuild the target")
You're shown a **target frame** and must rebuild it in a Playground-like builder.

- Grading is **structural equivalence**, not pixels — same tree comparison Parsons
  uses.
- Feedback is a **deterministic diff**: missing components, extra components,
  wrong panel settings (align / gaps / grid dimensions), or "right components,
  wrong arrangement — check regions and add order." No score-shaming, just the next
  thing to fix.

*Shipped: "Search header" (Apply), "Calculator shell" (Analyze).*

### Why the grading design matters
Because the grader runs the student's work through the **same executor and layout
engine** as the live render, a challenge can never be "correct on screen but marked
wrong," and the feedback can point at a *rule* rather than a pixel delta. This is
the pedagogical payoff of the single-source-of-truth architecture.

---

## Part IV — How It's Built (Structure)

### Stack
- **React 19** + **TypeScript 6** (strict), built with **Vite 8**, tested with
  **Vitest 4** (~43 tests across engine, codegen, and challenges).
- **Dependencies: React + React-DOM only.** No UI kit, no state library, no
  CSS-in-JS. The layout engine, router, and codegen are all first-party.

### Directory map
```
src/
├── engine/                 # The heart: faithful JDK layout ports
│   ├── types.ts            # SwingNode, LayoutSpec, ComponentType, intDiv (Java trunc)
│   ├── borderLayout.ts     # 5-region resolver
│   ├── flowLayout.ts       # row-wrapping packer
│   ├── gridLayout.ts       # uniform-cell sizer
│   ├── layoutTree.ts       # recursive tree layout (prefs up, bounds down)
│   └── metrics.ts          # canvas-backed text measurement
├── codegen/
│   └── javaCode.ts         # deterministic, compilable Java generator
├── state/
│   └── playground.ts       # reducer: add/remove/select/setLayout/resize/undo/redo/clear
├── components/             # Playground UI
│   ├── Playground.tsx      # orchestrator (drag, click-add, reset, shortcuts)
│   ├── Canvas.tsx          # JFrame sim, resize handles, node rendering
│   ├── Palette.tsx · LayoutControls.tsx · CodePanel.tsx
│   └── dropGeometry.ts     # region-band hit-testing for drag
├── challenges/             # The graded modes
│   ├── types.ts            # Challenge/Magnet/Stmt definitions
│   ├── execute.ts          # statement executor with true Swing semantics
│   ├── grade.ts            # deterministic graders (parsons/reflow/reverse)
│   ├── ChallengesRoute.tsx # list + routing to players
│   ├── ParsonsPlayer · ReflowPlayer · ReversePlayer · SwingFrame
│   └── data/               # the challenge content (parsons/reflow/reverse)
├── router.ts               # dependency-free hash router (#/ and #/challenges/:id)
├── styles/app.css          # full design-token system + responsive rules
└── main.tsx
```

### The three architectural pillars
1. **One engine, two consumers.** `layoutTree` renders the Playground *and* backs
   every grader. Adding a layout manager improves the tool and the assessments at
   once.
2. **Deterministic everything.** Codegen, execution, and grading are pure functions
   of the tree. Same input → same output, always — which is what makes the code
   trustworthy enough to copy into an IDE and the grades trustworthy enough to rely
   on.
3. **Faithful, not approximate.** `intDiv` mirrors Java's truncating integer
   division; the executor models manager *generations* so `setLayout`-after-`add`
   produces the same invisible component Swing produces. The fidelity is the
   feature.

---

## Part V — Design & Accessibility

**North star: "The Quiet Lab Bench."** A near-white room where the only saturated
thing is the work. **Duke Orange** (#E8590C, Java-tied — not Apple blue) appears
*only* on interactive/active states; a screen at rest is nearly monochrome.
Structure comes from **hairlines and a one-step brightness lift**, never cards or
ambient shadows. Type is one system-sans family, hierarchy from weight and tracking.

**Accessibility (WCAG AA, verified — final design review 36/40):**
- Contrast ≥4.5:1 body / 3:1 large across all surfaces.
- **Zero click-only controls** — the whole app is keyboard-operable (roving-tabindex
  radiogroup, keyboard frame resize, arrow-navigable components, native Popover).
- Full **reduced-motion** coverage (every transition zeroes under
  `prefers-reduced-motion`).
- Responsive down to 375px (header wraps, tagline hides, stage stays usable).
- ARIA roles/labels + `aria-live` hint strip for screen readers.

---

## Part VI — Potential & Roadmap

LayoutLab's architecture is deliberately shaped so growth is **additive**: because
the engine is the single source of truth, each new capability compounds across both
the Playground and the Challenges.

### Near-term, low-friction extensions
- **More challenge content.** New Parsons/Reflow/Reverse items are pure data in
  `challenges/data/` — no engine or grader changes needed. A lecturer could ship a
  full semester's exercises as a data file.
- **More components.** Additional Swing widgets (JRadioButton, JList, JSlider) plug
  into the palette and codegen with the existing `ComponentType` pattern.
- **Dark mode.** The token system is CSS-variable driven; a `prefers-color-scheme`
  theme is a styling pass, not a rewrite.

### Medium-term (new engine capability)
- **GridBagLayout** — the manager students fear most, and the one where "watch why"
  pays off the most. A new engine module that both surfaces (Playground + graders)
  inherit for free.
- **BoxLayout / GroupLayout** — rounding out the managers a diploma course touches.
- **Progress & streaks** in Challenges — since grading already returns structured
  results, tracking mastery per manager is a state layer, not new pedagogy.

### Longer-term (institutional)
- **Lecturer authoring** — a UI to build challenges from a Playground state (the
  Reverse mode already proves the round-trip: a tree *is* a target).
- **Curriculum packs** — shareable challenge sets aligned to specific lab sheets,
  installable without touching code.
- **Export to a real project** — the codegen already emits compilable Java;
  wrapping it in a full runnable `main` + build stub is a small step from "read the
  code" to "run the code."

### Why the potential is credible
The hard part is already done and done *honestly*: a faithful layout engine, a
deterministic grader, and an accessible, restrained UI, all sharing one model.
Most future features are **content or a styling pass**; the few that need engine
work (new managers) slot into a proven pattern and immediately benefit every
surface. The ceiling here isn't "can it be built" — it's "how much curriculum can
be poured into a foundation that already tells the truth about Swing."

---

## Quick Reference

| I want to… | Do this |
|---|---|
| Add a component | Click a palette item, or drag it onto the canvas |
| Add via keyboard | Tab to palette button → Enter/Space |
| Edit text | Double-click a JButton/JLabel/JCheckBox (or select + Enter) |
| Delete | Select + Delete/Backspace |
| Resize the frame | Drag E/S/SE edge, or Tab to a handle + Arrow (Shift = 1px) |
| Switch layout manager | Use the segmented control (arrow keys work) |
| See the rule for a vanished component | Read the hint strip — it names the rule |
| Undo / Redo | ⌘Z / ⇧⌘Z |
| Clear everything | Click Reset twice (arms, then confirms) |
| See all shortcuts | Click **?** in the header |
| Practice | Go to `#/challenges` |

---

*Handbook last updated: 2026-07-05 · Covers Phase 1 (Playground) + Challenges.
Engine, codegen, and grading are all first-party, deterministic, and LLM-free.*
