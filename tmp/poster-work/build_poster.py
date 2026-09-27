from pathlib import Path
from base64 import b64encode
import re, json, html
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF, renderSVG
from PIL import Image
from pypdf import PdfReader
import subprocess

ROOT=Path('/Users/macintosh/IdeaProjects/bulan/MagikLayout')
OUT=ROOT/'output/poster'; OUT.mkdir(parents=True,exist_ok=True)
ASSET=ROOT/'tmp/poster-work'
W,H=595.2756,841.8898
NAVY='#142E46'; TEAL='#006B71'; ORANGE='#B74712'; INK='#243747'; MUTED='#536474'; LINE='#CDDAE1'; LIGHT='#EDF5F6'
pdfmetrics.registerFont(TTFont('Arial','/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic','/System/Library/Fonts/Supplemental/Arial Italic.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-Bold')
PDF=OUT/'LayoutLab_AR_MIPAC_TVET_2026_A4_Proof.pdf'
c=canvas.Canvas(str(PDF),pagesize=(W,H))
c.setTitle('LayoutLab AR | MIPAC TVET 2026 English competition poster')
c.setAuthor('Mohd Azlan bin Ab Aziz and Hasnah binti Ngah')
items=[]; blocks=[]

def rect(x,y,w,h,fill,stroke=None,r=0):
    y=y*.975
    c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke or fill))
    if r: c.roundRect(x,H-y-h,w,h,r,stroke=bool(stroke),fill=1)
    else:c.rect(x,H-y-h,w,h,stroke=bool(stroke),fill=1)
    items.append(f'<div style="position:absolute;left:{x}pt;top:{y}pt;width:{w}pt;height:{h}pt;background:{fill};border-radius:{r}pt;'+(f'border:.5pt solid {stroke};' if stroke else '')+'"></div>')

def line(x,y,w,color=LINE): rect(x,y,w,.55,color)

def text(t,x,y,w,size=8.6,leading=None,color=INK,bold=False,align=0,maxh=None):
    y=y*.975
    leading=leading or size*1.23
    p=Paragraph(t,ParagraphStyle('p',fontName='Arial-Bold' if bold else 'Arial',fontSize=size,leading=leading,textColor=HexColor(color),alignment=align,spaceAfter=0))
    _,h=p.wrap(w,900)
    if maxh is not None and h>maxh+.1: raise ValueError(f'Overflow {h:.1f}>{maxh}: {t}')
    p.drawOn(c,x,H-y-h)
    css=f'position:absolute;left:{x}pt;top:{y}pt;width:{w}pt;font-family:Arial,sans-serif;font-size:{size}pt;line-height:{leading}pt;color:{color};font-weight:{700 if bold else 400};text-align:{["left","center","right"][align]};'
    ht=re.sub(r'<br\s*/?>','<br>',t)
    items.append(f'<div style="{css}">{ht}</div>')
    blocks.append(dict(text=re.sub('<[^>]+>',' ',t),x=x,y=y,w=w,h=h,font_size=size))
    return h

def img(name,x,y,w,h):
    y=y*.975
    path=ASSET/name
    c.drawImage(str(path),x,H-y-h,w,h,mask='auto')
    mt='image/jpeg' if path.suffix.lower() in ('.jpg','.jpeg') else 'image/png'
    items.append(f'<img alt="{html.escape(name)}" src="data:{mt};base64,{b64encode(path.read_bytes()).decode()}" style="position:absolute;left:{x}pt;top:{y}pt;width:{w}pt;height:{h}pt;object-fit:fill;">')

def section(num,title,x,y,w=267):
    text(f'{num:02}',x,y,21,9.6,11.6,TEAL,True)
    text(title,x+24,y,w-24,9.6,11.6,NAVY,True)
    line(x,y+16,w)

def bullet(t,x,y,w=267,size=8.6):
    rect(x,y+4,2.3,2.3,TEAL)
    return text(t,x+8,y,w-8,size)+2

