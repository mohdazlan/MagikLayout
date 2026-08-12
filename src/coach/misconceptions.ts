/**
 * Misconception taxonomy — stage 2 of the coach pipeline (Observe → **Diagnose**
 * → Retrieve → Compose → Guard → Log).
 *
 * The deterministic engine already knows *what is wrong*. This module gives that
 * verdict a stable, machine-readable NAME, so the same structural error always
 * retrieves the same approved teaching content and always appears under the same
 * label in cohort evidence.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. Nothing here decides correctness. Every diagnosis is derived from grade
 *     results and execution facts the engine computed first.
 *  2. Every code is stable. Codes are part of the retrieval key and of the
 *     teacher-facing report, so they are renamed only with a corpus migration.
 *
 * Codes carry a *family*. Retrieval tries the exact code first and falls back to
 * the family when a region-specific chunk has not been authored yet — which is
 * why `BL-SOUTH-COLLISION` can be taught by the `BL-REGION` family content
 * without the corpus having to enumerate all five regions up front.
 */
import type { BorderRegion, LayoutSpec, SwingNode } from '../engine/types'
import { borderHiddenChildren } from '../engine/borderLayout'
import type { ExecResult } from '../challenges/execute'
import type { ParsonsGrade, ReflowGrade } from '../challenges/grade'
import type { ParsonsChallenge, ReflowChallenge } from '../challenges/types'

export type MisconceptionFamily =
  | 'BL-REGION'
  | 'RESIZE'
  | 'NESTING'
  | 'ORDER'
  | 'SETTINGS'
  | 'LIFECYCLE'
  | 'COMPOSITION'
  | 'NONE'

export type MisconceptionCode =
  // BL-REGION — a BorderLayout region holds at most one component.
  | 'BL-NORTH-COLLISION'
  | 'BL-SOUTH-COLLISION'
  | 'BL-EAST-COLLISION'
  | 'BL-WEST-COLLISION'
  | 'BL-CENTER-COLLISION'
  | 'BL-REGION-WRONG'
  // RESIZE — what each manager does with the extra pixels when the frame grows.
  | 'BL-CENTER-EXPANSION'
  | 'BL-EDGE-SIZING'
  | 'FLOW-REWRAP'
  | 'GRID-UNIFORM-CELLS'
  // NESTING — a nested panel is how one region carries more than one component.
  | 'NESTED-PANEL-MISSING'
  | 'NESTED-PANEL-EXTRA'
  | 'NESTED-PANEL-WRONG-MANAGER'
  // ORDER — under Flow and Grid, add order *is* position.
  | 'FLOW-ORDER'
  | 'GRID-ORDER'
  // SETTINGS — same structure, different manager configuration.
  | 'GRID-DIMENSION'
  | 'FLOW-ALIGN-GAP'
  // LIFECYCLE — when a statement runs changes what Swing registers.
  | 'SETLAYOUT-AFTER-ADD'
  | 'STATEMENT-ORDER'
  | 'COMPILE-ERROR'
  // COMPOSITION — the parts list itself differs from the target.
  | 'COMPONENT-MISSING'
  | 'COMPONENT-EXTRA'
  // Sentinel: the engine failed the attempt but no signature matched confidently.
  | 'UNKNOWN'

export interface MisconceptionSpec {
  code: MisconceptionCode
  family: MisconceptionFamily
  /** Topic label used for retrieval filtering and teacher-facing reports. */
  concept: string
  /** NOSS competency unit this misconception is assessed under. */
  curriculumTag: string
}

const CU = 'IT-010-3:2016-C01'

