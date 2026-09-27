from pathlib import Path
import json
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT=Path('/Users/macintosh/IdeaProjects/bulan/MagikLayout')
OUT=ROOT/'output/docx/MagikLayout_Laporan_Juri_Teknikal_2026_Maklum_Balas.docx'
doc=Document()
s=doc.sections[0]
s.page_width=Cm(21); s.page_height=Cm(29.7)
s.top_margin=s.bottom_margin=s.left_margin=s.right_margin=Cm(2.54)
s.header_distance=s.footer_distance=Cm(1.25)
for name in ['Normal','Title','Heading 1','Heading 2','Caption']:
 st=doc.styles[name]; st.font.name='Times New Roman'; st.font.size=Pt(12); st.font.color.rgb=RGBColor(0,0,0)
 st.paragraph_format.line_spacing=1
 st.paragraph_format.space_after=Pt(12)
 rf=st._element.get_or_add_rPr().rFonts
 for key in list(rf.attrib):
  if 'Theme' in key: del rf.attrib[key]
 for key in ['ascii','hAnsi','eastAsia','cs']:rf.set(qn('w:'+key),'Times New Roman')
for name in ['Heading 1','Heading 2']:
 doc.styles[name].font.bold=True
 doc.styles[name].paragraph_format.keep_with_next=True
doc.styles['Title'].font.size=Pt(14); doc.styles['Title'].font.bold=True
hp=s.header.paragraphs[0]; hp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
hr=hp.add_run('MAGIKLAYOUT | MIPAC TVET 2026'); hr.font.name='Times New Roman'; hr.font.size=Pt(9)
fp=s.footer.paragraphs[0]; fp.alignment=WD_ALIGN_PARAGRAPH.CENTER
fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); fp._p.append(fld)
s.different_first_page_header_footer=True
pages=[]
def p(t,indent=True,italic=False,size=12):
 x=doc.add_paragraph(); x.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY if indent else WD_ALIGN_PARAGRAPH.LEFT
 x.paragraph_format.first_line_indent=Cm(1.27 if indent else 0)
 r=x.add_run(t); r.italic=italic; r.font.size=Pt(size)
 return x
def h(t,level=2):
 x=doc.add_paragraph(t.upper(),style=f'Heading {level}'); x.paragraph_format.space_after=Pt(12); return x
def page(title):
 if pages: doc.add_page_break()
 pages.append(title)
 h(title,1)
def table(num,title,heads,rows,widths):
 p(f'Jadual {num} menunjukkan {title[0].lower()+title[1:]}.')
 cap=doc.add_paragraph(f'Jadual {num}  {title}',style='Caption'); cap.paragraph_format.keep_with_next=True
 t=doc.add_table(rows=1,cols=len(heads));t.autofit=False
 for col,w in zip(t.columns,widths): col.width=Cm(w)
 bd=OxmlElement('w:tblBorders')
 for k in ['top','left','bottom','right','insideH','insideV']:
  z=OxmlElement('w:'+k); z.set(qn('w:val'),'single');z.set(qn('w:sz'),'4');z.set(qn('w:color'),'D9D9D9');bd.append(z)
 t._tbl.tblPr.append(bd)
 for ri,vals in enumerate([heads]+rows):
  row=t.rows[0] if ri==0 else t.add_row()
  pr=row._tr.get_or_add_trPr(); pr.append(OxmlElement('w:cantSplit'))
  if ri==0:pr.append(OxmlElement('w:tblHeader'))
  for c,txt,w in zip(row.cells,vals,widths):
   c.width=Cm(w); c.text=txt
   mar=OxmlElement('w:tcMar')
   for edge in ['top','bottom','start','end']:
    el=OxmlElement('w:'+edge);el.set(qn('w:w'),'90');el.set(qn('w:type'),'dxa');mar.append(el)
   c._tc.get_or_add_tcPr().append(mar)
   if ri==0:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'E7E6E6');c._tc.get_or_add_tcPr().append(sh)
   for q in c.paragraphs:
    q.paragraph_format.space_after=Pt(0);q.paragraph_format.line_spacing=1
    for r in q.runs:r.font.size=Pt(12);r.bold=ri==0
 spacer=doc.add_paragraph();spacer.paragraph_format.space_after=Pt(0);spacer.paragraph_format.line_spacing=1
 spacer.paragraph_format.space_before=Pt(0);spacer.add_run().font.size=Pt(6)

# Cover and contents use physical page numbers, confirmed against rendered PDF.
c=doc.add_paragraph('LAPORAN INOVASI\nMIPAC TVET 2026',style='Title');c.alignment=WD_ALIGN_PARAGRAPH.CENTER;c.paragraph_format.space_before=Pt(75)
for txt in ['MAGIKLAYOUT','PEMBELAJARAN SUSUN ATUR JAVA SWING\nMELALUI SIMULASI INTERAKTIF\nREALITI TERIMBUH DAN KECERDASAN BUATAN','GRUP NELANG PMU\nPOLITEKNIK MUKAH','KATEGORI PENYERTAAN\nIMMERSIVE DIGITAL TEACHING AID','MOHD AZLAN BIN AB AZIZ\nHASNAH BINTI NGAH','15 SEPTEMBER 2026']:
 x=doc.add_paragraph(txt,style='Title');x.alignment=WD_ALIGN_PARAGRAPH.CENTER;x.paragraph_format.space_before=Pt(18)
doc.add_page_break()
h('SENARAI KANDUNGAN',1)
toc=doc.add_paragraph('')
doc.add_page_break()

page('1 MAKLUMAT KUMPULAN')
p('Nama kumpulan: Grup Nelang PMU\nInstitusi: Politeknik Mukah, Sarawak',False)
h('1.1 Ketua kumpulan untuk pengesahan')
p('Mohd Azlan bin Ab Aziz\nE-mel: azlan@pmu.edu.my',False,True)
p('Bahagian/Jabatan: Jabatan Teknologi Maklumat dan Komunikasi\nJawatan: Pensyarah [sahkan jawatan rasmi]',False)
p('Peranan yang dicadangkan untuk pengesahan: mengetuai reka bentuk pembelajaran, pembangunan sistem, penyediaan misi serta pengesahan enjin dan dokumentasi teknikal. Pembahagian ini perlu dipadankan dengan sumbangan sebenar sebelum pengakuan ditandatangani.')
h('1.2 Ahli kumpulan')
p('Hasnah binti Ngah\nE-mel: hasnah@pmu.edu.my',False)
p('Bahagian/Jabatan: Jabatan Perdagangan\nJawatan: Pensyarah [sahkan jawatan rasmi]',False)
p('Peranan yang dicadangkan untuk pengesahan: menyemak kebolehfahaman arahan, kesesuaian aktiviti pengajaran dan pembelajaran serta instrumen maklum balas pengguna. Sumbangan sebenar belum diperincikan dalam rekod yang tersedia.')
p('Nama dan afiliasi diambil daripada dokumen projek sedia ada; e-mel disahkan oleh pemilik projek pada 15 September 2026. Status ketua dan sumbangan individu masih memerlukan pengesahan. Pembahagian peranan di atas ialah cadangan untuk dilengkapkan sebelum penyerahan.')

