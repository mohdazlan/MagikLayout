import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ComponentType, Size } from '../engine/types'
import { containerAt, layoutTree } from '../engine/layoutTree'
import { createCanvasMeasurer } from '../engine/metrics'
import { generateJava } from '../codegen/javaCode'
import { activeContainer, addChild, firstFreeRegion, findNode, findParent, initialState, makeNode, reducer } from '../state/playground'
import { regionAtPoint } from './dropGeometry'
import { Palette } from './Palette'
import { LayoutControls } from './LayoutControls'
import { Canvas, type DragTarget } from './Canvas'
import { CodePanel } from './CodePanel'

interface DragState {
  type: ComponentType
  pointer: { x: number; y: number }
  target: DragTarget | null
  start: { x: number; y: number }
  active: boolean
}

const DRAG_THRESHOLD = 4

const MANAGER_TIPS: Record<string, string> = {
  border: 'Drag the frame edge — NORTH and SOUTH keep their height, CENTER absorbs everything else.',
  flow: 'Drag the frame edge narrower — rows wrap at the frame width, like text in a paragraph.',
  grid: 'Every cell is identical. GridLayout ignores preferred sizes — try dropping components of different sizes.',
}

export function Playground() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [transientSize, setTransientSize] = useState<Size | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [resetArmed, setResetArmed] = useState(false)
  const resetTimer = useRef<number | null>(null)

  const measure = useMemo(() => createCanvasMeasurer(), [])
  const canvasSize = transientSize ?? state.frameSize
  const layout = useMemo(() => layoutTree(state.root, canvasSize, measure), [state.root, canvasSize, measure])
  const { code, varNames } = useMemo(
    () => generateJava(state.root, state.frameSize),
    [state.root, state.frameSize],
  )

  // ————— drag from palette —————
  const dragCtx = useRef({ state, layout, canvasSize, measure })
  dragCtx.current = { state, layout, canvasSize, measure }

  useEffect(() => {
    if (!drag) return

    const computeTarget = (clientX: number, clientY: number): DragState['target'] => {
      const el = contentRef.current
      if (!el) return null
      const { state, layout, canvasSize, measure } = dragCtx.current
      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      if (x < 0 || y < 0 || x >= canvasSize.width || y >= canvasSize.height) return null

      let container = containerAt(state.root, layout, x, y)
      const EDGE = 10
      while (container.id !== state.root.id) {
        const r = layout.abs.get(container.id)!
        const nearEdge =
          x < r.x + EDGE || x >= r.x + r.width - EDGE || y < r.y + EDGE || y >= r.y + r.height - EDGE
        if (!nearEdge) break
        container = findParent(state.root, container.id) ?? state.root
      }
      const spec = container.layout!
      const region =
        spec.kind === 'border' ? regionAtPoint(layout.abs.get(container.id)!, x, y) : undefined

      const previewNode = { ...makeNode(drag.type), id: '__preview__' }
      const previewTree = addChild(state.root, container.id, previewNode, region)
      const previewLayout = layoutTree(previewTree, canvasSize, measure)
      return {
        containerId: container.id,
        region,
        previewRect: previewLayout.abs.get('__preview__') ?? null,
      }
    }

    const onMove = (e: PointerEvent) => {
      setDrag((d) => {
        if (!d) return d
        if (!d.active) {
          const dx = e.clientX - d.start.x
          const dy = e.clientY - d.start.y
          if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return d
          return { ...d, active: true, pointer: { x: e.clientX, y: e.clientY }, target: computeTarget(e.clientX, e.clientY) }
        }
        return { ...d, pointer: { x: e.clientX, y: e.clientY }, target: computeTarget(e.clientX, e.clientY) }
      })
    }
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) { setDrag(null); return }
      if (!d.active) {
        const { state } = dragCtx.current
        const cont = activeContainer(state)
        const constraint = cont.layout!.kind === 'border' ? firstFreeRegion(cont) : undefined
        dispatch({ type: 'add', parentId: cont.id, node: makeNode(d.type), constraint })
      } else {
        const target = computeTarget(e.clientX, e.clientY)
        if (target) {
          dispatch({ type: 'add', parentId: target.containerId, node: makeNode(d.type), constraint: target.region })
        }
      }
      setDrag(null)
    }
    const onCancel = () => setDrag(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [drag?.type]) // eslint-disable-line react-hooks/exhaustive-deps

  const clickAdd = (type: ComponentType) => {
    const container = activeContainer(state)
    const constraint = container.layout!.kind === 'border' ? firstFreeRegion(container) : undefined
    dispatch({ type: 'add', parentId: container.id, node: makeNode(type), constraint })
  }

  // Reset wipes the whole tree, so arm it on the first click and only clear on the second.
  const onResetClick = () => {
    if (resetArmed) {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
      setResetArmed(false)
      dispatch({ type: 'clear' })
    } else {
      setResetArmed(true)
      resetTimer.current = window.setTimeout(() => setResetArmed(false), 3000)
    }
  }

  // ————— global keyboard: undo/redo —————
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ————— hint strip —————
  const container = activeContainer(state)
  const containerLabel = container.id === 'root' ? 'the frame' : (varNames.get(container.id) ?? 'panel')
  const tip = MANAGER_TIPS[container.layout!.kind]

  // Flash manager tip for 5s after a layout-kind switch
  const currentKind = container.layout!.kind
  const [tipFlash, setTipFlash] = useState(false)
  const prevKindRef = useRef(currentKind)

  useEffect(() => {
    if (currentKind !== prevKindRef.current) {
      prevKindRef.current = currentKind
      setTipFlash(true)
      const id = setTimeout(() => setTipFlash(false), 5000)
      return () => clearTimeout(id)
    }
  }, [currentKind])

  const selectedVar = state.selectedId === 'root' ? null : (varNames.get(state.selectedId) ?? null)
  const selectedNode = findNode(state.root, state.selectedId)

  return (
    <>
      <header className="app-header">
        <h1 className="wordmark">
          Layout<em>Lab</em>
        </h1>
        <p className="tagline">Why did Swing put it there? Drag, resize, and read the code.</p>
        <div className="header-actions">
          <a href="#/challenges" className="ghost-btn ch-header-link">
            Challenges
          </a>
          <button
            type="button"
            className="ghost-btn icon-btn"
            popoverTarget="shortcuts-pop"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
          <button type="button" className="ghost-btn" disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })}>
            Undo
          </button>
          <button type="button" className="ghost-btn" disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })}>
            Redo
          </button>
          <button
            type="button"
            className={`ghost-btn reset-btn${resetArmed ? ' armed' : ''}`}
            disabled={!state.root.children?.length}
            onClick={onResetClick}
            onBlur={() => setResetArmed(false)}
            aria-label={resetArmed ? 'Confirm: clear the whole canvas' : 'Reset the canvas'}
          >
            {resetArmed ? 'Clear all?' : 'Reset'}
          </button>
          <div id="shortcuts-pop" popover="auto" className="shortcuts-pop" aria-label="Keyboard shortcuts">
            <h2>Shortcuts</h2>
            <dl>
              <div><dt>Click a component</dt><dd>adds it to the selected container</dd></div>
              <div><dt>Drag from the palette</dt><dd>drops it into a specific region</dd></div>
              <div><dt>Double-click</dt><dd>edits a component's text</dd></div>
              <div><dt><kbd>Delete</kbd></dt><dd>removes the selected component</dd></div>
              <div><dt>Frame edge, or <kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd></dt><dd>resizes — hold <kbd>Shift</kbd> for 1px steps</dd></div>
              <div><dt><kbd>⌘Z</kbd> · <kbd>⇧⌘Z</kbd></dt><dd>undo · redo</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <div className="playground">
        <Palette onDragStart={(type, e) => {
          e.preventDefault()
          setDrag({ type, pointer: { x: e.clientX, y: e.clientY }, target: null, start: { x: e.clientX, y: e.clientY }, active: false })
        }} onClickAdd={clickAdd} />

        <section className="stage" aria-label="Playground canvas">
          <LayoutControls
            container={container}
            containerLabel={containerLabel}
            onChange={(spec) => dispatch({ type: 'setLayout', containerId: container.id, spec })}
          />
          <div className="stage-canvas">
            <Canvas
              root={state.root}
              layout={layout}
              size={canvasSize}
              selectedId={state.selectedId}
              dragTarget={drag?.active ? drag.target : null}
              contentRef={contentRef}
              onSelect={(id) => dispatch({ type: 'select', id })}
              onSetText={(id, text) => dispatch({ type: 'setText', id, text })}
              onRemove={(id) => dispatch({ type: 'remove', id })}
              onResize={setTransientSize}
              onResizeCommit={(size) => {
                setTransientSize(null)
                dispatch({ type: 'resizeFrame', size })
              }}
            />
          </div>
          <div className="hint-strip" aria-live="polite" role="status">
            {layout.hidden.length > 0 ? (
              <div className="hidden-notice">
                <span className="hidden-why">
                  BorderLayout shows only the <strong>last</strong> component added to each region — drag a
                  hidden one to a free region, or delete it.
                </span>
                <div className="hidden-chips">
                  {layout.hidden.map((h) => {
                    const name = varNames.get(h.id) ?? 'component'
                    return (
                      <span
                        key={h.id}
                        className={`hidden-chip${state.selectedId === h.id ? ' selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        title={`${name} is covered in ${h.region} — click to select it`}
                        onClick={() => dispatch({ type: 'select', id: h.id })}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch({ type: 'select', id: h.id }) } }}
                      >
                        <code>{name}</code>
                        <span className="hidden-reason">{h.region}</span>
                        <button
                          type="button"
                          className="chip-x"
                          aria-label={`Delete ${name}`}
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'remove', id: h.id }) }}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : tipFlash || !(selectedNode && selectedNode.id !== 'root') ? (
              <span>{tip}</span>
            ) : (
              <span>
                <code>{selectedVar}</code> selected — press <code>Delete</code> to remove
                {selectedNode.type !== 'JPanel' && selectedNode.type !== 'JTextField' && selectedNode.type !== 'JComboBox'
                  ? ', double-click to edit its text'
                  : ''}
                .
              </span>
            )}
          </div>
        </section>

        <CodePanel code={code} selectedVar={selectedVar} />

        {drag?.active && (
          <div className="drag-ghost" style={{ left: drag.pointer.x, top: drag.pointer.y }}>
            <span className="chip">{drag.type}</span>
          </div>
        )}
      </div>
    </>
  )
}
