# MagikLayout AI Debugging Studio - Complete 12-Mission Recording Storyboard

## Recording goal

Record one continuous, unhurried walkthrough of all 12 missions at `#/classroom`. The viewer should understand the broken geometry, the misconception diagnosed by the deterministic engine, the grounded AI hint, the two-stage structural repair, and the generated Java evidence.

## Standard shot pattern for every mission

Use this pattern in every mission. Hold each important state for 3-5 seconds, and hold AI responses/evidence for 6-10 seconds so viewers can read them.

1. Select the mission card and hold on the title, goal, broken Swing state, inspector, and `1/3` rail.
2. Click **Highlight [focus]** and point out the affected region or container.
3. Click **Replay add order** and let the geometry animation finish.
4. Click **Explain the Java lines** and hold on the problem code and component tree.
5. Select the correct prediction. Hold on **Engine agrees** and the inspector rule.
6. Click **Ask for one hint**. Wait for the full response and hold on **Model composed - guard passed** (or the approved safe fallback).
7. Expand **AI evidence and safety checks**. Show the authority statement, retrieved IDs, cited IDs, latency, and guard result.
8. Click the repair-tool card. Hold on the `2/3` intermediate state, changed inspector, Java, and tree.
9. Click the second build-step button. Hold on `3/3`, **Repair verified**, and the repaired live Swing state.
10. Click **Explain the Java lines** again. Show the repaired Java and component tree.
11. Click **Explain why this works**. Wait for and hold on the Level-4 explanation.
12. Keep the evidence drawer open and show the second request's retrieval, citation, latency, and guard status.
13. End the mission on the repaired frame, **Repair verified**, Level 4, generated Java, and component tree before selecting the next mission.

## Mission 1 storyboard - Two controls in SOUTH

**Learning point:** A BorderLayout region accepts one direct laid-out occupant.

1. Show the broken frame: **Save** is hidden and **Cancel** is visible in SOUTH.
2. Highlight **SOUTH** and replay the add order: Save first, Cancel last.
3. Show the problem Java: `frame.add(save, BorderLayout.SOUTH);` followed by `frame.add(cancel, BorderLayout.SOUTH);`.
4. Select **Cancel took the same SOUTH region**; hold on **Engine agrees**.
5. Ask for one hint and open the evidence drawer.
6. Click **JPanel - One container can carry both controls**.
7. Hold on **Place a JPanel in SOUTH**, the empty container, and the `2/3` state.
8. Click **Group Save + Cancel**.
9. Show **Repair verified** and both buttons visible side by side.
10. Show the final JPanel Java, component tree, Level-4 explanation, and second evidence request.

**Narration cue:** "BorderLayout did not delete Save. Cancel was added later to the same named region, so it became SOUTH's laid-out occupant. One JPanel can own SOUTH while FlowLayout arranges both buttons inside it."

## Mission 2 storyboard - Two controls in NORTH

**Learning point:** Resolve a NORTH collision with one nested container.

1. Show the broken frame: **Search** is hidden and **Filter** is visible in NORTH.
2. Highlight **NORTH**, replay the add order, and show the two repeated NORTH add calls.
3. Select **Filter took the same NORTH region**; hold on the inspector's one-direct-component rule.
4. Ask for one hint and open its retrieval/citation evidence.
5. Click **JPanel - One container can carry both controls**.
6. Hold on **Place a JPanel in NORTH** and the empty intermediate container.
7. Click **Group Search + Filter**.
8. Show the verified row, repaired Java, component tree, Level-4 explanation, and evidence.

**Narration cue:** "NORTH is also a single BorderLayout slot. Nesting preserves both controls without changing the outer manager's rule."

## Mission 3 storyboard - Two controls in EAST

**Learning point:** The last component added to a repeated EAST region becomes visible.

1. Show **Next** hidden and **Finish** visible in EAST.
2. Highlight **EAST**, replay the add order, and show both EAST add calls.
3. Select **Finish took the same EAST region**.
4. Ask for the grounded hint and inspect its evidence.
5. Click **JPanel**, then hold on **Place a JPanel in EAST** and `2/3`.
6. Click **Group Next + Finish**.
7. Show verification, repaired Java/tree, Level 4, and the second evidence request.