/** The complete taxonomy. Adding a code here without corpus coverage is caught by the RAG evaluation gate. */
export const MISCONCEPTIONS: Record<MisconceptionCode, MisconceptionSpec> = {
  'BL-NORTH-COLLISION': { code: 'BL-NORTH-COLLISION', family: 'BL-REGION', concept: 'BorderLayout region occupancy', curriculumTag: CU },
  'BL-SOUTH-COLLISION': { code: 'BL-SOUTH-COLLISION', family: 'BL-REGION', concept: 'BorderLayout region occupancy', curriculumTag: CU },
  'BL-EAST-COLLISION': { code: 'BL-EAST-COLLISION', family: 'BL-REGION', concept: 'BorderLayout region occupancy', curriculumTag: CU },
  'BL-WEST-COLLISION': { code: 'BL-WEST-COLLISION', family: 'BL-REGION', concept: 'BorderLayout region occupancy', curriculumTag: CU },
  'BL-CENTER-COLLISION': { code: 'BL-CENTER-COLLISION', family: 'BL-REGION', concept: 'BorderLayout region occupancy', curriculumTag: CU },
  'BL-REGION-WRONG': { code: 'BL-REGION-WRONG', family: 'BL-REGION', concept: 'BorderLayout region choice', curriculumTag: CU },
  'BL-CENTER-EXPANSION': { code: 'BL-CENTER-EXPANSION', family: 'RESIZE', concept: 'BorderLayout CENTER absorbs slack', curriculumTag: CU },
  'BL-EDGE-SIZING': { code: 'BL-EDGE-SIZING', family: 'RESIZE', concept: 'BorderLayout edge-region sizing', curriculumTag: CU },
  'FLOW-REWRAP': { code: 'FLOW-REWRAP', family: 'RESIZE', concept: 'FlowLayout re-wrapping on resize', curriculumTag: CU },
  'GRID-UNIFORM-CELLS': { code: 'GRID-UNIFORM-CELLS', family: 'RESIZE', concept: 'GridLayout uniform cell sizing', curriculumTag: CU },
  'NESTED-PANEL-MISSING': { code: 'NESTED-PANEL-MISSING', family: 'NESTING', concept: 'Nested panels as containers', curriculumTag: CU },
  'NESTED-PANEL-EXTRA': { code: 'NESTED-PANEL-EXTRA', family: 'NESTING', concept: 'Nested panels as containers', curriculumTag: CU },
  'NESTED-PANEL-WRONG-MANAGER': { code: 'NESTED-PANEL-WRONG-MANAGER', family: 'NESTING', concept: 'Choosing a manager for a nested panel', curriculumTag: CU },
  'FLOW-ORDER': { code: 'FLOW-ORDER', family: 'ORDER', concept: 'FlowLayout add order', curriculumTag: CU },
  'GRID-ORDER': { code: 'GRID-ORDER', family: 'ORDER', concept: 'GridLayout row-major fill', curriculumTag: CU },
  'GRID-DIMENSION': { code: 'GRID-DIMENSION', family: 'SETTINGS', concept: 'GridLayout rows × cols', curriculumTag: CU },
  'FLOW-ALIGN-GAP': { code: 'FLOW-ALIGN-GAP', family: 'SETTINGS', concept: 'FlowLayout alignment and gaps', curriculumTag: CU },
  'SETLAYOUT-AFTER-ADD': { code: 'SETLAYOUT-AFTER-ADD', family: 'LIFECYCLE', concept: 'setLayout must precede add', curriculumTag: CU },
  'STATEMENT-ORDER': { code: 'STATEMENT-ORDER', family: 'LIFECYCLE', concept: 'Statement order in GUI construction', curriculumTag: CU },
  'COMPILE-ERROR': { code: 'COMPILE-ERROR', family: 'LIFECYCLE', concept: 'Declaration before use', curriculumTag: CU },
  'COMPONENT-MISSING': { code: 'COMPONENT-MISSING', family: 'COMPOSITION', concept: 'Component inventory', curriculumTag: CU },
  'COMPONENT-EXTRA': { code: 'COMPONENT-EXTRA', family: 'COMPOSITION', concept: 'Component inventory', curriculumTag: CU },
  UNKNOWN: { code: 'UNKNOWN', family: 'NONE', concept: 'Unclassified layout difference', curriculumTag: CU },
}

export type Confidence = 'high' | 'medium' | 'low'

export interface Diagnosis {
  code: MisconceptionCode
  family: MisconceptionFamily
  confidence: Confidence
  /** BorderLayout region the finding is about, when the code is region-specific. */
  region?: BorderRegion
  /**
   * Engine-derived facts, verbatim. These are the ONLY claims about the attempt
   * that reach the language model — never the answer key, never a target tree.
   */
  evidence: string[]
}

const COLLISION_CODE: Record<BorderRegion, MisconceptionCode> = {
  NORTH: 'BL-NORTH-COLLISION',
  SOUTH: 'BL-SOUTH-COLLISION',
  EAST: 'BL-EAST-COLLISION',
  WEST: 'BL-WEST-COLLISION',
  CENTER: 'BL-CENTER-COLLISION',
}

function diagnosis(code: MisconceptionCode, confidence: Confidence, evidence: string[], region?: BorderRegion): Diagnosis {
  return { code, family: MISCONCEPTIONS[code].family, confidence, evidence, ...(region ? { region } : {}) }
}

