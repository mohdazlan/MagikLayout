/**
 * Deterministic grading — no LLM anywhere.
 *
 * Parsons: the student's tree is compared structurally against the target
 * tree (canonical magnet order executed through the same engine model).
 * Equivalence is exactly as order-sensitive as Swing itself: BorderLayout
 * children compare per region (adds to different regions commute), while
 * Flow/Grid children compare in add order (order IS the layout).
 *
 * Reflow: the ghost's center point is compared against the engine-computed
 * rect at the end size, within a per-challenge per-axis tolerance.
 */
import type { LayoutSpec, Rect, Size, SwingNode } from '../engine/types'
import type { BorderRegion } from '../engine/types'
import { layoutTree } from '../engine/layoutTree'
import type { TextMeasurer } from '../engine/metrics'
import { executeStatements, type ExecResult } from './execute'
import type { ParsonsChallenge, ReflowChallenge } from './types'

function specsEqual(a: LayoutSpec, b: LayoutSpec): boolean {
  if (a.kind !== b.kind) return false
  if (a.hgap !== b.hgap || a.vgap !== b.vgap) return false
  if (a.kind === 'flow' && b.kind === 'flow') return a.align === b.align
  if (a.kind === 'grid' && b.kind === 'grid') return a.rows === b.rows && a.cols === b.cols
  return true
}

const REGIONS: BorderRegion[] = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTER']

export function treesEquivalent(a: SwingNode, b: SwingNode): boolean {
  if (a.type !== b.type) return false
  if (a.type !== 'JPanel') {
    return (
      a.text === b.text &&
      (a.columns ?? null) === (b.columns ?? null) &&
      JSON.stringify(a.items ?? null) === JSON.stringify(b.items ?? null)
    )
  }
  if (!specsEqual(a.layout!, b.layout!)) return false
  const ca = a.children ?? []
  const cb = b.children ?? []
  if (ca.length !== cb.length) return false
  if (a.layout!.kind === 'border') {
    // Region occupancy is what Swing resolves; order across regions is free,
    // order within a region matters (last one added wins).
    for (const region of REGIONS) {
      const la = ca.filter((c) => (c.constraint ?? 'CENTER') === region)
      const lb = cb.filter((c) => (c.constraint ?? 'CENTER') === region)
      if (la.length !== lb.length) return false
      for (let i = 0; i < la.length; i++) {
        if (!treesEquivalent(la[i].node, lb[i].node)) return false
      }
    }
    return true
  }
  for (let i = 0; i < ca.length; i++) {
    if (!treesEquivalent(ca[i].node, cb[i].node)) return false
  }
  return true
}

export function executeOrder(challenge: ParsonsChallenge, order: number[]): ExecResult {
  return executeStatements(order.map((i) => challenge.magnets[i].stmt))
}

/** The target state: canonical magnet order run through the same executor. */
export function targetExec(challenge: ParsonsChallenge): ExecResult {
  return executeOrder(challenge, challenge.magnets.map((_, i) => i))
}

function matchesTarget(exec: ExecResult, target: ExecResult): boolean {
  return exec.clean && exec.unmanaged.length === 0 && treesEquivalent(exec.root, target.root)
}

export interface ParsonsGrade {
  pass: boolean
  /**
   * On failure: index into the SUBMITTED order of the first statement after
   * which the program can no longer reach the target (completing the rest in
   * canonical relative order). -1 on pass.
   */
  firstDivergence: number
}

export function gradeParsons(challenge: ParsonsChallenge, order: number[]): ParsonsGrade {
  const target = targetExec(challenge)
  if (matchesTarget(executeOrder(challenge, order), target)) {
    return { pass: true, firstDivergence: -1 }
  }
  for (let i = 0; i < order.length; i++) {
    const prefix = order.slice(0, i + 1)
    const placed = new Set(prefix)
    const rest = challenge.magnets.map((_, idx) => idx).filter((idx) => !placed.has(idx))
    if (!matchesTarget(executeOrder(challenge, [...prefix, ...rest]), target)) {
      return { pass: false, firstDivergence: i }
    }
  }
  // Unreachable: the full order equals the failing submission itself.
  return { pass: false, firstDivergence: order.length - 1 }
}

export interface ReverseGrade {
  pass: boolean
  /** Structured, deterministic feedback — derived from the trees, no LLM. */
  findings: string[]
}