**Narration cue:** "The repeated constraint, not the window size, explains the disappearance. EAST can hold a panel whose own FlowLayout carries both actions."

## Mission 4 storyboard - Two controls in WEST

**Learning point:** Nesting preserves multiple controls in a single WEST region.

1. Show **Back** hidden and **Menu** visible in WEST.
2. Highlight **WEST**, replay the add order, and reveal the repeated WEST Java lines.
3. Select **Menu took the same WEST region**.
4. Request one hint and show the evidence drawer.
5. Click **JPanel** and hold on **Place a JPanel in WEST**.
6. Click **Group Back + Menu**.
7. Show the repaired frame, verification, Java/tree, Level-4 explanation, and citations.

**Narration cue:** "The repair changes the structure, not the grader: WEST receives one panel, and the panel owns both controls."

## Mission 5 storyboard - Two controls in CENTER

**Learning point:** CENTER is one named region, not an unrestricted canvas.

1. Show **Canvas** hidden and **Preview** visible in CENTER.
2. Highlight **CENTER**, replay the order, and show both CENTER add calls.
3. Select **Preview took the same CENTER region**.
4. Ask for a hint and show retrieved/cited evidence.
5. Click **JPanel** and hold on **Place a JPanel in CENTER**.
6. Click **Group Canvas + Preview**.
7. Show the verified nested structure, generated Java, Level 4, and evidence.

**Narration cue:** "CENTER stretches, but it is still only one BorderLayout region. The panel becomes that one occupant and manages both children locally."

## Mission 6 storyboard - Build a search row

**Learning point:** A nested JPanel provides a local FlowLayout inside NORTH.

1. Show the broken state: the query field and Search button are split across NORTH and EAST.
2. Highlight **NORTH**, replay the structure, and show the split Java/tree.
3. Select **The row needs its own container**.
4. Hold on the inspector rule: different local arrangements require nested containers.
5. Ask for one hint and inspect the evidence.
6. Click **JPanel - Create a local layout inside NORTH**.
7. Hold on **Create the search panel**, the empty `search-row`, and `2/3`.
8. Click **Move field + button**.
9. Show the field and button together at the top, **Repair verified**, final Java/tree, Level 4, and evidence.

**Narration cue:** "BorderLayout places the finished row in NORTH; the row's FlowLayout arranges the field and Search button. Each container manages only its direct children."

## Mission 7 storyboard - Repair button order

**Learning point:** FlowLayout's visual order follows component add order.

1. Show the broken row: **Finish, Back, Next**.
2. Highlight **FLOW ROW**, replay the add order, and show `finish`, `back`, `next` in Java/tree order.
3. Select **The add sequence controls position**.
4. Ask for one hint and open its evidence.
5. Click **Add order - Sequence is position in FlowLayout**.
6. Hold on **Read left to right**, the target sequence, and `2/3`.
7. Click **Reorder add calls**.
8. Show **Back, Next, Finish**, verification, corrected Java order, Level 4, and evidence.

**Narration cue:** "FlowLayout does not infer meaning from labels. It displays children in the order they were added."

## Mission 8 storyboard - Repair keypad order

**Learning point:** GridLayout fills cells left-to-right, row-by-row.

1. Show the broken keypad: **1, 3 / 2, 4**.
2. Highlight **2 x 2 GRID**, replay the order, and show `1, 3, 2, 4` in the Java/tree.
3. Select **The add sequence fills the cells**.
4. Ask for one hint and inspect evidence.
5. Click **Row-major order - GridLayout fills left-to-right, row-by-row**.
6. Hold on **Trace the cells**, the target `1 -> 2 -> 3 -> 4`, and `2/3`.
7. Click **Reorder add calls**.
8. Show the correct **1, 2 / 3, 4** keypad, verification, Java/tree, Level 4, and citations.

**Narration cue:** "The second add goes into the top-right cell. Labels do not choose cells; list index does."

