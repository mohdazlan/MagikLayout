# MagikLayout — How to Use It (Walkthrough & Demo Script)

**Live:** https://magik-layout.mhdazlan.cc
**Four surfaces, one engine:** Playground (`#/`) · Challenges (`#/challenges`) ·
AR Lab (`#/ar-lab`) · AI Debugging Studio (`#/classroom`). Use the top navigation
to switch between them.

This doc has two parts:
- **Part A — Step-by-step usage** (how each surface works).
- **Part B — Demo-video script** (a timed narration you can read while recording).

---

## Part A — Step-by-step usage

### 1) The Playground (`#/`) — see *why* Swing places components
The workspace has three panes: **Palette** (left), **Stage/canvas** (centre), **Code** (right).

1. **Add a component.** Either **click** a palette item (JButton, JLabel, JTextField, JCheckBox, JComboBox, JPanel) — it drops into the selected container — or **drag** it onto the canvas to choose the exact spot. Keyboard: Tab to a palette item, press **Enter/Space**.
2. **Switch the layout manager.** Use the segmented switcher (**BorderLayout / FlowLayout / GridLayout**). Contextual knobs appear: gaps for all; `align` for Flow; `rows`/`cols` for Grid.
3. **Resize the frame.** Drag the **right / bottom / corner** edge (or Tab to a handle and use **arrow keys**, Shift for 1-px steps). *This is half the lesson* — you watch which regions stretch and which hold their size.
4. **Read the Java.** The right pane shows real, compilable `javax.swing` code, regenerated on every action. Changed lines **flash orange**; selecting a component highlights its variable; **Copy** takes the code to your IDE.
5. **The key teaching moment.** Add a **second** component to an already-occupied BorderLayout region — the first vanishes. The hint strip names the rule ("BorderLayout shows only the **last** component added to each region") and shows a chip for each hidden component (click to select, ✕ to delete).
6. **Undo/Redo** (⌘Z / ⇧⌘Z), **Reset** (two-step: click once to arm, again to clear), and **?** for the shortcuts panel.

### 2) Challenges (`#/challenges`) — graded practice, deterministic feedback
The index lists **ten exercises grouped by mode**. Pick one; each is graded by the *same* engine that renders the Playground, so feedback always matches real Swing.

- **Parsons — "order the code."** Drag shuffled Java statements into the correct order. On a wrong order, the grader points at the **first statement that diverges** from a correct solution.
- **Reflow — "predict the reflow."** Drag a ghost of a component to where you think it lands **after** the frame resizes, then submit — the tool animates the true reflow and names the rule.
- **Reverse — "rebuild the target."** You're shown a target frame; rebuild it in a mini-Playground. **Check structure** grades it; on success you get a congratulation plus teaching notes; your live generated Java is shown alongside.

**The AI Coach (opt-in, bilingual).** When a check **fails**, an **"Ask the AI coach for a hint"** button appears under the findings, with an **EN / BM** toggle. Tap it for one Socratic hint. The coach only *explains* the engine's findings — it never grades and never gives the answer. (It needs a backend key configured; if none is set it politely says so and nothing else changes.)

### 3) AI Debugging Studio (`#/classroom`) — visual repair with grounded AI

1. Choose one of the **12 missions** in the horizontal catalogue.
2. Study the **Live Swing state** and select a prediction before requesting help.
3. Read the mission-specific inspector: direct occupants, visible occupant, rule,
   and deterministic misconception code.
4. Select the repair tool, then complete the second build step. The state moves
   from **broken → tool ready → repaired**.
5. Ask for one hint at any time. Select **EN** or **BM**; the RAG pipeline retrieves
   approved material and Claude Haiku may compose the response. If the model is
   unavailable or rejected, approved corpus text is served instead.
6. Expand **AI evidence and safety checks** to inspect retrieved sources, cited
   sources, latency, and guard status.
7. After **Repair verified**, inspect the generated Java and component tree, then
   choose **Explain why this works** for the post-success explanation.

Lesson Pack and Class Session are intentionally hidden from this route. The
complete feature contract is in [MagicAI.md](MagicAI.md).

### 4) AR Lab (`#/ar-lab`) — the NOSS-aligned immersive module
> **Needs a phone with a camera and a printed (or on-screen) target.** Works in **iOS Safari** and Android Chrome. The page must be served over **HTTPS** (the live URL is).

**Prepare:** print or open `public/ar/layoutlab-target.png` on a second screen. Good, even lighting helps tracking.

