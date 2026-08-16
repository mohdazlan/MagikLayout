from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from pathlib import Path

OUT = Path("output/pdf/MagikLayout_Storyboard_Primary_Simple_Haiku_MIPAC_TVET_2026.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE = landscape(A4)
W, H = PAGE
INK = colors.HexColor("#171717")
MUTED = colors.HexColor("#5E625F")
ORANGE = colors.HexColor("#F36C21")
CREAM = colors.HexColor("#FFF8F1")
PALE = colors.HexColor("#F4F4F1")
GREEN = colors.HexColor("#197A55")
BLUE = colors.HexColor("#2F5C92")
LINE = colors.HexColor("#D9D9D3")
WHITE = colors.white

font_regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
if Path(font_regular).exists():
    pdfmetrics.registerFont(TTFont("DocSans", font_regular))
    pdfmetrics.registerFont(TTFont("DocSansBold", font_bold))
    REG, BOLD = "DocSans", "DocSansBold"
else:
    REG, BOLD = "Helvetica", "Helvetica-Bold"

styles = getSampleStyleSheet()

def ps(name, size, leading=None, color=INK, font=REG, align=TA_LEFT, space_after=0):
    return ParagraphStyle(name, fontName=font, fontSize=size,
                          leading=leading or size * 1.25, textColor=color,
                          alignment=align, spaceAfter=space_after)

TITLE = ps("TitleX", 27, 31, INK, BOLD)
SUB = ps("SubX", 12, 16, MUTED)
H1 = ps("H1X", 19, 23, INK, BOLD, space_after=8)
H2 = ps("H2X", 13, 16, INK, BOLD, space_after=5)
BODY = ps("BodyX", 9.3, 12.2)
SMALL = ps("SmallX", 7.6, 10.1)
TINY = ps("TinyX", 6.7, 8.7)
WHITE_BODY = ps("WhiteBody", 9.2, 12, WHITE)
ORANGE_SMALL = ps("OrangeSmall", 8, 10.3, ORANGE, BOLD)
CENTER = ps("Center", 10.2, 13, INK, BOLD, TA_CENTER)

def P(text, style=BODY):
    return Paragraph(text, style)

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.45)
    canvas.line(15*mm, H-12*mm, W-15*mm, H-12*mm)
    canvas.setFont(BOLD, 7.5)
    canvas.setFillColor(ORANGE)
    canvas.drawString(15*mm, H-9*mm, "MAGIKLAYOUT / MIPAC TVET 2026")
    canvas.setFont(REG, 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(W-15*mm, 8*mm, f"PRIMARY-SIMPLE STORYBOARD  |  {doc.page}")
    canvas.restoreState()

doc = BaseDocTemplate(str(OUT), pagesize=PAGE,
                      leftMargin=15*mm, rightMargin=15*mm,
                      topMargin=17*mm, bottomMargin=13*mm,
                      title="MagikLayout Primary-Simple Storyboard and Narration")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="landscape", frames=[frame], onPage=header_footer)])

story = []

# Cover
story += [Spacer(1, 16*mm),
          P("MAGIKLAYOUT", ORANGE_SMALL),
          P("Make the invisible rule visible.", TITLE),
          Spacer(1, 3*mm),
          P("A child-clear, judge-convincing storyboard with word-for-word English narration", SUB),
          Spacer(1, 12*mm)]
cover = Table([
    [P("THE MYSTERY", H2), P("THE REPAIR", H2), P("THE AI", H2), P("THE PROOF", H2)],
    [P("Two buttons enter SOUTH.<br/><b>Only one can be seen.</b>"),
     P("A JPanel becomes a bench:<br/><b>one seat, two buttons.</b>"),
     P("The engine judges.<br/><b>Haiku explains.</b>"),
     P("The repair is recorded as<br/><b>classroom evidence.</b>")]
], colWidths=[doc.width/4]*4, rowHeights=[13*mm, 34*mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("BACKGROUND", (0,1), (-1,1), CREAM), ("BOX", (0,0), (-1,-1), .7, LINE),
    ("INNERGRID", (0,0), (-1,-1), .5, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10)
]))
story += [cover, Spacer(1, 9*mm),
          P("MASTER DURATION  3:45  |  FORMAT  16:9 / 1080p  |  ONE CONCEPT  BorderLayout SOUTH collision", CENTER),
          Spacer(1, 6*mm),
          P("Design test: if a Year 5 learner can retell the story as ‘one chair, one bench, two buttons’, the film is clear enough. Technical names remain on screen so assessors still see NOSS accuracy and engineering depth.", SUB),
          PageBreak()]

