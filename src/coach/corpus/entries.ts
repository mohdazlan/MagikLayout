/**
 * The governed teaching corpus, in authoring form.
 *
 * Each entry is ONE approved passage written as a bilingual pair. English and
 * Bahasa Malaysia sit on adjacent lines on purpose: a reviewer checking
 * technical equivalence (MVP RAG acceptance criterion 4) reads them together,
 * and Java identifiers — BorderLayout, JPanel, FlowLayout, setLayout, add — stay
 * untranslated in both.
 *
 * `corpus/index.ts` expands every entry into two retrievable chunks carrying the
 * full metadata schema. Nothing in the pipeline reads this file directly.
 *
 * ── The hint ladder ────────────────────────────────────────────────────────
 *  1  Nudge              One question. Names no structure and no component.
 *  2  Concept reminder   The Swing rule, stated generally.
 *  3  Structural clue    Names the mechanism to reach for. Still no code.
 *  4  Worked explanation Why the repair works. RELEASED AFTER SUCCESS ONLY.
 *
 * Level 4 text is deliberately explicit; the hint policy is what keeps it out of
 * an assessed attempt, and the guard rejects it if it ever escapes.
 *
 * ── Scope ──────────────────────────────────────────────────────────────────
 * An entry is scoped either to one misconception code or to a whole family.
 * Retrieval prefers the exact code and falls back to the family, so a new
 * region-specific code inherits sound teaching content the day it is added.
 */
import type { MisconceptionCode, MisconceptionFamily } from '../misconceptions'

export type HintLevel = 1 | 2 | 3 | 4

export type EntryScope = { kind: 'code'; code: MisconceptionCode } | { kind: 'family'; family: MisconceptionFamily }

export interface CorpusEntry {
  /** Stable citation id. Never reused, never renumbered. */
  sourceId: string
  scope: EntryScope
  hintLevel: HintLevel
  /** English (en-MY). */
  en: string
  /** Bahasa Malaysia (ms-MY), technically equivalent — not a loose paraphrase. */
  ms: string
  /** Authoritative reference the rule was derived from, where one applies. */
  derivedFrom?: string
  version: string
  /** Reviewer initials — the human who approved this text for classroom use. */
  reviewer: string
}

const ORACLE_BORDER = 'https://docs.oracle.com/javase/tutorial/uiswing/layout/border.html'
const ORACLE_FLOW = 'https://docs.oracle.com/javase/tutorial/uiswing/layout/flow.html'
const ORACLE_GRID = 'https://docs.oracle.com/javase/tutorial/uiswing/layout/grid.html'
const ORACLE_USING = 'https://docs.oracle.com/javase/tutorial/uiswing/layout/using.html'

const code = (c: MisconceptionCode): EntryScope => ({ kind: 'code', code: c })
const family = (f: MisconceptionFamily): EntryScope => ({ kind: 'family', family: f })

const V = 'v1.0'
const R = 'MAA' // reviewing teacher initials

