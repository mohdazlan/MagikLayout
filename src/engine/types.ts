export type BorderRegion = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTER'
export type FlowAlign = 'LEFT' | 'CENTER' | 'RIGHT'

export type LayoutSpec =
  | { kind: 'border'; hgap: number; vgap: number }
  | { kind: 'flow'; align: FlowAlign; hgap: number; vgap: number }
  | { kind: 'grid'; rows: number; cols: number; hgap: number; vgap: number }

export type ComponentType =
  | 'JButton'
  | 'JLabel'
  | 'JTextField'
  | 'JCheckBox'
  | 'JComboBox'
  | 'JPanel'

export interface SwingNode {
  id: string
  type: ComponentType
  text: string
  /** JTextField only — mirrors `new JTextField(columns)` */
  columns?: number
  /** JComboBox only */
  items?: string[]
  /** JPanel only */
  layout?: LayoutSpec
  /** JPanel only; order = add() order, which matters to every manager */
  children?: SwingChild[]
}

export interface SwingChild {
  node: SwingNode
  /** Meaningful when the parent's layout is BorderLayout. Absent = CENTER (JDK behavior). */
  constraint?: BorderRegion
}

export interface Size {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Insets {
  top: number
  left: number
  bottom: number
  right: number
}

export const ZERO_INSETS: Insets = { top: 0, left: 0, bottom: 0, right: 0 }

export const DEFAULT_LAYOUTS: Record<LayoutSpec['kind'], LayoutSpec> = {
  border: { kind: 'border', hgap: 0, vgap: 0 },
  flow: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
  grid: { kind: 'grid', rows: 2, cols: 2, hgap: 0, vgap: 0 },
}

/** Java int division truncates toward zero; JS Math.floor does not (negatives). */
export function intDiv(a: number, b: number): number {
  return Math.trunc(a / b)
}