**Run:**
1. On the phone, open **`https://magik-layout.mhdazlan.cc/#/ar-lab`**.
2. Choose your language (**English / BM**) — instructions are also **spoken** aloud.
3. Tap **Begin AR module**, then **Start AR camera**, and **allow camera access**.
4. Point the rear camera at the **whole target** until **"Target found"** appears — a virtual `JFrame` and its five `BorderLayout` regions anchor to the card.
5. Complete the **three missions** (tap the tracked 3D object each one asks for):
   - **Mission 1** — place the title in the correct region (**NORTH**).
   - **Mission 2** — tap the region that absorbs space (**CENTER**) and watch the frame resize.
   - **Mission 3** — reveal the **SOUTH** two-button collision (X-ray), then activate the **repair control** to build a nested `JPanel` holding both buttons.
6. Watch the **score reach 3/3**, then expand **"Java evidence"** to see and record the generated Swing code — proof the AR state maps to real code, with **no AI in the grading**.
7. Exit with the **←** control; the camera is released and the module can restart.

**NOSS mapping** is shown in the module: IT-010-3:2016 · Pembangunan Aplikasi · Tahap 3 · CU IT-010-3:2016-C01.

---

## Part B — Demo-video script (~2½ minutes, read while recording)

> Cut between screen recordings. Keep the phone segment (AR) separate from the desktop segments.

**[0:00–0:15 — Hook, on the Playground]**
> "This is MagikLayout. Java beginners struggle with one invisible idea — you don't place components, *layout managers* do. MagikLayout makes that visible in the browser, with no install."

*(Drag a JButton and a JLabel onto the canvas.)*

**[0:15–0:45 — Playground: engine + code]**
> "Everything you see runs faithful re-implementations of the real JDK layout algorithms — not a CSS fake — and this panel is the exact, compilable Java it produces. Watch what happens when I resize the frame…"

*(Drag the frame edge; point at CENTER stretching.)*
> "…CENTER absorbs the space while NORTH keeps its height. And if I add a second component to the same region —"

*(Add a second component to an occupied region; it vanishes; point at the hint.)*
> "— Swing hides the first one. Instead of a silent mystery, MagikLayout names the rule and lets you recover. That's the whole philosophy: show *why*, not just *what*."

**[0:45–1:20 — Challenges + AI Coach]**
> "In Challenges, that same engine becomes a grader — ten exercises across three modes: order the code, predict the reflow, rebuild the target. Because the grader *is* the engine, feedback always matches real Swing."

*(Open a Reverse or Parsons challenge; submit a wrong answer.)*
> "When I get it wrong, I can ask the AI Coach — in English or Bahasa Malaysia."

*(Tap "Ask the AI coach for a hint"; show the hint.)*
> "But here's the safeguard: the deterministic engine is the only judge. The AI *explains* the engine's findings — it never grades and never hands over the answer. That means it can't confidently teach wrong Swing behaviour."

**[1:20–2:20 — AR Lab (phone footage)]**
> "For the immersive category, we built an AR Lab aligned to the NOSS competency IT-010-3. I point my phone at a printed target…"

*(Show "Target found" + the anchored JFrame.)*
> "…and a virtual JFrame anchors to the real world. There are three assessed missions. First, place the title in the correct region…"

*(Complete Mission 1.)*
> "…next, tap the region that absorbs space and watch it resize…"

*(Complete Mission 2.)*
> "…and finally, reveal a two-button collision in SOUTH and repair it into a nested panel."

*(Complete Mission 3 → 3/3 → expand Java evidence.)*
> "Three out of three — and the AR state generates real Swing code as evidence. No AI in the grading; it's the same deterministic engine, in augmented reality — and it runs on an ordinary iPhone."

**[2:20–2:35 — Close]**
> "One engine, four surfaces: a Playground that shows why, Challenges that grade
> like real Swing, an AI Debugging Studio with twelve visual repair missions, and
> an AR lab that makes the rules tangible. The engine judges; retrieval grounds;
> Haiku explains; the guard controls delivery."

---

### Honesty notes for the pitch (keep these true)
- Say **"prototype / not yet classroom-validated"** — a Politeknik pilot is the planned next step; don't claim student results you don't have.
- For AR on **iPhone**, the image-tracking path works in Safari; if a device can't track, say so plainly rather than letting a judge discover it. Do one **dry run** on the exact phone before recording (well-lit, full target in frame).
- The **AI Coach** needs a configured backend key; confirm **one live round-trip** before filming so the hint returns for real.