page('2 ABSTRAK')
abstract='Pembelajaran antara muka Java Swing memerlukan pelajar menghubungkan struktur kod dengan perubahan susun atur ketika aplikasi berjalan. MagikLayout dibangunkan untuk menjadikan hubungan tersebut boleh diperhatikan, diramal dan diuji melalui latihan interaktif. Inovasi ini menggabungkan simulasi BorderLayout, FlowLayout dan GridLayout, penjanaan kod Java berasaskan peraturan, sepuluh cabaran, 12 misi pembaikan visual serta tiga misi realiti terimbuh dalam satu platform pelayar. Sumbangan utamanya ialah penggunaan model komponen dan enjin deterministik yang dikongsi bagi menghasilkan visual, menilai pembaikan dan menyediakan bukti kod yang konsisten. Kecerdasan Buatan atau Artificial Intelligence (AI) digunakan melalui pengambilan petikan korpus dwibahasa dan komposisi petunjuk oleh Claude Haiku 4.5 secara pilihan. Semakan keluaran dan petunjuk gantian menyokong kesinambungan aktiviti apabila respons model ditolak atau perkhidmatan tidak tersedia. Pengesahan teknikal pada 15 September 2026 merekodkan 207 ujian lulus dalam 18 fail serta binaan produksi yang berjaya. Penilaian korpus dan aliran petunjuk meluluskan 138 kes dalam setiap mod deterministik dan adversarial. Keputusan tersebut menyokong kebolehulangan fungsi yang diuji; peningkatan pencapaian pelajar, penjimatan masa dan penerimaan pengguna masih memerlukan kajian lapangan. MagikLayout menyediakan asas praktikal untuk latihan diagnosis dan pembaikan prototaip dalam pendidikan teknikal dan latihan vokasional, dengan peluasan dirancang melalui misi tambahan dan pengesahan bersama institusi.'
p(abstract,True,True,11)
h('3 PENDAHULUAN',1)
p('MagikLayout ialah alat bantu pembelajaran bagi topik antara muka pengguna grafik, iaitu Graphical User Interface (GUI), dalam Java Swing. Konteks kursus yang direkodkan ialah DFP50463 Java Based Application Development di Politeknik Mukah [1]. Pelajar sasaran ialah pelajar diploma yang sedang mempelajari asas GUI; tahap semester perlu mengikut penawaran kursus institusi.')
p('Kami memusatkan inovasi pada kefahaman hubungan antara bekas, komponen dan pengurus susun atur. Apabila pelajar mengubah struktur atau saiz bingkai, sistem memaparkan kesannya bersama kod Java. Pensyarah boleh menggunakan keadaan yang sama untuk demonstrasi, latihan pembaikan dan perbincangan sebab sesuatu susun atur terhasil.')
p('Laporan disusun menurut garis panduan MIPAC TVET 2026 [2]. Kategori Immersive Digital Teaching Aid mengikuti rekod projek; laporan meliputi platform MagikLayout, dengan AR Lab sebagai komponen imersif utama. Ia tidak mewakili penyertaan video AI DigiTeach yang berasingan.')

page('3 PENDAHULUAN DAN OBJEKTIF')
h('3.1 Objektif inovasi')
p('Objektif pertama ialah membolehkan pelajar menerangkan kesan pemilihan pengurus susun atur, perubahan saiz dan penyarangan JPanel. Bukti pencapaian yang dicadangkan ialah ramalan yang tepat serta penjelasan sebab sebelum pelajar melihat hasil perubahan.')
p('Objektif kedua ialah menyediakan latihan diagnosis dan pembaikan yang boleh dinilai secara berulang menggunakan struktur komponen dan geometri. Bukti teknikal tersedia melalui ujian enjin, penggred dan misi; penguasaan pelajar perlu diukur melalui tugasan pemindahan tanpa petunjuk.')
p('Objektif ketiga ialah menyediakan bimbingan AI yang mempunyai sumber dan had peranan yang jelas. Kejayaan teknikal ditentukan melalui kesahihan petikan, pematuhan aras petunjuk, kawalan percanggahan dan keupayaan meneruskan aktiviti ketika model tidak tersedia.')
p('Objektif keempat ialah menghubungkan manipulasi prototaip tiga dimensi dengan diagnosis susun atur dan bukti Java dalam aktiviti realiti terimbuh, atau Augmented Reality (AR). Kesediaan peranti perlu dibuktikan melalui ujian kamera, penjejakan, sentuhan dan penyiapan misi pada telefon sebenar.')
h('3.2 Skop dan kepentingan kepada TVET')
p('Pendidikan teknikal dan latihan vokasional, atau Technical and Vocational Education and Training (TVET), memerlukan latihan yang menghubungkan pengetahuan dengan pelaksanaan. MagikLayout menyediakan urutan aktiviti membina, menguji dan membaiki prototaip. Sistem tidak melaksanakan mesin maya Java dalam pelayar; kod yang dieksport perlu dikompil dan dijalankan dalam persekitaran Java untuk pengesahan runtime sebenar.')
p('Skop teras ialah BorderLayout, FlowLayout, GridLayout dan bekas bersarang. Playground menyokong penerokaan bebas; Challenges menyediakan latihan berstruktur; AI Debugging Studio memberi latihan pembaikan; AR Lab memberi pengalaman spatial. Swing Discovery Lab merupakan peluasan tambahan yang telah didokumentasikan, tetapi tidak digabungkan dengan kiraan tiga misi AR asal [3].')