export const CORPUS_ENTRIES: CorpusEntry[] = [
  // ═══ BL-SOUTH-COLLISION — the competition lesson, full ladder ═══════════
  {
    sourceId: 'ML-BLS-L1',
    scope: code('BL-SOUTH-COLLISION'),
    hintLevel: 1,
    en: 'Your code ran without an error, so nothing was rejected — but look at the bottom of the frame. How many things did you send there, and how many can you actually see?',
    ms: 'Kod anda berjalan tanpa ralat, jadi tiada apa yang ditolak — tetapi lihat bahagian bawah bingkai. Berapa banyak yang anda hantar ke sana, dan berapa banyak yang benar-benar kelihatan?',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BLS-L2',
    scope: code('BL-SOUTH-COLLISION'),
    hintLevel: 2,
    en: 'BorderLayout has exactly five slots, and SOUTH is one slot — not a row. When a second component is added to the same region, it replaces the first in that slot, and the earlier one is never given a size or a position.',
    ms: 'BorderLayout mempunyai tepat lima slot, dan SOUTH ialah satu slot — bukan satu baris. Apabila komponen kedua ditambah ke kawasan yang sama, ia menggantikan yang pertama dalam slot itu, dan komponen terdahulu tidak pernah diberi saiz atau kedudukan.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BLS-L3',
    scope: code('BL-SOUTH-COLLISION'),
    hintLevel: 3,
    en: 'One slot can still carry two buttons — but only if the slot holds a single container instead of two loose components. Think about what kind of component is allowed to have children of its own, and which manager arranges those children side by side.',
    ms: 'Satu slot masih boleh membawa dua butang — tetapi hanya jika slot itu memegang satu bekas tunggal dan bukan dua komponen berasingan. Fikirkan jenis komponen yang dibenarkan mempunyai anak sendiri, dan pengurus mana yang menyusun anak-anak itu bersebelahan.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BLS-L4',
    scope: code('BL-SOUTH-COLLISION'),
    hintLevel: 4,
    en: 'The repair works because the SOUTH slot now holds one component — a JPanel. That JPanel is a container with its own FlowLayout, and FlowLayout lays its children out in a row in add order. BorderLayout still obeys its one-component-per-region rule; you satisfied the rule instead of fighting it.',
    ms: 'Pembaikan ini berkesan kerana slot SOUTH kini memegang satu komponen sahaja — sebuah JPanel. JPanel itu ialah bekas dengan FlowLayout tersendiri, dan FlowLayout menyusun anak-anaknya dalam satu baris mengikut susunan add. BorderLayout masih mematuhi peraturan satu komponen bagi setiap kawasan; anda memenuhi peraturan itu, bukan melawannya.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },

  // ═══ NESTED-PANEL-MISSING ═══════════════════════════════════════════════
  {
    sourceId: 'ML-NPM-L1',
    scope: code('NESTED-PANEL-MISSING'),
    hintLevel: 1,
    en: 'Count the containers in the target and the containers in your build. Are they the same number?',
    ms: 'Kira bilangan bekas dalam sasaran dan bilangan bekas dalam binaan anda. Adakah jumlahnya sama?',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-NPM-L2',
    scope: code('NESTED-PANEL-MISSING'),
    hintLevel: 2,
    en: 'A layout manager only arranges the direct children of its own container. To get a different arrangement inside one part of the frame, that part has to be a container with a manager of its own.',
    ms: 'Pengurus susun atur hanya menyusun anak langsung bagi bekasnya sendiri. Untuk mendapatkan susunan berbeza di dalam satu bahagian bingkai, bahagian itu mesti menjadi bekas dengan pengurusnya sendiri.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-NPM-L3',
    scope: code('NESTED-PANEL-MISSING'),
    hintLevel: 3,
    en: 'A JPanel is a component and a container at the same time — that is what makes nesting possible. Build the group first, give it the manager you want inside, then add the finished group to the region.',
    ms: 'JPanel ialah komponen dan bekas pada masa yang sama — itulah yang membolehkan penyarangan. Bina kumpulan itu dahulu, berikan pengurus yang anda mahu di dalamnya, kemudian tambah kumpulan yang siap itu ke kawasan berkenaan.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-NPM-L4',
    scope: code('NESTED-PANEL-MISSING'),
    hintLevel: 4,
    en: 'Nesting works because the outer manager sees one child, not several. The outer BorderLayout sizes and places the JPanel as a single unit; inside it, the panel’s own manager divides that space among its children. Every complex Swing interface is built from this one idea repeated.',
    ms: 'Penyarangan berkesan kerana pengurus luar hanya nampak satu anak, bukan beberapa. BorderLayout di luar memberi saiz dan kedudukan kepada JPanel sebagai satu unit; di dalamnya, pengurus panel itu sendiri membahagikan ruang tersebut antara anak-anaknya. Setiap antara muka Swing yang kompleks dibina daripada satu idea ini yang diulang.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // ═══ SETLAYOUT-AFTER-ADD ════════════════════════════════════════════════
  {
    sourceId: 'ML-SLA-L1',
    scope: code('SETLAYOUT-AFTER-ADD'),
    hintLevel: 1,
    en: 'Every statement compiled, yet a component never appeared. Read your statements top to bottom — was the container ready to receive it when the add ran?',
    ms: 'Setiap pernyataan berjaya dikompil, namun satu komponen tidak pernah muncul. Baca pernyataan anda dari atas ke bawah — adakah bekas itu sudah bersedia menerimanya ketika add dijalankan?',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-SLA-L2',
    scope: code('SETLAYOUT-AFTER-ADD'),
    hintLevel: 2,
    en: 'BorderLayout records a component together with the region it was given. Installing a new BorderLayout with setLayout gives the container a manager that has no record of anything added earlier, so those components are never laid out.',
    ms: 'BorderLayout merekodkan komponen bersama kawasan yang diberikan kepadanya. Memasang BorderLayout baharu dengan setLayout memberikan bekas itu pengurus yang tiada rekod tentang apa-apa yang ditambah sebelumnya, jadi komponen tersebut tidak pernah disusun.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-SLA-L3',
    scope: code('SETLAYOUT-AFTER-ADD'),
    hintLevel: 3,
    en: 'The fix is a reordering, not new code: the container needs its manager before anything is added to it. Move the setLayout statement above the first add for that container.',
    ms: 'Penyelesaiannya ialah penyusunan semula, bukan kod baharu: bekas itu memerlukan pengurusnya sebelum apa-apa ditambah kepadanya. Alihkan pernyataan setLayout ke atas add pertama bagi bekas tersebut.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-SLA-L4',
    scope: code('SETLAYOUT-AFTER-ADD'),
    hintLevel: 4,
    en: 'With setLayout first, every add is registered against the manager that will do the laying out, so its region constraint is kept. This is why GUI construction is written as: create the container, set its layout, then add its children — in that order, for every container in the tree.',
    ms: 'Dengan setLayout didahulukan, setiap add didaftarkan pada pengurus yang akan melakukan susun atur, jadi kekangan kawasannya dikekalkan. Inilah sebabnya pembinaan GUI ditulis sebagai: cipta bekas, tetapkan susun aturnya, kemudian tambah anak-anaknya — mengikut susunan itu, bagi setiap bekas dalam pokok.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },

  // ═══ GRID-ORDER ═════════════════════════════════════════════════════════
  {
    sourceId: 'ML-GRO-L1',
    scope: code('GRID-ORDER'),
    hintLevel: 1,
    en: 'The grid put your components somewhere you did not expect. If you read your add statements in order, and read the grid the way you read a page, do the two sequences match?',
    ms: 'Grid meletakkan komponen anda di tempat yang tidak anda jangkakan. Jika anda membaca pernyataan add mengikut susunan, dan membaca grid seperti anda membaca halaman, adakah kedua-dua urutan itu sepadan?',
    derivedFrom: ORACLE_GRID,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-GRO-L2',
    scope: code('GRID-ORDER'),
    hintLevel: 2,
    en: 'GridLayout takes no position argument at all. It fills its cells left to right, row by row, strictly in the order components were added — the first add goes to the top-left cell.',
    ms: 'GridLayout langsung tidak menerima argumen kedudukan. Ia mengisi selnya dari kiri ke kanan, baris demi baris, tepat mengikut susunan komponen ditambah — add pertama pergi ke sel kiri atas.',
    derivedFrom: ORACLE_GRID,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-GRO-L3',
    scope: code('GRID-ORDER'),
    hintLevel: 3,
    en: 'Since position comes only from sequence, the repair is to reorder the add statements so that reading them top to bottom traces the grid row by row. Nothing about the components themselves needs to change.',
    ms: 'Oleh sebab kedudukan hanya datang daripada urutan, pembaikannya ialah menyusun semula pernyataan add supaya membacanya dari atas ke bawah mengikuti grid baris demi baris. Tiada apa-apa pada komponen itu sendiri yang perlu diubah.',
    derivedFrom: ORACLE_GRID,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-GRO-L4',
    scope: code('GRID-ORDER'),
    hintLevel: 4,
    en: 'GridLayout is row-major: with rows × cols cells, component number n lands in row n / cols and column n % cols, counting from zero. Because the mapping is pure sequence, add order is the only control you have — and it is enough.',
    ms: 'GridLayout bersifat row-major: dengan sel rows × cols, komponen nombor n mendarat di baris n / cols dan lajur n % cols, dikira bermula dari sifar. Oleh sebab pemetaan ini semata-mata urutan, susunan add ialah satu-satunya kawalan yang anda ada — dan ia memadai.',
    derivedFrom: ORACLE_GRID,
    version: V,
    reviewer: R,
  },

  // ═══ FLOW-ORDER ═════════════════════════════════════════════════════════
  {
    sourceId: 'ML-FLO-L1',
    scope: code('FLOW-ORDER'),
    hintLevel: 1,
    en: 'Your components are all correct and all present. Read them left to right on the canvas, then read your add statements top to bottom — what is different?',
    ms: 'Komponen anda semuanya betul dan semuanya ada. Baca dari kiri ke kanan pada kanvas, kemudian baca pernyataan add anda dari atas ke bawah — apa yang berbeza?',
    derivedFrom: ORACLE_FLOW,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FLO-L2',
    scope: code('FLOW-ORDER'),
    hintLevel: 2,
    en: 'FlowLayout arranges components in a row in the order they were added, like words in a sentence. There is no way to ask it for a position — the sequence of adds is the position.',
    ms: 'FlowLayout menyusun komponen dalam satu baris mengikut susunan ia ditambah, seperti perkataan dalam ayat. Tiada cara untuk memintanya meletakkan kedudukan — urutan add itulah kedudukannya.',
    derivedFrom: ORACLE_FLOW,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FLO-L3',
    scope: code('FLOW-ORDER'),
    hintLevel: 3,
    en: 'So the repair is to swap the order in which you add them to the panel. Decide the reading order you want on screen first, then make your add statements follow exactly that order.',
    ms: 'Jadi pembaikannya ialah menukar susunan anda menambahnya ke panel. Tentukan dahulu susunan bacaan yang anda mahu di skrin, kemudian pastikan pernyataan add anda mengikut susunan itu dengan tepat.',
    derivedFrom: ORACLE_FLOW,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FLO-L4',
    scope: code('FLOW-ORDER'),
    hintLevel: 4,
    en: 'FlowLayout walks the container’s component list once and places each item after the previous one, wrapping to a new row when the width runs out. Add order is therefore the whole specification — which is why the same components in a different order are a genuinely different interface.',
    ms: 'FlowLayout menyusuri senarai komponen bekas sekali sahaja dan meletakkan setiap item selepas item sebelumnya, membalut ke baris baharu apabila lebar habis. Oleh itu susunan add ialah keseluruhan spesifikasi — sebab itulah komponen yang sama dalam susunan berbeza merupakan antara muka yang benar-benar berbeza.',
    derivedFrom: ORACLE_FLOW,
    version: V,
    reviewer: R,
  },

  // ═══ BL-CENTER-EXPANSION ════════════════════════════════════════════════
  {
    sourceId: 'ML-BCE-L1',
    scope: code('BL-CENTER-EXPANSION'),
    hintLevel: 1,
    en: 'The frame grew. Before you look at the answer — when there are extra pixels to hand out, which region do you think receives them?',
    ms: 'Bingkai itu membesar. Sebelum anda melihat jawapan — apabila ada piksel lebihan untuk diagihkan, kawasan manakah yang anda fikir menerimanya?',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BCE-L2',
    scope: code('BL-CENTER-EXPANSION'),
    hintLevel: 2,
    en: 'BorderLayout serves the edge regions first, each at its preferred size on one axis, and then gives CENTER every pixel that is left. CENTER is the only region that grows in both directions when the frame grows.',
    ms: 'BorderLayout melayan kawasan tepi dahulu, setiap satu pada saiz pilihannya pada satu paksi, kemudian memberikan CENTER setiap piksel yang berbaki. CENTER ialah satu-satunya kawasan yang membesar pada kedua-dua arah apabila bingkai membesar.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BCE-L3',
    scope: code('BL-CENTER-EXPANSION'),
    hintLevel: 3,
    en: 'To predict a CENTER component, work out the edge regions first: subtract the NORTH and SOUTH heights and the EAST and WEST widths from the frame, and what remains is the CENTER rectangle. Its centre point is the middle of that rectangle.',
    ms: 'Untuk meramal komponen CENTER, kira kawasan tepi dahulu: tolak ketinggian NORTH dan SOUTH serta lebar EAST dan WEST daripada bingkai, dan yang berbaki ialah segi empat CENTER. Titik tengahnya ialah pertengahan segi empat itu.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-BCE-L4',
    scope: code('BL-CENTER-EXPANSION'),
    hintLevel: 4,
    en: 'BorderLayout resolves regions in a fixed order — NORTH, SOUTH, EAST, WEST, then CENTER — shrinking the available rectangle at each step. CENTER receives whatever rectangle survives, which is why a CENTER component stretches on both axes and every edge component keeps its preferred size on one.',
    ms: 'BorderLayout menyelesaikan kawasan mengikut susunan tetap — NORTH, SOUTH, EAST, WEST, kemudian CENTER — mengecilkan segi empat yang tersedia pada setiap langkah. CENTER menerima apa jua segi empat yang tinggal, sebab itulah komponen CENTER meregang pada kedua-dua paksi manakala setiap komponen tepi mengekalkan saiz pilihannya pada satu paksi.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },

  // ═══ Family fallbacks — every family, every level ═══════════════════════
  // BL-REGION
  {
    sourceId: 'ML-FAM-BLREGION-L1',
    scope: family('BL-REGION'),
    hintLevel: 1,
    en: 'BorderLayout is about which of five named places each component was sent to. Point at each component and say its region out loud — does the frame agree with you?',
    ms: 'BorderLayout adalah tentang tempat mana antara lima tempat bernama yang setiap komponen dihantar. Tunjuk setiap komponen dan sebut kawasannya dengan kuat — adakah bingkai itu bersetuju dengan anda?',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-BLREGION-L2',
    scope: family('BL-REGION'),
    hintLevel: 2,
    en: 'BorderLayout offers exactly five regions — NORTH, SOUTH, EAST, WEST and CENTER — and each one holds at most one component. An add with no region at all goes to CENTER.',
    ms: 'BorderLayout menawarkan tepat lima kawasan — NORTH, SOUTH, EAST, WEST dan CENTER — dan setiap satu memegang paling banyak satu komponen. Add tanpa kawasan langsung akan pergi ke CENTER.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-BLREGION-L3',
    scope: family('BL-REGION'),
    hintLevel: 3,
    en: 'Check the constraint on each add statement against where you want that component to sit, and remember that a region already in use will simply take over the newcomer instead of sharing.',
    ms: 'Semak kekangan pada setiap pernyataan add berbanding tempat anda mahu komponen itu berada, dan ingat bahawa kawasan yang sudah digunakan akan terus diambil alih oleh komponen baharu dan bukannya berkongsi.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-BLREGION-L4',
    scope: family('BL-REGION'),
    hintLevel: 4,
    en: 'BorderLayout keeps one slot per region and the last add to a region wins it. Once you treat the five regions as five single slots — and reach for a nested container whenever a slot needs more than one thing — the whole manager becomes predictable.',
    ms: 'BorderLayout menyimpan satu slot bagi setiap kawasan dan add terakhir ke sesuatu kawasan memenanginya. Sebaik sahaja anda menganggap lima kawasan itu sebagai lima slot tunggal — dan menggunakan bekas bersarang apabila sesuatu slot memerlukan lebih daripada satu benda — keseluruhan pengurus ini menjadi boleh dijangka.',
    derivedFrom: ORACLE_BORDER,
    version: V,
    reviewer: R,
  },

  // RESIZE
  {
    sourceId: 'ML-FAM-RESIZE-L1',
    scope: family('RESIZE'),
    hintLevel: 1,
    en: 'Resizing does not move components — it re-runs the layout. Ask yourself what the manager recalculates when the frame changes size.',
    ms: 'Mengubah saiz tidak menggerakkan komponen — ia menjalankan semula susun atur. Tanya diri anda apa yang dikira semula oleh pengurus apabila saiz bingkai berubah.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-RESIZE-L2',
    scope: family('RESIZE'),
    hintLevel: 2,
    en: 'Each manager has its own rule for extra space: BorderLayout gives it to CENTER, GridLayout divides it equally between all cells, and FlowLayout keeps components at their preferred size and re-wraps the rows instead.',
    ms: 'Setiap pengurus mempunyai peraturan tersendiri untuk ruang lebihan: BorderLayout memberikannya kepada CENTER, GridLayout membahagikannya sama rata antara semua sel, dan FlowLayout mengekalkan saiz pilihan komponen lalu membalut semula barisnya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-RESIZE-L3',
    scope: family('RESIZE'),
    hintLevel: 3,
    en: 'Predict in two steps: first decide whether your component keeps its preferred size on each axis, then work out where the space it does not control has gone. The manager, not the component, owns that decision.',
    ms: 'Ramalkan dalam dua langkah: mula-mula tentukan sama ada komponen anda mengekalkan saiz pilihannya pada setiap paksi, kemudian kira ke mana perginya ruang yang tidak dikawalnya. Pengurus, bukan komponen, yang memiliki keputusan itu.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-RESIZE-L4',
    scope: family('RESIZE'),
    hintLevel: 4,
    en: 'Layout is recomputed from scratch at every size, which is why a coordinate you measured once is never a safe prediction. What transfers between sizes is the rule: who stretches, who stays at preferred size, and who absorbs the remainder.',
    ms: 'Susun atur dikira semula dari mula pada setiap saiz, sebab itulah koordinat yang anda ukur sekali tidak pernah menjadi ramalan yang selamat. Yang berpindah antara saiz ialah peraturannya: siapa yang meregang, siapa yang kekal pada saiz pilihan, dan siapa yang menyerap bakinya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // NESTING
  {
    sourceId: 'ML-FAM-NESTING-L1',
    scope: family('NESTING'),
    hintLevel: 1,
    en: 'Compare the shape of the two component trees, not just the components. Where does one have a branch that the other does not?',
    ms: 'Bandingkan bentuk kedua-dua pokok komponen, bukan sekadar komponennya. Di manakah satu pihak mempunyai cabang yang tiada pada satu pihak lagi?',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NESTING-L2',
    scope: family('NESTING'),
    hintLevel: 2,
    en: 'Swing interfaces are trees of containers. Each container has exactly one layout manager, and that manager arranges only its own direct children.',
    ms: 'Antara muka Swing ialah pokok bekas. Setiap bekas mempunyai tepat satu pengurus susun atur, dan pengurus itu hanya menyusun anak langsungnya sendiri.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NESTING-L3',
    scope: family('NESTING'),
    hintLevel: 3,
    en: 'Decide which manager each group of components needs, then give each group its own JPanel with that manager before adding the panel to its parent.',
    ms: 'Tentukan pengurus yang diperlukan oleh setiap kumpulan komponen, kemudian berikan setiap kumpulan JPanel tersendiri dengan pengurus itu sebelum menambah panel tersebut ke induknya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NESTING-L4',
    scope: family('NESTING'),
    hintLevel: 4,
    en: 'Nesting composes managers: the parent treats the whole child panel as one component with one preferred size, while the child panel independently arranges what is inside it. Combining simple managers this way is how real Swing layouts are built.',
    ms: 'Penyarangan menggabungkan pengurus: induk menganggap keseluruhan panel anak sebagai satu komponen dengan satu saiz pilihan, manakala panel anak menyusun kandungannya secara berasingan. Menggabungkan pengurus mudah dengan cara inilah susun atur Swing sebenar dibina.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // ORDER
  {
    sourceId: 'ML-FAM-ORDER-L1',
    scope: family('ORDER'),
    hintLevel: 1,
    en: 'You have the right parts. Read your add statements in sequence — is that the sequence you see on the canvas?',
    ms: 'Anda mempunyai bahagian yang betul. Baca pernyataan add anda mengikut urutan — adakah itu urutan yang anda lihat pada kanvas?',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-ORDER-L2',
    scope: family('ORDER'),
    hintLevel: 2,
    en: 'FlowLayout and GridLayout take no position argument. For both of them, the order in which components were added is the only thing that decides where they appear.',
    ms: 'FlowLayout dan GridLayout tidak menerima argumen kedudukan. Bagi kedua-duanya, susunan komponen ditambah ialah satu-satunya perkara yang menentukan tempat ia muncul.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-ORDER-L3',
    scope: family('ORDER'),
    hintLevel: 3,
    en: 'Write down the arrangement you want as a reading order — left to right, then row by row — and make the add statements follow that list exactly.',
    ms: 'Tuliskan susunan yang anda mahu sebagai urutan bacaan — kiri ke kanan, kemudian baris demi baris — dan pastikan pernyataan add mengikut senarai itu dengan tepat.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-ORDER-L4',
    scope: family('ORDER'),
    hintLevel: 4,
    en: 'Both managers iterate the container’s component list once, in add order, and place each item in the next available position. That is why reordering two add statements is a real design change, not a cosmetic one.',
    ms: 'Kedua-dua pengurus menyusuri senarai komponen bekas sekali sahaja, mengikut susunan add, dan meletakkan setiap item pada kedudukan seterusnya yang tersedia. Sebab itulah menyusun semula dua pernyataan add merupakan perubahan reka bentuk yang sebenar, bukan sekadar kosmetik.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // SETTINGS
  {
    sourceId: 'ML-FAM-SETTINGS-L1',
    scope: family('SETTINGS'),
    hintLevel: 1,
    en: 'The structure is right — same components, same containers. So look at what you passed to the manager when you created it.',
    ms: 'Strukturnya betul — komponen sama, bekas sama. Jadi lihat apa yang anda hantar kepada pengurus semasa menciptanya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-SETTINGS-L2',
    scope: family('SETTINGS'),
    hintLevel: 2,
    en: 'A manager’s constructor arguments are part of the layout: FlowLayout takes an alignment and gaps, GridLayout takes rows and columns and gaps. Different arguments give a visibly different result from the same components.',
    ms: 'Argumen pembina pengurus ialah sebahagian daripada susun atur: FlowLayout menerima penjajaran dan jurang, GridLayout menerima baris dan lajur serta jurang. Argumen berbeza memberikan hasil yang jelas berbeza daripada komponen yang sama.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-SETTINGS-L3',
    scope: family('SETTINGS'),
    hintLevel: 3,
    en: 'Compare the manager settings one field at a time — alignment, then hgap, then vgap, or rows then columns — instead of rebuilding the panel.',
    ms: 'Bandingkan tetapan pengurus satu medan pada satu masa — penjajaran, kemudian hgap, kemudian vgap, atau baris kemudian lajur — dan bukannya membina semula panel itu.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-SETTINGS-L4',
    scope: family('SETTINGS'),
    hintLevel: 4,
    en: 'Structure decides which manager arranges what; settings decide how it does so. Separating the two questions — “is my tree right?” then “are my arguments right?” — is the fastest way to debug any Swing layout.',
    ms: 'Struktur menentukan pengurus mana menyusun apa; tetapan menentukan bagaimana ia melakukannya. Memisahkan dua soalan ini — “adakah pokok saya betul?” kemudian “adakah argumen saya betul?” — ialah cara terpantas untuk menyahpepijat mana-mana susun atur Swing.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // LIFECYCLE
  {
    sourceId: 'ML-FAM-LIFECYCLE-L1',
    scope: family('LIFECYCLE'),
    hintLevel: 1,
    en: 'In a Java program the statements run one after another, so a line can be correct and still be in the wrong place. Which line ran too early?',
    ms: 'Dalam program Java, pernyataan berjalan satu demi satu, jadi satu baris boleh betul tetapi masih berada di tempat yang salah. Baris manakah yang berjalan terlalu awal?',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-LIFECYCLE-L2',
    scope: family('LIFECYCLE'),
    hintLevel: 2,
    en: 'GUI construction has a required order: a variable must be declared before it is used, and a container must have its layout manager before components are added to it.',
    ms: 'Pembinaan GUI mempunyai susunan yang diwajibkan: pemboleh ubah mesti diisytiharkan sebelum digunakan, dan bekas mesti mempunyai pengurus susun aturnya sebelum komponen ditambah kepadanya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-LIFECYCLE-L3',
    scope: family('LIFECYCLE'),
    hintLevel: 3,
    en: 'Group your statements per container in the order create, setLayout, add — then check that no statement mentions a variable that appears for the first time further down.',
    ms: 'Kumpulkan pernyataan anda bagi setiap bekas mengikut susunan cipta, setLayout, add — kemudian pastikan tiada pernyataan menyebut pemboleh ubah yang muncul buat kali pertama di bawahnya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-LIFECYCLE-L4',
    scope: family('LIFECYCLE'),
    hintLevel: 4,
    en: 'The create → setLayout → add order works because each step needs the result of the one before it. Following it for every container in the tree removes a whole class of bugs where the code looks correct but a component silently never appears.',
    ms: 'Susunan cipta → setLayout → add berkesan kerana setiap langkah memerlukan hasil langkah sebelumnya. Mengikutinya bagi setiap bekas dalam pokok menghapuskan satu kelas pepijat di mana kod kelihatan betul tetapi komponen senyap-senyap tidak pernah muncul.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // COMPOSITION
  {
    sourceId: 'ML-FAM-COMPOSITION-L1',
    scope: family('COMPOSITION'),
    hintLevel: 1,
    en: 'Before thinking about arrangement, take an inventory: list every component in the target, then every component in your build.',
    ms: 'Sebelum memikirkan susunan, buat inventori: senaraikan setiap komponen dalam sasaran, kemudian setiap komponen dalam binaan anda.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-COMPOSITION-L2',
    scope: family('COMPOSITION'),
    hintLevel: 2,
    en: 'A layout can only arrange the components that exist. A missing or surplus component changes the result no matter how correct the managers are.',
    ms: 'Susun atur hanya boleh menyusun komponen yang wujud. Komponen yang hilang atau berlebihan mengubah hasilnya tidak kira betapa betulnya pengurus itu.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-COMPOSITION-L3',
    scope: family('COMPOSITION'),
    hintLevel: 3,
    en: 'Fix the inventory first — add what is missing, remove what is surplus, and check the text and type of each one — then look at the arrangement again.',
    ms: 'Betulkan inventori dahulu — tambah yang hilang, buang yang berlebihan, dan semak teks serta jenis setiap satu — kemudian lihat semula susunannya.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-COMPOSITION-L4',
    scope: family('COMPOSITION'),
    hintLevel: 4,
    en: 'Reading a target interface is a two-part skill: name the parts, then name the containers that group them. Doing the parts first means every later question is only about arrangement, which is where the layout rules actually apply.',
    ms: 'Membaca antara muka sasaran ialah kemahiran dua bahagian: namakan bahagiannya, kemudian namakan bekas yang mengumpulkannya. Melakukan bahagian dahulu bermakna setiap soalan seterusnya hanya tentang susunan, iaitu tempat peraturan susun atur benar-benar terpakai.',
    derivedFrom: ORACLE_USING,
    version: V,
    reviewer: R,
  },

  // NONE — the unmatched case still gets reviewed, non-committal teaching text.
  {
    sourceId: 'ML-FAM-NONE-L1',
    scope: family('NONE'),
    hintLevel: 1,
    en: 'The check did not pass, but the difference is not one of the patterns I recognise. Compare your build with the target one container at a time, starting from the frame.',
    ms: 'Semakan itu tidak lulus, tetapi perbezaannya bukan salah satu corak yang saya kenali. Bandingkan binaan anda dengan sasaran satu bekas pada satu masa, bermula dari bingkai.',
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NONE-L2',
    scope: family('NONE'),
    hintLevel: 2,
    en: 'Every Swing layout question comes down to three things: which components exist, which container each one is in, and which manager that container uses. Check them in that order.',
    ms: 'Setiap soalan susun atur Swing berbalik kepada tiga perkara: komponen mana yang wujud, bekas mana setiap satu berada, dan pengurus mana yang digunakan bekas itu. Semak mengikut susunan tersebut.',
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NONE-L3',
    scope: family('NONE'),
    hintLevel: 3,
    en: 'Work outward from the frame: confirm the frame’s manager, then each region or slot, then the contents of any nested panel. The first level where the two differ is your answer.',
    ms: 'Bekerja dari bingkai ke luar: sahkan pengurus bingkai, kemudian setiap kawasan atau slot, kemudian kandungan mana-mana panel bersarang. Aras pertama di mana kedua-duanya berbeza ialah jawapan anda.',
    version: V,
    reviewer: R,
  },
  {
    sourceId: 'ML-FAM-NONE-L4',
    scope: family('NONE'),
    hintLevel: 4,
    en: 'Comparing two interfaces level by level — components, containers, managers, then settings — turns “it looks wrong” into a specific, fixable difference. That habit is the transferable skill here, more than any single layout rule.',
    ms: 'Membandingkan dua antara muka aras demi aras — komponen, bekas, pengurus, kemudian tetapan — mengubah “ia kelihatan salah” menjadi perbezaan khusus yang boleh dibaiki. Tabiat itulah kemahiran boleh pindah di sini, lebih daripada mana-mana peraturan susun atur tunggal.',
    version: V,
    reviewer: R,
  },
]
