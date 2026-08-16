/**
 * AI Debugging Studio - the Swing state is the primary interface and the
 * grounded coach reacts to engine truth. The model never owns correctness.
 */
import { useMemo, useState } from 'react'
import { SwingFrame, useMeasurer } from '../challenges/SwingFrame'
import { chunkById, type CorpusLanguage } from '../coach/corpus'
import type { LadderState } from '../coach/hintPolicy'
import { runCoach, type CoachRunResult } from '../coach/pipeline'
import { ragComposer, ragComposerConfigured } from './ragComposer'
import { coachLog } from './store'
import {
  STUDIO_MISSIONS,
  isCorrectPrediction,
  missionById,
  nextRepairStage,
  repairPasses,
  studioProgress,
  treeForStage,
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
  const measure = useMeasurer()
  const [missionId, setMissionId] = useState(STUDIO_MISSIONS[0].id)
  const mission = missionById(missionId)
  const [language, setLanguage] = useState<CorpusLanguage>('en-MY')
  const [stage, setStage] = useState<RepairStage>('broken')
  const [prediction, setPrediction] = useState<string | null>(null)
  const [ladder, setLadder] = useState<LadderState>({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
  const [history, setHistory] = useState<CoachRunResult[]>([])
  const [busy, setBusy] = useState(false)
  const [focus, setFocus] = useState<Focus>('conflict')
  const [replayKey, setReplayKey] = useState(0)
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  const composer = props.aiEnabled ? ragComposer() : undefined
  const configured = props.aiEnabled && ragComposerConfigured()
  const root = useMemo(() => treeForStage(mission, stage), [mission, stage])
  const inspector = mission.inspector[stage]
  const latest = history.at(-1)

  const recordAttempt = () => setLadder((current) => ({ ...current, attempts: current.attempts + 1 }))

  const reset = (nextMissionId = missionId) => {
    setMissionId(nextMissionId)
    setStage('broken')
    setPrediction(null)
    setLadder({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
    setHistory([])
    setFocus('conflict')
    setReplayKey((key) => key + 1)
    setEvidenceOpen(false)
  }

  const choosePrediction = (id: string) => {
    setPrediction(id)
    recordAttempt()
    setFocus(isCorrectPrediction(mission, id) ? 'conflict' : 'order')
  }

  const advanceRepair = () => {
    const next = nextRepairStage(stage)
    if (next === stage) return
    setStage(next)
    recordAttempt()
    setFocus(next === 'repaired' ? 'code' : 'conflict')
    if (repairPasses(mission, next)) {
      coachLog().recordOutcome(mission.id, true)
      setLadder((current) => ({ ...current, solved: true }))
    }
  }

  const ask = async () => {
    setBusy(true)
    const result = await runCoach({
      diagnosis: mission.diagnosis,
      language,
      ladder,
      challengeId: mission.id,
      challengeTitle: mission.title,
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
          <p className="ds-eyebrow">Mission {STUDIO_MISSIONS.findIndex((item) => item.id === mission.id) + 1} · {mission.manager} · {mission.difficulty}</p>
          <h3 className="ds-title">{mission.title}</h3>
          <p className="ds-mission-copy">{mission.goal}</p>
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
          <button type="button" className="cl-btn cl-btn-quiet" onClick={() => reset()}>Reset</button>
        </div>
      </header>

      <nav className="ds-mission-catalogue" aria-label="Debugging missions">
        {STUDIO_MISSIONS.map((item, index) => (
          <button key={item.id} type="button" className={item.id === mission.id ? 'is-current' : ''} aria-current={item.id === mission.id ? 'page' : undefined} onClick={() => reset(item.id)}>
            <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><small>{item.manager}</small>
          </button>
        ))}
      </nav>

      <div className="ds-workspace">
        <aside className="ds-toolbox" aria-label="Repair toolbox">
          <p className="ds-panel-label">Repair toolbox</p>
          <button type="button" className={`ds-component-card${stage !== 'broken' ? ' is-used' : ''}`} onClick={advanceRepair} disabled={stage !== 'broken'}>
            <span className="ds-component-icon" aria-hidden="true"><span /><span /></span>
            <span><strong>{mission.tool.name}</strong><small>{mission.tool.detail}</small></span>
          </button>

          <div className="ds-build-steps">
            <p className="ds-panel-label">Build the repair</p>
            <ol>
              <li className={stage !== 'broken' ? 'is-complete' : 'is-current'}><span>1</span><div><strong>{mission.steps[0].title}</strong><small>{mission.steps[0].detail}</small></div></li>
              <li className={stage === 'repaired' ? 'is-complete' : stage === 'tool-ready' ? 'is-current' : ''}><span>2</span><div><strong>{mission.steps[1].title}</strong><small>{mission.steps[1].detail}</small></div></li>
            </ol>
          </div>

          {stage === 'tool-ready' && <button type="button" className="cl-btn cl-btn-primary ds-group-btn" onClick={advanceRepair}>{mission.steps[1].title}</button>}
          {stage === 'repaired' && <div className="ds-success" role="status"><span aria-hidden="true">✓</span><div><strong>Repair verified</strong><small>The deterministic grader matched the target structure.</small></div></div>}
        </aside>

        <main className="ds-stage">
          <div className="ds-stage-head"><div><span className="ds-live-dot" /> Live Swing state</div><span>420 × 250</span></div>
          <div className={`ds-frame-wrap ds-focus-${focus ?? 'none'}`} key={replayKey}>
            <SwingFrame
              root={root}
              size={{ width: 420, height: 250 }}
              title={mission.title}
              measure={measure}
              overlays={<>
                <span className={`ds-south-outline${mission.ghostLabel ? '' : ' ds-workspace-outline'}`} aria-hidden="true"><em>{mission.regionLabel}</em></span>
                {stage === 'broken' && mission.ghostLabel && <span className="ds-ghost-button" aria-hidden="true">{mission.ghostLabel} <em>hidden</em></span>}
                {stage === 'broken' && mission.ghostLabel && <span className="ds-add-trace ds-add-trace-save" aria-hidden="true">1 · first</span>}
                {stage === 'broken' && mission.ghostLabel && <span className="ds-add-trace ds-add-trace-cancel" aria-hidden="true">2 · last</span>}
                {stage === 'tool-ready' && mission.tool.name === 'JPanel' && <span className="ds-empty-panel" aria-hidden="true">The container is ready for its children</span>}
              </>}
            />
          </div>

          <section className="ds-prediction" aria-label="Prediction">
            <div className="ds-section-heading"><span>Predict before the hint</span><small>What caused this result?</small></div>
            <div className="ds-prediction-options">
              {mission.predictions.map((option) => {
                const chosen = prediction === option.id
                return <button key={option.id} type="button" className={`ds-prediction-option${chosen ? option.correct ? ' is-correct' : ' is-wrong' : ''}`} aria-pressed={chosen} onClick={() => choosePrediction(option.id)} disabled={stage === 'repaired'}>
                  {option.label}{chosen && <span>{option.correct ? 'Engine agrees' : 'Test another idea'}</span>}
                </button>
              })}
            </div>
          </section>

          <section className={`ds-inspector${focus === 'conflict' ? ' is-focused' : ''}`} aria-label="SOUTH region inspector">
            <div className="ds-inspector-title"><span>{mission.regionLabel} inspector</span><code>{mission.diagnosis.code}</code></div>
            <dl>
              <div><dt>Direct occupants</dt><dd>{inspector.direct}</dd></div>
              <div><dt>Visible occupant</dt><dd>{inspector.visible}</dd></div>
              <div><dt>Rule</dt><dd>{inspector.rule}</dd></div>
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
          <div className="ds-context-strip"><span>Active context</span><code>{mission.diagnosis.code} · {inspector.direct} nodes</code></div>
          <div className="ds-coach-body">
            {latest ? <CoachTurn result={latest} /> : <div className="ds-coach-welcome"><p className="ds-coach-kicker">I can see the same state you see.</p><p>{mission.situation} Make a prediction, or ask for one small hint.</p></div>}
            <div className="ds-quick-actions" aria-label="Visual coach actions">
              <button type="button" onClick={() => setFocus('conflict')}>Highlight {mission.regionLabel}</button>
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
              <p><strong>Authority</strong>The deterministic engine diagnosed this misconception before any model call.</p>
              {history.length === 0 ? <p>No hint request yet. Evidence will appear here after retrieval.</p> : history.map((result, index) => <EvidenceTurn key={index} result={result} index={index} />)}
            </div>
          </details>
        </aside>
      </div>

      <section className={`ds-code-deck${focus === 'code' ? ' is-focused' : ''}`} aria-label="Java and structure evidence">
        <div className="ds-code-head"><div><span className="ds-code-dot red" /><span className="ds-code-dot amber" /><span className="ds-code-dot green" /></div><strong>LayoutDemo.java</strong><span>Generated from the live structure</span></div>
        <div className="ds-code-grid">
          <div className="ds-code-lines">{mission.java[stage].map((line, index) => <code key={`${index}-${line.text}`} className={line.tone ? `is-${line.tone}` : ''}><span>{index + 10}</span>{line.text}</code>)}</div>
          <div className="ds-structure-tree">
            <p className="ds-panel-label">Component tree</p>
            <pre>{mission.structure[stage]}</pre>
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