# Story doctrine
story += [P("1. The new story rule", H1),
          P("More detail in the production plan; less cognitive load in the film.", SUB), Spacer(1, 5*mm)]
rules = [
    ("ONE QUESTION", "Why did Save disappear even though the code had no error?"),
    ("ONE ANALOGY", "A BorderLayout frame is a house with five named spaces. SOUTH is one seat, not a row."),
    ("ONE REPAIR", "Put one JPanel in SOUTH. The panel acts like a bench and arranges Save + Cancel inside it."),
    ("ONE AI JOB", "Claude Haiku never decides correctness. It turns approved evidence into a short question that helps the learner think."),
    ("ONE ENDING", "The learner explains why the bench works. Understanding - not button placement - is the transformation."),
]
tbl = Table([[P(a, ORANGE_SMALL), P(b, BODY)] for a,b in rules], colWidths=[45*mm, 205*mm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,-1), CREAM), ("BACKGROUND", (1,0), (1,-1), PALE),
    ("BOX", (0,0), (-1,-1), .6, LINE), ("INNERGRID", (0,0), (-1,-1), .4, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8), ("LEFTPADDING", (0,0), (-1,-1), 9)
]))
story += [tbl, Spacer(1, 7*mm), P("What must be removed from the old cut", H2)]
remove = Table([
    [P("REMOVE", ORANGE_SMALL), P("REPLACE WITH", ORANGE_SMALL), P("WHY", ORANGE_SMALL)],
    [P("Four surfaces shown as equal features", SMALL), P("One SOUTH story; other screens appear only as evidence", SMALL), P("A child follows cause and effect, not a product tour", SMALL)],
    [P("Technical pipeline spoken as a list", SMALL), P("Referee -> library -> helper -> gatekeeper", SMALL), P("The picture carries the meaning; technical labels remain for judges", SMALL)],
    [P("Long mouse travel and setup", SMALL), P("Pre-positioned states and match cuts", SMALL), P("OBS records learning moments, not administration", SMALL)],
    [P("Claims before proof", SMALL), P("Show the engine verdict first, then show Haiku", SMALL), P("The sequence itself proves ethical AI", SMALL)],
], colWidths=[75*mm, 90*mm, 85*mm])
remove.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("BOX", (0,0), (-1,-1), .6, LINE), ("INNERGRID", (0,0), (-1,-1), .4, LINE),
    ("VALIGN", (0,0), (-1,-1), "TOP"), ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6), ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [remove, PageBreak()]

# Visual vocabulary
story += [P("2. Visual vocabulary: explain hard ideas without dumbing them down", H1),
          P("Use the friendly metaphor in narration; preserve the precise computing term as a small caption.", SUB), Spacer(1, 5*mm)]
vocab = [
    ("FRAME", "A small house", "The JFrame content pane"),
    ("NORTH / SOUTH / EAST / WEST / CENTER", "Five named spaces", "BorderLayout regions"),
    ("SOUTH", "One chair", "One direct component per region"),
    ("JPanel + FlowLayout", "A bench holding two friends", "A nested container arranges multiple children"),
    ("DETERMINISTIC ENGINE", "The referee", "Calculates layout and correctness without AI"),
    ("RETRIEVAL", "The approved library", "Selects reviewed bilingual passages by misconception and hint level"),
    ("CLAUDE HAIKU 4.5", "The helpful teacher's voice", "Composes a short Socratic hint from supplied evidence"),
    ("GUARD", "The gatekeeper", "Rejects invalid citations, leakage, contradictions, wrong language or length"),
]
data = [[P("SCREEN LABEL", ORANGE_SMALL), P("CHILD-CLEAR PICTURE", ORANGE_SMALL), P("JUDGE-LEVEL MEANING", ORANGE_SMALL)]]
for a,b,c in vocab:
    data.append([P(a, SMALL), P(b, BODY), P(c, SMALL)])
