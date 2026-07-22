/**
 * Reverse challenge: target on the left, a real builder on the right, graded
 * by deterministic structural equivalence (spec §7.3 — "structural
 * equivalence, not pixels"). The builder is composed from the Playground's
 * own frozen components (Palette, Canvas, LayoutControls, reducer) so the
 * interaction vocabulary the student already learned carries over untouched.
 * The qualitative AI coach layer ships with the Phase 2 proxy; nothing here
 * calls a model.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ComponentType, Size } from '../engine/types'
import { containerAt, layoutTree } from '../engine/layoutTree'
import { generateJava } from '../codegen/javaCode'
import {
  activeContainer,
  addChild,
  findParent,
  firstFreeRegion,
  initialState,
  makeNode,
  reducer,
} from '../state/playground'
import { regionAtPoint } from '../components/dropGeometry'
import { Palette } from '../components/Palette'
import { LayoutControls } from '../components/LayoutControls'
import { Canvas, type DragTarget } from '../components/Canvas'
import { CodePanel } from '../components/CodePanel'
import { challengeHref } from '../router'
import { CHALLENGES } from './data'
import { gradeReverse, type ReverseGrade } from './grade'
import { SwingFrame, useMeasurer } from './SwingFrame'
import type { ReverseChallenge } from './types'

interface DragState {
  type: ComponentType
  pointer: { x: number; y: number }
  target: DragTarget | null
  start: { x: number; y: number }
  active: boolean
}

const DRAG_THRESHOLD = 4

export function ReversePlayer({ challenge }: { challenge: ReverseChallenge }) {
  const measure = useMeasurer()
  const [state, dispatch] = useReducer(reducer, challenge, (ch) => ({
    ...initialState,
    frameSize: ch.frameSize,
  }))
  const [transientSize, setTransientSize] = useState<Size | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [grade, setGrade] = useState<ReverseGrade | null>(null)

  const canvasSize = transientSize ?? state.frameSize
  const layout = useMemo(() => layoutTree(state.root, canvasSize, measure), [state.root, canvasSize, measure])
  const { code, varNames } = useMemo(
    () => generateJava(state.root, state.frameSize),
    [state.root, state.frameSize],
  )
  const selectedVar = state.selectedId === 'root' ? null : (varNames.get(state.selectedId) ?? null)

  // Any edit invalidates the last verdict.
  useEffect(() => setGrade(null), [state.root])

  // ————— drag from palette (the Playground's own interaction, rewired) —————
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
      if (!d) {
        setDrag(null)
        return
      }
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

  // ————— global keyboard: undo/redo (Playground convention) —————
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

  const container = activeContainer(state)
  const containerLabel = container.id === 'root' ? 'the frame' : (varNames.get(container.id) ?? 'panel')

  const chIndex = CHALLENGES.findIndex((c) => c.id === challenge.id)
  const nextChallenge = chIndex >= 0 ? CHALLENGES[chIndex + 1] : undefined

  const onCheck = () => setGrade(gradeReverse(challenge.target, state.root))

  return (
    <div className="ch-player ch-reverse">
      <Palette
        onDragStart={(type, e) => {
          e.preventDefault()
          setDrag({ type, pointer: { x: e.clientX, y: e.clientY }, target: null, start: { x: e.clientX, y: e.clientY }, active: false })
        }}
        onClickAdd={clickAdd}
      />

      <section className="ch-stage ch-reverse-stage" aria-label="Reverse challenge canvas">
        <p className="ch-prompt">{challenge.prompt}</p>
        <p className="ch-kbd-hint">
          Click adds to the first free region of the selected container — drag to choose the spot yourself.
          Double-click renames · Delete removes · ⌘Z undoes.
        </p>
        <div className={`ch-canvases${grade?.pass ? ' ch-pass-glow' : ''}`}>
          <figure className="ch-target">
            <figcaption className="ch-canvas-label">Target — shown at 70%</figcaption>
            <div
              className="ch-target-scale"
              style={{
                width: (challenge.frameSize.width + 2) * 0.7,
                height: (challenge.frameSize.height + 32) * 0.7,
              }}
            >
              <SwingFrame root={challenge.target} size={challenge.frameSize} title="Target" dims={null} measure={measure} />
            </div>
          </figure>
          <figure className="ch-live">
            <figcaption className="ch-canvas-label">Your build</figcaption>
            <LayoutControls
              container={container}
              containerLabel={containerLabel}
              onChange={(spec) => dispatch({ type: 'setLayout', containerId: container.id, spec })}
            />
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
          </figure>
        </div>
        <div className="ch-notices" role="status" aria-live="polite">
          {layout.hidden.map((h) => (
            <p key={h.id} className="ch-notice ch-notice-warn">
              <code>{varNames.get(h.id) ?? 'a component'}</code> is covered — BorderLayout only shows the{' '}
              <strong>last</strong> component added to <code>{h.region}</code>.
            </p>
          ))}
        </div>
      </section>

      <section className="ch-grade-pane" aria-label="Grading">
        <div className="ch-pane-block">
          <h2 className="pane-title">Structure check</h2>
          <p className="ch-grade-explain">
            Graded on the component tree — types, texts, layout managers, regions, and add order. Sizes and
            pixels don’t count; your frame size is yours.
          </p>
          {grade && (
            <div className={`ch-verdict ${grade.pass ? 'ch-verdict-pass' : 'ch-verdict-fail'}`} role="alert">
              {grade.pass ? (
                <>
                  <strong className="ch-congrats">Congratulations — you rebuilt the target.</strong>
                  <p className="ch-congrats-sub">
                    Structurally equivalent: Swing would build the same tree from your canvas.
                  </p>
                  {challenge.notes && challenge.notes.length > 0 && (
                    <>
                      <p className="ch-notes-title">What this layout just taught you</p>
                      <ul className="ch-notes">
                        {challenge.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {nextChallenge ? (
                    <a className="ch-next-link" href={challengeHref(nextChallenge.id)}>
                      Next challenge: {nextChallenge.title} →
                    </a>
                  ) : (
                    <a className="ch-next-link" href={challengeHref()}>
                      Back to all challenges →
                    </a>
                  )}
                </>
              ) : (
                <>
                  Not equivalent yet:
                  <ul className="ch-findings">
                    {grade.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          <div className="ch-actions">
            <button
              type="button"
              className="ghost-btn"
              disabled={!state.past.length}
              onClick={() => dispatch({ type: 'undo' })}
            >
              Undo
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={!state.future.length}
              onClick={() => dispatch({ type: 'redo' })}
            >
              Redo
            </button>
            <button
              type="button"
              className="ch-submit"
              disabled={!state.root.children?.length}
              title={state.root.children?.length ? undefined : 'Add components first'}
              onClick={onCheck}
            >
              Check structure
            </button>
          </div>
        </div>
        <div className="ch-pane-block ch-code-block">
          <h2 className="pane-title">Your code</h2>
          <p className="ch-grade-explain">
            The Java your canvas describes, regenerated on every edit — the same deterministic codegen the
            Playground uses. Compare it against the target as you build.
          </p>
          <CodePanel code={code} selectedVar={selectedVar} />
        </div>

        <p className="ch-ai-note">
          AI coach feedback — qualitative advice on <em>how</em> you got there — arrives in a later release.
          The verdict above is the same deterministic engine check every mode here uses.
        </p>
      </section>

      {drag?.active && (
        <div className="drag-ghost" style={{ left: drag.pointer.x, top: drag.pointer.y }}>
          <span className="chip">{drag.type}</span>
        </div>
      )}
    </div>
  )
}
