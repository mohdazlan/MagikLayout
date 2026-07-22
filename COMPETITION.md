# LayoutLab — Competition Entry Document

## Executive Summary

**LayoutLab** is a pedagogical sandbox for learning Java Swing layout managers. It lets first and second-year polytechnic students drag Swing components onto a live canvas, switch between BorderLayout, FlowLayout, and GridLayout, and watch the real JDK layout algorithms compute in real time—alongside deterministic, compilable Java code that updates with every action.

Unlike drag-and-drop builders that hide the why, LayoutLab shows why. It's a reference companion, not a tool that hides mechanics: students resolve layout confusion faster by understanding the rules, not by copy-pasting.

LayoutLab has **two surfaces driven by one engine**: a free-exploration **Playground** and a **Challenges** area with three graded exercise modes (Parsons, Reflow, Reverse). The same layout engine that renders the Playground also grades every challenge—deterministically, with no screenshots and no LLM anywhere in the layout or grading path.

**Status:** Phase 1 shipped on 2026-07-04. Playground surface scored **36/40 (Excellent)** in final impeccable design review (no P0/P1 issues, clean detector, WCAG AA compliant, full keyboard accessibility, reduced-motion support). The Challenges system is implemented with 6 shipped exercises and its own deterministic graders.

---

## 1. Technologies & Stack

### Frontend Framework
- **React 19.2.7** with TypeScript 6.0.3
  - Functional components with hooks (useEffect, useReducer, useState, useRef, useMemo)
  - Unidirectional data flow with a reducer pattern for immutable state management
  - 50-step undo/redo history backed by a reducer

### Build & Tooling
- **Vite 8.1.3** (HMR dev server, optimized builds)
- **Vitest 4.1.9** (~43 passing tests across engine, codegen, and challenges)
- **TypeScript 6.0** (strict mode, zero compilation errors)

### Layout Engine
- **Faithful JDK algorithm ports** (no approximation):
  - BorderLayout: 5-region constraint resolver, region-band collision detection
  - FlowLayout: row-wrapping based on frame width
  - GridLayout: cell-uniform sizing, row/col computed from component count
- **Deterministic pixel math**: recursive tree layout (preferred sizes bottom-up, bounds top-down)
- **Metric measurer**: canvas-backed text measurement for accurate label sizing

### Code Generation
- **Java source formatter** producing deterministic, compilable `javax.swing` / `java.awt` code
- Deterministic variable naming by type + counter (`button1`, `label1`, `panel1`, etc.)
- Zero LLM-generated code; all output is algorithmic and verifiable

### Challenges Engine
- **Statement executor** (`challenges/execute.ts`) models true Swing semantics:
  `add()` re-parenting, use-before-declare errors, and manager *generations* (a
  component added before `setLayout(new BorderLayout())` becomes unmanaged/invisible,
  exactly as in the JDK)
- **Deterministic graders** (`challenges/grade.ts`): structural tree equivalence for
  Parsons/Reverse, engine-computed rectangle comparison for Reflow — no LLM, no pixels
- **Challenges are pure data** (`challenges/data/`) — new exercises need no engine change

### Routing
- **Dependency-free hash router** (`useSyncExternalStore` over `hashchange`) — flat IA
  (`#/` Playground, `#/challenges/:id`) that keeps the Playground bundle byte-identical
  to Phase 1

### Styling & Theming
- **CSS 3** with CSS Custom Properties as design tokens (colors, spacing, motion durations)
- **Hex color tokens** from a committed brand palette (Duke Orange accent + Apple-calm neutrals)
- **System font stack** (SF Pro / Segoe UI on Windows)
- **Monospace stack** for code display (SF Mono / JetBrains Mono fallback)

### State Management
- **React reducer pattern** (dispatch-driven actions: `add`, `remove`, `select`, `setLayout`, `resizeFrame`, `undo`, `redo`, `clear`)
- **No external state libraries** — single reducer is sufficient for the domain
- **Immutable updates** — every action returns a new tree