vt = Table(data, colWidths=[62*mm, 72*mm, 116*mm])
vt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("BACKGROUND", (0,1), (-1,-1), WHITE), ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, PALE]),
    ("BOX", (0,0), (-1,-1), .6, LINE), ("INNERGRID", (0,0), (-1,-1), .35, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6), ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [vt, Spacer(1, 6*mm),
          P("Language control", H2),
          P("No sentence should introduce more than one new idea. Prefer concrete verbs: <b>enter, disappear, sit, carry, check, ask</b>. Delay terms such as deterministic, retrieval and contradiction until the audience has already seen their visual equivalent.", BODY),
          PageBreak()]

scenes = [
    {
        "scene":"01 - The magic trick", "time":"0:00-0:15", "purpose":"HOOK",
        "narr":"Two buttons enter the bottom of this window: Save, then Cancel. The code runs. No red error. But look closely - where did Save go?",
        "action":"Start on a clean Playground already set to BorderLayout. Add or reveal Save in SOUTH. Add Cancel to SOUTH. Freeze the pointer beside the single visible button.",
        "visual":"Canvas and two generated <b>frame.add(..., SOUTH)</b> lines remain readable together.",
        "text":"NO ERROR. ONE BUTTON MISSING.",
        "audio":"Single soft click per add. Music stops for 0.5 s after the question.",
        "check":"A viewer can point to the missing button before any explanation begins."
    },
    {
        "scene":"02 - One chair", "time":"0:15-0:32", "purpose":"PROBLEM",
        "narr":"Imagine the window as a tiny house with five named spaces. SOUTH is the space at the bottom. But SOUTH has only one chair. Cancel arrived last, so Save lost its seat.",
        "action":"Overlay a simple five-space diagram on the live frame. Highlight SOUTH orange. Animate one chair; place Save, then replace it with Cancel.",
        "visual":"Keep the application visible beneath a 35% transparent overlay. Do not cut away to a full-screen cartoon.",
        "text":"SOUTH = ONE DIRECT COMPONENT",
        "audio":"Warm explanatory tone. Land ‘one chair’ slowly.",
        "check":"A child can answer: Cancel is visible because it arrived last."
    },
    {
        "scene":"03 - The mission", "time":"0:32-0:49", "purpose":"OUTCOME",
        "narr":"Our mission is simple: keep both buttons visible, and explain why the repair works. This is a real TVET skill aligned to NOSS IT-010-3:2016-C01.",
        "action":"Match-cut to Classroom Lesson Pack. Hold the NOSS code, learning outcome, and BL-SOUTH-COLLISION in the same frame.",
        "visual":"Use a subtle crop or zoom so the outcome is readable at 1080p.",
        "text":"PREDICT -> TEST -> EXPLAIN -> REPAIR",
        "audio":"Confident, not bureaucratic. Do not read the entire formal outcome.",
        "check":"The judge hears one measurable skill; the child hears one mission."
    },
    {
        "scene":"04 - Build a bench", "time":"0:49-1:17", "purpose":"CONCEPT + EXAMPLE",
        "narr":"We do not need another chair. We need one bench. A JPanel becomes that bench. Put Save and Cancel inside the panel, then place the single panel in SOUTH. BorderLayout sees one component. We still see two buttons.",
        "action":"Return to a prepared Playground state. Reveal JPanel in SOUTH. Reveal Save and Cancel inside it. Pointer traces button -> panel -> SOUTH. Avoid constructing from scratch on camera.",
        "visual":"Panel boundary pulses once. Show <b>panel.add(Save)</b>, <b>panel.add(Cancel)</b>, then <b>frame.add(panel, SOUTH)</b>.",
        "text":"ONE REGION -> ONE CONTAINER -> TWO BUTTONS",
        "audio":"Small music rise when both buttons become visible.",
        "check":"A child can retell: the bench fits in one seat and carries two buttons."
    },
    {
        "scene":"05 - Test the rule", "time":"1:17-1:35", "purpose":"ACTIVE LEARNING",
        "narr":"Now make a prediction. If the window becomes wider, will the buttons disappear again? Choose your answer before we resize.",
        "action":"Cut to the reflow challenge with prediction ready. Hold 2 s. Lock the prediction, then resize or reveal the target position.",
        "visual":"Ghost position and final position must both be visible. Keep cursor still during the thinking pause.",
        "text":"PAUSE. PREDICT FIRST.",
        "audio":"Leave two full seconds of silence for viewer participation.",
        "check":"The viewer has time to form an answer before the app reveals one."
    },
    {
        "scene":"06 - The referee", "time":"1:35-1:55", "purpose":"DETERMINISTIC PROOF",
        "narr":"The layout engine checks the structure and the exact movement. It is our referee. It decides what happened from the same rules that draw the screen. No AI decides this score.",
        "action":"Show the challenge verdict or Coach Lab engine finding for BL-SOUTH-COLLISION. Highlight the finding before any hint button is pressed.",
        "visual":"Add a small ‘REFEREE’ label beside the engine finding. Do not display the AI pipeline yet.",
        "text":"THE ENGINE JUDGES.",
        "audio":"Firm, factual cadence. Drop the music under ‘No AI’.",
        "check":"Sequence proves the verdict existed before Haiku was called."
    },
    {
        "scene":"07 - Ask the library", "time":"1:55-2:15", "purpose":"RETRIEVAL",
        "narr":"Only after the referee speaks do we ask for help. First, MagikLayout visits an approved library. It selects two short notes for this exact mistake and this hint level.",
        "action":"Open Coach Lab with ‘AI on - coach-rag’. Keep BL-SOUTH-COLLISION visible. Press Ask for a hint. Animate Engine -> Approved Library while the request is processing.",
        "visual":"Retrieved source chips appear as the visual proof. Use their real IDs; never invent a citation.",
        "text":"1. ENGINE  ->  2. APPROVED LIBRARY",
        "audio":"A quiet page-turn sound may mark retrieval; no science-fiction effects.",
        "check":"Viewer understands that approved information is selected before AI writes."
    },
    {
        "scene":"08 - Haiku finds the words", "time":"2:15-2:42", "purpose":"AI VALUE",
        "narr":"Now Claude Haiku 4.5 enters - not as the referee, but as a helpful teacher's voice. It receives the finding and those approved notes. It writes one short question: enough to guide thinking, never enough to give away the repair.",
        "action":"Reveal Haiku only at the Compose stage. Hold the generated Level 1 hint. Pointer does not move while the audience reads the first sentence.",
        "visual":"Pipeline overlay: Engine -> Retrieve -> <b>Haiku 4.5</b>. Keep real hint visible behind it.",
        "text":"HAIKU EXPLAINS. IT DOES NOT GRADE.",
        "audio":"Human, reassuring voice. Slow down on ‘not as the referee’.",
        "check":"A child can answer: Haiku helps with words; the engine decides correctness."
    },
    {
        "scene":"09 - The gatekeeper", "time":"2:42-3:02", "purpose":"ETHICAL AI",
        "narr":"Before the hint reaches a learner, a gatekeeper checks it. Are the sources real? Is the language correct? Did it reveal the answer or disagree with the engine? Only a safe hint may pass.",
        "action":"Reveal ‘Model composed - guard passed’, then Retrieved and Cited IDs. Animate a gate opening only after all checks tick green.",
        "visual":"Use five compact checks: source, language, length, no answer leak, no contradiction.",
        "text":"GUARD CHECKED. SAFE TO SERVE.",
        "audio":"Five restrained ticks, then silence. Do not claim the model can never fail.",
        "check":"Judge sees explicit ethical controls; child understands a safety check happens."
    },
    {
        "scene":"10 - Speak my language", "time":"3:02-3:19", "purpose":"ACCESS",
        "narr":"The same help can speak in Bahasa Malaysia. The rule stays true; only the explanation changes. And if the network fails, reviewed library text still answers.",
        "action":"Toggle BM and show a fresh Level 1 hint. Briefly caption the safe fallback; do not simulate a network failure in the main take.",
        "visual":"BM hint plus matching Retrieved/Cited IDs. Keep technical Swing terms in English.",
        "text":"SAME RULE. THE LEARNER'S LANGUAGE.",
        "audio":"Warm and inclusive. No music swell.",
        "check":"Bilingual value is visible without opening a second storyline."
    },
    {
        "scene":"11 - Evidence, not applause", "time":"3:19-3:34", "purpose":"IMPACT",
        "narr":"The teacher sees attempts, hints and successful repairs - without student names. The evidence comes from the layout engine, not from the model.",
        "action":"Cut to Class Session. Show anonymous learner label, repair rate, hints served, and BL-SOUTH-COLLISION frequency. Refresh once only.",
        "visual":"Crop to the cohort summary. Avoid claiming learning gains from an unrun classroom pilot.",
        "text":"ANONYMOUS. MEASURABLE. TEACHER-READY.",
        "audio":"Matter-of-fact close to the proof sequence.",
        "check":"Judge sees usable classroom evidence and privacy discipline."
    },
    {
        "scene":"12 - Return to the mystery", "time":"3:34-3:45", "purpose":"SUMMARY + REFLECTION",
        "narr":"Save never needed magic. It needed the right structure. MagikLayout makes the hidden rule visible, then lets AI help without taking control. If two buttons must share SOUTH, what will you build - and why?",
        "action":"Match-cut back to the repaired frame. Hold JPanel selected, both buttons visible, and Java proof readable for four seconds.",
        "visual":"No cursor movement. Fade after the question, not before.",
        "text":"MAKE THE INVISIBLE VISIBLE.",
        "audio":"Music resolves, then stops beneath the final question. Four-second silence.",
        "check":"A child answers ‘a panel/bench, because SOUTH accepts one component’."
    },
]