## Mission 9 storyboard - Choose the row manager

**Learning point:** Every container owns its own layout manager.

1. Show OK and Cancel stacked vertically inside the SOUTH panel.
2. Highlight **SOUTH PANEL**, replay the structure, and show `new GridLayout(2, 1)`.
3. Select **The nested panel manager is wrong**.
4. Ask for a grounded hint and show evidence.
5. Click **FlowLayout - A natural manager for compact rows**.
6. Hold on **Inspect the panel**, the selected `actions` JPanel, and `2/3`.
7. Click **Change its manager**.
8. Show OK and Cancel side by side, verification, `new FlowLayout()`, final tree, Level 4, and evidence.

**Narration cue:** "The outer BorderLayout already put the panel in the correct place. We fix the manager closest to the wrong geometry: the nested panel."

## Mission 10 storyboard - Move the title home

**Learning point:** BorderLayout constraints express placement behaviour.

1. Show **Student Profile** at the bottom while the body occupies CENTER.
2. Highlight **NORTH**, replay the current placement, and show the title's SOUTH constraint.
3. Select **The title uses the wrong region**.
4. Ask for one hint and inspect its evidence.
5. Click **Region constraint - Choose the semantic edge**.
6. Hold on **Compare the target**, the selected title, current SOUTH, and `2/3`.
7. Click **Change the constraint**.
8. Show the title at the top, verification, `BorderLayout.NORTH`, final tree, Level 4, and evidence.

**Narration cue:** "The title was never hidden. SOUTH correctly pinned it below CENTER. Changing the semantic constraint to NORTH gives the intended header behaviour."

## Mission 11 storyboard - Restore the 2 x 2 grid

**Learning point:** GridLayout rows and columns define the cell matrix.

1. Show four controls stretched across one **1 x 4** row.
2. Highlight **GRID SETTINGS**, replay the layout, and show `new GridLayout(1, 4)`.
3. Select **The rows and columns are wrong**.
4. Ask for one hint and open its evidence.
5. Click **Rows x columns - Geometry comes from manager settings**.
6. Hold on **Count the target cells**, the `2 rows x 2 columns` target, and `2/3`.
7. Click **Change dimensions**.
8. Show the balanced 2 x 2 grid, verification, `new GridLayout(2, 2)`, final tree, Level 4, and evidence.

**Narration cue:** "Four components do not automatically create a square. The manager's row and column settings define the matrix."

## Mission 12 storyboard - Find the missing component

**Learning point:** A component absent from the tree is different from one hidden by geometry.

1. Show the row containing **Save** and **Cancel**, with Help absent.
2. Highlight **COMPONENT LIST**, replay the inventory, and show the two-node Java/tree.
3. Select **Help is absent from the component tree**.
4. Ask for one hint and inspect retrieval/citation evidence.
5. Click **JButton Help - Restore the missing component**.
6. Hold on **Compare inventories**, `Missing: JButton Help`, and `2/3`.
7. Click **Add Help**.
8. Show **Save, Cancel, Help**, verification, final `row.add(help);`, tree, Level 4, and evidence.

**Narration cue:** "A layout manager can arrange only components that exist in its tree. This is an inventory error, not hidden geometry."

## Closing shot

1. Keep Mission 12's repaired state visible.
2. Slowly move across **Repair verified**, Level 4, the two evidence requests, generated Java, and component tree.
3. End on the mission catalogue to remind viewers that the studio covered five BorderLayout collisions, nested composition, FlowLayout order, GridLayout order, nested-manager choice, region constraints, grid dimensions, and component inventory.
4. Closing line: "The engine judges. Retrieval grounds. Haiku explains. The guard controls delivery."

## Recording checks

- Keep browser zoom at 100% and avoid resizing during a mission.
- Wait for the AI response before opening evidence; never click twice while retrieval is running.
- If the model falls back to approved corpus text, describe it honestly as the guard/fallback path.
- Do not claim measured student outcomes or classroom validation.
- Keep all generated Java and component-tree shots readable before moving on.
- Do not select the next mission until the final Level-4 explanation and second evidence request are visible.