# Official banner and existing author identity.
rect(0,0,W,H,'#FFFFFF')
img('template-image1.jpeg',20,13,555.3,75)
text('LayoutLab AR',20,99,450,29,32,NAVY,True)
text('Make invisible Java layout rules visible.',21,135,525,13,16,TEAL,True)
text('Immersive Digital Teaching Aid  |  Grup Nelang PMU  |  Politeknik Mukah',21,157,549,8.4,10,INK)
text('Mohd Azlan bin Ab Aziz &amp; Hasnah binti Ngah  •  azlan@pmu.edu.my',21,170,549,8.4,10,INK)
img('pmu-logo.png',504,101,68,25.84)
line(20,188,555.3)

L,R,CW=20,307,268.3
# Row one: exact paired section order from the official template.
section(1,'BACKGROUND / PROBLEM',L,199,CW)
text('Novice diploma students in DFP50463 Java Based Application Development at Politeknik Mukah struggle to predict resizing, hidden components and nested panels. Slides explain rules; GUI builders can conceal them. Learners need to see, test and repair the behaviour. [1]',L,222,CW,8.6,maxh=67)
section(2,'INNOVATION OBJECTIVES',L,292,CW)
y=315
for t in ['<b>Construct</b> a BorderLayout prototype in tracked AR.', '<b>Test and diagnose</b> resizing and region collisions.', '<b>Repair and explain</b> the structure using verifiable Java evidence.']:
    y+=bullet(t,L,y,CW)
rect(L,370,CW,19,LIGHT)
text('NOSS IT-010-3:2016-C01 · Application Prototype Development',L+6,374,CW-12,7.35,9,TEAL,True)

section(3,'THE INNOVATION',R,199,CW)
text('A browser-based AR teaching aid that turns a virtual JFrame into a tracked model, touch surface and assessed task. Visual, audio and code feedback connect each action to a Java rule.',R,222,CW,8.6,maxh=46)
img('abstract-image3.png',R,272,63.2,113)
img('abstract-image4.png',R+70,272,57.2,113)
text('CONSTRUCT',R+141,275,126,8.5,11,TEAL,True)
text('Place a title in NORTH.',R+141,289,126,8.2,10)
text('TEST',R+141,312,126,8.5,11,TEAL,True)
text('Predict how CENTER resizes.',R+141,326,126,8.2,10)
text('REPAIR',R+141,349,126,8.5,11,TEAL,True)
text('Nest Save + Cancel in one JPanel; inspect the Java.',R+141,363,126,8.2,10)
text('Figure 1. Actual AR use and generated Java after structural repair.',R,391,CW,7,8.5,MUTED)

line(20,409,555.3)
section(4,'DEVELOPMENT PROCESS',L,420,CW)
steps=[('Identify','Initial student feedback (n=11) established the need.'),('Design','Map construct–test–diagnose–repair to NOSS tasks.'),('Develop','React, Three.js and MindAR; shared Java generator.'),('Test','Automated checks, follow-up users (n=6), device acceptance.'),('Refine','Improve onboarding, touch targets and resizing feedback.')]
y=443
for i,(a,b) in enumerate(steps,1):
    rect(L,y,15,15,LIGHT,r=7.5)
    text(str(i),L,y+2,15,8,10,TEAL,True,1)
    text(f'<b>{a}</b>  {b}',L+22,y,CW-22,8.05,10,maxh=22)
    if i<5: rect(L+7.2,y+17,.6,5,LINE)
    y+=24

section(5,'VALUE & ADVANTAGES',R,420,CW)
y=443
for a,b in [('Novelty','AR interaction links behaviour, repair and code.'),('Usefulness','Makes layout rules observable and assessable.'),('Replicability','Reusable tasks for other courses and institutions.'),('Cost effectiveness','Browser delivery avoids native installation.'),('Sustainability','Reusable engine and tests support maintenance.'),('Scalability','Further NOSS modules and institutional packs.')]:
    text(f'<b>{a}.</b> {b}',R,y,CW,7.9,10,maxh=20)
    y+=16
section(6,'AI USE & ETHICS',R,547,CW)
text('OpenAI Codex assisted development and writing. Authors verify outputs against code, tests and device evidence. AR scores and assessed Java come from deterministic rules; generative AI does not decide correctness.',R,570,CW,8.05,10,maxh=43)