page('4 PENYATAAN MASALAH DAN KEBAHARUAN')
h('4.1 Masalah yang boleh ditunjukkan')
p('Kes demonstrasi utama ialah dua JButton ditambah terus ke kawasan SOUTH bagi BorderLayout yang sama. Struktur tersebut tidak menghasilkan baris dua butang seperti yang mungkin dijangka pelajar. Misi dalam repositori menunjukkan diagnosis dan pembaikan melalui satu JPanel yang mengandungi kedua-dua butang [4]. Kes ini memberi bukti masalah teknikal yang boleh dihasilkan semula; kekerapan masalah dalam kalangan pelajar belum disahkan melalui data asal.')
p('Dua kes tambahan ialah perubahan baris dalam FlowLayout apabila lebar bekas berkurang dan pengagihan sel sama saiz dalam GridLayout. Peraturan asas ini dihuraikan dalam dokumentasi Oracle [5]. Cabaran pedagoginya ialah membantu pelajar meramal hasil berdasarkan struktur, kemudian menjelaskan sebab ramalan itu betul atau salah.')
h('4.2 Sumbangan inovasi')
p('Kebaharuan yang dikemukakan ialah integrasi pedagogi dan seni bina: keadaan komponen yang sama digunakan untuk visualisasi, semakan pembaikan dan penjanaan kod. Keputusan penilaian boleh dikaitkan dengan struktur yang dilihat pelajar. Ini memberikan jejak bukti yang boleh diperiksa oleh pensyarah dan juri.')
p('Dalam AI Debugging Studio, pelajar melihat keadaan rosak, memilih ramalan, meneliti bukti, melaksanakan pembaikan dan meminta petunjuk apabila perlu. Pengambilan petikan berdasarkan diagnosis menghubungkan penjelasan AI kepada kes sebenar dalam misi. Dalam AR Lab, tindakan pada objek yang dijejak menjadi sebahagian daripada kemajuan misi [4], [6].')
h('4.3 Keaslian dan batas bukti')
p('Algoritma Swing, React, Three.js dan MindAR ialah teknologi sedia ada. Sumbangan kumpulan terletak pada reka bentuk aktiviti, pelaksanaan integrasi, misi dan kawalan penilaian. Tiada tuntutan bahawa MagikLayout ialah produk pertama di dunia atau bahawa algoritma layout dicipta oleh kumpulan. Dokumen lama menyebut kajian n=11 dan n=6; data mentah tidak tersedia dalam bahan yang diperiksa, maka statistik tersebut tidak digunakan sebagai dapatan disahkan.')

page('5 ANALISIS PENYELESAIAN SEDIA ADA')
p('Perbandingan berikut ialah analisis fungsi untuk tugasan pembelajaran susun atur. Ia tidak berasaskan ujian prestasi antara produk komersial dan tidak menyimpulkan bahawa setiap alat dalam sesuatu kategori mempunyai kelemahan yang sama.')
table(1,'Perbandingan pendekatan bagi latihan susun atur',['Pendekatan','Kekuatan dan jurang','Sumbangan MagikLayout'],[
['Nota dan rajah statik','Mudah dirujuk; perubahan saiz perlu dibayangkan atau ditunjukkan berasingan.','Manipulasi bingkai menunjukkan perubahan susun atur secara langsung.'],
['Editor kod dan Java runtime','Menguji aplikasi sebenar; pelajar perlu menghubungkan kod, ralat dan visual sendiri.','Struktur, visual dan kod diletakkan dalam aktiviti yang sama.'],
['Pembina GUI visual','Mempercepat pembinaan; kedalaman penjelasan peraturan bergantung pada alat dan pengajaran.','Misi menumpukan sebab sesuatu komponen disusun atau tersembunyi.'],
['Pembantu AI umum','Boleh menerangkan konsep; ketepatan bergantung pada konteks dan semakan.','Diagnosis enjin mengarahkan petikan dan petunjuk yang boleh disemak.']
],[3.1,6.2,6.62])
p('Nilai tambah yang paling jelas ialah jejak daripada keputusan pelajar kepada bukti struktur. Pensyarah masih boleh menggunakan editor kod dan runtime sebagai semakan akhir. MagikLayout melengkapi aliran kerja tersebut dengan latihan yang memfokuskan satu salah faham pada satu masa [1], [4].')

page('6 BAHAN DAN KAEDAH INOVASI')
h('6.1 Reka bentuk dan proses pembangunan')
p('Rekod projek menunjukkan pembangunan modul enjin, penjana kod, cabaran, bimbingan AI dan AR. Urutan ini dihuraikan sebagai proses pembangunan dalam laporan, tanpa mereka tarikh mula, tempoh kerja atau carta Gantt yang belum disahkan. React dan TypeScript digunakan untuk antara muka dan model keadaan; Vite menyediakan binaan aplikasi [1], [7].')
p('Pokok komponen menyimpan hubungan bekas-anak, jenis komponen, pengurus susun atur dan kekangan. Enjin mengira geometri untuk paparan; penggred menyemak struktur atau geometri mengikut jenis tugasan; penjana kod menghasilkan Java daripada keadaan tersebut. Ketepatan peraturan yang diuji tidak bermaksud kesetaraan piksel pada semua sistem operasi, fon atau tema Swing.')
h('6.2 Seni bina dan aliran operasi')
p('Rajah 1 menunjukkan hubungan komponen sistem. Cabang AI hanya membantu penyampaian petunjuk. Penilaian dan penjanaan kod mempunyai laluan deterministik sendiri.')
cap=doc.add_paragraph('Rajah 1  Aliran keadaan dan bukti MagikLayout',style='Caption');cap.paragraph_format.keep_with_next=True
p('Tindakan pelajar → Pokok komponen Swing\nPokok komponen → Enjin layout → Visual dan geometri\nPokok komponen → Penggred → Diagnosis dan keputusan\nPokok komponen → Penjana Java → Bukti kod\nDiagnosis → Pengambilan korpus → Haiku pilihan\nRespons → Semakan keluaran → Petunjuk atau teks gantian',False)
p('AR Lab menggunakan MindAR untuk menjejak imej sasaran dan Three.js untuk memaparkan objek tiga dimensi. Keadaan misi dipetakan kepada struktur Swing untuk menghasilkan bukti Java. Kamera dan penjejakan memerlukan ujian peranti sebenar; kelulusan binaan sahaja tidak membuktikan fungsi tersebut [6].')
h('6.3 Bahan inovasi')
p('Bahan terdiri daripada kod sumber, korpus dwibahasa, katalog misi, aset sasaran AR, komponen visual dan suite ujian. Rujukan teknikal serta lesen komponen pihak ketiga perlu dikekalkan bersama edaran. Peluasan Swing Discovery Lab mempunyai lima model komponen dan aliran pengenalan tersendiri [3].')

page('6 KAEDAH PEMBELAJARAN DAN PELAKSANAAN')
table(2,'Modul yang boleh diperiksa dalam repositori',['Modul','Aktiviti','Hasil yang boleh diperiksa'],[
['Playground','Tambah komponen, tukar manager dan ubah saiz.','Visual, struktur dan kod Java berubah bersama.'],
['Challenges','10 latihan Parsons, Reflow dan Reverse.','Semakan urutan, geometri atau struktur tugasan.'],
['AI Debugging Studio','12 misi ramalan, pemeriksaan dan pembaikan.','Keputusan pembaikan, petikan dan status semakan AI.'],
['AR Lab asal','3 misi NORTH, CENTER dan pembaikan SOUTH.','Kemajuan misi dan kod daripada keadaan akhir.']
],[3.5,5.3,7.12])
h('6.4 Contoh pelaksanaan pengajaran')
p('Pensyarah membuka kes dua komponen dalam SOUTH dan meminta pelajar meramal komponen yang kelihatan. Pelajar memeriksa hubungan bekas-anak, mencuba pembaikan dan membandingkan kod sebelum dan selepas. Jika memerlukan bantuan, pelajar meminta satu petunjuk pada aras yang dibenarkan. Selepas pembaikan disahkan, pelajar menerangkan fungsi JPanel dengan perkataan sendiri.')
p('Aktiviti pemindahan yang dicadangkan menggunakan kawasan lain atau susunan berbeza tanpa memberikan langkah pembaikan. Bagi aktiviti AR, pelajar mengesan sasaran, menyentuh NORTH, meramal ruang CENTER semasa perubahan saiz dan membaiki konflik SOUTH. Pensyarah merekod penyiapan, ralat dan alasan pelajar. Urutan pengajaran ini ialah cadangan pelaksanaan, bukan laporan kelas yang telah dijalankan.')

