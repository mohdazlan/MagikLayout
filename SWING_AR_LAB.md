# Swing Discovery Lab

An additive beginner module, linked **below** the original BorderLayout module at
`/#/ar-lab`. The new entry page is `/swing-ar.html`. The original MindAR activity,
tracking card, documents and all other learning routes are retained.

## Teaching sequence

The learner sees a component before handling syntax. The free library includes
JButton, JTextField, JPanel, JFrame and JLabel. Each has a concrete analogy and a
small action. The lab never labels the learner as weak or treats exploration as
proof of mastery. Progress is session-only and explicitly means activities explored.

1. **Component Recognition:** a floating JButton starts the loop. Rotate, magnify,
   tap, place it in a JFrame, and inspect the matching constructor and `add` call.
   Next Component cycles all five original GLB assets using the same Hiro marker.
2. **Layout Manager Playground:** compare FlowLayout and BorderLayout with the
   same three buttons, then resize the window. Java is initially hidden.
3. **Build-a-Frame Challenge:** reconstruct the target label/field/button interface.
   Choose a component and tap a 3D region or drag the selected piece onto it.
   Region selection and Place provide a keyboard alternative. Structural checking
   reveals the Java only after a correct build; editing revokes that result.
4. **Debug the AR Scene:** inspect the two direct SOUTH occupants and the hidden
   Save button, then repair with one JPanel containing Save and Cancel.
   This teaches the actual BorderLayout disappearance rule. It does not falsely
   imply that two direct SOUTH children normally appear as overlapping buttons.
5. **Event Handling Simulation:** a button press does nothing until a listener is
   attached. A subsequent press changes the label and highlights the callback.
   The browser simulates the event; Java runs only after export to a local JDK.

## Run and deploy

```sh
npm install
npm run dev
# http://localhost:5180/swing-ar.html

npm test
npm run build
npm start
# http://localhost:3000/swing-ar.html
```

The optional Express server serves `dist/` and `/api/health`. No backend, account,
database or API key is needed by the learning loop. Vercel serves the same built
pages statically; the optional Express health endpoint belongs to `npm start`.

`vercel.json` configures the Vite build and output directory. To deploy using an
authenticated Vercel account:

```sh
npx vercel login
npx vercel --prod
```

For this session, Vercel CLI is signed out and the temporary deployment API
returned `403 Not authorized`. The build is ready in `.vercel/output/static`,
with Build Output API v3 routing in `.vercel/output/config.json`; publishing is
pending account authorization. A local build alone does not establish that a
public deployment exists. The prepared upload contains only 28 application
asset/configuration files (about 6 MB), excluding PDFs, Word documents, Blender
sources, environment files and dependencies. The standalone preview uses the
existing deterministic coach fallback; local coach endpoint settings were not
bundled into this public deployment payload.

After Vercel authorization, deploy the prepared output using
`npx vercel deploy --prebuilt --prod`. Keep camera use
on HTTPS outside localhost. The standard Hiro pattern is supported; ordinary QR
codes are not AR.js pattern markers. Custom patterns need a trained `.patt` file.

## Architecture and asset provenance

- `swing-ar.html`: small, separate Vite entry; it does not replace `index.html`.
- `src/swing-ar/main.ts` and `style.css`: mobile-first learner interface and Monaco.
- `src/swing-ar/model.ts`: deterministic lesson state, Java and geometry adapters.
- `public/swing-ar/scene.html`: isolated A-Frame 1.6.0 / AR.js 3.4.7 scene.
  Isolation keeps AR.js camera/video sizing away from the surrounding application.
- Monaco Editor 0.52.2 loads on demand from a pinned CDN URL. The read-only editor
  always has a copyable/downloadable text fallback if the CDN cannot be reached.
- The main application keeps its existing dependency graph. A-Frame and AR.js
  only load inside this lab; AR.js and the camera load after Start AR camera.
- `layoutTree`, `gradeReverse`, and `generateJava` remain the source of the Swing
  layout, structural checking and source generation. This entry wraps UI creation
  in `SwingUtilities.invokeLater`. It does not use AI to grade or generate Java.
- 3D magnification and rotation are viewing aids. Window width changes Swing
  `setSize`. Text metrics approximate a desktop look-and-feel; OS borders and
  font rendering can differ. The ordering, nesting and layout rules are shared.
- `scripts/export_swing_models.py` creates original low-poly geometry in Blender
  and exports five glTF 2.0 binary files. Source `.blend` files are in
  `brand/swing-ar/`; exported models are in `public/swing-ar/models/`.
- Export command: `blender --background --factory-startup --python scripts/export_swing_models.py`.
  These assets were exported using Blender 4.5.0. No third-party model is used.
