from pathlib import Path
import hashlib
import re

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path("/Users/macintosh/IdeaProjects/bulan/MagikLayout")
REFERENCE = Path("/Users/macintosh/Downloads/Template Eng - Extended Abstract MIPACTVET 2026.docx")
EXPECTED_SHA = "41bbd6dcf2c03eceab227f9dc5e42ea5827a1131c1534522224d48e3b8389ef5"
OUT = ROOT / "output" / "docx" / "LayoutLab_AR_MIPACTVET_2026_Template_Compliant.docx"
TMP = ROOT / "tmp" / "mipac_template" / "placeholders"


def set_font(run, size=11, bold=None, italic=None, color=None):
    run.font.name = "Times New Roman"
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def add_run(paragraph, text, size=11, bold=False, italic=False, color=None):
    run = paragraph.add_run(text)
    set_font(run, size=size, bold=bold, italic=italic, color=color)
    return run


def format_paragraph(paragraph, align=WD_ALIGN_PARAGRAPH.JUSTIFY, before=0, after=0, keep=False):
    paragraph.alignment = align
    pf = paragraph.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if keep:
        pf.keep_with_next = True


def add_body(doc, text, before=0, after=0):
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, before=before, after=after)
    add_run(p, text)
    return p


def add_heading(doc, text):
    p = doc.add_paragraph(style="HeadingCustom")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT, before=5, after=0, keep=True)
    add_run(p, text, bold=True)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph(style="SmallCustom")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER, before=2, after=2, keep=True)
    add_run(p, text, size=10)
    return p


def set_cell_margins(cell, top=55, start=75, bottom=55, end=75):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + name))
        if node is None:
            node = OxmlElement("w:" + name)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_fill(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_table_geometry(table, widths):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")
    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        node = OxmlElement("w:gridCol")
        node.set(qn("w:w"), str(width))
        grid.append(node)
    for row in table.rows:
        for index, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[index]))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)


def keep_row_together(row):
    tr_pr = row._tr.get_or_add_trPr()
    node = OxmlElement("w:cantSplit")
    node.set(qn("w:val"), "true")
    tr_pr.append(node)


def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    node = OxmlElement("w:tblHeader")
    node.set(qn("w:val"), "true")
    tr_pr.append(node)


def add_data_table(doc, headers, rows, widths, font_size=9.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    set_table_geometry(table, widths)
    repeat_header(table.rows[0])
    for index, header in enumerate(headers):
        cell = table.rows[0].cells[index]
        set_cell_fill(cell, "E7E6E6")
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT)
        add_run(p, header, size=font_size, bold=True)
    for row_data in rows:
        row = table.add_row()
        keep_row_together(row)
        for index, value in enumerate(row_data):
            cell = row.cells[index]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT)
            add_run(p, str(value), size=font_size, bold=(index == 0 and len(headers) == 2))
    return table


def make_placeholder(path, number, label):
    w, h = 420, 720
    image = Image.new("RGB", (w, h), "white")
    draw = ImageDraw.Draw(image)
    try:
        bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf", 31)
        regular = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 22)
    except OSError:
        bold = ImageFont.load_default()
        regular = ImageFont.load_default()
    border = "#666666"
    draw.rectangle((12, 12, w - 12, h - 12), outline=border, width=4)
    title = f"SCREENSHOT {number}"
    tb = draw.textbbox((0, 0), title, font=bold)
    draw.text(((w - (tb[2] - tb[0])) / 2, 245), title, fill="#111111", font=bold)
    lines = label.split("|")
    y = 318
    for line in lines:
        lb = draw.textbbox((0, 0), line, font=regular)
        draw.text(((w - (lb[2] - lb[0])) / 2, y), line, fill="#444444", font=regular)
        y += 34
    image.save(path)