def scene_page(chunk, page_title):
    story.append(P(page_title, H1))
    story.append(P("Every row is a shooting instruction. Narration is spoken exactly; all other text is production guidance.", SUB))
    story.append(Spacer(1, 4*mm))
    rows = [[P("SCENE / TIME", ORANGE_SMALL), P("WORD-FOR-WORD NARRATION", ORANGE_SMALL),
             P("BROWSER + VISUAL ACTION", ORANGE_SMALL), P("TEXT / AUDIO / PASS TEST", ORANGE_SMALL)]]
    for s in chunk:
        left = P(f"<b>{s['scene']}</b><br/>{s['time']}<br/><font color='#F36C21'>{s['purpose']}</font>", SMALL)
        nar = P(s["narr"], SMALL)
        act = P(f"<b>Action</b><br/>{s['action']}<br/><br/><b>Frame</b><br/>{s['visual']}", TINY)
        proof = P(f"<b>On screen</b><br/>{s['text']}<br/><br/><b>Sound</b><br/>{s['audio']}<br/><br/><b>Pass</b><br/>{s['check']}", TINY)
        rows.append([left,nar,act,proof])
    t = Table(rows, colWidths=[31*mm, 69*mm, 82*mm, 68*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, PALE]),
        ("BOX", (0,0), (-1,-1), .6, LINE), ("INNERGRID", (0,0), (-1,-1), .35, LINE),
        ("VALIGN", (0,0), (-1,-1), "TOP"), ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6), ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6)
    ]))
    story.append(t)
    story.append(PageBreak())