- `public/swing-ar/hiro.png` is the standard marker from the AR.js 3.4.7 repository:
  https://github.com/AR-js-org/AR.js/blob/3.4.7/data/images/hiro.png .
  AR.js uses the MIT license. The printable worksheet is `public/swing-ar/marker.html`.

The starter uses one HTML entry plus a small scene document and shared modules.
Duplicating the existing Swing engine into a monolithic HTML file would introduce
another source of truth. All source files remain directly editable.

## Camera and device acceptance

No camera opens on page load. Start explicitly, allow access, and point at the
printed Hiro marker. The status must distinguish preview, camera on, marker found,
and marker lost. Stop camera, hide the tab, or leave the page to release the stream.
Camera denial returns the learner to the usable 3D preview with recovery guidance.

### Verification completed — 14 September 2026

- 207 automated tests across 18 files pass, including ten new lesson-state tests.
- TypeScript checking and the production build pass. Existing MindAR vendor
  externalization and chunk-size warnings remain.
- Eight exported Java examples (five components, build, debug and events) compile
  with `javac` 23.
- Chrome at 1440px and 375px: original AR lab retained, new lab below it, all five
  activities, code gating, model switching, layout resizing and mobile overflow
  checks pass. Monaco loads successfully; no application console errors occurred.
- Real A-Frame raycasting: tap, drag rotation, drag from the component tray into
  NORTH/CENTER/SOUTH, structural checking and a 3D event-button tap pass.
- Real AR.js detects Hiro from a synthetic camera video; model switching works
  with tracking active. Stop returns to preview with no video stream attached.
- Camera denial, restored-page restart, resizing, unavailable Monaco text
  fallback and blocked A-Frame retry pass in isolated Chrome sessions.
- `npm audit --omit=dev` reports zero known production dependency vulnerabilities.

Browser QA scripts and screenshots are retained in `tmp/swing-ar-qa/`. Synthetic
camera checks are not physical phone tests; the classroom acceptance below is
still required.

Before a classroom demonstration, test on the exact iPhone Safari and Android
Chrome devices over HTTPS:

1. Load the free preview and inspect the five components.
2. Open the printable worksheet on a second screen or paper.
3. Start camera, allow access, acquire the full Hiro marker, and walk around it.
4. Switch all five models while keeping the same marker in view.
5. Test rotation, magnification, placement, resize, build checking, debug repair,
   and a button press with and without a listener.
6. Confirm generated Java matches the state and the downloaded MyApp.java compiles.
7. Lose/reacquire the marker, deny/retry permission, stop/restart the camera, leave
   the page, and hide/restore the tab. Confirm the camera indicator turns off.
8. Repeat at 375px width, keyboard-only, and reduced motion. Record device/browser
   versions and tracking time. Automated browser checks do not replace this test.

## Eight-week pilot roadmap

| Weeks | Deliverable |
| --- | --- |
| 1–2 | Validate these five models; create five worksheet cards/custom markers. |
| 3–4 | Validate the A-Frame + AR.js prototype on student phones. |
| 5 | Pilot live Monaco Java previews with novice readers. |
| 6 | Refine touch targets and drag placement from device observations. |
| 7 | Pilot with 20 students who need additional support; collect consented pre/post and usability evidence. |
| 8 | Iterate from observed difficulties and record the demonstration video. |

The first proof remains **one JButton, one Hiro marker, one live Java preview**.
The five short activities are starter interactions, not a validated full curriculum.
No learning gain is claimed before the planned pilot is completed.

## Proposed commercial extensions

The free component library remains immediately accessible. Exam Mode and
certificates are future paid features. An institutional price hypothesis is
**RM 5–10 per student per semester**, to validate with lecturers; this is not a
live checkout offer. Physical marker kits could pair worksheets with access codes.
White-label lecturer lesson uploads require future authoring, storage, access
control and content review. None of these paid/account features is represented
as already implemented.

## Reference review before implementation

The project inventory contained 95 Markdown/PDF files outside dependencies, build
output and Git metadata, including hidden tooling references. All source files
were opened for extraction; duplicate tooling references and PDF revisions were
compared. The product/AR documents, teaching narratives and PDF abstracts informed
the additive scope, concrete analogies, deterministic grading, accessibility and
honest pilot claims. Historical test counts and device claims in those documents
are not evidence that this new module has passed physical-device acceptance.

Primary library references consulted:

- https://ar-js-org.github.io/AR.js-Docs/ui-events/
- https://ar-js-org.github.io/AR.js/
- https://github.com/microsoft/monaco-editor/tree/main/samples
- https://vercel.com/docs/frameworks/frontend/vite