/** The unmatched fallback: an honest "the engine failed you, but I can't name why". */
export const UNKNOWN_DIAGNOSIS: Diagnosis = {
  code: 'UNKNOWN',
  family: 'NONE',
  confidence: 'low',
  evidence: [],
}

/** The diagnosis a hint should be built from: highest confidence, first found. */
export function primaryDiagnosis(list: Diagnosis[]): Diagnosis {
  const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 }
  const best = [...list].sort((a, b) => rank[a.confidence] - rank[b.confidence])[0]
  return best ?? UNKNOWN_DIAGNOSIS
}

// ---------------------------------------------------------------------------
// Structural helpers — pure reads over trees the engine produced.
// ---------------------------------------------------------------------------

function managerName(spec: LayoutSpec): string {
  return spec.kind === 'border' ? 'BorderLayout' : spec.kind === 'flow' ? 'FlowLayout' : 'GridLayout'
}

/** Regions of `root` holding more than one child — Swing lays out only the last. */
export function collidedRegions(root: SwingNode): { region: BorderRegion; hiddenCount: number }[] {
  if (root.type !== 'JPanel' || root.layout?.kind !== 'border') return []
  const hidden = borderHiddenChildren((root.children ?? []).map((c) => ({ size: { width: 0, height: 0 }, constraint: c.constraint })))
  const byRegion = new Map<BorderRegion, number>()
  for (const h of hidden) byRegion.set(h.region, (byRegion.get(h.region) ?? 0) + 1)
  return [...byRegion.entries()].map(([region, hiddenCount]) => ({ region, hiddenCount }))
}

/** Depth-first walk including the root. */
function walk(root: SwingNode, visit: (node: SwingNode) => void): void {
  visit(root)
  for (const child of root.children ?? []) walk(child.node, visit)
}

function countPanels(root: SwingNode): number {
  let n = 0
  walk(root, (node) => {
    if (node !== root && node.type === 'JPanel') n++
  })
  return n
}

/** Leaf identity used for inventory diffs — ignores position entirely. */
function leafKey(node: SwingNode): string {
  switch (node.type) {
    case 'JTextField':
      return `JTextField(${node.columns ?? 10})`
    case 'JComboBox':
      return 'JComboBox'
    case 'JPanel':
      return ''
    default:
      return `${node.type} “${node.text}”`
  }
}