---

## 2. Key Features

### Canvas & Live Reflow
- **Drag-and-drop palette** → drop components into any layout container or region
- **Click-to-add**: select a container, click a palette item to add it directly
- **Live region preview**: as you drag, the canvas shows which region the component will occupy (BorderLayout)
- **Frame resize handles**: grab the E, S, or SE edges to resize the frame; layout recomputes with sub-200ms transitions
- **Keyboard-accessible resize**: Tab to a handle, use arrow keys (Shift for 1px steps)

### Layout Managers (Phase 1)
1. **BorderLayout** (5 regions: NORTH, SOUTH, EAST, WEST, CENTER)
   - Collision detection: when a region is occupied, the hint strip shows the hidden component and offers click-to-select or delete
   - Teaching moment: "BorderLayout shows only the **last** component added to each region" — students understand the rule

2. **FlowLayout** (left-to-right, wrappable rows)
   - Alignment control: LEFT, CENTER, RIGHT
   - Horizontal and vertical gap knobs

3. **GridLayout** (uniform cell sizing)
   - Rows/cols specification with mutual-zero prevention
   - Gap controls; cell count auto-derives

### Code Panel
- **Live Java code** updates with every action
- **Syntax coloring** with muted hue (code carries info via structure, not color noise)
- **Diff highlighting**: newly-changed lines flash Duke Orange, then fade
- **Copy button** with "Copied ✓" feedback; students take ground-truth code back to their IDE

### Keyboard Navigation & Accessibility
- **Full palette keyboard path**: Tab to component buttons, Enter/Space to add (no mouse required)
- **Canvas components are focusable**: Tab to select, Arrow keys to navigate, Delete/Backspace to remove, Enter to edit (for editable types)
- **Roving tabindex radiogroup**: the layout-manager switcher (BorderLayout/FlowLayout/GridLayout) uses ARIA radiogroup with arrow-key navigation and wrap
- **Resize handles keyboard path**: Tab to a handle, Arrow/Shift+Arrow to resize, live dimension updates in titlebar
- **Hidden-region chips**: Tab to select, Enter/Space to select, Backspace to delete
- **Undo/Redo shortcuts**: ⌘Z / Shift+⌘Z (global; respect INPUT/SELECT/TEXTAREA focus to allow typing)
- **Native Popover API** for shortcuts panel: opens via `popoverTarget`, dismissible via Esc

### Hint Strip (Context-Aware)
- **Manager tip** (on layout switch): shows once for 5s as a transient teaching moment ("Drag the frame edge — CENTER absorbs everything else")
- **Selection feedback**: when you select a component, the hint shows what actions you can take (delete, edit if editable)
- **Hidden-notice**: when BorderLayout collision occurs, the hint leads with the rule in a tutor sentence, then shows chips for each hidden component

### Undo/Redo with History
- **50-step history** (past + future stacks)
- **Undo/Redo buttons** in the header; globally reachable via ⌘Z / Shift+⌘Z
- **Reset** via two-step confirm: first click arms it ("Reset" → "Clear all?" in accent tint), second click within 3s executes, auto-disarms at 3s or on blur

### Challenges — Three Graded Practice Modes (`#/challenges`)
The Challenges area turns the engine into an assessment tool. Every mode is graded
deterministically against trees or engine-computed rectangles — never pixels, never
AI. Exercises are tagged by **Bloom difficulty** (Recall → Apply → Analyze). Six
challenges ship in Phase 1 (2 per mode).