scene_page(scenes[0:3], "3. Storyboard A - mystery, meaning, mission")
scene_page(scenes[3:6], "4. Storyboard B - repair, prediction, referee")
scene_page(scenes[6:9], "5. Storyboard C - where Claude Haiku actually enters")
scene_page(scenes[9:12], "6. Storyboard D - access, evidence, reflection")

# Continuous narration
story += [P("7. Continuous English narration - clean recording copy", H1),
          P("Approx. 400 words. Read at 112-120 words per minute. Do not announce scene names. The pauses are part of the teaching.", SUB), Spacer(1, 5*mm)]
full_text = " ".join(s["narr"] for s in scenes)
paras = [
    "<b>0:00</b>  " + " ".join(s["narr"] for s in scenes[:3]),
    "<b>0:49</b>  " + " ".join(s["narr"] for s in scenes[3:6]),
    "<b>1:55</b>  " + " ".join(s["narr"] for s in scenes[6:9]),
    "<b>3:02</b>  " + " ".join(s["narr"] for s in scenes[9:]),
]
for i,p in enumerate(paras):
    box = Table([[P(p, BODY)]], colWidths=[245*mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), CREAM if i % 2 == 0 else PALE),
        ("BOX", (0,0), (-1,-1), .6, LINE), ("LEFTPADDING", (0,0), (-1,-1), 11),
        ("RIGHTPADDING", (0,0), (-1,-1), 11), ("TOPPADDING", (0,0), (-1,-1), 9),
        ("BOTTOMPADDING", (0,0), (-1,-1), 9)
    ]))
    story += [box, Spacer(1, 3*mm)]
