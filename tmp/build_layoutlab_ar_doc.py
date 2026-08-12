from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path("/Users/macintosh/IdeaProjects/bulan/MagikLayout")
OUT_DIR = ROOT / "output" / "docx"
TMP_DIR = ROOT / "tmp" / "docx_qa" / "placeholders"
OUT_FILE = OUT_DIR / "LayoutLab_AR_Extended_Abstract.docx"

NAVY = "102A43"
BLUE = "1F4D78"
TEAL = "0F6F73"
ORANGE = "C94F12"
GREEN = "18713A"
INK = "1D2939"
MUTED = "5F6B7A"
LINE = "D5DCE3"
PALE = "F4F6F9"
PALE_BLUE = "EAF2F8"
PALE_ORANGE = "FFF2E8"
PALE_GREEN = "EAF6EE"
WHITE = "FFFFFF"


def rgb(hex_color):
    return RGBColor.from_string(hex_color)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, **edges):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = tc_pr.first_child_found_in("w:tcBorders")
    if tc_borders is None:
        tc_borders = OxmlElement("w:tcBorders")
        tc_pr.append(tc_borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        if edge not in edges:
            continue
        edge_data = edges[edge]
        tag = "w:" + edge
        element = tc_borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            tc_borders.append(element)
        for key in ("val", "sz", "space", "color"):
            if key in edge_data:
                element.set(qn("w:" + key), str(edge_data[key]))


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + margin))
        if node is None:
            node = OxmlElement("w:" + margin)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    cant_split.set(qn("w:val"), "true")
    tr_pr.append(cant_split)


def set_table_widths(table, widths):
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
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = Inches(widths[idx] / 1440)
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[idx]))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)


def set_paragraph_keep(paragraph, keep_next=False, keep_lines=True):
    p_pr = paragraph._p.get_or_add_pPr()
    if keep_next:
        element = OxmlElement("w:keepNext")
        p_pr.append(element)
    if keep_lines:
        element = OxmlElement("w:keepLines")
        p_pr.append(element)


def set_run_font(run, name="Aptos", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    if size:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = rgb(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def add_run(paragraph, text, bold=False, italic=False, color=INK, size=None, font="Aptos"):
    run = paragraph.add_run(text)
    set_run_font(run, font, size, color, bold, italic)
    return run


def add_field(paragraph, instruction):
    run = paragraph.add_run()
    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = instruction
    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char_begin, instr_text, fld_char_end])
    return run


def add_hyperlink(paragraph, text, url, color=TEAL):
    part = paragraph.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    new_run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    color_el = OxmlElement("w:color")
    color_el.set(qn("w:val"), color)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_pr.extend([color_el, underline])
    new_run.append(r_pr)
    text_el = OxmlElement("w:t")
    text_el.text = text
    new_run.append(text_el)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


