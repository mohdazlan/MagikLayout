/**
 * Read-only render of a Swing tree through the SAME layout engine the
 * Playground uses. Positions come exclusively from layoutTree's pixel math;
 * the global .sw component styles are consumed as-is so challenge canvases
 * are visually identical to the Playground for the same tree.
 */
import { useMemo } from 'react'
import type { Rect, Size, SwingChild, SwingNode } from '../engine/types'
import { layoutTree, type TreeLayout } from '../engine/layoutTree'
import { createCanvasMeasurer, type TextMeasurer } from '../engine/metrics'

export function useMeasurer(): TextMeasurer {
  return useMemo(() => createCanvasMeasurer(), [])
}

function px(r: Rect): React.CSSProperties {
  return {
    transform: `translate(${r.x}px, ${r.y}px)`,
    width: Math.max(r.width, 0),
    height: Math.max(r.height, 0),
  }
}

function StaticLeafContent({ node }: { node: SwingNode }) {
  switch (node.type) {
    case 'JCheckBox':
      return (
        <>
          <span className="box" aria-hidden="true" />
          {node.text}
        </>
      )
    case 'JComboBox':
      return (
        <>
          {node.items?.[0] ?? node.text}
          <span className="arrow" aria-hidden="true" />
        </>
      )
    default:
      return <>{node.text}</>
  }
}

function StaticNode({ child, layout }: { child: SwingChild; layout: TreeLayout }) {
  const { node } = child
  const r = layout.rel.get(node.id)
  if (!r) return null // not laid out (BorderLayout region re-occupied) — invisible, like Swing

  const cls = `sw sw-${node.type}`
  if (node.type === 'JPanel') {
    return (
      <div className={cls} style={px(r)}>
        {node.children?.map((c) => (
          <StaticNode key={c.node.id} child={c} layout={layout} />
        ))}
      </div>
    )
  }
  return (
    <div className={cls} style={px(r)}>
      <StaticLeafContent node={node} />
    </div>
  )
}

export interface SwingFrameProps {
  root: SwingNode
  /** Size the engine lays the tree out at. */
  size: Size
  /** Frame title shown in the (fake) titlebar. */
  title: string
  /** Titlebar dims readout; defaults to `size`, `null` hides it (e.g. when sizes aren't graded). */
  dims?: string | null
  measure: TextMeasurer
  /** Content-pane size when it must exceed the laid-out size (reflow drag surface). */
  surfaceSize?: Size
  /** Absolutely-positioned extras rendered inside the content pane (ghosts, guides). */
  overlays?: React.ReactNode
  className?: string
}

export function SwingFrame({ root, size, title, dims, measure, surfaceSize, overlays, className }: SwingFrameProps) {
  const layout = useMemo(() => layoutTree(root, size, measure), [root, size, measure])
  const surface = surfaceSize ?? size
  return (
    <div className={`jframe ${className ?? ''}`} style={{ width: surface.width + 2 }}>
      <div className="jframe-titlebar">
        <span className="jframe-title">
          {title}
          {dims !== null && (
            <>
              {' — '}
              <span className="dims">{dims ?? `${size.width} × ${size.height}`}</span>
            </>
          )}
        </span>
      </div>
      <div className="jframe-content" style={{ width: surface.width, height: surface.height }}>
        {root.children?.map((c) => (
          <StaticNode key={c.node.id} child={c} layout={layout} />
        ))}
        {overlays}
      </div>
    </div>
  )
}