page('7 PENGGUNAAN AI DAN ETIKA AI')
h('7.1 Model dan sumber pengetahuan')
p('Endpoint coach-rag menetapkan model claude-haiku-4-5. Dalam Studio, Retrieval-Augmented Generation (RAG) dilaksanakan dengan memilih petikan daripada korpus berdasarkan metadata diagnosis, bahasa dan aras petunjuk sebelum komposisi model. Korpus tersimpan bersama kod serta mempunyai pengecam sumber, versi dan medan penyemak [4], [8]. Kewujudan medan penyemak tidak menggantikan rekod pengesahan manusia yang ditandatangani.')
p('Dataset ini ialah kandungan pengajaran dwibahasa, bukan set latihan untuk melatih semula model. Sistem menggunakan model sedia ada melalui perkhidmatan luar. Modul Challenges turut mempunyai laluan coach yang berbeza; keputusan penilaian RAG dalam laporan ini khusus kepada korpus dan aliran Studio yang diuji.')
h('7.2 Kejuruteraan prompt dan kawalan')
p('Prompt mengehadkan jawapan kepada petikan yang dibekalkan, meminta satu petunjuk ringkas, melarang penggredan semula dan menetapkan format hint serta citedChunkIds. Aras pertama memberi dorongan; aras kedua menyatakan peraturan; aras ketiga memberi petunjuk mekanisme; aras keempat menerangkan pembaikan selepas syarat pelepasan dipenuhi. Penjana Java tidak menggunakan model [8].')
p('Endpoint menolak permintaan tanpa petikan atau dapatan enjin. Pemeriksa pada klien menyemak petikan, bahasa, panjang, kebocoran penyelesaian dan percanggahan sebelum paparan. Kegagalan model atau penolakan respons menggunakan teks korpus sebagai gantian. Kawalan ini mengurangkan risiko dalam aliran yang diuji; ia tidak menjamin semua jawapan model sentiasa tepat.')
h('7.3 Privasi dan tanggungjawab manusia')
p('Log aplikasi menggunakan label pelajar dan kod sesi serta disimpan dalam pelayar. Apabila komposisi diaktifkan, dapatan tugasan dan petikan dihantar kepada endpoint dan penyedia model. Oleh itu, laporan tidak mendakwa semua data kekal pada peranti. Kunci perkhidmatan ditempatkan pada pelayan. Nama, e-mel dan data sulit tidak diperlukan untuk aktiviti yang diterangkan [8].')
p('OpenAI Codex digunakan dalam penyediaan laporan dan telah dinyatakan dalam dokumentasi pembangunan. Kumpulan bertanggungjawab menyemak fakta, hak penggunaan aset, kesetaraan bahasa dan kesesuaian petunjuk. Risiko bias bahasa serta kebergantungan pelajar perlu dinilai melalui penggunaan sebenar. Kawalan kos, had permintaan dan pengendalian log perlu disahkan sebelum peluasan awam.')

page('8 PENGUJIAN DAN TAHAP PELAKSANAAN')
p('Pengesahan semula pada 15 September 2026 menggunakan arahan projek npm test, npm run build dan npm run eval:rag. Log disimpan sebagai bukti pengulangan [7].')
table(3,'Keputusan pengujian teknikal',['Pemeriksaan','Dapatan','Tafsiran'],[
['Suite automatik','207 ujian lulus; 18 fail.','Fungsi yang diliputi suite memenuhi jangkaan ujian.'],
['Binaan produksi','Berjaya.','Kod boleh dibina; terdapat amaran saiz bundel dan modul vendor.'],
['RAG deterministik','138 kes; ketepatan retrieval, sumber teratas dan liputan 100%.','Padanan kepada jangkaan set ujian dalaman.'],
['RAG adversarial','138 kes; percanggahan dan kebocoran akhir 0%.','Keluaran akhir dikawal dalam senario model bermasalah yang diuji.']
],[4.2,5.8,5.92])
h('8.1 Batas kesimpulan pengujian')
p('Dua mod RAG menggunakan set 138 kes yang sama di bawah keadaan berlainan, bukan 276 pelajar atau 276 masalah unik. Ujian adversarial menyemak tingkah laku perlindungan menggunakan model ujian; ia tidak membuktikan kejayaan panggilan Claude secara langsung pada pelayan produksi. Tiada panggilan model berbayar dibuat untuk menyediakan laporan ini.')
p('Ujian automatik tidak mengukur peningkatan pembelajaran, kepuasan atau kemampuan semua telefon menjalankan AR. Rekod penerimaan AR asal dan dokumen lama tidak seragam; tanpa rakaman dan borang peranti yang boleh disemak, ujian kamera, audio dan penyiapan tiga misi perlu disahkan semula. Amaran binaan berkaitan saiz aset AR memberi sebab praktikal untuk mengukur masa muat pada rangkaian kelas.')

page('9 PRAKTIKAL DAN KEBOLEHGUNAAN')
h('9.1 Penggunaan dalam persekitaran sebenar')
p('Platform pelayar membolehkan pensyarah menyediakan demonstrasi tanpa pemasangan aplikasi asli pada setiap peranti. Komputer sesuai untuk manipulasi struktur dan pembacaan kod; telefon berkamera diperlukan untuk pengalaman AR. Sebelum sesi, pensyarah perlu menguji pautan, menyediakan sasaran bercetak yang jelas, memeriksa pencahayaan dan membenarkan akses kamera pada sambungan selamat.')
p('Aktiviti boleh digunakan untuk demonstrasi berpusat, latihan pasangan atau pembelajaran kendiri. Untuk kelas dengan peranti terhad, pensyarah boleh berkongsi satu paparan bagi perbincangan ramalan dan menggunakan giliran peranti bagi AR. Jika penjejakan gagal, permukaan dua dimensi boleh meneruskan perbincangan konsep, tetapi tidak menggantikan bukti penerimaan fungsi AR.')
h('9.2 Kebolehcapaian dan penyelenggaraan')
p('Kod dan dokumentasi menyatakan sokongan fokus, input papan kekunci serta pengurangan animasi pada komponen teras. Ini ialah ciri pelaksanaan, bukan pengesahan menyeluruh pematuhan Web Content Accessibility Guidelines (WCAG). Audit dengan pembaca skrin, pengguna orang kurang upaya dan pelbagai saiz skrin belum tersedia sebagai bukti yang disahkan.')
p('Misi berasaskan data dan modul enjin berasingan memudahkan perubahan kandungan. Sebelum versi baharu digunakan, penyelenggara perlu menjalankan suite ujian, menyemak Java daripada contoh tugasan dan menguji semula peranti AR. Bahan AI perlu mempunyai pemilik kandungan dan rekod semakan agar perubahan bahasa tidak mengubah maksud teknikal.')
h('9.3 Penerimaan pengguna')
p('Tahap penerimaan pengguna belum boleh diberi skor berdasarkan bahan yang tersedia. Lampiran B menyediakan protokol yang boleh terus digunakan untuk mengumpul masa, kesilapan, tahap bantuan dan maklum balas. Pengesahan pakar Java dan pensyarah kursus dicadangkan bagi menentukan sama ada petunjuk, contoh dan aras kesukaran sesuai dengan pelajar sasaran.')
p('Keputusan penerimaan hendaklah merekod kejayaan dan kegagalan. Pelajar yang memerlukan bantuan atau mengalami ralat tidak boleh dikecualikan daripada laporan tanpa sebab yang dinyatakan. Maklum balas tersebut perlu dihubungkan kepada perubahan reka bentuk dan ujian semula.')

