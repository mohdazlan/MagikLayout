---
target: Rebuild-the-target reverse screen
total_score: 29
p0_count: 1
p1_count: 2
timestamp: 2026-07-07T10-26-40Z
slug: src-challenges-reverseplayer-tsx
---
# Critique — Rebuild the target screen (src/challenges/ReversePlayer.tsx)

Method: dual-agent (A: design review · B: detector/contrast evidence; A stalled once and was resumed to conclusion)

## Design Health Score
1: 3 · 2: 4 · 3: 3 · 4: 3 · 5: 2 · 6: 2 · 7: 3 · 8: 4 · 9: 3 · 10: 2 — **Total 29/40 (Good)**

## Anti-Patterns Verdict
Not slop — authored (real Playground components reused, honest structural diffing, disciplined scoped CSS). Detector: zero findings on this screen (two reflow-mode layout-transition hits, both the intentional whitelisted reveal — ignore.md broadened to cover all three selectors). All measured text passes AA (worst 4.91:1). Tab order logical, no console errors. Blind spot: composed at wide viewport; not validated at 1366×768.

## Priority Issues
- [P0] Target and build not co-visible at lab resolutions (420px frames + palette + 380px pane stack below ~1500px; build below the fold at 768px tall). Fix: scaled target + co-visibility.
- [P1] LayoutControls renders above the Target figure — reads as target metadata and leaks the root manager. Fix: move into the "Your build" figure.
- [P1] Click-to-add places at firstFreeRegion (CENTER first) with no indication. Fix: visible hint line.
- [P2] Arrangement fallback omits nested panel layout settings — misleading advice when only align/gaps differ. Fix: panel-spec comparison finding.
- [P2] Missing sibling kbd-hint convention; pass moment flat (green card a column away from the thing built). Fix: hint line + on-stage pass acknowledgment.

## Persona Red Flags
- Alex: no keyboard region choice; no duplicate; four drag-rename cycles for the calculator.
- Jordan: at 1366×768 first drag targets the only visible frame — the inert Target; CENTER-first placement unexplained.
- Sam: canvas root re-selection is pointer-only (frozen Canvas); region choice keyboard-inaccessible; otherwise better than average (labels, alerts, aria-live all present).

## Minor Observations
Target titlebar prints pixel size despite "sizes don't count" copy; card preview chrome text ~6px at 0.55× and reverse cards bottom-heavy; five red bullets is loud for the brand (findings could be ink); "Phase 2 proxy" is roadmap-speak; build state resets on navigation with no warning; Undo/Redo far from canvas.

## Questions
- Why is feedback a text list instead of annotations on the frames (Reflow draws "engine says here")?
- The Target is a live render — why inert? Hover-to-inspect would teach structural reading.
- Should "Check structure" be a button at all vs continuous matched-count instrumentation?