story += [Spacer(1, 3*mm),
          P("Performance direction", H2),
          P("Start with wonder, not urgency. Become playful on ‘one chair’ and ‘one bench’. Become precise at the referee. Slow deliberately when naming Claude Haiku 4.5. Finish the reflection question as a teacher speaking to one learner, not as an advertisement.", BODY),
          PageBreak()]

# AI truth and rubric
story += [P("8. The judge-proof AI explanation", H1),
          P("This page is for rehearsal and Q&A. The film uses the child-clear metaphor; the presenter must also command the exact architecture.", SUB), Spacer(1, 5*mm)]
pipeline = [
    ("1. ENGINE", "Referee", "Deterministically diagnoses BL-SOUTH-COLLISION and emits factual findings.", "No"),
    ("2. RETRIEVE", "Approved library", "Selects reviewed bilingual passages for the misconception and permitted hint level.", "No"),
    ("3. HAIKU", "Helpful voice", "claude-haiku-4-5 composes one short Socratic hint and cites supplied chunk IDs.", "YES"),
    ("4. GUARD", "Gatekeeper", "Checks citation validity, language, length, answer leakage and contradiction.", "No"),
    ("5. SERVE + LOG", "Delivery record", "Serves only approved output; records retrieved IDs, cited IDs, model, latency and outcome.", "No"),
]
pd = [[P("STAGE", ORANGE_SMALL), P("FILM METAPHOR", ORANGE_SMALL), P("TECHNICAL AUTHORITY", ORANGE_SMALL), P("AI?", ORANGE_SMALL)]]
pd += [[P(a, SMALL), P(b, SMALL), P(c, SMALL), P(d, CENTER)] for a,b,c,d in pipeline]
pt = Table(pd, colWidths=[42*mm, 48*mm, 137*mm, 23*mm])
pt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, PALE]),
    ("BACKGROUND", (0,3), (-1,3), CREAM), ("BOX", (0,0), (-1,-1), .6, LINE),
    ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [pt, Spacer(1, 6*mm)]
quote = Table([[P("SAFE JUDGE-FACING LINE", ORANGE_SMALL),
                P("Claude Haiku 4.5 does not decide whether a learner is correct. It composes a bilingual Socratic hint from reviewed passages already selected by retrieval, and the hint is served only after a deterministic guard validates it.", WHITE_BODY)]],
              colWidths=[50*mm, 200*mm])
quote.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), INK), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 10), ("BOTTOMPADDING", (0,0), (-1,-1), 10)
]))
story += [quote, Spacer(1, 6*mm), P("Rubric coverage inside the story", H2)]
rubric = Table([
    [P("20% PdP design", SMALL), P("One NOSS objective + induction + concept + prediction + repair + reflection", SMALL),
     P("20% AI integration", SMALL), P("Haiku adds explanation after deterministic truth", SMALL)],
    [P("10% innovation", SMALL), P("Faithful live layout engine and governed AI pipeline", SMALL),
     P("10% impact", SMALL), P("Anonymous attempts, hints and repair evidence", SMALL)],
    [P("5% ethics", SMALL), P("Subordinate AI, guard, citations, fallback and no model grading", SMALL),
     P("10% video", SMALL), P("One clear story, readable proof shots and timed reflection", SMALL)],
], colWidths=[35*mm, 90*mm, 35*mm, 90*mm])
rubric.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), PALE), ("BOX", (0,0), (-1,-1), .6, LINE),
    ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [rubric, PageBreak()]

# Production plan
story += [P("9. OBS and browser production plan", H1),
          P("The best take is prepared, not improvised. Record short clean states, then edit them into one continuous cause-and-effect story.", SUB), Spacer(1, 5*mm)]
