/**
 * Challenge definitions for the /challenges modes.
 *
 * A Parsons challenge is a bag of "code magnets" — real Java statements with a
 * machine-readable effect. The target UI is never stored as pixels or as a
 * second tree: it is DERIVED by executing the magnets in their canonical
 * order, so the layout engine stays the single source of truth for both the
 * live render and the grader.
 */
import type { BorderRegion, ComponentType, LayoutSpec, Size, SwingNode } from '../engine/types'

export type ChallengeType = 'parsons' | 'reflow' | 'reverse'

export interface ChallengeMeta {
  id: string
  type: ChallengeType
  title: string
  /** One-sentence student-facing task statement. */
  prompt: string
  /** Bloom level, matching the spec's difficulty vocabulary. */
  difficulty: 'Recall' | 'Apply' | 'Analyze'
}

/** Component construction, as `new JButton("Save")` etc. */
export interface DeclareSpec {
  type: ComponentType
  text: string
  columns?: number
  items?: string[]
  /** JPanel only: a layout passed to the constructor. Absent = FlowLayout default. */
  layout?: LayoutSpec
}

/** `frame` refers to the JFrame content pane. */
export const FRAME_VAR = 'frame'

export type Stmt =
  | { kind: 'declare'; varName: string; component: DeclareSpec }
  | { kind: 'setLayout'; target: string; spec: LayoutSpec }
  | { kind: 'add'; target: string; child: string; constraint?: BorderRegion }

/** One draggable code magnet: the display statement plus its effect. */
export interface Magnet {
  id: string
  java: string
  stmt: Stmt
}

export interface ParsonsChallenge extends ChallengeMeta {
  type: 'parsons'
  frameSize: Size
  /** Magnets in one canonical correct order (defines the target tree). */
  magnets: Magnet[]
  /**
   * Fixed display order for the tray (indices into `magnets`). A committed
   * shuffle keeps every student's tray — and every grading run — deterministic.
   */
  trayOrder: number[]
}

export interface ReflowChallenge extends ChallengeMeta {
  type: 'reflow'
  /** The fixed component tree the read-only snippet describes. */
  root: SwingNode
  startSize: Size
  endSize: Size
  /** id of the component whose post-resize position the student predicts. */
  targetId: string
  /** Center-point tolerance in px on each axis (spec default ±24). */
  tolerance: number
}

export interface ReverseChallenge extends ChallengeMeta {
  type: 'reverse'
  /** Starting (and target-render) frame size; the student may resize — grading is structural. */
  frameSize: Size
  /**
   * The tree to rebuild. Constraint: every leaf must be reachable with the
   * Playground palette + text editing (JButton/JLabel/JCheckBox texts are
   * editable; JTextField compares by columns; JComboBox only at its defaults).
   */
  target: SwingNode
  /**
   * Shown with the congratulation once the rebuild matches — the layout rules
   * this particular target was built to teach. Deterministic prose, not an
   * LLM's; each line names something the student can see in their own code.
   */
  notes?: string[]
}

export type Challenge = ParsonsChallenge | ReflowChallenge | ReverseChallenge