1. **Parsons ("order the code")** — arrange a tray of shuffled Java code magnets into
   the correct order to build a target UI. The executor applies true Swing semantics
   (re-parenting, use-before-declare errors, and the subtle "component added before
   `setLayout(new BorderLayout())` is invisible" rule). On failure, the grader reports
   the **first divergence** — the earliest statement after which the target is
   unreachable.
   *Shipped: "Name prompt with a button row" (Apply), "Browser toolbar — setLayout timing" (Analyze).*

2. **Reflow ("predict the reflow")** — drag a ghost of one component to its predicted
   position **after** a frame resize; grading compares the ghost center to the
   engine-computed rect at the end size (±tolerance). The tool then animates the true
   reflow and states the rule it just demonstrated.
   *Shipped: "Pinned to the edge" (Apply), "The wrap" (Analyze).*

3. **Reverse ("rebuild the target")** — reconstruct a shown target frame in a builder;
   graded on **structural equivalence** with a deterministic component-level diff
   (missing / extra / wrong panel settings / wrong arrangement).
   *Shipped: "Search header" (Apply), "Calculator shell" (Analyze).*

**Why the grading design matters:** because the grader runs student work through the
*same* executor and layout engine as the live render, a challenge can never be
"correct on screen but marked wrong," and feedback points at a **rule**, not a pixel
delta.

---

## 3. Design & Brand

### North Star
**"The Quiet Lab Bench"** — Apple-grade restraint applied to an educational tool. The only saturated color in the interface is the Duke Orange accent on interactive elements; everything at rest is monochromatic. The canvas is the one moment of boldness, and it's earned because that's where the learning happens.

### Visual Identity
- **Duke Orange (#E8590C / deep #B54708)**: Java-tied (Duke University, Sun's palette), reserved strictly for active states, selection, and drop targets
- **Off-White background (#FBFBFD)**: Apple's own near-white, not pure white (reduces eye strain)
- **Panel White surfaces (#FFFFFF)**: one step brighter than body, used for the canvas frame and code panel
- **Near-black text (#1D1D1F)**: primary ink
- **Secondary ink (#6E6E73)**: captions, hints (4.5:1 contrast floor maintained throughout)
- **Hairlines (#D2D2D7)**: 1px borders and dividers; no shadows, no cards

### Typography
- **System sans everywhere** (SF Pro / Segoe UI): one family, real weight variation (400/500/600)
- **Code mono** (SF Mono / ui-monospace fallback)
- **Hierarchy via weight and tracking**, not multiple faces
- **Display**: 28px, weight 600, -0.02em tracking
- **Body**: 15px, weight 400, 1.5 line-height
- **Code**: 13px mono, 1.6 line-height

### Anti-References (Explicitly Rejected)
- **Not a skin over apple.com** (Duke Orange confirms independence)
- **Not generic SaaS dashboard chrome** (no card grids, no hero metrics, no sidebar-for-sidebar's-sake)
- **Not a builder that hides the why** (like WindowBuilder)
- **Not MOOC-platform e-learning styling** (Coursera/Udemy corporate chrome)

---

## 4. Architecture & Engineering Excellence

### Faithful Layout Algorithms
The core thesis: **CSS approximations teach a lie.** Students who learn layout on flexbox/grid will be surprised when their real Swing code behaves differently. LayoutLab uses faithful JDK ports so students learn the actual rules.

**BorderLayout implementation:**
- 5-region specification (NORTH, SOUTH, EAST, WEST, CENTER)
- Preferred-size calculation: NORTH and SOUTH take their preferred heights; EAST and WEST take their preferred widths; CENTER absorbs remainder
- Collision detection: if two components are added to the same region, the second makes the first invisible (matches Swing's actual behavior)

**FlowLayout implementation:**
- Left-to-right component packing; rows wrap at frame width
- Row height is the max of all components in that row
- Alignment control: LEFT (default), CENTER, or RIGHT within each row

**GridLayout implementation:**
- Uniform cell sizing: all cells are the same width/height
- Row/col auto-derivation: if rows > 0, cols = ceil(component count / rows)
- Completely ignores component preferred sizes (unlike BorderLayout)

### Reducer-Driven State
- Single reducer function manages all state mutations
- Actions: `add`, `remove`, `select`, `setText`, `setLayout`, `resizeFrame`, `undo`, `redo`, `clear`
- Immutable updates: every action returns a new state tree
- 50-step history: past and future stacks for unlimited undo within the session

### Deterministic Code Generation
- **No approximation**: generated code is compilable `javax.swing`/`java.awt` vanilla Java
- **Deterministic naming**: algorithms produce the same variable names and code structure every time
- **Syntax accurate**: correct import statements, proper constructor calls, real Swing signatures
- **No LLM component**: all code is algorithmic; every line is verifiable

### TypeScript Strict Mode
- Zero compilation errors
- Full type safety: `SwingNode`, `Size`, `Rect`, `BorderRegion`, `DragTarget`, all properly typed
- React 19 types fully resolved (no `@ts-expect-error` comments)

---

## 5. Accessibility & WCAG AA Compliance

### Contrast
- **Body text**: 4.5:1 minimum against backgrounds (all spots verified)
- **Large text** (≥18px bold or ≥14px): 3:1 minimum
- **Secondary ink** (#6E6E73) validated at 5.53–5.72:1 on white panels
- **All interactive states** (armed Reset, shortcuts popover, code selection) pass AA floor

### Keyboard Navigation
- **Zero click-only interactive elements**: every action is reachable via keyboard
- **Tab order**: logical flow through palette, layout controls, canvas, and header actions
- **Roving tabindex**: segmented control implements ARIA radiogroup with arrow-key navigation, Home/End wrap
- **Focus visible**: all focusable elements have a clear focus ring

### Reduced Motion
- **CSS variable override**: `--dur: 0ms` in `@media (prefers-reduced-motion: reduce)`
- **All transitions** (component position, size, diff-flash) instantly disable under reduced motion
- **No auto-play animations**: everything is user-triggered
- **Fallback to instant transitions**: even hard-coded 120ms drops become instant under reduced motion

### Screen Reader Support
- **ARIA labels** on canvas components: `aria-label="{type} "{text}""` 
- **ARIA roles**: `role="button"`, `role="separator"`, `role="radiogroup"`, `role="radio"`
- **`aria-live="polite"`** on hint strip for dynamic hint updates
- **Semantic HTML**: real `<button>` elements, `<input>` for text editing, native `<select>` for dropdown

### Mobile & Responsive
- **Desktop**: 1280px+ viewport, full three-pane layout (palette | stage | code)
- **Tablet & mobile** (≤760px): header wraps, tagline hides, stage canvas scaled to fit (220px min-height → 218px on 375px width)
- **Touch targets**: interactive elements sized ≥28px where possible; handles are keyboard-accessible as fallback

---

## 6. Quality Assurance

### Testing
- **~43 passing tests** (Vitest) covering:
  - Layout engine: BorderLayout region resolution, FlowLayout row wrapping, GridLayout cell sizing
  - Java code generation determinism
  - Challenges: statement execution semantics and deterministic grading (Parsons/Reflow/Reverse)
  - Tree equivalence and first-divergence detection

### Code Quality
- **TypeScript strict mode**: 0 errors, 0 warnings
- **No console errors or warnings** in development or production
- **Pre-commit hooks**: linting, type check, test run (ensure quality gate before commit)
- **Deterministic snapshot testing**: same inputs → same layout → same code every time

### Browser Verification
- **Desktop (1280px+)**: full three-pane, tested and verified
- **Tablet (768px)**: header wraps, stage canvas resizable
- **Mobile (375px)**: stage canvas 218px tall, fully functional
- **Dark mode (prefers-color-scheme)**: not yet implemented; currently light-only (future phase)

---

## 7. Performance

### Runtime
- **Synchronous layout computation**: the whole tree lays out in a single pass on each
  action; component counts in this domain are small (tens of nodes), so reflow is
  perceptually instant
- **Reflow animation**: 150–200ms ease-out, so students *watch* components move to rest
- **Memoized layout & measurement**: `useMemo` recomputes the layout tree only when the
  tree or size changes; text metrics use a shared canvas measurer
- **Render discipline**: drag state lives in `useRef` to avoid per-move re-renders

### Build (measured, production `vite build`)
- **JS**: 259 kB raw / **79 kB gzipped** (React + React-DOM included)
- **CSS**: 22 kB raw / **5 kB gzipped**
- **Total**: ~281 kB raw / **~85 kB gzipped** — 44 modules, builds in well under a second
- **No dependencies beyond React + React-DOM** — no UI kit, state library, or CSS-in-JS

---

## 8. Target Audience & Impact

### Primary Users
**First/second-year polytechnic diploma students** taking a Java GUI course
- Age: 18–25
- Technical level: novice to early intermediate (first contact with event-driven GUI)
- Context: mid-lab-exercise with a deadline in days, code editor open in another window
- Pain point: "Why did my component end up there?" — confusion about layout manager rules

### Secondary Users
**Lecturers** who integrate LayoutLab into a scaffolded curriculum
- Need: tool that teaches the why without contradicting their labs
- Want: no sign-up, no API keys, no vendor lock-in (instant classroom deployment)

### Impact Metric
**Success = faster confusion resolution.** A student who would spend 20 minutes trial-compiling + debugging resolves their layout confusion in <2 minutes on LayoutLab, then applies that understanding to their own code.

---

## 9. Unique Differentiators

1. **Faithful JDK algorithms, not approximations**
   - Other tools (Figma, web-based layout editors) use CSS flexbox/grid, which teach a mental model that doesn't apply to real Swing.
   - LayoutLab computes *exactly* the way the real JDK does, pixel for pixel.

2. **Deterministic, compilable code**
   - Students copy the generated Java code and it compiles on the first try — no surprises, no "close enough."
   - No LLM hallucination or approximation.

3. **Tutor voice in error moments**
   - When a BorderLayout collision happens, the tool doesn't just show an error; it teaches the rule: "BorderLayout shows only the **last** component..."
   - Error messages are pedagogy.

4. **Full keyboard accessibility in an educational tool**
   - Not an afterthought; from day one, the entire UI is operable without a mouse.
   - Roving-tabindex radiogroups, keyboard-resizable frame, arrow-navigable components.

5. **WCAG AA compliance from the start**
   - Not a later audit finding; contrast, motion, and focus were verified during the hardening phase.
   - Reduced-motion fully supported.

6. **Minimal dependencies**
   - Only React + React-DOM; no UI libraries, no state management libraries, no CSS-in-JS overhead.
   - Fast to install, fast to build, easy to understand and modify.

7. **Apple-grade restraint**
   - The design doesn't distract from the learning. The one bold moment (the live canvas) is where it belongs.
   - No decorative gradients, no hero metrics, no card grids — just the tool.

---

## 10. Current Status

### Phase 1: Complete
- **Ship date**: 2026-07-04
- **Final design score**: 36/40 (Excellent, no P0/P1 issues)
- **Quality gates**: TS clean, ~43 tests pass, detector clean, WCAG AA verified
- **Surface tested**: desktop (1280px+), tablet (768px), mobile (375px)

### What's Shipped
- **Playground**: BorderLayout, FlowLayout, GridLayout; drag-and-drop + click-to-add;
  live code generation; undo/redo (50-step history); nestable JPanels
- **Challenges**: Parsons, Reflow, and Reverse modes with deterministic graders (6 exercises)
- Full keyboard accessibility, reduced-motion support, WCAG AA contrast and focus

### Remaining (future phases)
- More challenge content (pure data — no engine change needed)
- More components (JRadioButton, JList, JSlider) and dark mode (styling pass)
- GridBagLayout (new engine module — benefits Playground and graders at once)
- Progress/streak tracking in Challenges
- Lecturer challenge authoring from a Playground state

---

## 11. Getting Started

### Prerequisites
- Node.js 18+ (Vite requirement)
- pnpm or npm

### Installation
```bash
cd MagikLayout
npm install
npm run dev
```

The app opens at `http://localhost:5173` with HMR enabled.

### Build
```bash
npm run build
```

Output: optimized static bundle in `dist/`.

### Testing
```bash
npm run test
```

All ~43 tests run under Vitest.

---

## 12. Codebase Overview

### Directory Structure
```
MagikLayout/
├── src/
│   ├── components/       # Playground UI: Playground, Canvas, Palette, LayoutControls, CodePanel
│   ├── engine/          # Layout algorithms: BorderLayout, FlowLayout, GridLayout, layoutTree, metrics
│   ├── codegen/         # Deterministic Java code generator
│   ├── state/           # Playground reducer + actions
│   ├── challenges/      # Graded modes: executor, graders, players, data (parsons/reflow/reverse)
│   ├── styles/          # app.css (design tokens, responsive)
│   ├── router.ts        # Dependency-free hash router (#/ and #/challenges/:id)
│   └── main.tsx
├── PRODUCT.md           # Product brief and UX principles
├── DESIGN.md            # Design system and brand
├── HANDBOOK.md          # Companion handbook (features, structure, potential)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### Key Files
- **`src/components/Playground.tsx`** — UX orchestrator; drag, click-add, Reset, shortcuts
- **`src/components/Canvas.tsx`** — JFrame sim; renders components; handles resize
- **`src/engine/layoutTree.ts`** — Core layout computation (renders Playground *and* backs every grader)
- **`src/codegen/javaCode.ts`** — Deterministic Java generator
- **`src/state/playground.ts`** — Reducer + actions
- **`src/challenges/execute.ts`** — Statement executor with true Swing semantics
- **`src/challenges/grade.ts`** — Deterministic Parsons/Reflow/Reverse graders
- **`src/router.ts`** — Hash router for the flat Playground/Challenges IA
- **`src/styles/app.css`** — Full design system in CSS tokens

---

## 13. Metrics & Validation

| Metric | Target | Actual |
|--------|--------|--------|
| Design Score | ≥32/40 | **36/40** ✓ |
| Tests | Engine + codegen + grading covered | ~43 passing ✓ |
| TS Errors | 0 | 0 ✓ |
| WCAG AA Contrast | 4.5:1 body / 3:1 large | All verified ✓ |
| Keyboard Coverage | 100% UI operable | 100% ✓ |
| Reduced Motion | Full coverage | 100% ✓ |
| Bundle Size | Lean (no UI/state deps) | ~85KB gzipped ✓ |
| Desktop UX | Mobile viewport fails | 375px verified ✓ |

---

## 14. Why This Matters

Java Swing is still taught in 1000+ polytechnics and universities worldwide. It's the first place many students encounter event-driven GUI programming and the interaction between layout algorithms and component positioning.

**The problem**: Swing's layout system is non-obvious. Components don't position themselves; layout managers compute their positions algorithmically. Most students learn by trial-and-compile, which is slow and doesn't build conceptual understanding.

**The solution**: LayoutLab makes the invisible visible. In under 30 seconds, a student understands why BorderLayout hides the second component added to a region, or why GridLayout ignores preferred sizes. They watch it happen live, they read the code that expresses it, and they build mental models that stick when they write real code.

**This tool exists to correct a gap in software education.** It's not a builder that ships fast; it's a tutor that builds understanding.

---

## 15. Credits & Acknowledgments

Built with:
- React 19 + TypeScript 6
- Vite 8 + Vitest 4
- Faithful reimplementations of JDK 21 layout algorithms
- Apple's design language (with Duke Orange, not Apple Blue)

---

## Contact

For more information about LayoutLab, its pedagogy, or integration into curricula, contact:

**Project Owner**: [Name/Email]  
**Repository**: `/Users/macintosh/IdeaProjects/bulan/MagikLayout`  
**Live Demo**: (Deployment URL when available)

---

## License

[To be determined — likely MIT or educational open-source]

---

**Last Updated**: 2026-07-05  
**Project Status**: Phase 1 Complete, Shipped  
**Design Review**: 36/40 (Excellent), P0/P1 resolved
