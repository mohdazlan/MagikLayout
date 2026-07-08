---
target: Parsons challenge screen
total_score: 25
p0_count: 1
p1_count: 3
timestamp: 2026-07-06T17-39-11Z
slug: src-challenges-parsonsplayer-tsx
---
# Critique — Parsons challenge screen (src/challenges/ParsonsPlayer.tsx)

Method: dual-agent (A: design review · B: detector/contrast evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Disabled submit gives no reason; ok-dot meaning hover-only |
| 2 | Match System / Real World | 4 | javac voice + Swing chrome pitch-perfect |
| 3 | User Control and Freedom | 2 | No undo; drag-out silently removes; Start over nukes all |
| 4 | Consistency and Standards | 3 | Header drops Playground Undo/Redo convention |
| 5 | Error Prevention | 3 | Accidental drag-out removal; tiny × hit target |
| 6 | Recognition Rather Than Recall | 2 | 0.55-scale target ~7px labels; verdict cites statement in other pane |
| 7 | Flexibility and Efficiency | 2 | Alt+↑/↓, Delete, Enter exist but advertised nowhere |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; big empty live frame dominates first paint |
| 9 | Error Recovery | 2 | setLayout trap fires as muted grey text in far pane |
| 10 | Help and Documentation | 1 | No help affordance, no legend, keyboard model invisible |
| Total | | 25/40 | Acceptable |

## Anti-Patterns Verdict
Not AI slop — clearly authored. Detector: 1 finding (layout-transition warning, challenges.css:441) — intentional reflow-mode mechanism (real JFrame resize; children must re-lay-out at intermediate sizes). All measured text ≥4.5:1 contrast; disabled submit ~2.03:1 but WCAG-exempt (inactive control).

## Priority Issues
- [P0] setLayout trap whispers: unmanaged-component lesson is muted grey in the opposite pane; causal line shows a clean dot. Fix: warning treatment + inline mark on causal statement.
- [P1] Verdict and cause in opposite panes. Fix: verdict at top of program pane; "Statement N" scrolls/focuses the magnet.
- [P1] Target rendered at 0.55 scale (~7px labels). Fix: render 1:1.
- [P1] No undo + silent drag-out removal. Fix: undo history + ⌘Z.
- [P2] Tray scanning cost (8–9 identical mono chips). Fix: syntax tinting with existing token palette.

## Persona Red Flags
- Alex: no partial check; misdrag delete unrecoverable; no "next challenge" after pass; Alt+↑/↓ undiscoverable.
- Jordan: doubled error message (stage + inline, different wording) reads as two errors; disabled submit unexplained; can't read OK/Cancel order in scaled target; setLayout trap burns >30s budget.
- Sam: nested-listitem role bug; Alt+↑/↓ unannounced; focus falls to body after Delete; SwingFrame output has no text alternative (prompt copy compensates).

## Minor Observations
Raw hex #b9b9c1 hover; disabled submit keeps saturated orange; "Program 8/8" heading doing double duty; below 1180px the edit→watch loop breaks; post-pass primary should become "Next challenge"; fail verdict is a 31-word sentence.

## Questions
- Why is the ground truth the smallest thing on screen (target-as-overlay instead)?
- Is the explicit submit ritual necessary when the engine grades every keystroke?
- Should the setLayout trap be the loudest moment the screen ever produces?
