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

1. Place a title in the correct `BorderLayout` region.
2. Predict which region absorbs space when the `JFrame` becomes wider.
3. Diagnose two buttons competing for SOUTH and fix the structure with a nested `JPanel`.

The mission state is converted into the same deterministic Swing component tree used by the existing Java generator. Generative AI is not used for AR grading.

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

## Current asset note

`public/ar/layoutlab-target.png` and `public/ar/layoutlab-target.mind` are temporary image-tracking fixtures from the MIT-licensed MindAR example set. Replace both with a compiled, original LayoutLab tracking target before the final competition submission, then record the replacement in the asset register.