def add_figure_panel(doc, images):
    table = doc.add_table(rows=1, cols=4)
    set_table_geometry(table, [2250, 2250, 2250, 2250])
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for index, image in enumerate(images):
        cell = table.cell(0, index)
        set_cell_margins(cell, top=20, start=35, bottom=20, end=35)
        # Remove visible table borders so this reads as one multi-panel figure.
        tc_pr = cell._tc.get_or_add_tcPr()
        borders = tc_pr.first_child_found_in("w:tcBorders")
        if borders is None:
            borders = OxmlElement("w:tcBorders")
            tc_pr.append(borders)
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            node = OxmlElement("w:" + edge)
            node.set(qn("w:val"), "nil")
            borders.append(node)
        p = cell.paragraphs[0]
        format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER)
        p.add_run().add_picture(str(image), width=Inches(1.43))
    return table


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Paragraph")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    # Preserve the template's genuine list paragraph/numbering definition.
    p_pr = p._p.get_or_add_pPr()
    num_pr = OxmlElement("w:numPr")
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    num_id = OxmlElement("w:numId")
    num_id.set(qn("w:val"), "21")
    num_pr.extend([ilvl, num_id])
    p_pr.append(num_pr)
    add_run(p, text)
    return p


def clear_body_keep_section(doc):
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def add_page_break(doc):
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT)
    p.add_run().add_break(WD_BREAK.PAGE)


def count_words(doc):
    words = []
    for node in doc.element.body.iter():
        if node.tag.endswith("}t") and node.text:
            words += re.findall(r"[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*", node.text)
    return len(words)


