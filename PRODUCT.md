# Product

## Register

product

## Users

Primary: first/second-year polytechnic diploma students taking a Java GUI course — first contact with event-driven layout, usually mid-lab-exercise with a deadline in days. They have a code editor open in another window and a lab sheet next to it. Secondary: the lecturer, who needs the tool to slot into an existing scaffolded curriculum without contradicting it.

Design consequence: this is a *reference companion*, not a marketing site. Optimize every screen for "get the answer to my confusion in under 30 seconds," not for dwell time.

## Product Purpose

LayoutLab (working name; repo dir `MagikLayout/`) is the tool students open **before** they're ready for WindowBuilder: a sandbox that shows *why* a component lands where it lands, not a builder that hides the why to ship faster. Students drag Swing components onto a live canvas, switch layout managers, resize the frame, and watch real, compilable Java code update with every action. Success: a confused student resolves a layout question faster here than by trial-compiling.

The canvas is driven by faithful JS reimplementations of the real JDK layout algorithms (BorderLayout, FlowLayout, GridLayout in Phase 1) — never CSS flexbox/grid approximation, which would teach a mental model that contradicts what happens when students compile the real code. This is the single highest-leverage engineering decision in the project.

## Brand Personality

Apple-grade restraint: calm, precise, quiet. The one moment of boldness is the live reflowing canvas itself; everything around it stays out of the way. Tone of voice is a tutor naming a rule, never a chatty assistant.

## Anti-references

- **A skin over apple.com**: Apple's restraint yes, Apple's identity no (hence Duke-orange accent, not Apple blue).
- **Generic SaaS/dashboard chrome**: card grids, sidebars-for-the-sake-of-sidebars, hero metrics.
- **WindowBuilder / drag-and-drop builders that hide the why**: convenience that suppresses understanding is the exact failure this tool exists to correct.
- **MOOC-platform look** (Coursera/Udemy corporate e-learning chrome).

## Design Principles

- **Show why, not just what.** Every visual change on the canvas must be traceable: the layout rule that caused it and the code line that expresses it.
- **Answer confusion in under 30 seconds.** No gates, no auth, no onboarding ceremony between a student and their answer.
- **Resize is half the lesson.** A layout tool that never resizes teaches half of layout; the frame edge is a first-class control.
- **Real code is ground truth.** The code panel is deterministic, compilable, vanilla `javax.swing`/`java.awt` — never approximated, never LLM-generated.
- **Restraint frames the tool.** The Playground is appropriately dense; the frame around it is quiet, spacious, and Apple-calm.

## Accessibility & Inclusion

WCAG AA baseline: contrast, full keyboard paths (palette and canvas operable without a mouse), visible focus, reduced-motion alternatives for all reflow animation.
