/**
 * Live-Rendered Parsons Problems. The build area is the program; every edit
 * re-executes the magnet sequence statement-by-statement and re-renders the
 * canvas through the real layout engine — order matters exactly as in Swing.
 * Grading is deterministic tree equivalence (grade.ts); no LLM.
 */
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { layoutTree } from '../engine/layoutTree'
import { challengeHref } from '../router'
import { CHALLENGES } from './data'
import { executeStatements, type ExecResult } from './execute'
import { gradeParsons, targetExec, type ParsonsGrade } from './grade'
import { CoachPanel } from './CoachPanel'
import { SwingFrame, useMeasurer } from './SwingFrame'
import type { ParsonsChallenge } from './types'

/** Turn a failed Parsons grade into plain-language findings for the AI coach.
 *  Everything here is already computed by the engine — the first divergence,
 *  compile errors, and setLayout-timing (unmanaged) issues. */
function parsonsFindings(
  challenge: ParsonsChallenge,
  placed: number[],
  exec: ExecResult,
  result: ParsonsGrade,
): string[] {
  const out: string[] = []
  const fd = result.firstDivergence
  if (fd >= 0 && fd < placed.length) {
    out.push(
      `Statement ${fd + 1} — \`${challenge.magnets[placed[fd]].java}\` — is the first statement after which this order can no longer reach the target.`,
    )
  }
  exec.results.forEach((r, i) => {
    if (!r.ok && r.error) {
      out.push(`Line ${i + 1} (\`${challenge.magnets[placed[i]].java}\`) does not compile: ${r.error}.`)
    }
  })
  for (const u of exec.unmanaged) {
    out.push(
      `${u.varName} was added to ${u.containerVar} before its BorderLayout was installed, so Swing never registers it — it stays invisible.`,
    )
  }
  return out
}

interface DragState {
  magnetIdx: number
  /** Index in `placed` when dragging an already-placed magnet; null from tray. */
  fromSlot: number | null
  pointer: { x: number; y: number }
  start: { x: number; y: number }
  active: boolean
  /** Insertion slot in the build area the pointer is over, or null (outside). */
  insertAt: number | null
}

const DRAG_THRESHOLD = 4

/** Same token vocabulary as the Playground's code panel, for scannable magnets. */
function JavaCode({ code }: { code: string }) {
  const re =
    /("(?:[^"\\]|\\.)*")|\b(new|public|static|void|class)\b|\b(JFrame|JButton|JLabel|JTextField|JCheckBox|JComboBox|JPanel|BorderLayout|FlowLayout|GridLayout|String)\b|(\b\d+\b)/g
  const out: JSX.Element[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(<span key={key++}>{code.slice(last, m.index)}</span>)
    const cls = m[1] ? 'tok-str' : m[2] ? 'tok-kw' : m[3] ? 'tok-type' : 'tok-num'
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < code.length) out.push(<span key={key++}>{code.slice(last)}</span>)
  return <>{out}</>
}