def make_placeholder(path, label, subtitle, aspect=(1200, 560)):
    w, h = aspect
    image = Image.new("RGB", (w, h), "#F4F6F9")
    draw = ImageDraw.Draw(image)
    try:
        font_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 38)
        font_regular = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 25)
        font_small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
    except OSError:
        font_bold = ImageFont.load_default()
        font_regular = ImageFont.load_default()
        font_small = ImageFont.load_default()
    pad = 24
    dash = 24
    gap = 14
    color = "#C94F12"
    for x in range(pad, w - pad, dash + gap):
        draw.line((x, pad, min(x + dash, w - pad), pad), fill=color, width=5)
        draw.line((x, h - pad, min(x + dash, w - pad), h - pad), fill=color, width=5)
    for y in range(pad, h - pad, dash + gap):
        draw.line((pad, y, pad, min(y + dash, h - pad)), fill=color, width=5)
        draw.line((w - pad, y, w - pad, min(y + dash, h - pad)), fill=color, width=5)
    badge = "AR EVIDENCE"
    badge_box = draw.textbbox((0, 0), badge, font=font_small)
    badge_w = badge_box[2] - badge_box[0] + 42
    draw.rounded_rectangle((54, 48, 54 + badge_w, 94), radius=16, fill="#102A43")
    draw.text((75, 58), badge, font=font_small, fill="white")
    main_box = draw.textbbox((0, 0), label, font=font_bold)
    main_x = (w - (main_box[2] - main_box[0])) / 2
    draw.text((main_x, 210), label, font=font_bold, fill="#102A43")
    sub_box = draw.textbbox((0, 0), subtitle, font=font_regular)
    sub_x = (w - (sub_box[2] - sub_box[0])) / 2
    draw.text((sub_x, 282), subtitle, font=font_regular, fill="#5F6B7A")
    note = "In Word: select this image → Picture Format → Change Picture"
    note_box = draw.textbbox((0, 0), note, font=font_small)
    note_x = (w - (note_box[2] - note_box[0])) / 2
    draw.text((note_x, 410), note, font=font_small, fill="#0F6F73")
    image.save(path, quality=95)


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph(style="Body Text")
    if bold_lead and text.startswith(bold_lead):
        add_run(p, bold_lead, bold=True)
        add_run(p, text[len(bold_lead):])
    else:
        add_run(p, text)
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    add_run(p, text)
    return p


def add_callout(doc, title, body, fill=PALE_BLUE, title_color=BLUE):
    table = doc.add_table(rows=1, cols=1)
    set_table_widths(table, [9120])
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    set_cell_border(cell, top={"val": "single", "sz": 10, "color": title_color}, bottom={"val": "single", "sz": 10, "color": title_color}, left={"val": "single", "sz": 10, "color": title_color}, right={"val": "single", "sz": 10, "color": title_color})
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(4)
    add_run(p, title, bold=True, color=title_color, size=11.2)
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    add_run(p2, body, color=INK, size=10.2)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    set_paragraph_keep(p, keep_next=True)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph(style="Caption")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_run(p, text, italic=True, color=MUTED, size=9)
    return p


def add_figure(doc, image_path, caption, width=6.25):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(str(image_path), width=Inches(width))
    set_paragraph_keep(p, keep_next=True)
    add_caption(doc, caption)


