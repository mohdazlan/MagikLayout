/**
 * AI Debugging Studio - the Swing state is the primary interface and the
 * grounded coach reacts to engine truth. The model never owns correctness.
 */
import { useMemo, useState } from 'react'
import { SwingFrame, useMeasurer } from '../challenges/SwingFrame'
import { chunkById, type CorpusLanguage } from '../coach/corpus'
import type { LadderState } from '../coach/hintPolicy'
import { runCoach, type CoachRunResult } from '../coach/pipeline'
import { SCENARIOS } from './scenarios'
import { ragComposer, ragComposerConfigured } from './ragComposer'
import { coachLog } from './store'
import {
  PREDICTIONS,
  isCorrectPrediction,
  javaLinesForStage,
  nextRepairStage,
  repairPasses,
  southInspector,
  studioProgress,
  treeForStage,
  type PredictionId,
  type RepairStage,
} from './debugStudio'

const SOURCE_LABEL: Record<string, string> = {
  model: 'Model composed · guard passed',
  corpus: 'Approved text served directly',
  'engine-only': 'Engine findings only',
}

const OUTCOME_NOTE: Record<string, string> = {
  'served-model': 'Haiku composed this hint from the retrieved passages. The guard approved it.',
  'served-corpus': 'Reviewed corpus text answered directly. No model was needed.',
  'fallback-guard': 'The guard rejected the model response and substituted reviewed corpus text.',
  'fallback-error': 'The model call failed and reviewed corpus text was substituted.',
  withheld: 'Try an action in the workspace before asking for a stronger hint.',
}

type Focus = 'conflict' | 'order' | 'code' | null