export function ParsonsPlayer({ challenge }: { challenge: ParsonsChallenge }) {
  const measure = useMeasurer()
  const [placed, setPlaced] = useState<number[]>([])
  const [past, setPast] = useState<number[][]>([])
  const [result, setResult] = useState<ParsonsGrade | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag
  const buildRef = useRef<HTMLOListElement | null>(null)

  const target = useMemo(() => targetExec(challenge), [challenge])
  const exec = useMemo(
    () => executeStatements(placed.map((i) => challenge.magnets[i].stmt)),
    [placed, challenge],
  )
  const liveLayout = useMemo(
    () => layoutTree(exec.root, challenge.frameSize, measure),
    [exec.root, challenge.frameSize, measure],
  )

  const inTray = challenge.trayOrder.filter((i) => !placed.includes(i))
  const allPlaced = inTray.length === 0

  const chIndex = CHALLENGES.findIndex((c) => c.id === challenge.id)
  const nextChallenge = chIndex >= 0 ? CHALLENGES[chIndex + 1] : undefined

  const edit = (updater: (prev: number[]) => number[]) => {
    setPlaced((prev) => {
      const next = updater(prev)
      if (next !== prev) setPast((p) => [...p.slice(-49), prev])
      return next
    })
    setResult(null)
  }

  const undo = () => {
    setPast((p) => {
      const prev = p[p.length - 1]
      if (prev === undefined) return p
      setPlaced(prev)
      setResult(null)
      return p.slice(0, -1)
    })
  }

  // ⌘Z / Ctrl+Z, matching the Playground's header convention.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const insertAtSlot = (magnetIdx: number, fromSlot: number | null, slot: number) => {
    edit((prev) => {
      const next = [...prev]
      if (fromSlot !== null) {
        next.splice(fromSlot, 1)
        if (slot > fromSlot) slot -= 1
      }
      next.splice(slot, 0, magnetIdx)
      return next
    })
  }

  // ————— pointer drag (same idiom as the Playground palette) —————
  useEffect(() => {
    if (!drag) return

    const slotFromPointer = (clientY: number, clientX: number): number | null => {
      const list = buildRef.current
      if (!list) return null
      const box = list.getBoundingClientRect()
      const SLOP = 28
      if (clientX < box.left - SLOP || clientX > box.right + SLOP || clientY < box.top - SLOP || clientY > box.bottom + SLOP) {
        return null
      }
      const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-slot]'))
      let slot = rows.length
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect()
        if (clientY < r.top + r.height / 2) {
          slot = i
          break
        }
      }
      return slot
    }

    const onMove = (e: PointerEvent) => {
      setDrag((d) => {
        if (!d) return d
        if (!d.active) {
          const dx = e.clientX - d.start.x
          const dy = e.clientY - d.start.y
          if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return d
        }
        return {
          ...d,
          active: true,
          pointer: { x: e.clientX, y: e.clientY },
          insertAt: slotFromPointer(e.clientY, e.clientX),
        }
      })
    }
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      setDrag(null)
      if (!d) return
      if (!d.active) {
        // Plain click: tray magnets append to the end of the program.
        if (d.fromSlot === null) edit((prev) => [...prev, d.magnetIdx])
        return
      }
      const slot = slotFromPointer(e.clientY, e.clientX)
      if (slot !== null) {
        insertAtSlot(d.magnetIdx, d.fromSlot, slot)
      } else if (d.fromSlot !== null) {
        // Dragged out of the program: back to the tray (undo restores it).
        edit((prev) => prev.filter((i) => i !== d.magnetIdx))
      }
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
  }, [drag !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (magnetIdx: number, fromSlot: number | null) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setDrag({
      magnetIdx,
      fromSlot,
      pointer: { x: e.clientX, y: e.clientY },
      start: { x: e.clientX, y: e.clientY },
      active: false,
      insertAt: null,
    })
  }

  const moveSlot = (slot: number, delta: number) => {
    const to = slot + delta
    if (to < 0 || to >= placed.length) return
    edit((prev) => {
      const next = [...prev]
      const [m] = next.splice(slot, 1)
      next.splice(to, 0, m)
      return next
    })
  }

  const removeSlot = (magnetIdx: number) => edit((prev) => prev.filter((i) => i !== magnetIdx))

  const focusSlot = (slot: number) => {
    const rows = buildRef.current?.querySelectorAll<HTMLElement>('[data-slot]')
    const row = rows?.[slot]
    if (row) {
      row.scrollIntoView({ block: 'nearest' })
      row.focus()
    }
  }

  const onSubmit = () => setResult(gradeParsons(challenge, placed))

  /**
   * Slots whose add() ran before the container's setLayout — the Swing trap.
   * Marked inline exactly like compile errors so the causal line never shows
   * a clean dot while its component is invisible on the canvas.
   */
  const warnSlots = useMemo(() => {
    const map = new Map<number, string>()
    for (const u of exec.unmanaged) {
      for (let slot = placed.length - 1; slot >= 0; slot--) {
        const s = challenge.magnets[placed[slot]].stmt
        if (s.kind === 'add' && s.child === u.varName && s.target === u.containerVar) {
          map.set(
            slot,
            `runs while ${u.containerVar} still has its old manager — the BorderLayout installed later never registers ${u.varName}, so Swing leaves it unsized`,
          )
          break
        }
      }
    }
    return map
  }, [exec.unmanaged, placed, challenge])

  return (
    <div className="ch-player ch-parsons">
      <section className="ch-stage" aria-label="Challenge canvas">
        <p className="ch-prompt">{challenge.prompt}</p>
        <div className="ch-canvases">
          <figure className="ch-target">
            <figcaption className="ch-canvas-label">Target</figcaption>
            <SwingFrame root={target.root} size={challenge.frameSize} title="Target" measure={measure} />
          </figure>
          <figure className="ch-live">
            <figcaption className="ch-canvas-label">Your program, executed live</figcaption>
            <SwingFrame root={exec.root} size={challenge.frameSize} title="LayoutLab" measure={measure} />
          </figure>
        </div>
        <div className="ch-notices" role="status" aria-live="polite">
          {exec.unmanaged.map((u) => (
            <p key={u.varName} className="ch-notice ch-notice-warn">
              <code>{u.varName}</code> is invisible: it was added to <code>{u.containerVar}</code> before{' '}
              <code>setLayout(…)</code>, so the new manager never registered it and Swing never gives it a
              size. The marked line in your program is where it happens.
            </p>
          ))}
          {liveLayout.hidden.map((h) => (
            <p key={h.id} className="ch-notice ch-notice-warn">
              <code>{h.id}</code> is covered — BorderLayout only shows the <strong>last</strong> component
              added to <code>{h.region}</code>.
            </p>
          ))}
        </div>
      </section>

      <section className="ch-program-pane" aria-label="Code magnets">
        <div className="ch-pane-block">
          <h2 className="pane-title">
            Program <span className="ch-count">{placed.length} / {challenge.magnets.length}</span>
          </h2>
          <p className="ch-kbd-hint">Drag to reorder · Alt ↑/↓ moves a line · Delete removes · ⌘Z undoes</p>
          {result && (
            <div className={`ch-verdict ${result.pass ? 'ch-verdict-pass' : 'ch-verdict-fail'}`} role="alert">
              {result.pass ? (
                <>
                  Matches the target — this is exactly the tree Swing builds.
                  {nextChallenge && (
                    <a className="ch-next-link" href={challengeHref(nextChallenge.id)}>
                      Next challenge: {nextChallenge.title} →
                    </a>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="ch-stmt-link" onClick={() => focusSlot(result.firstDivergence)}>
                    Statement {result.firstDivergence + 1}
                  </button>{' '}
                  diverges — from there this order can’t reach the target. The canvas shows what Swing builds
                  instead.
                  <CoachPanel
                    key={`${result.firstDivergence}:${placed.join(',')}`}
                    mode="parsons"
                    challengeTitle={challenge.title}
                    prompt={challenge.prompt}
                    findings={parsonsFindings(challenge, placed, exec, result)}
                    studentCode={placed.map((i) => challenge.magnets[i].java).join('\n')}
                  />
                </>
              )}
            </div>
          )}
          <ol className="ch-build" ref={buildRef} tabIndex={-1}>
            {placed.map((magnetIdx, slot) => {
              const magnet = challenge.magnets[magnetIdx]
              const status = exec.results[slot]
              const warn = status.ok ? warnSlots.get(slot) : undefined
              const isDivergence = result !== null && !result.pass && result.firstDivergence === slot
              const beingDragged = drag?.active && drag.fromSlot === slot
              const state = !status.ok ? 'error' : warn ? 'warn' : 'ok'
              return (
                <li
                  key={magnet.id}
                  data-slot
                  className={`ch-slot${drag?.active && drag.insertAt === slot ? ' ch-slot-before' : ''}`}
                  tabIndex={0}
                  aria-label={`Line ${slot + 1}: ${magnet.java}${
                    status.ok ? (warn ? `. Warning: ${warn}` : '') : `. Error: ${status.error}`
                  }`}
                  aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Delete"
                  onPointerDown={startDrag(magnetIdx, slot)}
                  onKeyDown={(e) => {
                    if (e.altKey && e.key === 'ArrowUp') {
                      e.preventDefault()
                      moveSlot(slot, -1)
                    } else if (e.altKey && e.key === 'ArrowDown') {
                      e.preventDefault()
                      moveSlot(slot, 1)
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.preventDefault()
                      removeSlot(magnetIdx)
                      buildRef.current?.focus()
                    }
                  }}
                >
                  <div
                    className={`ch-magnet ch-magnet-placed${status.ok ? '' : ' ch-magnet-error'}${
                      warn ? ' ch-magnet-warn' : ''
                    }${isDivergence ? ' ch-magnet-diverged' : ''}${beingDragged ? ' ch-magnet-lifted' : ''}`}
                  >
                    <span className="ch-ln">{slot + 1}</span>
                    <span className={`ch-status ${state}`} aria-hidden="true" />
                    <code className="ch-java">
                      <JavaCode code={magnet.java} />
                    </code>
                    <button
                      type="button"
                      className="chip-x"
                      aria-label={`Remove line ${slot + 1}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeSlot(magnetIdx)}
                    >
                      ×
                    </button>
                  </div>
                  {!status.ok && <p className="ch-error-msg">{status.error}</p>}
                  {warn && <p className="ch-warn-msg">{warn}</p>}
                  {isDivergence && <p className="ch-diverge-msg">first statement off the path to the target</p>}
                </li>
              )
            })}
            {drag?.active && drag.insertAt === placed.length && <li className="ch-slot ch-slot-before ch-slot-tail" aria-hidden="true" />}
            {placed.length === 0 && !drag?.active && (
              <li className="ch-build-empty">Drag statements here — or click one below to append it.</li>
            )}
          </ol>
        </div>

        <div className="ch-pane-block">
          <h2 className="pane-title">Unplaced statements</h2>
          <ul className="ch-tray">
            {inTray.map((magnetIdx) => {
              const magnet = challenge.magnets[magnetIdx]
              return (
                <li key={magnet.id}>
                  <button
                    type="button"
                    className={`ch-magnet${drag?.active && drag.magnetIdx === magnetIdx ? ' ch-magnet-lifted' : ''}`}
                    onPointerDown={startDrag(magnetIdx, null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        edit((prev) => [...prev, magnetIdx])
                      }
                    }}
                  >
                    <code className="ch-java">
                      <JavaCode code={magnet.java} />
                    </code>
                  </button>
                </li>
              )
            })}
            {allPlaced && <li className="ch-tray-empty">All statements placed.</li>}
          </ul>
        </div>

        <div className="ch-actions">
          <button type="button" className="ghost-btn" disabled={past.length === 0} onClick={undo}>
            Undo
          </button>
          <button type="button" className="ghost-btn" disabled={placed.length === 0} onClick={() => edit(() => [])}>
            Start over
          </button>
          <button
            type="button"
            className="ch-submit"
            disabled={!allPlaced}
            title={allPlaced ? undefined : `Place all ${challenge.magnets.length} statements first`}
            onClick={onSubmit}
          >
            Check against target
          </button>
        </div>
        {!allPlaced && placed.length > 0 && (
          <p className="ch-submit-hint">Place all {challenge.magnets.length} statements to check.</p>
        )}
      </section>

      {drag?.active && (
        <div className="drag-ghost" style={{ left: drag.pointer.x, top: drag.pointer.y }}>
          <span className="chip ch-ghost-chip">
            <code>
              <JavaCode code={challenge.magnets[drag.magnetIdx].java} />
            </code>
          </span>
        </div>
      )}
    </div>
  )
}
