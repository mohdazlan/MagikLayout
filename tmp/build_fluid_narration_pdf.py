from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path("output/pdf/MagikLayout_AI_Haiku_Focused_Narration_MIPAC_TVET_2026.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
if Path(FONT_REG).exists():
    pdfmetrics.registerFont(TTFont("ArialCustom", FONT_REG))
    pdfmetrics.registerFont(TTFont("ArialCustom-Bold", FONT_BOLD))
    BODY_FONT = "ArialCustom"
    BOLD_FONT = "ArialCustom-Bold"
else:
    BODY_FONT = "Helvetica"
    BOLD_FONT = "Helvetica-Bold"

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#17212B")
INK = colors.HexColor("#20252B")
MUTED = colors.HexColor("#66717D")
ORANGE = colors.HexColor("#F05A28")
PALE_ORANGE = colors.HexColor("#FFF2EC")
PALE_BLUE = colors.HexColor("#EEF4F7")
LINE = colors.HexColor("#D8DEE4")
WHITE = colors.white


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, stroke=0, fill=1)
    canvas.setFont(BOLD_FONT, 8.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(18 * mm, PAGE_H - 9.3 * mm, "MAGIKLAYOUT  /  MIPAC TVET 2026")
    canvas.setFont(BODY_FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "Fluid-cut narration and edit map")
    canvas.drawRightString(PAGE_W - 18 * mm, 10 * mm, f"{doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUT),
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=22 * mm,
    bottomMargin=17 * mm,
    title="MagikLayout AI Haiku Focused Narration - MIPAC TVET 2026",
    author="MagikLayout",
    subject="Three-minute continuous narration and edit map",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
doc.addPageTemplates(PageTemplate(id="main", frames=[frame], onPage=header_footer))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Hero",
    fontName=BOLD_FONT,
    fontSize=25,
    leading=29,
    textColor=NAVY,
    alignment=TA_LEFT,
    spaceAfter=8 * mm,
))
styles.add(ParagraphStyle(
    name="Deck",
    fontName=BODY_FONT,
    fontSize=12,
    leading=17,
    textColor=MUTED,
    spaceAfter=7 * mm,
))
styles.add(ParagraphStyle(
    name="H1x",
    fontName=BOLD_FONT,
    fontSize=17,
    leading=21,
    textColor=NAVY,
    spaceBefore=2 * mm,
    spaceAfter=4 * mm,
))
styles.add(ParagraphStyle(
    name="H2x",
    fontName=BOLD_FONT,
    fontSize=11.5,
    leading=15,
    textColor=ORANGE,
    spaceAfter=2 * mm,
))
styles.add(ParagraphStyle(
    name="BodyX",
    fontName=BODY_FONT,
    fontSize=9.6,
    leading=14.1,
    textColor=INK,
    spaceAfter=2.5 * mm,
))
styles.add(ParagraphStyle(
    name="SmallX",
    fontName=BODY_FONT,
    fontSize=8.2,
    leading=11.4,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="CellHead",
    fontName=BOLD_FONT,
    fontSize=8,
    leading=10,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="Cell",
    fontName=BODY_FONT,
    fontSize=8.2,
    leading=11.1,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="CellBold",
    fontName=BOLD_FONT,
    fontSize=8.2,
    leading=11.1,
    textColor=NAVY,
))
styles.add(ParagraphStyle(
    name="Quote",
    fontName=BOLD_FONT,
    fontSize=13.2,
    leading=18,
    textColor=NAVY,
    leftIndent=5 * mm,
    rightIndent=5 * mm,
    spaceBefore=3 * mm,
    spaceAfter=3 * mm,
))


