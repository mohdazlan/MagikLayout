import json,sys,re
from pathlib import Path
from pypdf import PdfReader
from docx import Document
from PIL import Image,ImageOps,ImageDraw
root=Path('/Users/macintosh/IdeaProjects/bulan/MagikLayout')
folder=root/'tmp/mipac_juri_2026'/sys.argv[1]
stem='MagikLayout_Laporan_Juri_Teknikal_2026_Maklum_Balas' if len(sys.argv)>2 else 'MagikLayout_Laporan_Juri_Teknikal_2026'
pdf=PdfReader(folder/(stem+'.pdf'))
d=Document(root/'output/docx'/(stem+'.docx'))
heads=[p.text for p in d.paragraphs if p.style.name=='Heading 1' and p.text!='SENARAI KANDUNGAN']
norm=lambda s:re.sub(r'\s+',' ',s).strip()
mapping={}
for n,p in enumerate(pdf.pages,1):
 t=norm(p.extract_text())
 print(n,len(t),t[:115])
 if n>2:
  for h in heads:
   if norm(h) in t and h not in mapping:mapping[h]=n
(root/'tmp/mipac_juri_2026/page_map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2))
print('MISSING',[h for h in heads if h not in mapping])
for start in range(1,len(pdf.pages)+1,4):
 sheet=Image.new('RGB',(1416,2000),'#cccccc')
 for j,n in enumerate(range(start,min(start+4,len(pdf.pages)+1))):
  im=Image.open(folder/f'page-{n}.png');im.thumbnail((700,970))
  x=(j%2)*708;y=(j//2)*1000
  sheet.paste(im,(x,y+25));ImageDraw.Draw(sheet).text((x+10,y+5),str(n),fill='black')
 sheet.save(folder/f'sheet-{start}.png')
