import { useEffect, useRef, useState } from 'react'
import type { BorderRegion, Rect, Size, SwingChild, SwingNode } from '../engine/types'
import type { TreeLayout } from '../engine/layoutTree'
import { resolveGrid, gridLayoutContainer } from '../engine/gridLayout'
import { regionBands } from './dropGeometry'
import { MIN_FRAME } from '../state/playground'

export interface DragTarget {
  containerId: string
  region?: BorderRegion
  previewRect: Rect | null
}

interface CanvasProps {
  root: SwingNode
  layout: TreeLayout
  size: Size
  selectedId: string
  dragTarget: DragTarget | null
  contentRef: React.RefObject<HTMLDivElement | null>
  onSelect: (id: string) => void
  onSetText: (id: string, text: string) => void
  onRemove: (id: string) => void
  onResize: (size: Size | null) => void
  onResizeCommit: (size: Size) => void
}

const EDITABLE = new Set(['JButton', 'JLabel', 'JCheckBox'])

function px(r: Rect): React.CSSProperties {
  return {
    transform: `translate(${r.x}px, ${r.y}px)`,
    width: Math.max(r.width, 0),
    height: Math.max(r.height, 0),
  }
}

function LeafContent({ node }: { node: SwingNode }) {
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
    case 'JTextField':
      return <>{node.text}</>
    default:
      return <>{node.text}</>
  }
}

interface NodeViewProps {
  child: SwingChild
  layout: TreeLayout
  selectedId: string
  editingId: string | null
  onSelect: (id: string) => void
  onEdit: (id: string | null) => void
  onSetText: (id: string, text: string) => void
  onRemove: (id: string) => void
}

function NodeView(props: NodeViewProps) {
  const { child, layout, selectedId, editingId, onSelect, onEdit, onSetText, onRemove } = props
  const { node } = child
  const r = layout.rel.get(node.id)
  if (!r) return null // not laid out (BorderLayout region re-occupied) — invisible, like Swing

  const selected = node.id === selectedId
  const cls = `sw sw-${node.type}${selected ? ' selected' : ''}`

  const shared = {
    style: px(r),
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': `${node.type}${node.text ? ` "${node.text}"` : ''}`,
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation()
      onSelect(node.id)
    },
    onDoubleClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (EDITABLE.has(node.type)) onEdit(node.id)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onRemove(node.id)
      } else if (e.key === 'Enter' && EDITABLE.has(node.type)) {
        e.preventDefault()
        onEdit(node.id)
      }
    },
  }

  if (node.type === 'JPanel') {
    return (
      <div className={cls} {...shared}>
        {node.children?.map((c) => (
          <NodeView key={c.node.id} {...props} child={c} />
        ))}
      </div>
    )
  }

  return (
    <div className={cls} {...shared}>
      {editingId === node.id ? (
        <TextEditor
          initial={node.text}
          onCommit={(text) => {
            onEdit(null)
            if (text !== node.text) onSetText(node.id, text)
          }}
          onCancel={() => onEdit(null)}
        />
      ) : (
        <LeafContent node={node} />
      )}
    </div>
  )
}