function leafCounts(root: SwingNode): Map<string, number> {
  const counts = new Map<string, number>()
  walk(root, (node) => {
    if (node === root || node.type === 'JPanel') return
    const key = leafKey(node)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return counts
}

/** Every non-root panel's layout spec, sorted — an order-independent settings fingerprint. */
function panelSpecs(root: SwingNode): LayoutSpec[] {
  const specs: LayoutSpec[] = []
  walk(root, (node) => {
    if (node !== root && node.type === 'JPanel' && node.layout) specs.push(node.layout)
  })
  return specs
}

function specKey(spec: LayoutSpec): string {
  return JSON.stringify(spec)
}

/** Which BorderLayout region each leaf sits under, keyed by leaf identity. */
function regionOfLeaves(root: SwingNode): Map<string, BorderRegion> {
  const map = new Map<string, BorderRegion>()
  if (root.layout?.kind !== 'border') return map
  for (const child of root.children ?? []) {
    const region = child.constraint ?? 'CENTER'
    walk(child.node, (node) => {
      if (node.type === 'JPanel') return
      const key = leafKey(node)
      if (!map.has(key)) map.set(key, region)
    })
  }
  return map
}

// ---------------------------------------------------------------------------
// Mode diagnosers. Each takes the engine's own output; none re-grades.
// ---------------------------------------------------------------------------

/**
 * Reverse mode: the student rebuilt a target and the trees are not equivalent.
 * Ordered from the most structurally specific signature to the most general, so
 * `primaryDiagnosis` naturally surfaces the teachable cause rather than a symptom.
 */
export function diagnoseReverse(target: SwingNode, student: SwingNode): Diagnosis[] {
  const out: Diagnosis[] = []

  // 1. A region the student over-filled. This is the highest-value signature:
  //    the component is genuinely invisible on their own canvas.
  for (const { region, hiddenCount } of collidedRegions(student)) {
    out.push(
      diagnosis(
        COLLISION_CODE[region],
        'high',
        [
          `${hiddenCount + 1} components are added directly to BorderLayout.${region} of the frame.`,
          `Swing lays out only the last component added to ${region}; the other ${hiddenCount === 1 ? 'one is' : `${hiddenCount} are`} never sized and stay invisible.`,
        ],
        region,
      ),
    )
  }

  // 2. The repair the collision needs: the target nests a panel, the student did not.
  const targetPanels = countPanels(target)
  const studentPanels = countPanels(student)
  if (targetPanels > studentPanels) {
    out.push(
      diagnosis('NESTED-PANEL-MISSING', out.length > 0 ? 'medium' : 'high', [
        `The target holds ${targetPanels} nested JPanel${targetPanels === 1 ? '' : 's'}; this build has ${studentPanels}.`,
        'A BorderLayout region carries several components only when they are grouped inside one nested panel.',
      ]),
    )
  } else if (studentPanels > targetPanels) {
    out.push(
      diagnosis('NESTED-PANEL-EXTRA', 'medium', [
        `This build holds ${studentPanels} nested JPanel${studentPanels === 1 ? '' : 's'}; the target holds ${targetPanels}.`,
      ]),
    )
  }

  // 3. Inventory: parts that are missing or surplus, before anything about arrangement.
  const wanted = leafCounts(target)
  const have = leafCounts(student)
  const missing: string[] = []
  const extra: string[] = []
  for (const [key, n] of wanted) {
    const got = have.get(key) ?? 0
    if (got < n) missing.push(`${key}${n - got > 1 ? ` ×${n - got}` : ''}`)
  }
  for (const [key, n] of have) {
    const want = wanted.get(key) ?? 0
    if (n > want) extra.push(`${key}${n - want > 1 ? ` ×${n - want}` : ''}`)
  }
  if (missing.length > 0) {
    out.push(diagnosis('COMPONENT-MISSING', 'medium', [`Not present in this build: ${missing.join(', ')}.`]))
  }
  if (extra.length > 0) {
    out.push(diagnosis('COMPONENT-EXTRA', 'medium', [`Present here but not in the target: ${extra.join(', ')}.`]))
  }

  // 4. Right parts, wrong manager on the frame or on a nested panel.
  if (target.layout && student.layout && specKey(target.layout) !== specKey(student.layout)) {
    const code = target.layout.kind !== student.layout.kind ? 'NESTED-PANEL-WRONG-MANAGER' : student.layout.kind === 'grid' ? 'GRID-DIMENSION' : 'FLOW-ALIGN-GAP'
    out.push(
      diagnosis(code, 'medium', [
        `The frame is on ${managerName(student.layout)} with settings ${describeSpec(student.layout)}; the target frame uses ${managerName(target.layout)} with ${describeSpec(target.layout)}.`,
      ]),
    )
  } else if (missing.length === 0 && extra.length === 0 && targetPanels === studentPanels) {
    const tSpecs = panelSpecs(target)
    const sSpecs = panelSpecs(student)
    if (tSpecs.map(specKey).sort().join('|') !== sSpecs.map(specKey).sort().join('|')) {
      const kinds = (specs: LayoutSpec[]) => specs.map((x) => x.kind).sort().join(',')
      const code: MisconceptionCode =
        kinds(tSpecs) !== kinds(sSpecs)
          ? 'NESTED-PANEL-WRONG-MANAGER'
          : sSpecs.some((x) => x.kind === 'grid')
            ? 'GRID-DIMENSION'
            : 'FLOW-ALIGN-GAP'
      out.push(
        diagnosis(code, 'medium', [
          `A nested panel's layout differs from the target: this build has ${sSpecs.map(describeSpec).join(', ') || 'none'}.`,
        ]),
      )
    }
  }

  // 5. Same parts, same containers — a component sits in the wrong region.
  if (out.length === 0) {
    const tRegions = regionOfLeaves(target)
    const sRegions = regionOfLeaves(student)
    const moved: string[] = []
    for (const [key, region] of tRegions) {
      const at = sRegions.get(key)
      if (at && at !== region) moved.push(`${key} is in ${at}`)
    }
    if (moved.length > 0) {
      out.push(diagnosis('BL-REGION-WRONG', 'medium', [`Region placement differs from the target: ${moved.join('; ')}.`]))
    }
  }

  // 6. Everything matches by inventory and settings — it must be add order.
  if (out.length === 0) {
    const ordered = [student.layout, ...panelSpecs(student)].find((spec) => spec && spec.kind !== 'border')
    out.push(
      diagnosis(ordered?.kind === 'grid' ? 'GRID-ORDER' : 'FLOW-ORDER', 'low', [
        'The components and the layout settings match the target, so the difference is the order in which components were added.',
      ]),
    )
  }

  return out
}

function describeSpec(spec: LayoutSpec): string {
  switch (spec.kind) {
    case 'border':
      return `BorderLayout(hgap ${spec.hgap}, vgap ${spec.vgap})`
    case 'flow':
      return `FlowLayout(${spec.align}, hgap ${spec.hgap}, vgap ${spec.vgap})`
    case 'grid':
      return `GridLayout(${spec.rows}×${spec.cols}, hgap ${spec.hgap}, vgap ${spec.vgap})`
  }
}

/**
 * Parsons mode: the program is the magnet order. Compile failures and the
 * setLayout/add lifecycle outrank the divergence point, because a statement that
 * did not run cannot be the lesson.
 */
export function diagnoseParsons(
  challenge: ParsonsChallenge,
  placed: number[],
  exec: ExecResult,
  grade: ParsonsGrade,
): Diagnosis[] {
  const out: Diagnosis[] = []

  const compileErrors = exec.results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !r.ok && r.error)
  if (compileErrors.length > 0) {
    out.push(
      diagnosis(
        'COMPILE-ERROR',
        'high',
        compileErrors.map(
          ({ r, i }) => `Line ${i + 1} (\`${challenge.magnets[placed[i]].java}\`) does not compile: ${r.error}.`,
        ),
      ),
    )
  }

  if (exec.unmanaged.length > 0) {
    out.push(
      diagnosis(
        'SETLAYOUT-AFTER-ADD',
        'high',
        exec.unmanaged.map(
          (u) =>
            `${u.varName} was added to ${u.containerVar} before its BorderLayout was installed, so Swing never registers it — it stays invisible.`,
        ),
      ),
    )
  }

  // The engine's own rendered tree can still show a region collision even when
  // every statement compiled — the same misconception as in reverse mode.
  for (const { region, hiddenCount } of collidedRegions(exec.root)) {
    out.push(
      diagnosis(
        COLLISION_CODE[region],
        'high',
        [
          `This order puts ${hiddenCount + 1} components into BorderLayout.${region}.`,
          `Only the last component added to ${region} is laid out; the ${hiddenCount === 1 ? 'earlier one' : 'earlier ones'} never appear.`,
        ],
        region,
      ),
    )
  }

  if (out.length === 0 && grade.firstDivergence >= 0 && grade.firstDivergence < placed.length) {
    out.push(
      diagnosis('STATEMENT-ORDER', 'medium', [
        `Statement ${grade.firstDivergence + 1} — \`${challenge.magnets[placed[grade.firstDivergence]].java}\` — is the first statement after which this order can no longer reach the target.`,
      ]),
    )
  }

  return out
}

/**
 * Reflow mode: the student predicted where a component lands after a resize.
 * The code names the sizing rule they mis-predicted, taken from the manager and
 * region the engine actually used.
 */
export function diagnoseReflow(challenge: ReflowChallenge, grade: ReflowGrade): Diagnosis[] {
  const kind = challenge.root.layout?.kind ?? 'border'
  const region = challenge.root.children?.find((c) => c.node.id === challenge.targetId)?.constraint ?? 'CENTER'
  const geometry = [
    `The frame was resized from ${challenge.startSize.width}×${challenge.startSize.height} to ${challenge.endSize.width}×${challenge.endSize.height} pixels.`,
    `The prediction was ${Math.round(grade.dx)}px off horizontally and ${Math.round(grade.dy)}px off vertically (tolerance ±${challenge.tolerance}px per axis).`,
  ]

  if (kind === 'flow') {
    return [diagnosis('FLOW-REWRAP', 'high', [...geometry, 'The frame is on FlowLayout, which re-packs its rows at the new width.'])]
  }
  if (kind === 'grid') {
    return [diagnosis('GRID-UNIFORM-CELLS', 'high', [...geometry, 'The frame is on GridLayout, whose cells all resize identically.'])]
  }
  if (region === 'CENTER') {
    return [diagnosis('BL-CENTER-EXPANSION', 'high', [...geometry, 'The component is in BorderLayout.CENTER.'], region)]
  }
  return [diagnosis('BL-EDGE-SIZING', 'high', [...geometry, `The component is in BorderLayout.${region}.`], region)]
}