page('9 DAPATAN MAKLUM BALAS PENGGUNA')
h('9.4 Kaedah dan sumber analisis')
p('Tangkapan skrin ringkasan respons yang dibekalkan peserta memaparkan enam jawapan bagi setiap dua soalan terbuka [9]. Kami mengelaskan teks jawapan asal secara deskriptif. Kotak Response Summary yang dijana Gemini tidak digunakan sebagai data responden. Tarikh kutipan, kaedah persampelan dan versi aplikasi belum diketahui; tarikh fail ialah tarikh tangkapan skrin. Soalan menggunakan nama LayoutLab, nama terdahulu projek.')
table('3A','Tema pengalaman pembelajaran daripada enam jawapan asal',['Tema utama','Bilangan jawapan','Maksud yang dilaporkan'],[
['Peranan pengurus susun atur','3 daripada 6','Kedudukan automatik, perbezaan manager dan perubahan layout panel.'],
['Perubahan saiz dinamik','2 daripada 6','Komponen meregang dan manager mengendalikan perubahan saiz.'],
['Maklum balas visual segera','1 daripada 6','Susunan komponen dapat dilihat serta-merta.']
],[5.2,3.5,7.22])
p('Setiap jawapan diberi satu tema utama untuk jadual ini. Keenam-enam jawapan menerangkan satu penemuan berkaitan susun atur. Ini menyokong nilai pembelajaran yang dirasakan pengguna, bukan ukuran peningkatan skor. Contohnya, satu jawapan menyebut “realizing that the layout manager controls where components are placed automatically.” Transkripsi penuh disertakan dalam Lampiran D.')
h('9.5 Isu dan tindakan penambahbaikan')
p('Lima daripada enam jawapan kepada soalan kesukaran menyebut sekurang-kurangnya satu isu; satu menjawab “no”. Isu termasuk kekeliruan awal, komponen berpindah selepas manager ditukar, jangkaan kod boleh disunting, kesan salah klik dan komponen mengecil. Satu jawapan meminta lebih banyak arahan. Dapatan positif tidak membuktikan penerimaan tanpa masalah.')
p('Tindakan dicadangkan ialah orientasi ringkas, contoh sebelum dan selepas perubahan manager, penjelasan tentang kod terjana serta panduan memulihkan salah klik dan saiz komponen. Keberkesanan tindakan perlu diuji semula. Graf Likert dan legendanya terpotong; min skor, kadar persetujuan dan kepuasan keseluruhan tidak dikira daripada imej ini.')

page('10 IMPAK INOVASI')
p('Impak yang dapat dihuraikan sekarang ialah keluaran pembangunan: aktiviti interaktif, penilaian yang boleh diulang dan bukti Java daripada keadaan pembaikan. Hubungan kepada hasil pembelajaran ialah hipotesis munasabah yang perlu diuji. Laporan tidak memberikan peratus peningkatan skor atau penjimatan masa tanpa ukuran sebelum dan selepas.')
table(4,'Kerangka pengukuran impak yang dicadangkan',['Dimensi','Ukuran sebelum dan selepas','Status bukti'],[
['Hasil pembelajaran','Skor tugasan setara, alasan teknikal dan tugasan pemindahan.','Belum diukur dalam kajian disahkan.'],
['Masa dan produktiviti','Masa hingga pembaikan betul; bilangan bantuan pensyarah.','Belum ada rekod masa berpasangan.'],
['Kos','Kos operasi, penyelenggaraan, cetakan dan penggunaan model.','Kos sebenar belum dibekalkan.'],
['Kepuasan','Respons soal selidik dan temu bual ringkas.','Data asal perlu diperoleh.']
],[3.8,7.0,5.12])
h('10.1 Kecekapan dan kos')
p('Kos keseluruhan perlu merangkumi domain atau hosting, panggilan model, sambungan, cetakan sasaran dan masa penyelenggaraan. Penggunaan peranti sedia ada berpotensi mengurangkan pembelian perkakasan tambahan, tetapi tidak menjadikan operasi tanpa kos. Penjimatan masa dicadangkan dikira sebagai perbezaan median masa bagi tugasan setara. Pulangan pelaburan tidak dikira kerana data kos dan manfaat belum tersedia.')
h('10.2 Keluasan impak')
p('Berdasarkan bukti yang diperiksa, keluasan yang boleh dipertahankan ialah pembangunan untuk konteks institusi sendiri; penggunaan meluas belum disahkan. Mengikut pengelasan garis panduan [2], tiada asas untuk menuntut impak sederhana atau tinggi pada masa ini. Potensi merentasi institusi bergantung pada pilot, pengesahan pengguna dan sokongan penyelenggaraan.')