segments = [
    {
        "time": "0:00-0:15",
        "beat": "HOOK / THE DISAPPEARANCE",
        "visual": "Empty Playground. Drop Save, then Cancel, into SOUTH. Hold on one visible button, the hidden chip, and two SOUTH lines in Java.",
        "narration": (
            "One line of code. No error. Yet <b>Save has vanished</b>. In Java Swing, the most dangerous bugs are not always broken code. Sometimes they are invisible rules being obeyed perfectly."
        ),
        "bridge": "Begin over the empty frame. Let “vanished” land exactly when Save disappears. Cut dead air after the second drop.",
        "screen": "NO ERROR. ONE BUTTON MISSING.",
    },
    {
        "time": "0:15-0:33",
        "beat": "PROBLEM / REVEAL THE RULE",
        "visual": "Pointer traces Cancel, hidden Save chip, then both BorderLayout.SOUTH statements.",
        "narration": (
            "Both buttons entered <b>SOUTH</b>. But SOUTH is not a row; it is one seat. Cancel arrived last and covered Save. BorderLayout obeyed its rule. The learner could not see it."
        ),
        "bridge": "On “could not see,” match-cut from the hidden chip to the Classroom learning outcome.",
        "screen": "SOUTH = ONE DIRECT COMPONENT",
    },
    {
        "time": "0:33-0:50",
        "beat": "PURPOSE / TURN FAILURE INTO COMPETENCE",
        "visual": "Classroom: NOSS code, Learning Outcome, and BL-SOUTH-COLLISION in one readable frame.",
        "narration": (
            "MagikLayout turns that failure into a measurable competency. Aligned to <b>NOSS IT-010-3:2016-C01</b>, learners predict, diagnose, and repair the collision. Every screen asks: <b>can the learner prove why?</b>"
        ),
        "bridge": "Start the next sentence before the cut to Playground. This J-cut makes Classroom feel like the reason for the engine demonstration.",
        "screen": "PREDICT → TEST → DIAGNOSE → REPAIR",
    },
    {
        "time": "0:50-1:05",
        "beat": "CONCEPT / THE RULES MOVE",
        "visual": "Switch FlowLayout, GridLayout, BorderLayout; resize the frame while Java remains visible.",
        "narration": (
            "Change the manager, and the rule changes. FlowLayout packs a row. GridLayout equalises cells. BorderLayout protects five regions. Resize, and canvas and Java respond together. <b>This is behaviour, live.</b>"
        ),
        "bridge": "Cut each manager switch on the click. Keep the resize continuous; remove any frozen pointer or failed selection.",
        "screen": "ONE ACTION. VISIBLE RULE. LIVE JAVA.",
    },
    {
        "time": "1:05-1:29",
        "beat": "REPAIR / CHANGE THE STRUCTURE",
        "visual": "Reset. Drop JPanel into SOUTH. Add two buttons, rename Save and Cancel, then point to panel.add and frame.add(panel, SOUTH).",
        "narration": (
            "Repair the cause, not the symptom. Place <b>one JPanel</b> in SOUTH. Inside it, FlowLayout lets Save and Cancel coexist. BorderLayout sees one component; the learner sees two. Java confirms it: buttons enter the panel, then the panel enters SOUTH."
        ),
        "bridge": "Use a restrained rise in music as both buttons appear. Hold one full second on frame.add(panel, BorderLayout.SOUTH).",
        "screen": "ONE REGION → ONE CONTAINER → TWO CONTROLS",
    },
    {
        "time": "1:29-1:44",
        "beat": "PROOF / LET THE ENGINE DISAGREE",
        "visual": "Reflow Challenge. Lock the untouched prediction. Hold on the offset verdict and “BorderLayout stretches SOUTH”.",
        "narration": (
            "The learner locks a prediction. The engine measures the exact offset and exposes the failed assumption. No AI decides the score. <b>The layout engine establishes truth first.</b>"
        ),
        "bridge": "Begin “Only after that truth...” while the verdict is still visible, then cut to Coach Lab.",
        "screen": "THE ENGINE JUDGES.",
    },
    {
        "time": "1:44-2:25",
        "beat": "AI / WHERE CLAUDE HAIKU 4.5 ENTERS",
        "visual": "Required AI-on insert: Coach Lab badge 'AI on - coach-rag'; BL-SOUTH-COLLISION; Retrieved chips; 'Model composed - guard passed'; Cited chips; retry ladder. Add a compact pipeline overlay.",
        "narration": (
            "<b>Only now does Claude Haiku 4.5 enter.</b> It does not grade, browse, or see an answer key. Retrieval first selects approved bilingual passages using the engine's misconception code. Haiku receives only those passages, the findings, language, and permitted hint level. Its job: compose one short Socratic hint and cite what it used. A guard then checks citations, language, length, answer leakage, and contradiction. If Haiku invents a source, reveals the repair, contradicts the engine, or the network fails, its response is rejected and reviewed corpus text is served. <b>The engine judges. Retrieval grounds. Haiku explains. The guard controls delivery.</b>"
        ),
        "bridge": "Use a five-stage animated overlay while the real UI remains visible: ENGINE → RETRIEVE → HAIKU 4.5 → GUARD → HINT. Do not show Haiku over the deterministic AI-off footage; record the AI-on insert first.",
        "screen": "ENGINE → RETRIEVE → HAIKU 4.5 → GUARD → HINT",
    },
    {
        "time": "2:25-2:41",
        "beat": "TRANSFER / MOVE BEYOND THE SCREEN",
        "visual": "AR Lab BM: NOSS, CU, Work Activity, outcomes, original target card.",
        "narration": (
            "The rule must transfer beyond the screen. The AR Lab anchors the same prototype to a target card while preserving the NOSS outcome: construct, test, diagnose, and repair spatially."
        ),
        "bridge": "Use the target card as a visual wipe or fast push. Return to Playground on the word “return.”",
        "screen": "SAME COMPETENCY. NEW CONTEXT.",
    },
    {
        "time": "2:41-3:00",
        "beat": "REFLECTION / RETURN TRANSFORMED",
        "visual": "Repaired Playground: JPanel selected, FlowLayout visible, Save and Cancel together, Java proof on the right. Final four-second hold.",
        "narration": (
            "Return to the same SOUTH with a different structure. What changed was not the buttons, but the learner's mental model. MagikLayout turns an invisible rule into evidence - and uses AI only where it adds value. <b>If two controls must share SOUTH, what will you build - and why?</b>"
        ),
        "bridge": "Music cuts beneath the question. Hold four seconds. No cursor movement. Fade only after the Java proof has been readable.",
        "screen": "MAKE THE INVISIBLE VISIBLE.",
    },
]


