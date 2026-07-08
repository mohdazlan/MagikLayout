<!-- Tokens committed from spec Section 6 + confirmed accent decision. Re-run /impeccable document after Phase 1 ships to capture real component specs. -->

---
name: LayoutLab
description: A Swing layout playground — Apple-calm frame around a dense, honest tool.
colors:
  bg: "#FBFBFD"
  ink: "#1D1D1F"
  ink-secondary: "#6E6E73"
  surface: "#FFFFFF"
  hairline: "#D2D2D7"
  duke-orange: "#E8590C"
  duke-orange-deep: "#B54708"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontWeight: 400
    fontSize: "15px"
    lineHeight: 1.5
  code:
    fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace"
    fontSize: "13px"
    lineHeight: 1.6
---

# Design System: LayoutLab

## 1. Overview

**Creative North Star: "The Quiet Lab Bench"**

Apple's restraint translated to a learning tool: a nearly-white room where the only saturated thing is the work itself. The Playground canvas is the one moment of boldness — live, reflowing, dense — and everything around it (header, palette, code panel) stays typographically quiet so the student's eye goes to cause and effect, not chrome.

The system explicitly rejects being "a skin over apple.com" (hence no Apple blue), generic SaaS dashboard chrome, and MOOC-platform e-learning styling — all named in [PRODUCT.md](PRODUCT.md).

**Key Characteristics:**
- System sans everywhere; hierarchy from weight and tracking, not from a second face
- One warm accent (Duke Orange) reserved for interaction: active states, selection, drop targets, focus
- Hairline borders and generous padding instead of shadows and cards
- The tool region is dense; the frame around it is spacious

## 2. Colors

**The Restrained Rule.** Duke Orange appears only on interactive or active elements — selection outlines, drop highlights, active segments, focus rings, diff flashes. Never as decoration, never as a background wash.

### Primary
- **Duke Orange** (#E8590C): the Java-tied accent (Duke, Sun's warm palette) — active/interactive states only. Use **Duke Orange Deep** (#B54708, ≥4.5:1 on white) whenever orange must carry text or small glyphs.

### Neutral
- **Off-White** (#FBFBFD): body background — Apple's own near-white, not pure white.
- **Panel White** (#FFFFFF): the canvas frame and code panel surfaces, one step brighter than the body.
- **Ink** (#1D1D1F): near-black primary text.
- **Ink Secondary** (#6E6E73): captions, hints, secondary labels (4.5:1 on white — do not go lighter).
- **Hairline** (#D2D2D7): 1px borders and dividers; the only edge treatment.

## 3. Typography

**Display Font:** system sans stack (SF Pro on macOS, Segoe UI on Windows)
**Body Font:** same family
**Code Font:** SF Mono / ui-monospace stack

**Character:** The Apple tell isn't the font, it's the restraint — one family, real weight variation (400/500/600), slightly negative tracking on headings, generous line-height on prose.

### Hierarchy
- **Display** (600, ~28px, -0.02em): the wordmark and any future landing hero.
- **Title** (600, 15–17px): pane headers ("Components", the frame title).
- **Body** (400, 15px, 1.5): explanatory copy, hints.
- **Label** (500, 12–13px): control labels, palette items, segmented control.
- **Code** (400 mono, 13px, 1.6): the Java panel; syntax color stays muted, diff flash uses the accent.

## 4. Elevation

Flat by default. Depth is conveyed by hairline borders and the one-step brightness difference between body (#FBFBFD) and panel (#FFFFFF). The single sanctioned shadow is the macOS-style soft shadow under the segmented control's active pill and under a component while it is being dragged (state, not decoration).

**The Flat-By-Default Rule.** If something looks lifted, the user is currently interacting with it.

## 5. Components

`[First-pass specs live in src/styles/; re-run /impeccable document in scan mode after Phase 1 to extract them here.]`

Committed component decisions:
- **Segmented control** (layout-manager switcher): macOS Settings style — light gray track, white active pill with soft shadow; never a dropdown.
- **Canvas components**: rendered Swing-plausible (neutral gray buttons, inset text fields), positioned exclusively by the layout engine's pixel output — CSS never decides position.
- **Motion**: 150–200ms ease-out on component position/size changes (the reflow *is* pedagogy); instant under `prefers-reduced-motion`.

## 6. Do's and Don'ts

### Do:
- **Do** reserve Duke Orange for interactive/active states; a screen at rest is nearly monochrome.
- **Do** use hairlines + brightness steps for structure; no card stacks, no ambient shadows.
- **Do** let the code panel and canvas carry density; keep the surrounding frame quiet and generous.
- **Do** animate reflows at 150–200ms ease-out so students *watch why* components moved.

### Don't:
- **Don't** use Apple blue #0071E3 — "a skin over Apple's actual site" is a named anti-reference.
- **Don't** approximate the canvas with flexbox/grid; position only from the engine's computed pixels.
- **Don't** ship SaaS dashboard chrome: card grids, hero metrics, sidebar-for-sidebar's-sake (PRODUCT.md anti-references).
- **Don't** drop below 4.5:1 for any text; #6E6E73 is the lightest permitted gray.
- **Don't** use gradient text, glassmorphism, or side-stripe borders anywhere — **except** the controls strip and hint strip, which use macOS-style frosted translucency (`backdrop-filter: blur(8px)` over `color-mix(…, 88%, transparent)`) as a functional depth cue separating chrome from canvas.