page('11 PERLUASAN PENGKOMERSIALAN KELESTARIAN DAN KEBOLEHSKALAAN')
h('11.1 Pemindahan amalan dan kerjasama')
p('Peluasan dicadangkan bermula dengan pakej demonstrasi, sasaran AR, arahan pelajar, rubrik dan contoh Java yang boleh digunakan pensyarah lain. Pakej perlu diuji oleh pengajar yang tidak terlibat dalam pembangunan untuk menilai kejelasan arahan serta keperluan bantuan teknikal.')
p('Kerjasama yang sesuai melibatkan pensyarah Java GUI, unit e-pembelajaran dan institusi TVET yang menawarkan modul sepadan. Tiada kerjasama, surat sokongan atau penggunaan industri dianggap telah berlaku tanpa dokumen pengesahan. Standard Kemahiran Pekerjaan Kebangsaan, atau National Occupational Skills Standard (NOSS), IT-010-3:2016-C01 ialah pemetaan dalaman yang direkodkan pada AR Lab [6]; kesetaraan rasmi memerlukan semakan terhadap dokumen kompetensi dan pengesahan pihak berkaitan.')
h('11.2 Potensi pengkomersialan')
p('Pilihan pembangunan termasuk pakej latihan pensyarah, penyesuaian kandungan dan sokongan pelaksanaan institusi. Harga, permintaan pasaran dan pendapatan belum dibuktikan. Pengkomersialan hanya wajar selepas penerimaan pengguna disahkan serta pemilikan kod, aset, lesen dan tanggungjawab sokongan diperjelas.')
h('11.3 Penyelenggaraan dan skala')
p('Penyelenggaraan memerlukan fungsi pemilik kandungan, penyelenggara teknikal dan penguji. Pada peringkat awal, seorang ahli boleh memegang lebih daripada satu fungsi, tetapi semakan kandungan perlu mempunyai rekod. Bajet hendaklah mengambil kira hosting, ujian peranti, penyemakan bahasa dan penggunaan perkhidmatan model.')
p('Peluasan pengguna perlu diikuti ujian beban endpoint, kawalan permintaan, ukuran masa muat aset AR dan pemantauan ralat. Aktiviti deterministik mengurangkan pergantungan pada respons model bagi setiap tindakan. Integrasi sistem pengurusan pembelajaran dan pembinaan misi oleh pensyarah ialah cadangan masa hadapan, bukan fungsi produksi yang dibuktikan dalam laporan.')
p('Keutamaan seterusnya ialah melengkapkan pilot, membaiki isu pengguna dan mengulangi penerimaan pada versi baharu. Peluasan ke institusi lain dibuat selepas pengajar kedua dapat menjalankan aktiviti menggunakan panduan yang dibekalkan.')

page('12 KESIMPULAN')
p('MagikLayout menggabungkan simulasi susun atur, latihan diagnosis, bimbingan bersumber dan manipulasi AR dalam pembelajaran Java Swing. Kelebihan teknikal yang dapat dipertahankan ialah perkongsian model keadaan untuk menghasilkan visual, keputusan pembaikan dan bukti kod yang berkaitan. Ini memudahkan juri menelusuri bagaimana sesuatu aktiviti dilaksanakan dan dinilai.')
p('Objektif pembangunan fungsi disokong oleh pelaksanaan dan keputusan suite ujian. Objektif perubahan kompetensi pelajar masih perlu disahkan melalui tugasan pemindahan dan kajian kelas. Pengukuhan bukti pengguna, pengesahan peranti serta kos sebenar ialah langkah paling bernilai untuk meningkatkan kesiapsediaan pertandingan dan peluasan institusi.')
h('13 PENGAKUAN KEASLIAN',1)
p('Teks pengakuan untuk semakan dan tandatangan peserta: Kami mengaku bahawa sumbangan asli yang dinyatakan dalam inovasi dan laporan ini merupakan hasil kerja kami. Sumber adaptasi dan bahan pihak ketiga dinyatakan, dan penggunaan bahan tersebut tertakluk pada hak cipta, lesen serta kebenaran yang berkaitan. Kami bertanggungjawab terhadap ketepatan fakta, data, privasi dan kerahsiaan bahan yang dikemukakan.')
p('Kami akan menyemak semua kandungan yang dibantu AI serta memastikan hanya bukti yang boleh disahkan digunakan dalam penyerahan rasmi. Pengakuan ini belum ditandatangani secara automatik melalui penyediaan laporan.',False)
p('Tandatangan ketua: ____________________\nNama: ______________________________\nTarikh: ______________________________',False)
h('14 TAHAP KESIAPSEDIAAN TEKNOLOGI',1)
p('Penilaian kendiri yang konservatif ialah Technology Readiness Level (TRL) 4: komponen dan integrasi prototaip telah diuji dalam persekitaran pembangunan. Ia berada dalam kelompok TRL 4-6 menurut panduan [2]. TRL 5 atau 6 memerlukan bukti persekitaran penggunaan dan demonstrasi bersepadu yang lebih kukuh. Label ini bukan pensijilan bebas atau tuntutan sedia dikomersialkan.')

page('RUJUKAN')
refs=[
'[1] Grup Nelang PMU, “MagikLayout: skop produk dan rekod penyertaan,” PRODUCT.md dan MIPAC_TVET_2026.md, repositori projek, diperiksa 15 September 2026.',
'[2] CIAST, Format Penulisan dan Kandungan Laporan Inovasi Pertandingan MIPAC TVET 2026, 2026, hlm. 1-6. Dokumen PDF yang dibekalkan peserta.',
'[3] Grup Nelang PMU, “Swing Discovery Lab,” SWING_AR_LAB.md, repositori projek, diperiksa 15 September 2026.',
'[4] Grup Nelang PMU, “AI Debugging Studio dan aliran pembelajaran,” MagicAI.md; src/classroom/debugStudio.ts; src/challenges/data/; src/challenges/grade.ts, diperiksa 15 September 2026.',
'[5] Oracle, “A Visual Guide to Layout Managers,” The Java Tutorials, tutorial berasaskan JDK 8. Dicapai 15 September 2026. https://docs.oracle.com/javase/tutorial/uiswing/layout/visual.html',
'[6] Grup Nelang PMU, “AR Lab dan pelan penerimaan,” AR_P0.md; src/ar/ARLab.tsx; src/ar/arLabModel.ts, diperiksa 15 September 2026.',
'[7] MagikLayout, “Log pengesahan teknikal 15 September 2026,” tests.log, rag.log dan build.log, tmp/mipac_juri_2026/, repositori projek. Dihasilkan melalui arahan npm test, npm run eval:rag dan npm run build.',
'[8] MagikLayout, “Korpus, prompt dan kawalan AI,” supabase/functions/coach-rag/index.ts; src/coach/corpus/; src/coach/guard.ts; src/coach/log.ts; src/coach/eval/, diperiksa 15 September 2026.',
'[9] Peserta MagikLayout, tangkapan skrin ringkasan respons LayoutLab, fail Screenshot 2026-09-15 at 4.16.05 AM.png, dibekalkan 15 September 2026. Enam respons dipaparkan bagi setiap soalan terbuka; tarikh kutipan tidak dinyatakan.'
]
for r in refs:p(r,False)