prep = [
    ("PREP 1", "Set Chrome to 100% zoom; hide bookmarks; close notifications; use one 16:9 browser window."),
    ("PREP 2", "Prepare four tabs/states only: collision, repaired Playground, Coach Lab reset, active Class Session."),
    ("PREP 3", "Verify public badge reads AI on - coach-rag. Run one hidden preflight hint before recording."),
    ("PREP 4", "OBS: 1920x1080 canvas/output, 30 or 60 fps, microphone peaking near -9 dB, desktop alerts disabled."),
    ("PREP 5", "Record narration separately if possible. Browser motion should follow the voice, not force the voice to chase loading time."),
]
pt2 = Table([[P(a, ORANGE_SMALL), P(b, BODY)] for a,b in prep], colWidths=[35*mm, 215*mm])
pt2.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [CREAM, PALE]), ("BOX", (0,0), (-1,-1), .6, LINE),
    ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING", (0,0), (-1,-1), 8)
]))
story += [pt2, Spacer(1, 6*mm), P("Autopilot pacing rules", H2)]
pacing = Table([
    [P("MOMENT", ORANGE_SMALL), P("HOLD", ORANGE_SMALL), P("RULE", ORANGE_SMALL)],
    [P("Button disappears", SMALL), P("2.0 s", SMALL), P("Freeze cursor; let the audience discover the contradiction", SMALL)],
    [P("Prediction question", SMALL), P("2.0 s", SMALL), P("No clicking during thinking time", SMALL)],
    [P("Engine verdict", SMALL), P("3.0 s", SMALL), P("Must appear before Ask for a hint", SMALL)],
    [P("Haiku hint", SMALL), P("5.0 s", SMALL), P("First sentence and Model composed - guard passed must be readable", SMALL)],
    [P("Retrieved + Cited", SMALL), P("3.0 s", SMALL), P("Real IDs in frame; no decorative fake citation", SMALL)],
    [P("Final repair", SMALL), P("4.0 s", SMALL), P("No cursor movement beneath the reflection question", SMALL)],
], colWidths=[60*mm, 30*mm, 160*mm])
pacing.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, PALE]), ("BOX", (0,0), (-1,-1), .6, LINE),
    ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [pacing, Spacer(1, 6*mm),
          P("Editing bridges", H2),
          P("Use only three transitions: <b>match cut</b> (SOUTH to learning outcome), <b>J-cut</b> (voice begins before Coach Lab appears), and <b>return cut</b> (class evidence back to repaired SOUTH). Remove loading gaps, but never shorten proof holds. Avoid AR in this 3:45 master; it opens a second mental model and weakens the one-concept rubric focus.", BODY),
          PageBreak()]

# Final checklist
story += [P("10. Final acceptance checklist", H1),
          P("Do not submit merely because the recording is smooth. Submit when every item below is visible or audible.", SUB), Spacer(1, 5*mm)]
checks = [
    ("CHILD CLARITY", "A viewer can explain the disappearance using ‘one chair’ and the repair using ‘one bench’."),
    ("ONE OBJECTIVE", "The NOSS code and the single repair goal appear once, clearly, for at least three seconds."),
    ("ACTIVE LEARNING", "The prediction question includes a real two-second thinking pause."),
    ("ENGINE FIRST", "BL-SOUTH-COLLISION and factual findings are visible before any AI request."),
    ("HAIKU PROOF", "AI on - coach-rag, Model composed - guard passed, Retrieved IDs and Cited IDs are visible."),
    ("ETHICAL CLAIM", "Narration states that Haiku explains but does not grade; the guard is explained."),
    ("BILINGUAL VALUE", "A BM hint appears without changing the underlying engine finding."),
    ("CLASSROOM USE", "Anonymous attempts, hints and repair evidence appear; no names or invented pilot results."),
    ("TECHNICAL QUALITY", "16:9, minimum 1080p, clean cursor path, clear captions, stable audio, 3-5 minutes."),
    ("REFLECTION", "The film ends with: ‘If two buttons must share SOUTH, what will you build - and why?’"),
]
ct = Table([[P("[  ]", CENTER), P(a, ORANGE_SMALL), P(b, BODY)] for a,b in checks], colWidths=[15*mm, 48*mm, 187*mm])
ct.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, PALE]), ("BOX", (0,0), (-1,-1), .6, LINE),
    ("INNERGRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 7)
]))
story += [ct, Spacer(1, 7*mm)]
final = Table([[P("THE TEST", ORANGE_SMALL), P("After watching once, ask a non-programmer: ‘Why did Save disappear, what fixed it, and what did Haiku do?’ A winning cut produces three answers: ‘one SOUTH seat’, ‘a JPanel bench’, and ‘Haiku explained the referee’s finding’. If any answer is missing, revise the film - not the learner.", WHITE_BODY)]], colWidths=[35*mm, 215*mm])
final.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), INK), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 10), ("BOTTOMPADDING", (0,0), (-1,-1), 10)
]))
story += [final]

doc.build(story)
print(OUT)
