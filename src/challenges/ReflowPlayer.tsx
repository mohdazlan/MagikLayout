/**
 * Predict-the-Reflow. The snippet is the Playground's own deterministic
 * codegen; the student drags a ghost of one component to its predicted
 * post-resize position; submit grades against layoutTree at the end size and
 * then animates the true reflow so the student watches the answer either way.
 *
 * The frame renders at its TRUE size (titlebar dims never lie); guides, the
 * ghost, and the truth outline live in an unclipped overlay layer that may
 * legitimately overhang the window — the future edge is a fact of the stage,
 * not of the frame.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { generateJava } from '../codegen/javaCode'
import { layoutTree } from '../engine/layoutTree'
import type { Rect } from '../engine/types'
import { CodePanel } from '../components/CodePanel'
import { challengeHref } from '../router'
import { CHALLENGES } from './data'
import { CoachPanel } from './CoachPanel'
import { gradeReflow, type ReflowGrade } from './grade'
import { SwingFrame, useMeasurer } from './SwingFrame'
import type { ReflowChallenge } from './types'

/** Turn a missed reflow prediction into plain-language findings for the coach —
 *  the resize, the manager/region that governs the target, and how far off the
 *  guess was. The engine already computed all of it; the truth is already shown. */
function reflowFindings(challenge: ReflowChallenge, grade: ReflowGrade, targetVar: string): string[] {
  const kind = challenge.root.layout!.kind
  const manager = kind === 'flow' ? 'FlowLayout' : kind === 'grid' ? 'GridLayout' : 'BorderLayout'
  const region = challenge.root.children?.find((c) => c.node.id === challenge.targetId)?.constraint ?? 'CENTER'
  return [
    `The frame was resized from ${challenge.startSize.width}×${challenge.startSize.height} to ${challenge.endSize.width}×${challenge.endSize.height} pixels.`,
    `${targetVar} is laid out by the frame's ${manager}${manager === 'BorderLayout' ? ` in the ${region} region` : ''}.`,
    `The student's predicted centre was ${Math.round(grade.dx)}px off horizontally and ${Math.round(grade.dy)}px off vertically (tolerance is ±${challenge.tolerance}px on each axis).`,
  ]
}

type Phase = 'predict' | 'revealed'

/** The Swing rule the reveal just demonstrated — engine-derived, not prose for its own sake. */
function reflowLesson(challenge: ReflowChallenge): string {
  const kind = challenge.root.layout!.kind
  if (kind === 'flow') {
    return 'FlowLayout re-packs its rows at the new width — components keep their preferred size and wrap like words in a paragraph.'
  }
  if (kind === 'grid') {
    return 'GridLayout resizes every cell identically — the grid stretches, the components follow.'
  }
  const region = challenge.root.children?.find((c) => c.node.id === challenge.targetId)?.constraint ?? 'CENTER'
  switch (region) {
    case 'EAST':
    case 'WEST':
      return `BorderLayout gives ${region} its preferred width and pins it to the ${
        region === 'EAST' ? 'right' : 'left'
      } edge — CENTER absorbs all the extra width.`
    case 'NORTH':
    case 'SOUTH':
      return `BorderLayout stretches ${region} to the full frame width; it only keeps its preferred height.`
    default:
      return 'BorderLayout gives CENTER everything the edge regions don’t claim.'
  }
}

const REVEAL_MS = 560 // matches --ch-reveal-dur + a beat, so the verdict lands after the settle