page('LAMPIRAN A JEJAK BUKTI UNTUK JURI')
table(5,'Pemetaan tuntutan kepada bukti dan semakan',['Tuntutan','Lokasi bukti','Cara semakan'],[
['Peraturan layout dan Java','src/engine/; src/codegen/','Ubah saiz dan struktur; periksa kod dan ujian.'],
['12 misi Studio','src/classroom/debugStudio.ts','Buka katalog; lengkapkan pembaikan contoh.'],
['3 misi AR asal','src/ar/; AR_P0.md','Uji sasaran, sentuhan, audio dan Java pada telefon.'],
['Petunjuk bersumber','src/coach/; coach-rag','Periksa petikan, status guard dan teks gantian.'],
['Keputusan teknikal','Log bertarikh [7]','Padankan kiraan dengan hasil arahan projek.']
],[4.0,5.5,6.42])
h('A.1 Demonstrasi yang boleh diulang')
p('Mulakan dengan misi dua kawalan dalam SOUTH. Tunjukkan ramalan, struktur awal, satu petunjuk dan status sumbernya. Laksanakan pembaikan sehingga keputusan disahkan, kemudian tunjukkan struktur akhir dan Java. Untuk AR, ulangi pengesanan sasaran hingga penyiapan tiga misi serta hentikan kamera semasa keluar.')
p('Alamat projek yang direkodkan ialah https://magik-layout.mhdazlan.cc dengan laluan #/challenges, #/classroom dan #/ar-lab. Kebolehcapaian langsung, versi deployment dan respons model belum disahkan dalam semakan laporan ini. Pautan demonstrasi hanya patut dikunci untuk penyerahan selepas diuji tanpa akses khas pada peranti lain.')

page('LAMPIRAN B PROTOKOL PENGESAHAN PENGGUNA')
p('Protokol ini ialah instrumen cadangan, bukan data keputusan. Catat tarikh, versi aplikasi, kod peserta tanpa nama, peranti, pelayar, pengalaman Java dan sama ada bantuan pensyarah atau AI digunakan.')
h('B.1 Tugasan dan rekod')
p('Sebelum penggunaan, berikan tugasan ramalan susun atur dan satu pembaikan tanpa MagikLayout. Rekod skor menggunakan rubrik yang sama untuk semua peserta. Selepas aktiviti MagikLayout, berikan tugasan setara dengan kandungan berbeza. Tambahkan satu tugasan pemindahan tanpa petunjuk untuk menguji kefahaman, bukan ingatan terhadap langkah.')
p('Bagi setiap tugasan, rekod masa mula dan tamat, bilangan percubaan, petunjuk diterima, kesilapan struktur dan kejayaan akhir. Laporkan saiz sampel, semua kegagalan, data hilang dan kaedah pemilihan peserta. Kajian satu kumpulan pra/pasca tidak dengan sendirinya membuktikan sebab-akibat; kumpulan perbandingan sesuai dipertimbangkan jika boleh dilaksanakan.')
h('B.2 Soalan maklum balas')
p('Gunakan skala 1 hingga 5 dengan label 1 sangat tidak setuju dan 5 sangat setuju. Nilai pernyataan: arahan mudah difahami; perubahan visual membantu menerangkan peraturan; petunjuk membantu tanpa menghalang pemikiran sendiri; dan aktiviti boleh disiapkan menggunakan peranti tersedia. Tambahkan pilihan tidak berkenaan bagi fungsi yang tidak digunakan.')
p('Soalan terbuka: Pada langkah manakah anda keliru? Apakah peraturan yang kini boleh anda terangkan? Apakah yang perlu diperbaiki? Dapatkan persetujuan bagi penggunaan komen dan gambar; petikan testimoni hanya digunakan dengan rekod asal dan kebenaran.')
h('B.3 Penerimaan AR pada peranti')
p('Rekod model telefon, versi pelayar, rangkaian dan keadaan pencahayaan. Tandakan lulus atau gagal bagi kebenaran kamera, sasaran ditemui, kestabilan objek, sentuhan setiap misi, audio, penyiapan 3/3, bukti Java dan kamera berhenti ketika keluar. Lampirkan rakaman bertarikh serta nama penguji dengan kebenaran.')

page('LAMPIRAN C SEMAKAN SEBELUM PENYERAHAN')
p('Perkara berikut ialah jurang bukti yang perlu ditutup oleh pemilik projek. Ia disertakan supaya status laporan dapat dikenal pasti sebelum pengakuan ditandatangani.')
table(6,'Perkara yang memerlukan pengesahan peserta',['Perkara','Bahan yang diperlukan'],[
['Identiti dan sumbangan','E-mel telah dilengkapkan. Sahkan ketua, jawatan serta sumbangan sebenar setiap ahli.'],
['Keperluan dan penerimaan','Data soal selidik asal, instrumen, tarikh, sampel dan persetujuan penggunaan.'],
['Demonstrasi AR','Rekod ujian peranti dan rakaman penyiapan misi.'],
['Impak dan kos','Data pra/pasca, masa tugasan, rekod bantuan dan kos sebenar.'],
['Akses dan versi','Pautan awam tanpa kebenaran khas serta versi aplikasi yang dinilai.'],
['Keaslian dan hak bahan','Semakan lesen, kebenaran gambar dan tandatangan pengakuan.']
],[5,10.92])
p('Ketiadaan bukti di atas tidak menafikan fungsi prototaip yang telah diuji, tetapi mengehadkan kekuatan tuntutan tentang keberkesanan dan kesiapsediaan lapangan. Keutamaan ialah memperoleh data pengguna dan rekod AR yang boleh disahkan, kemudian mengemas kini bahagian impak dan tahap teknologi berdasarkan dapatan sebenar.')

page('LAMPIRAN D TRANSKRIPSI PENGALAMAN PEMBELAJARAN')
p('Sumber: teks jawapan asal yang kelihatan dalam tangkapan skrin [9]. Ejaan dan tatabahasa responden dikekalkan. Label A1-A6 menandakan urutan paparan sahaja dan bukan pengecam peserta. Tidak diketahui sama ada urutan jawapan sepadan antara soalan.')
p('Soalan: What was your biggest "aha!" moment regarding Java Swing while using LayoutLab?\nPaparan: 6 responses',False)
answers_a=[
'realizing that the layout manager controls where components are placed automatically.',
'understanding that each layout manager arranges components differently',
'i realize component suddenly stretch and resize perfectly',
'My biggest ‘aha!’ moment was seeing how different layout managers dynamically handle window resizing',
'when i finally know that i can change the layout of certain panel',
'it was the moment where i can see how the component lay on the frame immediately.'
]
for i,a in enumerate(answers_a,1):p(f'A{i}. {a}',False)
p('Pengelasan analisis: A1, A2 dan A5 berkaitan peranan pengurus susun atur; A3 dan A4 berkaitan perubahan saiz; A6 berkaitan visual segera. Kiraan 3, 2 dan 1 merujuk tema utama yang diberikan kepada enam jawapan. Ia tidak mengukur tahap kemahiran atau perubahan pencapaian individu.')
p('Rumusan automatik Gemini dalam imej tidak ditranskripsikan sebagai testimoni. Sebelum penerbitan luar, kumpulan perlu memastikan penggunaan jawapan dan imej mematuhi persetujuan asal responden.')

