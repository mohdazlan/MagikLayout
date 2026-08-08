# LayoutLab AR — P0 Competition Build

## Competition scope

**NOSS:** IT-010-3:2016 — Pembangunan Aplikasi, Tahap 3

**Competency Unit:** IT-010-3:2016-C01 — Application Prototype Development

**Primary Work Activity:** Implement Application Prototype Mock-Up Flow

**Supporting activity:** Conduct User Interface and User Experience Functionality Test

The assessed sub-topic is deliberately narrow: constructing, resizing, and diagnosing a Java Swing `BorderLayout` prototype. `FlowLayout` and `GridLayout` remain enrichment content in the wider Playground.

## Media and learning elements

The module includes more than the required three elements:

1. Text — NOSS mapping, outcomes, instructions, Swing rules, and generated Java.
2. Tracked 3D graphics — a virtual `JFrame`, its five regions, and Swing components anchored to a real target.
3. Animation — CENTER resize reveal and collision/X-ray reveal.
4. Audio — user-triggered BM/English spoken instructions using the device speech engine.
5. Interactivity and assessment — region placement, resize prediction, collision diagnosis, structural correction, scoring, and retries.

## Three assessed missions

1. Tap a tracked 3D region to place a title in the correct `BorderLayout` region.
2. Tap the region that should absorb space and observe the virtual `JFrame` resize.
3. Tap SOUTH to reveal two colliding buttons in X-ray mode, then activate the glowing AR repair control to construct a nested `JPanel`.

The mission state is converted into the same deterministic Swing component tree used by the existing Java generator. Generative AI is not used for AR grading.

## P2 AR-essential interaction

The assessed answers are no longer submitted through a conventional quiz button grid. Touch coordinates in the camera view are raycast against the tracked Three.js meshes, and only hits on the mission-relevant 3D object advance the deterministic mission state machine. This makes image tracking, spatial anchoring, 3D graphics, touch interaction, animation, and structural feedback necessary to complete the assessed flow.

Mission 3 uses a forgiving invisible interaction surface across SOUTH and the visible yellow repair control. This preserves the spatial learning intent while making the touch target reliable on an iPhone screen. On completion, a dedicated action expands and scrolls to the generated Java evidence for NOSS demonstration and recording.

## iPhone 13 acceptance test

The production deployment must use HTTPS; iOS blocks camera access on an insecure remote origin.

1. Open `https://<production-host>/#/ar-lab` in Safari on the iPhone 13.
2. Open `/ar/layoutlab-target.png` on a second screen or print it.
3. Select **Begin AR module**, then **Start AR camera**.
4. Allow camera access.
5. Point the rear camera at the complete target image until “Target found” appears.
6. Complete all three missions and confirm the score reaches 3/3.
7. Expand **Java evidence** and confirm that the final code contains one `JPanel` in `BorderLayout.SOUTH`, with Save and Cancel inside it.
8. Exit and reopen the module; confirm the camera is released and can start again.
9. Repeat once with BM selected and confirm spoken instructions use `ms-MY` where available.

Record the iOS version, Safari version, permission result, tracking time, mission completion, audio result, and any thermal or performance issue in the competition device matrix.

## Original tracking target

`public/ar/layoutlab-target.png` is an original LayoutLab-branded tracking card with dense, asymmetric detail across the complete frame. It was compiled with the official MindAR 1.2.5 image-target compiler into `public/ar/layoutlab-target.mind`.

Compilation acceptance evidence:

- Resolution: 1448 × 1086 (4:3)
- Scale keyframes: 12
- Detected feature points: 4,656 (3,496 maxima and 1,160 minima)
- Previous P0 target retained under `brand/ar-target-legacy.*` for local rollback
