# Critique ignore list

- `layout-transition` in `src/challenges/challenges.css` on any `.ch-reflow-frame` selector (the frame chrome width transition, the `.jframe-content` width/height transition, and the `.sw` transition-duration override): all three are one intentional animation. The Predict-the-Reflow mode animates a real JFrame resize so the layout engine visibly re-lays-out children at intermediate sizes — `transform: scale` cannot reproduce that. Scoped under `.ch-reflow-frame`, user-triggered, driven by `--ch-reveal-dur`, and zeroed under `prefers-reduced-motion`.