page('LAMPIRAN E TRANSKRIPSI ISU KEBOLEHGUNAAN')
p('Soalan: Did you encounter any behaviors in the app that felt confusing, frustrating, or broken?\nPaparan: 6 responses',False)
answers_b=[
'at first, it was a little confusing because changing the layout manager sometimes moved all the components to unexpected positions. It took a few tries to understand why the layout changed.',
'Yes. At first, I was confused because the code could not be edited directly, but later I understood that the app uses drag and drop.',
'if i one tiny wrong click it will make entire layout feel broken',
"t was a bit frustrating when components would suddenly shrink to tiny, invisible lines if they didn't have a preferred size set",
'it felt confusing at the first 10 minutes, but it should be more user friendly (add more instructions)',
'no'
]
for i,a in enumerate(answers_b,1):p(f'B{i}. {a}',False)
p('Label B1-B6 ialah urutan paparan bagi soalan ini sahaja. Lima jawapan menyebut isu dan satu tidak melaporkan isu. Jawapan B5 tentang 10 minit ialah anggaran kendiri seorang responden, bukan purata masa orientasi. Tema boleh bertindih, maka kiraan isu tidak dijumlahkan sebagai bilangan peserta baharu.')
p('Batas analisis: graf Section 1 tidak memaparkan keseluruhan skala; label item dan legenda Section 2 tidak lengkap. Data berjadual penuh diperlukan untuk menentukan setiap item, bilangan jawapan sah, taburan skor dan min. Imej juga tidak membuktikan bahawa AR Lab atau model AI semasa telah dinilai.')

# Update related claims consistently with the newly supplied primary responses.
replacements={
'Dokumen lama menyebut kajian n=11 dan n=6; data mentah tidak tersedia dalam bahan yang diperiksa, maka statistik tersebut tidak digunakan sebagai dapatan disahkan.':'Tangkapan skrin baharu membekalkan enam jawapan asal bagi dua soalan terbuka [9], yang dianalisis dalam Bahagian 9.4 dan 9.5. Bukti kajian n=11 serta data skor penuh masih belum tersedia.',
'Tahap penerimaan pengguna belum boleh diberi skor berdasarkan bahan yang tersedia. Lampiran B menyediakan protokol yang boleh terus digunakan untuk mengumpul masa, kesilapan, tahap bantuan dan maklum balas.':'Enam respons terbuka yang dipaparkan menunjukkan penemuan pembelajaran serta isu kebolehgunaan [9]. Analisis terperinci disertakan pada halaman berikutnya. Skor penerimaan keseluruhan belum boleh dikira kerana graf tidak lengkap. Lampiran B menyediakan protokol pengesahan susulan.',
'Impak yang dapat dihuraikan sekarang ialah keluaran pembangunan: aktiviti interaktif, penilaian yang boleh diulang dan bukti Java daripada keadaan pembaikan. Hubungan kepada hasil pembelajaran ialah hipotesis munasabah yang perlu diuji.':'Bukti impak merangkumi fungsi yang dibangunkan dan maklum balas pengguna. Keenam-enam jawapan soalan pengalaman pembelajaran menerangkan penemuan tentang layout [9]. Dapatan ini menyokong kefahaman yang dilaporkan sendiri; perubahan prestasi perlu diuji dengan ukuran berasingan.',
'Objektif pembangunan fungsi disokong oleh pelaksanaan dan keputusan suite ujian. Objektif perubahan kompetensi pelajar masih perlu disahkan melalui tugasan pemindahan dan kajian kelas.':'Objektif pembangunan fungsi disokong oleh pelaksanaan dan keputusan suite ujian. Enam jawapan pengguna turut menyokong nilai visualisasi yang dirasakan, manakala lima jawapan soalan kesukaran mengenal pasti isu untuk penambahbaikan [9]. Perubahan kompetensi masih memerlukan tugasan pemindahan dan kajian kelas.',
'fungsi yang diuji; peningkatan pencapaian pelajar, penjimatan masa dan penerimaan pengguna masih memerlukan kajian lapangan.':'fungsi yang diuji. Enam jawapan pengguna melaporkan penemuan berkaitan susun atur, sementara lima daripada enam jawapan soalan kesukaran menyebut isu kebolehgunaan. Peningkatan pencapaian dan penjimatan masa masih memerlukan kajian lapangan.',
'Data soal selidik asal, instrumen, tarikh, sampel dan persetujuan penggunaan.':'Respons terbuka tersedia [9]. Lengkapkan eksport skor, tarikh kutipan, versi aplikasi, sampel dan persetujuan penggunaan.'
}
for para in doc.paragraphs:
 for run in para.runs:
  for a,b in replacements.items():
   if a in run.text:run.text=run.text.replace(a,b)
for t in doc.tables:
 for row in t.rows:
  for c in row.cells:
   for para in c.paragraphs:
    for run in para.runs:
     for a,b in replacements.items():run.text=run.text.replace(a,b)
     if run.text=='Data asal perlu diperoleh.':run.text='Respons terbuka tersedia; skor penuh belum tersedia.'
     if run.text=='Belum diukur dalam kajian disahkan.':run.text='Penemuan kendiri dilaporkan; skor pra/pasca belum tersedia.'

# Static contents is populated after the first PDF pagination pass.
mapping=ROOT/'tmp/mipac_juri_2026/page_map.json'
page_map=json.loads(mapping.read_text()) if mapping.exists() else {}
contents=[q.text for q in doc.paragraphs if q.style.name=='Heading 1' and q.text!='SENARAI KANDUNGAN']
for title in contents:
 x=OxmlElement('w:p');toc._p.addprevious(x)
 from docx.text.paragraph import Paragraph
 q=Paragraph(x,doc._body);q.paragraph_format.space_after=Pt(4)
 q.paragraph_format.tab_stops.add_tab_stop(Cm(15.8),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
 display=title
 if title.startswith('11 PERLUASAN'):
  display='11 PERLUASAN PENGKOMERSIALAN\n     KELESTARIAN DAN KEBOLEHSKALAAN'
 q.add_run(display+'\t'+str(page_map.get(title,'...')))
for st in doc.styles:
 for el in list(st._element.iter()):
  if el.tag in (qn('w:pBdr'),qn('w:contextualSpacing')):
   el.getparent().remove(el)
for para in doc.paragraphs:
 for el in list(para._p.iter()):
  if el.tag==qn('w:pBdr'):el.getparent().remove(el)
doc.core_properties.title='MagikLayout Laporan Inovasi MIPAC TVET 2026'
doc.core_properties.author='Grup Nelang PMU'
doc.core_properties.subject='Laporan teknikal berasaskan bukti untuk penilaian inovasi'
OUT.parent.mkdir(parents=True,exist_ok=True);doc.save(OUT)
(ROOT/'tmp/mipac_juri_2026/headings.json').write_text(json.dumps(pages,ensure_ascii=False))
print(OUT);print('abstract words',len(abstract.split()))