def p(text, style="BodyX"):
    return Paragraph(text, styles[style])


story = []
story += [Spacer(1, 6 * mm), p("MagikLayout", "Hero")]
story += [p("A fluid three-minute product story with Claude Haiku 4.5 placed exactly where it adds pedagogical value", "Deck")]

summary_data = [
    [p("OLD CUT", "CellHead"), p("FLUID CUT", "CellHead")],
    [p("Eight self-contained takes repeatedly restart the explanation.", "Cell"), p("Each scene answers the question created by the scene before it.", "Cell")],
    [p("About 550 words plus pauses creates rushed delivery or timeline drift.", "Cell"), p("Approximately 390 spoken words, with deliberate space for proof shots.", "Cell")],
    [p("AI is mentioned generically while the recorded badge shows AI off.", "Cell"), p("A new AI-on insert proves Haiku composition, citations, guard validation, and safe fallback.", "Cell")],
]
summary = Table(summary_data, colWidths=[doc.width / 2, doc.width / 2])
summary.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#F5F6F7")),
    ("BACKGROUND", (1, 1), (1, -1), PALE_ORANGE),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [summary, Spacer(1, 7 * mm)]

story += [p("The dramatic spine", "H1x")]
spine = Table([
    [p("1", "CellBold"), p("A button disappears", "Cell"), p("Create the mystery", "Cell")],
    [p("2", "CellBold"), p("The rule is revealed", "Cell"), p("Make the failure intelligible", "Cell")],
    [p("3", "CellBold"), p("The learner repairs the structure", "Cell"), p("Deliver the transformation", "Cell")],
    [p("4", "CellBold"), p("The engine tests understanding", "Cell"), p("Prove it is not theatre", "Cell")],
    [p("5", "CellBold"), p("Haiku composes under guard; AR transfers", "Cell"), p("Show AI value without surrendering judgement", "Cell")],
    [p("6", "CellBold"), p("Return to SOUTH", "Cell"), p("End with a changed mental model", "Cell")],
], colWidths=[12 * mm, 67 * mm, doc.width - 79 * mm])
spine.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), ORANGE),
    ("TEXTCOLOR", (0, 0), (0, -1), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [spine, Spacer(1, 7 * mm)]
story += [p("Performance rule", "H2x"), p("Speak as if you are solving one mystery in real time. Do not announce sections. Do not say “next.” Let the final sentence of each beat cause the next image to appear.", "Quote")]
story += [PageBreak()]

story += [p("Continuous narration - 3:00 master", "H1x")]
story += [p("Read only the orange-accented narration blocks. Visual and edit notes are for the editor. Timing includes short proof holds.", "SmallX"), Spacer(1, 3 * mm)]

for idx, seg in enumerate(segments):
    block = []
    block.append(p(f'{seg["time"]}  ·  {seg["beat"]}', "H2x"))
    block.append(p(f'<b>VISUAL</b>  {seg["visual"]}', "SmallX"))
    block.append(Spacer(1, 1.5 * mm))
    block.append(p(seg["narration"], "BodyX"))
    block.append(p(f'<b>EDIT BRIDGE</b>  {seg["bridge"]}', "SmallX"))
    block.append(p(f'<b>ON-SCREEN TEXT</b>  {seg["screen"]}', "SmallX"))
    block.append(Spacer(1, 3.2 * mm))
    story.append(KeepTogether(block))
    if idx == 3:
        story.append(PageBreak())
        story.append(p("Continuous narration - continued", "H1x"))

story += [PageBreak(), p("Where Claude Haiku 4.5 actually runs", "H1x")]
story += [p("Haiku is an optional composition stage inside the Classroom coach-rag path. It is not used by the Playground renderer, Java generator, challenge grader, misconception diagnosis, retrieval ranking, AR assessment, or hint-ladder permission logic.", "BodyX")]

ai_rows = [
    [p("Stage", "CellHead"), p("Authority and evidence", "CellHead"), p("Haiku involved?", "CellHead")],
    [p("1 · Observe + diagnose", "CellBold"), p("The deterministic layout engine grades the attempt and emits BL-SOUTH-COLLISION plus factual findings.", "Cell"), p("No", "CellBold")],
    [p("2 · Retrieve", "CellBold"), p("Metadata-first retrieval selects up to two approved bilingual corpus passages for the misconception and hint level.", "Cell"), p("No", "CellBold")],
    [p("3 · Compose", "CellBold"), p("The coach-rag Edge Function sends only engine findings, approved passages, language, level and challenge title to claude-haiku-4-5. Haiku returns one short hint and cited chunk IDs.", "Cell"), p("YES", "CellBold")],
    [p("4 · Guard", "CellBold"), p("The client checks citation validity, language, length, answer leakage and contradiction. A rejected output is replaced by reviewed corpus text.", "Cell"), p("No", "CellBold")],
    [p("5 · Log + serve", "CellBold"), p("The request records retrieved IDs, cited IDs, model, latency and outcome; only a guard-approved hint reaches the learner.", "Cell"), p("No", "CellBold")],
]
ai_table = Table(ai_rows, colWidths=[34 * mm, doc.width - 66 * mm, 32 * mm], repeatRows=1)
ai_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("BACKGROUND", (0, 1), (0, -1), PALE_BLUE),
    ("BACKGROUND", (2, 3), (2, 3), PALE_ORANGE),
    ("TEXTCOLOR", (2, 3), (2, 3), ORANGE),
    ("ALIGN", (2, 1), (2, -1), "CENTER"),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [ai_table, Spacer(1, 6 * mm)]
story += [p("Required 12-18 second AI-on insert", "H2x")]
insert_rows = [
    [p("1", "CellBold"), p("Class session", "CellBold"), p("Enable AI composer and open a clean MIPAC Demo session.", "Cell")],
    [p("2", "CellBold"), p("Coach Lab", "CellBold"), p("Show the badge AI on - coach-rag, select BM, and keep BL-SOUTH-COLLISION visible.", "Cell")],
    [p("3", "CellBold"), p("Ask for a hint", "CellBold"), p("Hold on Model composed - guard passed, the hint, latency, Retrieved IDs and Cited IDs.", "Cell")],
    [p("4", "CellBold"), p("Overlay", "CellBold"), p("Add: Engine → Retrieve → Claude Haiku 4.5 → Guard → Hint. This names the model even though the current UI logs the identifier rather than displaying it prominently.", "Cell")],
]
insert_table = Table(insert_rows, colWidths=[12 * mm, 36 * mm, doc.width - 48 * mm])
insert_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), ORANGE),
    ("TEXTCOLOR", (0, 0), (0, -1), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [insert_table, Spacer(1, 5 * mm)]
story += [p("Safe judge-facing sentence", "H2x"), p("Claude Haiku 4.5 does not decide whether a learner is correct. It composes a bilingual Socratic hint from passages already selected by retrieval, and its output is served only after a deterministic guard validates it.", "Quote")]

story += [PageBreak(), p("Edit and performance map", "H1x")]

edit_rows = [
    [p("Problem", "CellHead"), p("Fix in the recorded cut", "CellHead")],
    [p("Navigation feels like a reset", "CellBold"), p("Use J-cuts: begin the next idea 6-10 frames before the route changes. The spoken logic should pull the viewer into the new screen.", "Cell")],
    [p("Mouse pauses reveal automation latency", "CellBold"), p("Remove static gaps longer than 0.4 seconds. Speed routine drags and route transitions to 115-130%; keep verdict, source chips, Java proof, and the final frame at normal speed.", "Cell")],
    [p("Every feature has equal weight", "CellBold"), p("Give the longest holds to three proof shots only: the hidden collision, the engine verdict, and the repaired Java structure.", "Cell")],
    [p("Dialogue sounds like a feature list", "CellBold"), p("Stress contrast pairs: “valid code / vanished button,” “one component / two controls,” “engine judges / coach explains,” “same SOUTH / different structure.”", "Cell")],
    [p("Recorded Coach Lab shows AI off", "CellBold"), p("Do not place the Haiku claim over deterministic footage. Replace 12-18 seconds with the AI-on insert, or label the existing footage explicitly as the safe corpus fallback.", "Cell")],
    [p("AR feels appended", "CellBold"), p("Enter AR with the transfer line and exit on “return.” Keep it concise unless stable tracked-camera footage is available.", "Cell")],
]
edit_table = Table(edit_rows, colWidths=[46 * mm, doc.width - 46 * mm], repeatRows=1)
edit_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("BACKGROUND", (0, 1), (0, -1), PALE_BLUE),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [edit_table, Spacer(1, 6 * mm)]

story += [p("Voice direction", "H2x")]
voice_data = [
    [p("0:00-0:33", "CellBold"), p("Controlled urgency. Short phrases. Let “Save has vanished” and “single seat” strike cleanly.", "Cell")],
    [p("0:33-1:29", "CellBold"), p("Confident discovery. Accelerate through manager changes; slow down for the JPanel repair.", "Cell")],
    [p("1:29-2:25", "CellBold"), p("Forensic precision. Emphasise truth first, then slow deliberately on Claude Haiku 4.5, guard, rejected, and reviewed fallback.", "Cell")],
    [p("2:25-3:00", "CellBold"), p("Broaden, then become intimate. Drop the music before the reflection question and leave four seconds of silence.", "Cell")],
]
voice_table = Table(voice_data, colWidths=[35 * mm, doc.width - 35 * mm])
voice_table.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("BACKGROUND", (0, 0), (0, -1), PALE_ORANGE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [voice_table, Spacer(1, 6 * mm)]

spoken_plain = " ".join(
    seg["narration"]
    .replace("<b>", "")
    .replace("</b>", "")
    for seg in segments
)
word_count = len(spoken_plain.replace("-", " ").split())
story += [
    PageBreak(),
    p("Timing and claim discipline", "H1x"),
    p("Timing check", "H2x"),
    p(f"Spoken copy: approximately {word_count} words. Deliver the non-AI sections at 140-148 words per minute and the Haiku section at 125-135 words per minute. Use the remaining space for the collision, verdict, AI evidence, Java proof, and final reflection holds.", "BodyX"),
    p("Claim discipline", "H2x"),
    p("The existing full recording shows deterministic, corpus-grounded mode. The Haiku-focused narration requires the AI-on insert described on the preceding page. State that the coach-rag function is deployed and smoke-tested, not comprehensively live-model evaluated. Never imply that Haiku graded the challenge. Present AR as a transfer activity and prototype unless classroom validation evidence is shown.", "BodyX"),
    Spacer(1, 4 * mm),
    p("AI evidence checklist before export", "H2x"),
]

check_rows = [
    [p("□", "CellBold"), p("The AI-on insert visibly shows AI on - coach-rag.", "Cell")],
    [p("□", "CellBold"), p("Model composed - guard passed appears with Retrieved and Cited source IDs.", "Cell")],
    [p("□", "CellBold"), p("The overlay names Claude Haiku 4.5 only during the composition stage.", "Cell")],
    [p("□", "CellBold"), p("The challenge verdict appears before any AI hint.", "Cell")],
    [p("□", "CellBold"), p("A caption states: The engine judges. Retrieval grounds. Haiku explains. The guard controls delivery.", "Cell")],
]
check_table = Table(check_rows, colWidths=[12 * mm, doc.width - 12 * mm])
check_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), PALE_ORANGE),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [check_table]

doc.build(story)
print(OUT)
print(f"word_count={word_count}")