def add_table(doc, headers, rows, widths, font_size=9.1):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    set_table_widths(table, widths)
    for idx, header in enumerate(headers):
        cell = table.rows[0].cells[idx]
        set_cell_shading(cell, NAVY)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        add_run(p, header, bold=True, color=WHITE, size=9.2)
    set_repeat_table_header(table.rows[0])
    for row_idx, row_data in enumerate(rows):
        row = table.add_row()
        set_row_cant_split(row)
        cells = row.cells
        for idx, value in enumerate(row_data):
            cell = cells[idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            if row_idx % 2 == 1:
                set_cell_shading(cell, PALE)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            add_run(p, str(value), color=INK, size=font_size)
    return table


def setup_document():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.74)
    section.bottom_margin = Inches(0.72)
    section.left_margin = Inches(0.88)
    section.right_margin = Inches(0.88)
    section.header_distance = Inches(0.32)
    section.footer_distance = Inches(0.32)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
    normal.font.size = Pt(10.2)
    normal.font.color.rgb = rgb(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.16

    body = styles["Body Text"]
    body.font.name = "Aptos"
    body._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
    body.font.size = Pt(10.2)
    body.font.color.rgb = rgb(INK)
    body.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    body.paragraph_format.space_after = Pt(7)
    body.paragraph_format.line_spacing = 1.16

    for style_name in ("List Bullet", "List Bullet 2"):
        style = styles[style_name]
        style.font.name = "Aptos"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
        style.font.size = Pt(10)
        style.font.color.rgb = rgb(INK)
        style.paragraph_format.space_after = Pt(3)
        style.paragraph_format.line_spacing = 1.08
    styles["List Bullet"].paragraph_format.left_indent = Inches(0.28)
    styles["List Bullet"].paragraph_format.first_line_indent = Inches(-0.16)
    styles["List Bullet 2"].paragraph_format.left_indent = Inches(0.56)
    styles["List Bullet 2"].paragraph_format.first_line_indent = Inches(-0.16)

    h1 = styles["Heading 1"]
    h1.font.name = "Aptos Display"
    h1._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos Display")
    h1.font.size = Pt(16)
    h1.font.bold = True
    h1.font.color.rgb = rgb(BLUE)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    h1.paragraph_format.keep_with_next = True

    h2 = styles["Heading 2"]
    h2.font.name = "Aptos Display"
    h2._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos Display")
    h2.font.size = Pt(12.5)
    h2.font.bold = True
    h2.font.color.rgb = rgb(TEAL)
    h2.paragraph_format.space_before = Pt(9)
    h2.paragraph_format.space_after = Pt(4)
    h2.paragraph_format.keep_with_next = True

    caption = styles["Caption"]
    caption.font.name = "Aptos"
    caption._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
    caption.font.size = Pt(9)
    caption.font.italic = True
    caption.font.color.rgb = rgb(MUTED)
    caption.paragraph_format.space_after = Pt(7)

    header = section.header
    header.is_linked_to_previous = False
    table = header.add_table(rows=1, cols=2, width=Inches(6.74))
    set_table_widths(table, [4700, 5000])
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    left = table.cell(0, 0)
    right = table.cell(0, 1)
    for cell in (left, right):
        set_cell_margins(cell, top=0, start=0, bottom=25, end=0)
        set_cell_border(cell, bottom={"val": "single", "sz": 8, "color": LINE})
    lp = left.paragraphs[0]
    lp.paragraph_format.space_after = Pt(0)
    add_run(lp, "LAYOUTLAB AR", bold=True, color=NAVY, size=8.5)
    rp = right.paragraphs[0]
    rp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rp.paragraph_format.space_after = Pt(0)
    add_run(rp, "MIPAC TVET 2026 • CIAST", color=MUTED, size=8.5)

    footer = section.footer
    ft = footer.add_table(rows=1, cols=2, width=Inches(6.74))
    set_table_widths(ft, [7000, 2700])
    fl = ft.cell(0, 0)
    fr = ft.cell(0, 1)
    for cell in (fl, fr):
        set_cell_margins(cell, top=25, start=0, bottom=0, end=0)
        set_cell_border(cell, top={"val": "single", "sz": 8, "color": LINE})
    fp = fl.paragraphs[0]
    fp.paragraph_format.space_after = Pt(0)
    add_run(fp, "Politeknik Mukah • magik-layout.mhdazlan.cc/#/ar-lab", color=MUTED, size=8.3)
    fpr = fr.paragraphs[0]
    fpr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fpr.paragraph_format.space_after = Pt(0)
    add_run(fpr, "Page ", color=MUTED, size=8.3)
    add_field(fpr, "PAGE")
    add_run(fpr, " of ", color=MUTED, size=8.3)
    add_field(fpr, "NUMPAGES")

    return doc


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    placeholders = []
    placeholder_specs = [
        ("figure-1-target-tracking.png", "INSERT SCREENSHOT 1", "Target detected and 3D BorderLayout anchored"),
        ("figure-2-mission-1.png", "INSERT SCREENSHOT 2", "Mission 1 — title placed in NORTH"),
        ("figure-3-mission-2.png", "INSERT SCREENSHOT 3", "Mission 2 — CENTER resize animation"),
        ("figure-4-mission-3.png", "INSERT SCREENSHOT 4", "Mission 3 — X-ray collision and JPanel repair"),
        ("figure-5-code-evidence.png", "INSERT SCREENSHOT 5", "3/3 completion and generated Java evidence"),
    ]
    for filename, label, subtitle in placeholder_specs:
        path = TMP_DIR / filename
        make_placeholder(path, label, subtitle)
        placeholders.append(path)

    doc = setup_document()

    # Proposal-style opening
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(7)
    add_run(p, "COMPETITION EXTENDED ABSTRACT", bold=True, color=ORANGE, size=9.2)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(5)
    add_run(title, "LAYOUTLAB AR", bold=True, color=NAVY, size=25, font="Aptos Display")
    title2 = doc.add_paragraph()
    title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title2.paragraph_format.space_after = Pt(7)
    add_run(title2, "A NOSS-Aligned Augmented Reality Trainer for\nJava Swing Interface Prototyping", bold=True, color=BLUE, size=16.5, font="Aptos Display")

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.space_after = Pt(9)
    add_run(sub, "Application Prototype Development • IT-010-3:2016-C01", bold=True, color=TEAL, size=10.5)

    authors = doc.add_paragraph()
    authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    authors.paragraph_format.space_after = Pt(2)
    add_run(authors, "Mohd Azlan bin Ab Aziz¹  |  Hasnah binti Ngah²", bold=True, color=INK, size=10.5)
    aff = doc.add_paragraph()
    aff.alignment = WD_ALIGN_PARAGRAPH.CENTER
    aff.paragraph_format.space_after = Pt(10)
    add_run(aff, "¹ Jabatan Teknologi Maklumat & Komunikasi  •  ² Jabatan Perdagangan\nPoliteknik Mukah, Sarawak, Malaysia", color=MUTED, size=8.8)

    add_heading(doc, "Extended Abstract", 1)
    add_body(doc, "Novice Java learners often understand Swing syntax before they understand the invisible rules that govern interface layout. This gap produces a costly trial-and-recompile cycle: components disappear, resize unexpectedly, or compete for the same BorderLayout region, while students change code without developing a transferable mental model. LayoutLab AR addresses this problem through an assessed, browser-based augmented reality module aligned to IT-010-3:2016-C01, Application Prototype Development. Using an iPhone camera and an original tracked target, learners view a virtual JFrame anchored in physical space and complete three sequential missions by touching the 3D model itself. They place an application title in NORTH, predict that CENTER absorbs remaining space during resizing, and diagnose why two buttons cannot independently occupy SOUTH before constructing the correct nested JPanel repair. The completed AR state is converted into deterministic, compilable Java evidence. The learning sequence integrates text, tracked 3D graphics, animation, bilingual spoken instructions, direct spatial interaction and generated source code—well beyond the organiser’s minimum requirement of three media elements. The wider LayoutLab platform also supports BorderLayout, FlowLayout and GridLayout exploration, but the competition module intentionally concentrates on one assessable BorderLayout competency. Two earlier formative evaluations of the browser platform (n=11 and n=6) established the learning need and shaped the interface; they are not presented as proof of AR learning effectiveness. The AR build has instead completed technical acceptance on an iPhone 13 over production HTTPS, including stable target tracking, all three missions, audio and final Java evidence. Seventy-five automated tests currently protect the engine, mission logic and code-generation path. LayoutLab AR therefore presents a focused TVET innovation: learners do not merely watch an AR visualisation—they construct, test and repair an application prototype through it.")

    kp = doc.add_paragraph()
    kp.paragraph_format.space_after = Pt(8)
    add_run(kp, "Keywords: ", bold=True, color=BLUE, size=9.5)
    add_run(kp, "augmented reality, BorderLayout, deterministic assessment, Java Swing, NOSS, prototype development, TVET", color=MUTED, size=9.5)

    # Compact NOSS alignment block
    table = doc.add_table(rows=5, cols=2)
    table.style = "Table Grid"
    set_table_widths(table, [1900, 7220])
    noss_rows = [
        ("NOSS Code", "IT-010-3:2016 — Pembangunan Aplikasi, Tahap 3"),
        ("Competency Unit", "IT-010-3:2016-C01 — Application Prototype Development"),
        ("Primary Work Activity", "Implement Application Prototype Mock-Up Flow"),
        ("Supporting Activity", "Conduct User Interface and User Experience Functionality Test"),
        ("Assessed Scope", "Construct, test and diagnose a Java Swing BorderLayout prototype in AR"),
    ]
    for idx, (label, value) in enumerate(noss_rows):
        left, right = table.rows[idx].cells
        set_cell_shading(left, NAVY if idx == 0 else PALE_BLUE)
        set_cell_shading(right, WHITE if idx % 2 == 0 else PALE)
        for c in (left, right):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        lp = left.paragraphs[0]
        lp.paragraph_format.space_after = Pt(0)
        add_run(lp, label, bold=True, color=WHITE if idx == 0 else BLUE, size=9)
        rp = right.paragraphs[0]
        rp.paragraph_format.space_after = Pt(0)
        add_run(rp, value, color=INK, size=9)

    doc.add_page_break()

    add_heading(doc, "1. Background and Problem Statement", 1)
    add_body(doc, "In Swing, a learner does not freely place each component. A layout manager interprets constraints, preferred sizes, available space and nesting. BorderLayout is especially revealing: each of its five regions accepts one direct component; NORTH and SOUTH take height, EAST and WEST take width, and CENTER absorbs what remains. When two components are added directly to the same region, only the last is displayed. Conventional slides can state these rules, but they do not let every learner manipulate and test them repeatedly.")
    add_body(doc, "The first formative evaluation of the earlier browser platform involved 11 Semester 5 students. Most rated their Java ability at 2 or 3 out of 5, and 81.9% reported sometimes or often struggling to arrange components as intended. Their difficulties included choosing a layout manager, predicting resize behaviour and understanding nested panels. These findings support the need for a visible, hands-on learning sequence; they do not, on their own, prove the effectiveness of the later AR module.")

    add_heading(doc, "2. Innovation Objective", 1)
    add_body(doc, "The primary objective is to enable learners to implement and functionally test a Java Swing application prototype by manipulating the layout rules in augmented reality. The module is designed to:")
    add_bullet(doc, "make an invisible layout algorithm observable as a stable, tracked 3D model;")
    add_bullet(doc, "require learners to apply, test and diagnose BorderLayout rules through direct spatial interaction;")
    add_bullet(doc, "connect each AR decision to deterministic Java source code that can be inspected and compiled; and")
    add_bullet(doc, "produce auditable evidence for the specified NOSS competency and work activities.")

    add_callout(doc, "Strategic scope decision", "The competition module deliberately assesses BorderLayout only. FlowLayout and GridLayout remain available as enrichment in the wider LayoutLab Playground. This narrower scope gives the AR experience a complete learning arc—construct, predict, test, diagnose and repair—instead of presenting three shallow demonstrations.", fill=PALE_ORANGE, title_color=ORANGE)

    add_heading(doc, "3. Description of the Innovation", 1)
    add_body(doc, "LayoutLab AR runs in a mobile browser over HTTPS. The learner points an iPhone camera at an original LayoutLab target card. Once detected, the application anchors a virtual JFrame and five colour-coded BorderLayout regions to the target. Touch coordinates are raycast against the tracked 3D meshes; therefore, the learner cannot complete the assessed flow through a conventional multiple-choice control. Tracking, spatial anchoring, 3D rendering and direct touch are essential to the task.")
    add_figure(doc, placeholders[0], "Figure 1. Replace with an iPhone screenshot showing the complete target, ‘Target found’ status and the anchored 3D BorderLayout model.", width=5.95)

    add_heading(doc, "4. Three-Mission Assessed Learning Flow", 1)
    add_table(
        doc,
        ["Mission", "Required AR action", "Competency demonstrated", "Evidence produced"],
        [
            ("1 — Construct", "Touch NORTH on the tracked 3D frame to place the application title.", "Select and apply the correct BorderLayout constraint.", "Title appears in NORTH; state and Java are updated."),
            ("2 — Test", "Touch the region expected to absorb space, then observe the frame resize.", "Predict and verify dynamic layout behaviour.", "CENTER stretches through a user-triggered animation."),
            ("3 — Diagnose and repair", "Touch SOUTH to reveal the collision; activate the AR repair hotspot.", "Identify the one-component-per-region rule and create a nested structure.", "A JPanel containing Save and Cancel occupies SOUTH; score reaches 3/3."),
        ],
        [1050, 2750, 2650, 2670],
        font_size=8.8,
    )

    add_heading(doc, "Mission 1 — Construct the prototype", 2)
    add_body(doc, "The learner is asked to place an application title that must remain across the top of the interface. Tapping the NORTH mesh changes the tracked model and advances the mission. A wrong region does not produce a generic failure message; the learner remains in the mission and can try again.")
    add_figure(doc, placeholders[1], "Figure 2. Replace with the successful Mission 1 state: application title placed in NORTH and progress shown as 1/3.", width=5.8)

    add_heading(doc, "Mission 2 — Conduct a functionality test", 2)
    add_body(doc, "The learner predicts which region changes when the JFrame becomes larger. Selecting CENTER triggers a visible resize animation and the rule ‘CENTER absorbs the remaining space’. This links a design decision to observable interface behaviour and directly supports UI functionality testing.")
    add_figure(doc, placeholders[2], "Figure 3. Replace with the resize sequence or final state showing CENTER stretched and progress shown as 2/3.", width=5.8)

    add_heading(doc, "Mission 3 — Diagnose failure and implement the structural repair", 2)
    add_body(doc, "The final mission reproduces a common Swing defect: Save and Cancel are both added directly to SOUTH, so only the last component remains visible. Touching SOUTH activates an X-ray view that reveals the collision. The learner must then activate a prominent repair hotspot on the tracked model. The system constructs a nested JPanel containing both buttons and places that single panel in SOUTH.")
    add_callout(doc, "Why this is more than a visual effect", "The learner must first identify the failed region, reveal the hidden structure and then choose a structural correction. The AR object is simultaneously the model, the interaction surface and the assessment interface.", fill=PALE_GREEN, title_color=GREEN)
    add_figure(doc, placeholders[3], "Figure 4. Replace with evidence of the SOUTH X-ray collision and/or the repaired ‘JPanel: Save + Cancel’ state.", width=5.95)

    add_heading(doc, "Generated Java as competency evidence", 2)
    add_body(doc, "After completion, the final AR state is converted through the same deterministic component-tree and Java-generation path used by LayoutLab. The evidence must show one JPanel added to BorderLayout.SOUTH, with Save and Cancel added inside that panel. Generative AI is not used to decide correctness or generate this assessed output.")
    add_figure(doc, placeholders[4], "Figure 5. Replace with the 3/3 completion state and the expanded Java evidence showing the nested JPanel repair.", width=5.95)

    add_heading(doc, "5. AR Media Elements and Learning Function", 1)
    add_body(doc, "The organiser indicated that AR should be the focus and that at least three media elements must be present. LayoutLab AR integrates six elements, each with a defined learning purpose rather than using media as decoration.")
    add_table(
        doc,
        ["Element", "Implementation in LayoutLab AR", "Learning or evidence function"],
        [
            ("Text", "Mission prompts, NOSS mapping, Swing rules, feedback and generated Java.", "Explains the task and records technical evidence."),
            ("Tracked 3D graphics", "Virtual JFrame, five regions and components anchored to the target.", "Makes the abstract layout model spatially visible."),
            ("Animation", "CENTER resize and SOUTH collision/X-ray transitions.", "Shows change over time and exposes hidden behaviour."),
            ("Audio", "User-triggered Bahasa Malaysia or English spoken instructions.", "Supports multimodal guidance without replacing the visual task."),
            ("Direct interaction and assessment", "Touch/raycast selection on mission-relevant 3D objects.", "Requires the learner to act on the AR model to progress."),
            ("Generated code", "Deterministic javax.swing/java.awt source from the final AR state.", "Connects prototype behaviour to verifiable implementation evidence."),
        ],
        [1400, 3940, 3780],
        font_size=8.8,
    )

    add_heading(doc, "6. Methodology and Development Process", 1)
    add_body(doc, "Development followed an iterative design–build–test cycle. The earlier browser platform established the instructional need and supplied the deterministic layout engine. The competition build then reframed one high-value misconception as a three-mission AR sequence.")
    add_table(
        doc,
        ["Stage", "Work completed", "Decision or result"],
        [
            ("Formative iteration 1 (n=11)", "Surveyed difficulty, clarity, confidence and feature requests.", "Prioritised visualisation, Java export, clearer guidance and structured practice."),
            ("Formative iteration 2 (n=6)", "Evaluated the revised platform and challenge modes.", "Confirmed placement and resizing ‘aha’ moments; identified onboarding and sizing refinements."),
            ("AR P0", "Built the tracked 3D model, mission logic, text, animation and audio.", "Established a NOSS-aligned construct–test–diagnose flow."),
            ("AR P1/P2", "Added raycast interaction; strengthened mission 3 and evidence reveal.", "Made AR essential and improved iPhone reliability."),
            ("Device acceptance", "Tested production HTTPS deployment on iPhone 13.", "Verified tracking, three missions, audio and Java evidence."),
        ],
        [1900, 3930, 3290],
        font_size=8.7,
    )

    add_heading(doc, "Original Tracking Target", 2)
    add_body(doc, "The target is an original LayoutLab-branded card with dense, asymmetric detail across the complete frame. It was compiled with the official MindAR 1.2.5 image-target compiler. Acceptance evidence records a resolution of 1448 × 1086 pixels, 12 scale keyframes and 4,656 detected feature points (3,496 maxima and 1,160 minima). These characteristics improve recognition and reduce ambiguity during the assessed interaction.")

    add_heading(doc, "7. Findings, Validation and Evidence", 1)
    add_body(doc, "The evidence is intentionally separated into formative learning evidence and technical acceptance evidence. This prevents the student surveys for the wider browser platform from being misrepresented as a controlled evaluation of the new AR module.")
    add_table(
        doc,
        ["Evidence", "Result", "What it supports—and what it does not"],
        [
            ("Iteration 1 student survey", "n=11; 81.8% agreed/strongly agreed that visualisations clarified layout-manager differences; 81.8% reported greater confidence building a GUI from scratch.", "Supports the learning need and acceptance of visual manipulation. It is not a controlled pre/post result."),
            ("Iteration 2 student evaluation", "n=6; students described immediate placement, manager rules and dynamic resizing as learning breakthroughs.", "Supports iterative design decisions for the wider LayoutLab platform, not causal AR effectiveness."),
            ("Automated quality gate", "75 automated tests currently pass across engine, mission logic, grading and code generation; strict production build passes.", "Supports reproducibility and technical reliability."),
            ("iPhone 13 acceptance", "Production HTTPS camera access, target tracking, direct 3D touch, all three missions, BM/English audio and Java evidence verified.", "Supports readiness for live demonstration on the stated device."),
            ("AR learning study", "Not yet completed.", "A larger classroom pilot with task completion, error rate and pre/post measures is required before claiming measured AR learning gains."),
        ],
        [1950, 3400, 3770],
        font_size=8.5,
    )

    add_heading(doc, "8. Innovation Value Proposition", 1)
    add_table(
        doc,
        ["Dimension", "Competition case"],
        [
            ("Novelty", "Tracked 3D Swing prototype serves as model, touch surface and deterministic assessment."),
            ("Usefulness", "One sequence moves from rule recognition to testing and structural repair."),
            ("NOSS relevance", "Missions evidence prototype implementation and UI/UX functionality testing."),
            ("Integrity", "A deterministic engine grades AR state and Java; generative AI does not."),
            ("Deployability", "Runs from a secure web link on iPhone 13; no native installation."),
            ("Replicability", "Extendable to other layout managers and institution-specific prototype tasks."),
        ],
        [1750, 7370],
        font_size=8.6,
    )

    add_heading(doc, "9. Expected Impact", 1)
    add_body(doc, "For learners, LayoutLab AR shortens the distance between an abstract constraint and its visible consequence. For lecturers, it provides a repeatable demonstration and a clear evidence trail: mission progress, repaired structure and generated Java. For TVET delivery, the web-based approach reduces installation burden while still using spatial interaction to make a difficult programming concept tangible. The immediate use case is the Java GUI curriculum at Politeknik Mukah; the design can later support broader Malaysian polytechnic and vocational programmes.")

    add_heading(doc, "10. Competition Readiness and Next Validation", 1)
    add_callout(doc, "Current readiness", "The competition demonstration is technically ready on the available iPhone 13: original target, tracked 3D model, three assessed missions, six media/learning elements, deterministic scoring and final Java evidence are operational at the production URL.", fill=PALE_GREEN, title_color=GREEN)
    add_body(doc, "Before judging, the team should complete a small, documented AR pilot rather than overstate the earlier browser surveys. Recommended evidence includes: target-acquisition time, mission completion time, wrong-region attempts, successful repair rate, System Usability Scale or a short usability instrument, and one concise pre/post BorderLayout task. Screen recordings should capture the complete target, direct touches on the 3D regions, the resize animation, X-ray collision, nested JPanel repair and expanded Java evidence.")

    add_heading(doc, "11. Conclusion", 1)
    add_body(doc, "LayoutLab AR addresses a precise competency gap: learners can write Java Swing syntax yet remain unable to predict how a layout manager will construct and resize an interface. The innovation turns that invisible mechanism into a tracked, touchable and assessable prototype. Its strongest feature is not the novelty of placing a model over a camera feed; it is the integrity of the learning sequence. The learner constructs a state, tests a rule, diagnoses a failure, repairs the structure and receives deterministic Java evidence. This positions AR as the essential method of learning and assessment while keeping claims verifiable and aligned to IT-010-3:2016-C01.")

    add_heading(doc, "Declaration", 1)
    add_body(doc, "The authors declare that the work is original and that all technical and evaluation evidence presented can be verified. Any AI-assisted drafting or development output has been reviewed by the authors. Generative AI does not determine learner correctness, scoring or the assessed Java output in LayoutLab AR.")

    add_heading(doc, "References", 1)
    refs = [
        "Brown, N. C. C., & Wilson, G. (2018). Ten quick tips for teaching programming. PLOS Computational Biology, 14(4), e1006023. https://doi.org/10.1371/journal.pcbi.1006023",
        "Keuning, H., Jeuring, J., & Heeren, B. (2018). A systematic literature review of automated feedback generation for programming exercises. ACM Transactions on Computing Education, 19(1), Article 3. https://doi.org/10.1145/3231711",
        "Qian, Y., & Lehman, J. (2017). Students’ misconceptions and other difficulties in introductory programming: A literature review. ACM Transactions on Computing Education, 18(1), Article 1. https://doi.org/10.1145/3077618",
        "Politeknik Mukah. (2026). LayoutLab evidence pack: Iteration 1 student survey; Iteration 2 student evaluation; AR competition build, device-acceptance records and technical documentation [Unpublished internal records].",
    ]
    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.22)
        p.paragraph_format.first_line_indent = Inches(-0.22)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.0
        add_run(p, ref, color=INK, size=8.25)

    # Core properties
    props = doc.core_properties
    props.title = "LayoutLab AR: A NOSS-Aligned Augmented Reality Trainer for Java Swing Interface Prototyping"
    props.subject = "MIPAC TVET 2026 CIAST Competition Extended Abstract"
    props.author = "Mohd Azlan bin Ab Aziz; Hasnah binti Ngah"
    props.keywords = "LayoutLab AR, CIAST, MIPAC TVET, NOSS, IT-010-3:2016-C01, Java Swing, BorderLayout"
    props.comments = "Editable competition document with screenshot placeholders."

    doc.save(OUT_FILE)
    print(OUT_FILE)


if __name__ == "__main__":
    main()