export function CoachLabPanel(props: { sessionId: string; learnerLabel: string; aiEnabled: boolean }) {
  const scenario = SCENARIOS[0]
  const measure = useMeasurer()
  const [language, setLanguage] = useState<CorpusLanguage>('en-MY')
  const [stage, setStage] = useState<RepairStage>('broken')
  const [prediction, setPrediction] = useState<PredictionId | null>(null)
  const [ladder, setLadder] = useState<LadderState>({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
  const [history, setHistory] = useState<CoachRunResult[]>([])
  const [busy, setBusy] = useState(false)
  const [focus, setFocus] = useState<Focus>('conflict')
  const [replayKey, setReplayKey] = useState(0)
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  const composer = props.aiEnabled ? ragComposer() : undefined
  const configured = props.aiEnabled && ragComposerConfigured()
  const root = useMemo(() => treeForStage(stage), [stage])
  const inspector = southInspector(stage)
  const latest = history.at(-1)

  const recordAttempt = () => setLadder((current) => ({ ...current, attempts: current.attempts + 1 }))

  const reset = () => {
    setStage('broken')
    setPrediction(null)
    setLadder({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
    setHistory([])
    setFocus('conflict')
    setReplayKey((key) => key + 1)
    setEvidenceOpen(false)
  }

  const choosePrediction = (id: PredictionId) => {
    setPrediction(id)
    recordAttempt()
    setFocus(isCorrectPrediction(id) ? 'conflict' : 'order')
  }

  const advanceRepair = () => {
    const next = nextRepairStage(stage)
    if (next === stage) return
    setStage(next)
    recordAttempt()
    setFocus(next === 'repaired' ? 'code' : 'conflict')
    if (repairPasses(next)) {
      coachLog().recordOutcome(scenario.id, true)
      setLadder((current) => ({ ...current, solved: true }))
    }
  }

  const ask = async () => {
    setBusy(true)
    const result = await runCoach({
      diagnosis: scenario.diagnosis,
      language,
      ladder,
      challengeId: scenario.id,
      challengeTitle: scenario.challengeTitle,
      sessionId: props.sessionId,
      learnerLabel: props.learnerLabel,
      compose: composer,
    })
    coachLog().append(result.log)
    setHistory((current) => [...current, result])
    if (result.status === 'served') setLadder((current) => ({ ...current, hintsServed: current.hintsServed + 1 }))
    setBusy(false)
  }

  const replay = () => {
    setReplayKey((key) => key + 1)
    setFocus('order')
  }

  return (
    <section className="ds-studio" aria-label="AI Debugging Studio">
      <header className="ds-mission-bar">
        <div>
          <p className="ds-eyebrow">Mission 1 · BorderLayout</p>
          <h3 className="ds-title">Find the missing button</h3>
          <p className="ds-mission-copy">Keep Save and Cancel visible in SOUTH, then explain why your repair works.</p>
        </div>
        <div className="ds-mission-tools">
          <div className="ds-progress" aria-label={`Mission step ${studioProgress(stage)} of 3`}>
            {[1, 2, 3].map((step) => <span key={step} className={step <= studioProgress(stage) ? 'is-done' : ''} />)}
            <strong>{studioProgress(stage)}/3</strong>
          </div>
          <span className="cl-toggle" role="group" aria-label="Hint language">
            <button type="button" className={`cl-toggle-btn${language === 'en-MY' ? ' is-on' : ''}`} aria-pressed={language === 'en-MY'} onClick={() => setLanguage('en-MY')}>EN</button>
            <button type="button" className={`cl-toggle-btn${language === 'ms-MY' ? ' is-on' : ''}`} aria-pressed={language === 'ms-MY'} onClick={() => setLanguage('ms-MY')}>BM</button>
          </span>
          <button type="button" className="cl-btn cl-btn-quiet" onClick={reset}>Reset</button>
        </div>
      </header>

      <div className="ds-workspace">
        <aside className="ds-toolbox" aria-label="Repair toolbox">
          <p className="ds-panel-label">Repair toolbox</p>
          <button type="button" className={`ds-component-card${stage !== 'broken' ? ' is-used' : ''}`} onClick={advanceRepair} disabled={stage !== 'broken'}>
            <span className="ds-component-icon" aria-hidden="true"><span /><span /></span>
            <span><strong>JPanel</strong><small>A container with its own layout</small></span>
          </button>

          <div className="ds-build-steps">
            <p className="ds-panel-label">Build the repair</p>
            <ol>
              <li className={stage !== 'broken' ? 'is-complete' : 'is-current'}><span>1</span><div><strong>Place a JPanel</strong><small>Give SOUTH one direct container.</small></div></li>
              <li className={stage === 'repaired' ? 'is-complete' : stage === 'panel-ready' ? 'is-current' : ''}><span>2</span><div><strong>Group the buttons</strong><small>Let FlowLayout arrange both children.</small></div></li>
            </ol>
          </div>

          {stage === 'panel-ready' && <button type="button" className="cl-btn cl-btn-primary ds-group-btn" onClick={advanceRepair}>Move Save + Cancel into the panel</button>}
          {stage === 'repaired' && <div className="ds-success" role="status"><span aria-hidden="true">✓</span><div><strong>Repair verified</strong><small>The engine found one direct component in SOUTH.</small></div></div>}
        </aside>

        <main className="ds-stage">
          <div className="ds-stage-head"><div><span className="ds-live-dot" /> Live Swing state</div><span>420 × 250</span></div>
          <div className={`ds-frame-wrap ds-focus-${focus ?? 'none'}`} key={replayKey}>
            <SwingFrame
              root={root}
              size={{ width: 420, height: 250 }}
              title="Button row"
              measure={measure}
              overlays={<>
                <span className="ds-south-outline" aria-hidden="true"><em>SOUTH</em></span>
                {stage === 'broken' && <span className="ds-ghost-button" aria-hidden="true">Save <em>hidden</em></span>}
                {stage === 'broken' && <span className="ds-add-trace ds-add-trace-save" aria-hidden="true">1 · Save</span>}
                {stage === 'broken' && <span className="ds-add-trace ds-add-trace-cancel" aria-hidden="true">2 · Cancel</span>}
                {stage === 'panel-ready' && <span className="ds-empty-panel" aria-hidden="true">Drop both buttons into this JPanel</span>}
              </>}
            />
          </div>

          <section className="ds-prediction" aria-label="Prediction">
            <div className="ds-section-heading"><span>Predict before the hint</span><small>Why is Save invisible?</small></div>
            <div className="ds-prediction-options">
              {PREDICTIONS.map((option) => {
                const chosen = prediction === option.id
                return <button key={option.id} type="button" className={`ds-prediction-option${chosen ? option.correct ? ' is-correct' : ' is-wrong' : ''}`} aria-pressed={chosen} onClick={() => choosePrediction(option.id)} disabled={stage === 'repaired'}>
                  {option.label}{chosen && <span>{option.correct ? 'Engine agrees' : 'Test another idea'}</span>}
                </button>
              })}
            </div>
          </section>

          <section className={`ds-inspector${focus === 'conflict' ? ' is-focused' : ''}`} aria-label="SOUTH region inspector">
            <div className="ds-inspector-title"><span>SOUTH inspector</span><code>BL-SOUTH-COLLISION</code></div>
            <dl>
              <div><dt>Direct occupants</dt><dd>{inspector.direct}</dd></div>
              <div><dt>Visible occupant</dt><dd>{inspector.visible}</dd></div>
              <div><dt>Rule</dt><dd>One direct component per BorderLayout region</dd></div>
            </dl>
            <p>{inspector.explanation}</p>
          </section>
        </main>

        <aside className="ds-coach" aria-label="AI layout coach">
          <header className="ds-coach-head">
            <div className="ds-coach-mark" aria-hidden="true">AI</div>
            <div><strong>Layout Coach</strong><span>{configured ? 'Claude Haiku · grounded' : props.aiEnabled ? 'Backend unavailable · safe fallback' : 'Approved corpus · AI off'}</span></div>
            <span className={`ds-status-dot${configured ? ' is-online' : ''}`} title={configured ? 'coach-rag configured' : 'deterministic mode'} />
          </header>
          <div className="ds-context-strip"><span>Active context</span><code>SOUTH · {inspector.direct} {inspector.direct === 1 ? 'occupant' : 'occupants'}</code></div>
          <div className="ds-coach-body">
            {latest ? <CoachTurn result={latest} /> : <div className="ds-coach-welcome"><p className="ds-coach-kicker">I can see the same state you see.</p><p>Save and Cancel were both sent directly to SOUTH. Make a prediction, or ask for one small hint.</p></div>}
            <div className="ds-quick-actions" aria-label="Visual coach actions">
              <button type="button" onClick={() => setFocus('conflict')}>Highlight SOUTH</button>
              <button type="button" onClick={replay}>Replay add order</button>
              <button type="button" onClick={() => setFocus('code')}>Explain the Java lines</button>
            </div>
          </div>
          <div className="ds-coach-ask">
            <button type="button" className="cl-btn cl-btn-primary" onClick={ask} disabled={busy}>{busy ? 'Retrieving approved guidance…' : stage === 'repaired' ? 'Explain why this works' : 'Ask for one hint'}</button>
            <span>attempts {ladder.attempts} · hints {ladder.hintsServed}</span>
          </div>
          <details className="ds-evidence" open={evidenceOpen} onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}>
            <summary>AI evidence and safety checks <span>{history.length}</span></summary>
            <div className="ds-evidence-body">
              <p><strong>Authority</strong>The deterministic engine diagnosed the collision before any model call.</p>
              {history.length === 0 ? <p>No hint request yet. Evidence will appear here after retrieval.</p> : history.map((result, index) => <EvidenceTurn key={index} result={result} index={index} />)}
            </div>
          </details>
        </aside>
      </div>

      <section className={`ds-code-deck${focus === 'code' ? ' is-focused' : ''}`} aria-label="Java and structure evidence">
        <div className="ds-code-head"><div><span className="ds-code-dot red" /><span className="ds-code-dot amber" /><span className="ds-code-dot green" /></div><strong>LayoutDemo.java</strong><span>Generated from the live structure</span></div>
        <div className="ds-code-grid">
          <div className="ds-code-lines">{javaLinesForStage(stage).map((line, index) => <code key={line.text} className={line.tone ? `is-${line.tone}` : ''}><span>{index + 10}</span>{line.text}</code>)}</div>
          <div className="ds-structure-tree">
            <p className="ds-panel-label">Component tree</p>
            {stage === 'repaired' ? <pre>JFrame (BorderLayout){'\n'}└─ SOUTH: JPanel (FlowLayout){'\n'}   ├─ Save{'\n'}   └─ Cancel</pre> : stage === 'panel-ready' ? <pre>JFrame (BorderLayout){'\n'}└─ SOUTH: JPanel (FlowLayout){'\n'}   └─ empty</pre> : <pre>JFrame (BorderLayout){'\n'}├─ SOUTH: Save  ← hidden{'\n'}└─ SOUTH: Cancel ← visible</pre>}
          </div>
        </div>
      </section>
    </section>
  )
}

function CoachTurn({ result }: { result: CoachRunResult }) {
  if (result.status === 'withheld') return <div className="ds-hint-card is-withheld"><span>Next rung held back</span><p>{result.reason}</p></div>
  return <div className="ds-hint-card">
    <div className="ds-hint-meta"><span>Level {result.hint.level}</span><strong>{SOURCE_LABEL[result.hint.source]}</strong></div>
    <p className="ds-hint-text" lang={result.log.language === 'ms-MY' ? 'ms' : 'en'}>{result.hint.text}</p>
    <p className="ds-hint-note">{OUTCOME_NOTE[result.log.outcome]}</p>
  </div>
}

function EvidenceTurn({ result, index }: { result: CoachRunResult; index: number }) {
  return <section className="ds-evidence-turn">
    <div><strong>Request {index + 1}</strong><span>{result.log.latencyMs} ms</span></div>
    <Sources label="Retrieved" ids={result.log.retrievedChunkIds} />
    <Sources label="Cited" ids={result.log.citedChunkIds} />
    <p className={result.log.guardViolations.length ? 'is-alert' : 'is-pass'}>{result.log.guardViolations.length ? `Guard caught: ${result.log.guardViolations.join(', ')}` : 'Guard checks passed or approved fallback served.'}</p>
  </section>
}

function Sources({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null
  return <div className="ds-sources"><span>{label}</span>{ids.map((id) => {
    const chunk = chunkById(id)
    return <code key={id} title={chunk ? `${chunk.concept} · level ${chunk.hintLevel} · ${chunk.version} · reviewed by ${chunk.reviewer}` : 'not in corpus'}>{id}</code>
  })}</div>
}
