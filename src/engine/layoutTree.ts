/**
 * Recursive layout of a Swing component tree.
 *
 * Preferred sizes are resolved bottom-up (a JPanel's preferred size is its
 * manager's preferredLayoutSize over its children — exactly Swing's
 * Container.getPreferredSize()), then bounds are assigned top-down by each
 * container's layout manager. All positioning is direct pixel math from the
 * ported JDK algorithms; CSS never decides a coordinate.
 */
import type { BorderRegion, LayoutSpec, Rect, Size, SwingNode } from './types'
import { ZERO_INSETS } from './types'
import { borderHiddenChildren, borderLayoutContainer, borderPreferredLayoutSize } from './borderLayout'
import { flowLayoutContainer, flowPreferredLayoutSize } from './flowLayout'
import { gridLayoutContainer, gridPreferredLayoutSize } from './gridLayout'
import { leafPreferredSize, type TextMeasurer } from './metrics'

export interface HiddenComponent {
  id: string
  region: BorderRegion
  containerId: string
}

export interface TreeLayout {
  /** Bounds relative to the parent container, for nested rendering (Swing-style clipping). */
  rel: Map<string, Rect>
  /** Bounds relative to the frame content pane, for hit-testing. */
  abs: Map<string, Rect>
  /** Preferred size per node id. */
  prefs: Map<string, Size>
  /** Components not laid out because their BorderLayout region was re-occupied. */
  hidden: HiddenComponent[]
}

export function preferredSize(node: SwingNode, measure: TextMeasurer): Size {
  if (node.type !== 'JPanel') return leafPreferredSize(node, measure)
  const layout = node.layout ?? { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }
  const children = node.children ?? []
  const sizes = children.map((c) => preferredSize(c.node, measure))
  switch (layout.kind) {
    case 'border':
      return borderPreferredLayoutSize(
        children.map((c, i) => ({ size: sizes[i], constraint: c.constraint })),
        layout,
        ZERO_INSETS,
      )
    case 'flow':
      return flowPreferredLayoutSize(sizes, layout, ZERO_INSETS)
    case 'grid':
      return gridPreferredLayoutSize(sizes, layout, ZERO_INSETS)
  }
}

function layoutChildren(spec: LayoutSpec, children: { size: Size; constraint?: BorderRegion }[], container: Size): (Rect | null)[] {
  switch (spec.kind) {
    case 'border':
      return borderLayoutContainer(children, spec, container, ZERO_INSETS)
    case 'flow':
      return flowLayoutContainer(children.map((c) => c.size), spec, container, ZERO_INSETS)
    case 'grid':
      return gridLayoutContainer(children.map((c) => c.size), spec, container, ZERO_INSETS)
  }
}

export function layoutTree(root: SwingNode, frameSize: Size, measure: TextMeasurer): TreeLayout {
  const rel = new Map<string, Rect>()
  const abs = new Map<string, Rect>()
  const prefs = new Map<string, Size>()
  const hidden: HiddenComponent[] = []

  const collectPrefs = (node: SwingNode) => {
    prefs.set(node.id, preferredSize(node, measure))
    node.children?.forEach((c) => collectPrefs(c.node))
  }
  collectPrefs(root)

  const layoutContainer = (container: SwingNode, containerSize: Size, origin: { x: number; y: number }) => {
    const spec = container.layout!
    const children = container.children ?? []
    const infos = children.map((c) => ({ size: prefs.get(c.node.id)!, constraint: c.constraint }))
    const rects = layoutChildren(spec, infos, containerSize)

    if (spec.kind === 'border') {
      for (const h of borderHiddenChildren(infos)) {
        hidden.push({ id: children[h.index].node.id, region: h.region, containerId: container.id })
      }
    }

    children.forEach((child, i) => {
      const r = rects[i]
      if (!r) return
      rel.set(child.node.id, r)
      const a: Rect = { x: origin.x + r.x, y: origin.y + r.y, width: r.width, height: r.height }
      abs.set(child.node.id, a)
      if (child.node.type === 'JPanel') {
        layoutContainer(child.node, { width: r.width, height: r.height }, { x: a.x, y: a.y })
      }
    })
  }

  rel.set(root.id, { x: 0, y: 0, ...frameSize })
  abs.set(root.id, { x: 0, y: 0, ...frameSize })
  layoutContainer(root, frameSize, { x: 0, y: 0 })

  return { rel, abs, prefs, hidden }
}

/** Deepest container whose absolute bounds contain the point. Falls back to root. */
export function containerAt(root: SwingNode, layout: TreeLayout, x: number, y: number): SwingNode {
  let best = root
  const visit = (node: SwingNode) => {
    node.children?.forEach((c) => {
      if (c.node.type === 'JPanel') {
        const r = layout.abs.get(c.node.id)
        if (r && x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) {
          best = c.node
          visit(c.node)
        }
      }
    })
  }
  visit(root)
  return best
}
