---
target: Predict-the-Reflow screen
total_score: 22
p0_count: 1
p1_count: 2
timestamp: 2026-07-06T21-28-53Z
slug: src-challenges-reflowplayer-tsx
---
# Critique — Predict-the-Reflow screen (src/challenges/ReflowPlayer.tsx)

Method: dual-agent (A: design review · B: detector/contrast evidence)

## Design Health Score
1: 2 · 2: 3 · 3: 2 · 4: 2 · 5: 2 · 6: 2 · 7: 3 · 8: 3 · 9: 2 · 10: 1 — **Total 22/40 (Acceptable, reveal under-built)**

## Anti-Patterns Verdict
Not slop — considered predict phase (honest W2 drop zone, hatched sweep strip, accent discipline). Detector: 0 net findings (only the whitelisted layout-transition). Contrast: .ch-ghost-tag 2.43:1 FAIL and ghost outline 1.93:1 FAIL (non-text 3:1) — shared root cause: opacity 0.55 on the whole .ch-ghost element. .ch-truth-label passes but has no plate (backdrop-dependent).

## Priority Issues
- [P0] overflow:hidden on .jframe-content deletes reveal evidence: truth label truncates ("engine says h"), guess ghost invisible after shrink on flow-wrap, ghost tag clipped below full-height EAST ghost. Fix: hoist overlays into an unclipped layer; frame renders at true size.
- [P1] Payoff is 180ms, unrepeatable, 0ms under reduced motion; verdict fires simultaneously with the animation. Fix: dedicated ~480ms reveal, verdict after settle, Replay button.
- [P1] Fail verdict reports distance, never the layout rule. Fix: engine-derived lesson line per layout kind/region.
- [P2] A11y/consistency debt vs fixed Parsons: no visible kbd hint, no focus ring on ghost (permanent outline replaces UA ring), role="slider" without aria-valuenow/min/max, no disabled-submit reason, no next-challenge link, tolerance contract hidden until after submit.
- [P2] Label collisions on wrap seed: edge label prints over Open/Save buttons. Fix: anchor label to the bottom gutter.

## Persona Red Flags
- Alex: no replay, reset re-centers ghost (adjust-and-retry = redo the drag), Shift=1px undiscoverable.
- Jordan: "which Send is the ghost?"; tolerance contract revealed only after failing; sub-1180px puts submit/verdict below the fold.
- Sam: no visible focus indicator on the only focusable canvas object; slider role announces without value; post-lock-in ghost keeps focus at tabIndex -1 — arrows die silently.

## Minor Observations
Pass copy in wrong tense; fail copy fuzzy antecedent and never names the failing axis; titlebar dims (440×280) vs surface-wide chrome (622px) honesty crack; three stacked borders on pass (hide locked ghost); ch-ghost-tag/ch-resize-guide-label duplicate rules; codegen comment "setSize includes the title bar" vs content-pane engine semantics (frozen codegen — flagged, not fixed); dead space in the code pane.

## Questions
- Should the screen stage its own drama (resize → settle → truth → verdict)?
- Why one point at one end width instead of dragging the frame edge continuously?
- Is the mode a mode, or two demos? (Data model could generate a randomized ladder.)