/** Human-readable identity of a node for diff findings. */
function nodeKey(node: SwingNode): string {
  switch (node.type) {
    case 'JPanel':
      return `a JPanel on ${node.layout!.kind === 'border' ? 'BorderLayout' : node.layout!.kind === 'flow' ? 'FlowLayout' : 'GridLayout'}`
    case 'JTextField':
      return `a JTextField(${node.columns ?? 10})`
    case 'JComboBox':
      return 'a JComboBox'
    default:
      return `a ${node.type} “${node.text}”`
  }
}

function countNodes(root: SwingNode, into: Map<string, number>): void {
  for (const child of root.children ?? []) {
    const key = nodeKey(child.node)
    into.set(key, (into.get(key) ?? 0) + 1)
    countNodes(child.node, into)
  }
}

/** Every nested panel's full layout spec, order-independent, for the settings check. */
function panelSpecs(root: SwingNode, into: string[]): void {
  for (const child of root.children ?? []) {
    if (child.node.type === 'JPanel') {
      into.push(JSON.stringify(child.node.layout))
      panelSpecs(child.node, into)
    }
  }
}

/**
 * Deterministic reverse-challenge grading: structural equivalence via the
 * same tree comparison the Parsons mode uses (spec §7.3 — "structural
 * equivalence, not pixels"), plus a component-level diff for feedback.
 */
export function gradeReverse(target: SwingNode, student: SwingNode): ReverseGrade {
  if (treesEquivalent(target, student)) return { pass: true, findings: [] }

  const findings: string[] = []
  if (!specsEqual(target.layout!, student.layout!)) {
    findings.push('The frame itself is on a different layout manager (or different settings) than the target.')
  }

  const targetCounts = new Map<string, number>()
  const studentCounts = new Map<string, number>()
  countNodes(target, targetCounts)
  countNodes(student, studentCounts)

  for (const [key, n] of targetCounts) {
    const have = studentCounts.get(key) ?? 0
    if (have < n) findings.push(`Missing from your build: ${key}${n - have > 1 ? ` ×${n - have}` : ''}.`)
  }
  for (const [key, n] of studentCounts) {
    const want = targetCounts.get(key) ?? 0
    if (n > want) findings.push(`Not in the target: ${key}${n - want > 1 ? ` ×${n - want}` : ''}.`)
  }

  // Same parts, same root manager — before blaming arrangement, check whether a
  // nested panel's SETTINGS (align, gaps, grid dimensions) are the real culprit.
  if (findings.length === 0) {
    const tSpecs: string[] = []
    const sSpecs: string[] = []
    panelSpecs(target, tSpecs)
    panelSpecs(student, sSpecs)
    if (tSpecs.sort().join('|') !== sSpecs.sort().join('|')) {
      findings.push(
        'A panel’s layout settings differ from the target — check alignment, hgap/vgap, or grid rows × cols.',
      )
    }
  }

  if (findings.length === 0) {
    findings.push(
      'Right components, wrong arrangement — check BorderLayout regions, which panel each component sits in, and add order (order is position under Flow and Grid).',
    )
  }
  return { pass: false, findings }
}

export interface ReflowGrade {
  pass: boolean
  /** Engine-computed bounds of the target component at endSize (abs coords). */
  truth: Rect
  /** Per-axis distance from the guess center to the true center. */
  dx: number
  dy: number
}

export function trueRectAt(challenge: ReflowChallenge, size: Size, measure: TextMeasurer): Rect {
  const layout = layoutTree(challenge.root, size, measure)
  const rect = layout.abs.get(challenge.targetId)
  if (!rect) throw new Error(`reflow target ${challenge.targetId} is not laid out at ${size.width}×${size.height}`)
  return rect
}

export function gradeReflow(
  challenge: ReflowChallenge,
  guessCenter: { x: number; y: number },
  measure: TextMeasurer,
): ReflowGrade {
  const truth = trueRectAt(challenge, challenge.endSize, measure)
  const dx = Math.abs(guessCenter.x - (truth.x + truth.width / 2))
  const dy = Math.abs(guessCenter.y - (truth.y + truth.height / 2))
  return { pass: dx <= challenge.tolerance && dy <= challenge.tolerance, truth, dx, dy }
}