def main():
    actual_sha = hashlib.sha256(REFERENCE.read_bytes()).hexdigest()
    if actual_sha != EXPECTED_SHA:
        raise RuntimeError("The official template changed; re-distillation is required.")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    placeholders = []
    labels = [
        "Target found|3D model anchored",
        "NORTH title|Mission 1/3",
        "CENTER resize|Mission 2/3",
        "SOUTH repair|Java evidence 3/3",
    ]
    for index, label in enumerate(labels, start=1):
        path = TMP / f"ar-evidence-{index}.png"
        make_placeholder(path, index, label)
        placeholders.append(path)

    doc = Document(REFERENCE)
    clear_body_keep_section(doc)

    # Title and author block
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER, after=2)
    add_run(p, "LAYOUTLAB AR: A NOSS-ALIGNED TRAINER FOR JAVA SWING PROTOTYPING", size=14, bold=True)

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER, before=3)
    add_run(p, "Mohd Azlan bin Ab Aziz", size=11)
    marker = add_run(p, "1*", size=8)
    marker.font.superscript = True
    add_run(p, ", Hasnah binti Ngah", size=11)
    marker = add_run(p, "2", size=8)
    marker.font.superscript = True

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER)
    marker = add_run(p, "1 ", size=8)
    marker.font.superscript = True
    add_run(p, "Department of Information and Communication Technology, Politeknik Mukah, Sarawak, Malaysia")
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER)
    marker = add_run(p, "2 ", size=8)
    marker.font.superscript = True
    add_run(p, "Department of Commerce, Politeknik Mukah, Sarawak, Malaysia")
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER, before=2)
    add_run(p, "*Corresponding Author | E-mail: [insert official e-mail]", italic=True)

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.CENTER, before=5, keep=True)
    add_run(p, "Extended Abstract", bold=True)
    add_body(
        doc,
        "Java Swing layout rules are difficult for novice diploma students because their behaviour remains invisible until code is compiled. LayoutLab AR is a browser-based teaching aid aligned to NOSS IT-010-3:2016-C01, Application Prototype Development. Using an iPhone and an original tracked target, learners manipulate a virtual JFrame through three BorderLayout missions: place a title in NORTH, test CENTER during resizing, and diagnose two buttons competing for SOUTH before repairing the structure with a nested JPanel. Progress requires touches on tracked 3D regions, while the final state generates deterministic Java evidence. The module integrates text, 3D graphics, animation, bilingual audio, spatial interaction and source code. Formative evaluations of the wider browser platform (n=11 and n=6) informed the design but do not prove AR effectiveness. iPhone 13 acceptance verified tracking, interaction, all missions, audio and Java evidence; 75 automated tests protect the technical path. AR is therefore the method of competency practice and assessment, not a decorative overlay.",
    )
    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT, before=2)
    add_run(p, "Keywords: ", bold=True)
    add_run(p, "assessment integrity, BorderLayout, immersive teaching aid, spatial interaction, TVET")

    add_heading(doc, "1. Background / Problem Statement")
    add_body(
        doc,
        "Students may reproduce Swing syntax without predicting resizing, region collisions or nested panels (Qian & Lehman, 2017). In the first evaluation, 81.9% of 11 Semester 5 students reported layout difficulty. Slides state the rules, while GUI builders often conceal them. The gap is an intervention that makes behaviour observable and requires learners to test and repair a prototype.",
    )

    add_heading(doc, "2. Innovation Objective")
    add_body(
        doc,
        "The objective is to enable learners to construct, functionally test, diagnose and repair a BorderLayout prototype in AR, then produce verifiable Java evidence aligned to the specified NOSS work activities.",
    )

    add_page_break(doc)

    add_heading(doc, "3. Description of Innovation")
    add_body(
        doc,
        "The camera recognises an original LayoutLab target and anchors a colour-coded 3D JFrame. Mission 1 requires a touch on NORTH to place the title. Mission 2 requires a prediction and touch on CENTER before the resize animation. Mission 3 exposes the SOUTH collision in X-ray mode and requires activation of the nested-JPanel repair. Touch coordinates are raycast against mission-relevant meshes, so conventional answer buttons cannot complete the assessment. Figure 1 records the tracked model, mission progress, repair and generated code. FlowLayout and GridLayout remain enrichment in the wider Playground; BorderLayout is the focused assessed competency.",
    )

    add_figure_panel(doc, placeholders)
    add_caption(doc, "Figure 1. LayoutLab AR evidence sequence: tracking, construction, functionality testing and structural repair.")

    add_heading(doc, "4. Methodology / Development Process")
    add_body(
        doc,
        "Development followed problem identification, needs analysis, design, implementation and validation. Feedback from 11 students prioritised visualisation, Java export and guidance; a second evaluation (n=6) informed onboarding and resizing feedback. The AR module uses React, Three.js and MindAR, connects to LayoutLab’s deterministic state and code-generation engines, and was tested through automated checks and iPhone 13 acceptance. The target uses an original asymmetric image. Generative AI is excluded from grading.",
    )

    add_heading(doc, "5. Innovation Value Proposition")
    add_caption(doc, "Table 1. Innovation value proposition")
    add_data_table(
        doc,
        ["Component", "Description"],
        [
            ("Novelty", "Tracked 3D prototype serves as model, touch surface and deterministic assessment."),
            ("Usefulness", "Connects a layout rule to visible behaviour, repair and compilable Java evidence."),
            ("Replicability", "Adaptable to other layout managers, courses and institutional challenge sets."),
            ("Cost Effectiveness", "Secure browser delivery avoids native installation and licence costs."),
            ("Sustainability", "Reusable deterministic engine and automated tests support maintenance."),
            ("Scalability", "Potential expansion across polytechnics through additional NOSS-aligned modules."),
        ],
        [2350, 6650],
        font_size=9.0,
    )

    add_page_break(doc)

    add_heading(doc, "6. Findings, Validation and Evidence of Effectiveness (Where Applicable)")
    add_body(
        doc,
        "Evidence is separated into formative platform feedback and AR technical acceptance to avoid overstating effectiveness. Table 2 summarises the current position.",
    )
    add_caption(doc, "Table 2. Formative and technical evidence")
    add_data_table(
        doc,
        ["Evidence Item", "Before / Baseline", "After / Result", "Interpretation"],
        [
            ("Learning need", "81.9% reported layout difficulty (n=11).", "Three AR missions address placement, resize and nesting.", "Strong need; AR learning gain not yet measured."),
            ("Visual understanding", "81.8% valued visual clarification (n=11).", "All six later users reported placement or resizing ‘aha’ moments.", "Supports the visual method, not causal AR impact."),
            ("Technical quality", "Browser engine and prototype baseline.", "75 automated tests and strict production build pass.", "Reproducible grading and code generation."),
            ("Device acceptance", "AR required mobile production validation.", "iPhone 13 verified HTTPS camera, tracking, touch, audio and 3/3 completion.", "Ready for competition demonstration."),
        ],
        [1850, 2250, 2850, 2050],
        font_size=8.2,
    )

    add_heading(doc, "7. Impact of Innovation")
    add_body(
        doc,
        "Learners receive a construct-test-diagnose-repair sequence with code evidence. Lecturers gain a repeatable browser demonstrator without native installation. The immediate market is Malaysian polytechnic and vocational Java courses; institutional challenge packs offer future commercialisation potential. NOSS alignment supports competency-based TVET, while the architecture can scale to other layout managers and prototype tasks.",
    )

    add_heading(doc, "8. Conclusion")
    add_body(
        doc,
        "LayoutLab AR makes an invisible programming rule spatial, touchable and assessable. Its contribution is the complete evidence chain from AR action to tested behaviour, structural repair and deterministic Java. The module is technically ready for demonstration; the next step is a documented classroom pilot measuring completion time, errors and learning performance.",
    )

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT, before=5, keep=True)
    add_run(p, "Declaration", bold=True)
    add_body(doc, "The authors declare that:")
    add_bullet(doc, "The work is original;")
    add_bullet(doc, "All authors have contributed substantially;")
    add_bullet(doc, "No plagiarism has occurred;")
    add_bullet(doc, "AI-assisted content has been reviewed and validated by the authors; and")
    add_bullet(doc, "All data are accurate and can be verified upon request.")

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT, before=4, keep=True)
    add_run(p, "AI-use disclosure", bold=True)
    add_body(
        doc,
        "OpenAI Codex was used to assist software development and manuscript editing. The authors verified outputs against the source code, automated tests, device recordings, NOSS mapping and official template. AI does not determine learner scores or generate assessed Java output.",
    )

    p = doc.add_paragraph(style="Normal")
    format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT, before=4, keep=True)
    add_run(p, "References", bold=True)
    references = [
        "Keuning, H., Jeuring, J., & Heeren, B. (2018). A systematic literature review of automated feedback generation for programming exercises. ACM Transactions on Computing Education, 19(1), Article 3. https://doi.org/10.1145/3231711",
        "Politeknik Mukah. (2026). LayoutLab surveys, AR acceptance records and technical documentation [Unpublished internal evidence pack].",
        "Qian, Y., & Lehman, J. (2017). Students’ misconceptions and other difficulties in introductory programming: A literature review. ACM Transactions on Computing Education, 18(1), Article 1. https://doi.org/10.1145/3077618",
    ]
    for reference in references:
        p = doc.add_paragraph(style="Normal")
        format_paragraph(p, align=WD_ALIGN_PARAGRAPH.LEFT)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.first_line_indent = Inches(-0.2)
        add_run(p, reference, size=8.5)

    # Ask Word to refresh PAGE/NUMPAGES fields when the document opens.
    settings = doc.settings._element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")

    props = doc.core_properties
    props.title = "LayoutLab AR: A NOSS-Aligned Trainer for Java Swing Prototyping"
    props.subject = "MIPAC TVET 2026 Extended Abstract"
    props.author = "Mohd Azlan bin Ab Aziz; Hasnah binti Ngah"
    props.keywords = "assessment integrity, BorderLayout, immersive teaching aid, spatial interaction, TVET"

    count = count_words(doc)
    if count > 1000:
        raise RuntimeError(f"Word limit exceeded: {count}")
    doc.save(OUT)
    print(f"{OUT}\nWord count: {count}")


if __name__ == "__main__":
    main()