function TextEditor({ initial, onCommit, onCancel }: { initial: string; onCommit: (t: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <input
      ref={ref}
      className="sw-text-input"
      defaultValue={initial}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') onCommit((e.target as HTMLInputElement).value)
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}

/** Faint teaching diagram shown while the frame is empty, per active manager. */
function EmptyOverlay({ root, size }: { root: SwingNode; size: Size }) {
  const spec = root.layout!
  if (spec.kind === 'border') {
    const bands = regionBands({ x: 0, y: 0, ...size })
    return (
      <div className="overlay" style={{ width: size.width, height: size.height }}>
        {(Object.entries(bands) as [BorderRegion, Rect][]).map(([region, b]) => (
          <div key={region} className="region-band" style={px(b)}>
            {region}
          </div>
        ))}
      </div>
    )
  }
  if (spec.kind === 'grid') {
    const { nrows, ncols } = resolveGrid(Math.max(spec.rows, 1) * Math.max(spec.cols, 1), spec.rows, spec.cols)
    const count = nrows * ncols
    const cells = gridLayoutContainer(new Array(count).fill({ width: 0, height: 0 }), spec, size)
    return (
      <div className="overlay" style={{ width: size.width, height: size.height }}>
        {cells.map((c, i) => (
          <div key={i} className="grid-cell" style={px(c)} />
        ))}
        <div className="empty-msg">{`${nrows} × ${ncols} identical cells\nDrag a component in`}</div>
      </div>
    )
  }
  return (
    <div className="overlay" style={{ width: size.width, height: size.height }}>
      <div className="empty-msg">{'FlowLayout packs components into rows,\nlike words in a paragraph. Drag one in.'}</div>
    </div>
  )
}

/** Live drop feedback: target container outline, BorderLayout bands, predicted bounds ghost. */
function DropOverlay({ root, layout, target, size }: { root: SwingNode; layout: TreeLayout; target: DragTarget; size: Size }) {
  const containerRect = layout.abs.get(target.containerId)
  if (!containerRect) return null
  const container = target.containerId === root.id ? root : null
  const spec = (container ?? findByIdShallow(root, target.containerId))?.layout

  return (
    <div className="overlay" style={{ width: size.width, height: size.height }}>
      {target.containerId !== root.id && <div className="container-hot" style={px(containerRect)} />}
      {spec?.kind === 'border' &&
        (Object.entries(regionBands(containerRect)) as [BorderRegion, Rect][]).map(([region, b]) => (
          <div key={region} className={`region-band${region === target.region ? ' hot' : ''}`} style={px(b)}>
            {region}
          </div>
        ))}
      {target.previewRect && target.previewRect.width > 0 && target.previewRect.height > 0 && (
        <div className="drop-ghost" style={px(target.previewRect)} />
      )}
    </div>
  )
}

function findByIdShallow(root: SwingNode, id: string): SwingNode | null {
  if (root.id === id) return root
  for (const c of root.children ?? []) {
    const f = findByIdShallow(c.node, id)
    if (f) return f
  }
  return null
}

export function Canvas(props: CanvasProps) {
  const { root, layout, size, selectedId, dragTarget, contentRef, onSelect, onSetText, onRemove, onResize, onResizeCommit } = props
  const [editingId, setEditingId] = useState<string | null>(null)
  const [resizing, setResizing] = useState(false)
  const resizeRef = useRef<{ startX: number; startY: number; start: Size; axis: 'e' | 's' | 'se' } | null>(null)
  const liveSize = useRef(size)
  liveSize.current = size

  const startResize = (axis: 'e' | 's' | 'se') => (e: React.PointerEvent) => {
    e.preventDefault()
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // pointer already released (or synthetic) — window listeners below still track it
    }
    resizeRef.current = { startX: e.clientX, startY: e.clientY, start: { ...size }, axis }
    setResizing(true)
  }

  const moveResize = (e: React.PointerEvent) => {
    const rs = resizeRef.current
    if (!rs) return
    const next: Size = {
      width:
        rs.axis === 's' ? rs.start.width : Math.max(MIN_FRAME.width, Math.round(rs.start.width + e.clientX - rs.startX)),
      height:
        rs.axis === 'e' ? rs.start.height : Math.max(MIN_FRAME.height, Math.round(rs.start.height + e.clientY - rs.startY)),
    }
    onResize(next)
  }

  const endResize = () => {
    if (!resizeRef.current) return
    resizeRef.current = null
    setResizing(false)
    onResizeCommit(liveSize.current)
  }

  const keyResize = (axis: 'e' | 's' | 'se') => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 10
    let dw = 0
    let dh = 0
    if (axis !== 's') {
      if (e.key === 'ArrowRight') dw = step
      else if (e.key === 'ArrowLeft') dw = -step
    }
    if (axis !== 'e') {
      if (e.key === 'ArrowDown') dh = step
      else if (e.key === 'ArrowUp') dh = -step
    }
    if (dw === 0 && dh === 0) return
    e.preventDefault()
    onResizeCommit({
      width: Math.max(MIN_FRAME.width, size.width + dw),
      height: Math.max(MIN_FRAME.height, size.height + dh),
    })
  }

  const isEmpty = !root.children?.length

  return (
    <div className={`jframe${resizing ? ' resizing' : ''}`} style={{ width: size.width + 2 }}>
      <div className="jframe-titlebar">
        <span className="jframe-title">
          LayoutLab — <span className="dims">{size.width} × {size.height}</span>
        </span>
      </div>
      <div
        ref={contentRef}
        className="jframe-content"
        style={{ width: size.width, height: size.height }}
        onPointerDown={() => onSelect(root.id)}
        aria-label="Frame content pane"
      >
        {root.children?.map((c) => (
          <NodeView
            key={c.node.id}
            child={c}
            layout={layout}
            selectedId={selectedId}
            editingId={editingId}
            onSelect={onSelect}
            onEdit={setEditingId}
            onSetText={onSetText}
            onRemove={onRemove}
          />
        ))}
        {isEmpty && !dragTarget && <EmptyOverlay root={root} size={size} />}
        {dragTarget && <DropOverlay root={root} layout={layout} target={dragTarget} size={size} />}
      </div>
      <div className="rs rs-e" tabIndex={0} role="separator" aria-orientation="vertical" aria-label="Resize width" onPointerDown={startResize('e')} onPointerMove={moveResize} onPointerUp={endResize} onKeyDown={keyResize('e')} />
      <div className="rs rs-s" tabIndex={0} role="separator" aria-orientation="horizontal" aria-label="Resize height" onPointerDown={startResize('s')} onPointerMove={moveResize} onPointerUp={endResize} onKeyDown={keyResize('s')} />
      <div className="rs rs-se" tabIndex={0} role="separator" aria-label="Resize frame" onPointerDown={startResize('se')} onPointerMove={moveResize} onPointerUp={endResize} onKeyDown={keyResize('se')} />
    </div>
  )
}