line(20,623,555.3)
section(7,'VALIDATION & EVIDENCE',L,634,CW)
text('81.8%',L,657,120,25,28,TEAL,True)
text('6/6',L+145,657,120,25,28,TEAL,True)
text('valued visual clarification\n<br/><b>Initial feedback · n=11</b>',L,689,122,7.8,10,maxh=24)
text('reported layout insights\n<br/><b>Follow-up feedback · n=6</b>',L+145,689,123,7.8,10,maxh=24)
text('<b>AR acceptance:</b> iPhone 13 demonstration documented tracking, touch, audio, 3/3 missions and Java evidence.',L,718,CW,8.05,10,maxh=24)
text('Formative self-reports; no controlled AR learning gain measured. Source: project extended abstract.',L,744,CW,7.3,9,MUTED,maxh=20)

section(8,'EXPECTED IMPACT',L,774,CW)
text('<b>Learning:</b> practise diagnosis and explain repairs. <b>Institution:</b> repeatable browser demonstrations. <b>Industry/community:</b> prototype skills. <b>Commercialisation:</b> future challenge packs. <b>TVET:</b> competency-based digital practice.',L,797,CW,7.5,9.3,maxh=38)

section(9,'CONCLUSION',R,634,CW)
text('LayoutLab AR connects spatial action, tested behaviour, structural repair and verifiable code. The prototype is ready for demonstration. Next: a classroom pilot measuring completion time, errors and learning performance.',R,657,CW,8.6,10.6,maxh=54)
section(10,'REFERENCES & SUPPORT',R,715,CW)
text('[1] Qian, Y., &amp; Lehman, J. (2017). Students’ misconceptions and other difficulties in introductory programming: A literature review. <i>ACM Transactions on Computing Education, 18</i>(1), Article 1. https://doi.org/10.1145/3077618',R,738,CW,6.7,8.1,maxh=35)
text('[2] Keuning, H., Jeuring, J., &amp; Heeren, B. (2018). A systematic literature review of automated feedback generation for programming exercises. <i>ACM Transactions on Computing Education, 19</i>(1), Article 3. https://doi.org/10.1145/3231711',R,774,203,6.4,7.7,maxh=39)

url='https://magik-layout.mhdazlan.cc/#/ar-lab'
q=QrCodeWidget(url,barLevel='M');x0,y0,x1,y1=q.getBounds();s=53
d=Drawing(s,s,transform=[s/(x1-x0),0,0,s/(y1-y0),0,0]);d.add(q)
renderPDF.draw(d,c,R+214,H-774*.975-s)
svg=renderSVG.drawToString(d).decode() if isinstance(renderSVG.drawToString(d),bytes) else renderSVG.drawToString(d)
items.append(f'<img alt="QR code to the LayoutLab AR module" src="data:image/svg+xml;base64,{b64encode(svg.encode()).decode()}" style="position:absolute;left:{R+214}pt;top:{774*.975}pt;width:53pt;height:53pt;">')
text('TRY THE AR MODULE',R,817,210,7.2,8.6,TEAL,True)
text('magik-layout.mhdazlan.cc/#/ar-lab',R,828,215,7.0,8.5,INK)
c.linkURL(url,(R,H-838*.975,R+CW,H-815*.975),relative=0)
c.save()
htmlfile=OUT/'LayoutLab_AR_MIPAC_TVET_2026_Editable.html'
htmlfile.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>LayoutLab AR MIPAC TVET 2026</title><style>*{box-sizing:border-box}body{margin:0;background:#edf0f2}#poster{position:relative;width:595.2756pt;height:841.8898pt;background:white;overflow:hidden} @page{size:A4;margin:0}@media print{body{background:white}}</style></head><body><main id="poster" data-document-role="page" data-label="LayoutLab AR competition poster">'+''.join(items)+'</main></body></html>')
(OUT/'LayoutLab_AR_Poster_Content_and_Layout.json').write_text(json.dumps(blocks,indent=2))
doc=PdfReader(PDF)
assert len(doc.pages)==1
subprocess.run(['/Users/macintosh/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm','-scale-to','1850','-png','-singlefile',str(PDF),str(ASSET/'poster-proof')],check=True)
assert PDF.stat().st_size<5_000_000
print('PDF',PDF,'bytes',PDF.stat().st_size)
print('HTML',htmlfile)
print('Lowest text:',max(b['y']+b['h'] for b in blocks))