export function ReflowPlayer({ challenge }: { challenge: ReflowChallenge }) {
  const measure = useMeasurer()
  const [phase, setPhase] = useState<Phase>('predict')
  const [grade, setGrade] = useState<ReflowGrade | null>(null)
  const [verdictVisible, setVerdictVisible] = useState(false)
  const [replayAt, setReplayAt] = useState<'start' | 'end'>('end')
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const { code, varNames } = useMemo(
    () => generateJava(challenge.root, challenge.startSize),
    [challenge],
  )
  const targetVar = varNames.get(challenge.targetId) ?? challenge.targetId

  const startLayout = useMemo(
    () => layoutTree(challenge.root, challenge.startSize, measure),
    [challenge, measure],
  )
  const startRect = startLayout.abs.get(challenge.targetId)!

  // Guides and the ghost may range over both the current and post-resize frame.
  const surface = {
    width: Math.max(challenge.startSize.width, challenge.endSize.width),
    height: Math.max(challenge.startSize.height, challenge.endSize.height),
  }

  const [guess, setGuess] = useState(() => ({
    x: startRect.x + startRect.width / 2,
    y: startRect.y + startRect.height / 2,
  }))

  const clampGuess = (x: number, y: number) => ({
    x: Math.min(Math.max(x, 0), surface.width),
    y: Math.min(Math.max(y, 0), surface.height),
  })

  const onGhostPointerDown = (e: React.PointerEvent) => {
    if (phase !== 'predict' || e.button !== 0) return
    e.preventDefault()
    const ghost = e.currentTarget as HTMLElement
    try {
      ghost.setPointerCapture(e.pointerId)
    } catch {
      // pointer already released (or synthetic) — move events over the ghost still track it
    }
    const surfaceBox = ghost.parentElement!.getBoundingClientRect()
    const offset = {
      x: guess.x - (e.clientX - surfaceBox.left),
      y: guess.y - (e.clientY - surfaceBox.top),
    }
    const onMove = (ev: PointerEvent) => {
      setGuess(clampGuess(ev.clientX - surfaceBox.left + offset.x, ev.clientY - surfaceBox.top + offset.y))
    }
    const onUp = () => {
      ghost.removeEventListener('pointermove', onMove)
      ghost.removeEventListener('pointerup', onUp)
      ghost.removeEventListener('pointercancel', onUp)
    }
    ghost.addEventListener('pointermove', onMove)
    ghost.addEventListener('pointerup', onUp)
    ghost.addEventListener('pointercancel', onUp)
  }

  const onGhostKeyDown = (e: React.KeyboardEvent) => {
    if (phase !== 'predict') return
    const step = e.shiftKey ? 1 : 8
    let dx = 0
    let dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else return
    e.preventDefault()
    setGuess((g) => clampGuess(g.x + dx, g.y + dy))
  }

  const onSubmit = () => {
    ghostRef.current?.blur()
    setGrade(gradeReflow(challenge, guess, measure))
    setPhase('revealed')
    setVerdictVisible(false)
    // Stage the drama: resize → settle → truth outline + verdict.
    timers.current.push(window.setTimeout(() => setVerdictVisible(true), REVEAL_MS))
  }

  const onReplay = () => {
    setReplayAt('start')
    timers.current.push(window.setTimeout(() => setReplayAt('end'), REVEAL_MS + 80))
  }

  // Adjust-and-retry keeps the guess where the student left it.
  const onAdjust = () => {
    setPhase('predict')
    setGrade(null)
    setVerdictVisible(false)
    setReplayAt('end')
  }

  const renderSize =
    phase === 'revealed' ? (replayAt === 'start' ? challenge.startSize : challenge.endSize) : challenge.startSize

  const ghostRect: Rect = {
    x: guess.x - startRect.width / 2,
    y: guess.y - startRect.height / 2,
    width: startRect.width,
    height: startRect.height,
  }
  const targetNode = challenge.root.children?.find((c) => c.node.id === challenge.targetId)?.node
  const showGhost = phase === 'predict' || !grade?.pass // on a pass, truth + real component tell the story alone
  const showMarks = phase === 'revealed' && grade !== null && verdictVisible

  const chIndex = CHALLENGES.findIndex((c) => c.id === challenge.id)
  const nextChallenge = chIndex >= 0 ? CHALLENGES[chIndex + 1] : undefined

  const overX = grade ? grade.dx > challenge.tolerance : false
  const overY = grade ? grade.dy > challenge.tolerance : false

  return (
    <div className="ch-player ch-reflow">
      <section className="ch-stage" aria-label="Challenge canvas">
        <p className="ch-prompt">{challenge.prompt}</p>
        <p className="ch-kbd-hint">
          Drag the ghost — or arrow keys, Shift for 1px. Graded on its center point: within ±
          {challenge.tolerance}px counts.
        </p>
        <div className="ch-canvases">
          <div className="ch-frame-wrap" style={{ minWidth: surface.width + 2, minHeight: surface.height + 32 }}>
            <SwingFrame
              root={challenge.root}
              size={renderSize}
              title="LayoutLab"
              measure={measure}
              className="ch-reflow-frame"
            />
            <div className="ch-frame-overlay" style={{ width: surface.width, height: surface.height }}>
              {phase === 'predict' && (
                <>
                  <div
                    className="ch-resize-zone"
                    style={{
                      left: Math.min(challenge.startSize.width, challenge.endSize.width),
                      width: Math.abs(challenge.endSize.width - challenge.startSize.width),
                      height: surface.height,
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="ch-resize-guide"
                    style={{ left: challenge.endSize.width, height: surface.height }}
                    aria-hidden="true"
                  />
                  <span className="ch-resize-guide-label" style={{ left: challenge.endSize.width }}>
                    edge after resize · {challenge.endSize.width}px
                  </span>
                </>
              )}
              {showMarks && grade && (
                <div
                  className="ch-truth"
                  style={{
                    transform: `translate(${grade.truth.x}px, ${grade.truth.y}px)`,
                    width: grade.truth.width,
                    height: grade.truth.height,
                  }}
                >
                  <span className="ch-truth-label">engine says here</span>
                </div>
              )}
              {showGhost && (
                <div
                  ref={ghostRef}
                  className={`ch-ghost${phase === 'revealed' ? ' ch-ghost-locked' : ''}`}
                  style={{
                    transform: `translate(${ghostRect.x}px, ${ghostRect.y}px)`,
                    width: ghostRect.width,
                    height: ghostRect.height,
                  }}
                  role="slider"
                  aria-label={`Predicted position of ${targetVar} — arrow keys to move, Shift for 1px`}
                  aria-valuemin={0}
                  aria-valuemax={surface.width}
                  aria-valuenow={Math.round(guess.x)}
                  aria-valuetext={`center ${Math.round(guess.x)}, ${Math.round(guess.y)}`}
                  tabIndex={phase === 'predict' ? 0 : -1}
                  onPointerDown={onGhostPointerDown}
                  onKeyDown={onGhostKeyDown}
                >
                  <div className={`sw sw-${targetNode?.type ?? 'JButton'} ch-ghost-body`}>{targetNode?.text}</div>
                  <span className="ch-ghost-tag">{phase === 'revealed' ? 'your guess' : `ghost of ${targetVar}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {grade && verdictVisible && (
          <div className={`ch-verdict ${grade.pass ? 'ch-verdict-pass' : 'ch-verdict-fail'}`} role="alert">
            {grade.pass ? (
              <>
                Within ±{challenge.tolerance}px — you predicted the reflow. {reflowLesson(challenge)}
                {nextChallenge && (
                  <a className="ch-next-link" href={challengeHref(nextChallenge.id)}>
                    Next challenge: {nextChallenge.title} →
                  </a>
                )}
              </>
            ) : (
              <>
                Your guess was {Math.round(grade.dx)}px off horizontally and {Math.round(grade.dy)}px
                vertically —{' '}
                {overX && overY
                  ? 'both axes exceed'
                  : overX
                    ? 'the horizontal axis exceeds'
                    : 'the vertical axis exceeds'}{' '}
                the ±{challenge.tolerance}px tolerance. {reflowLesson(challenge)}
                <CoachPanel
                  key={`${Math.round(grade.dx)}:${Math.round(grade.dy)}`}
                  mode="reflow"
                  challengeTitle={challenge.title}
                  prompt={challenge.prompt}
                  findings={reflowFindings(challenge, grade, targetVar)}
                  studentCode={code}
                />
              </>
            )}
          </div>
        )}
        <div className="ch-actions ch-actions-stage">
          {phase === 'predict' ? (
            <button type="button" className="ch-submit" onClick={onSubmit}>
              Lock in my prediction
            </button>
          ) : (
            <>
              <button type="button" className="ghost-btn" onClick={onReplay}>
                Replay reflow
              </button>
              <button type="button" className="ghost-btn" onClick={onAdjust}>
                Adjust my guess
              </button>
            </>
          )}
        </div>
      </section>
      <div className="ch-code-wrap">
        <CodePanel code={code} selectedVar={targetVar} />
      </div>
    </div>
  )
}
