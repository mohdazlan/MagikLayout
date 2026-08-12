/**
 * Coach Lab — the retrieval story, made watchable.
 *
 * A teacher (or a judge) picks a real misconception and walks the hint ladder
 * one rung at a time, seeing at every step: what the engine found, which
 * approved sources retrieval selected, which of them the served hint cites, and
 * whether a model was involved or the deterministic path answered.
 *
 * It is not a mock. The buttons drive src/coach/pipeline.ts — the same
 * retrieval, the same ladder, the same guard, the same log a student's request
 * would produce. In particular the ladder really does refuse to escalate until
 * "Learner attempts again" is pressed, because that refusal is the pedagogy and
 * hiding it in a demo would misrepresent the product.
 */
import { useState } from 'react'
import { chunkById, type CorpusLanguage } from '../coach/corpus'
import type { LadderState } from '../coach/hintPolicy'
import { runCoach, type CoachRunResult } from '../coach/pipeline'
import { SCENARIOS } from './scenarios'
import { ragComposer, ragComposerConfigured } from './ragComposer'
import { coachLog } from './store'

const SOURCE_LABEL: Record<string, string> = {
  model: 'Model composed · guard passed',
  corpus: 'Approved text served directly',
  'engine-only': 'Engine findings only',
}

const OUTCOME_NOTE: Record<string, string> = {
  'served-model': 'A model composed this hint from the retrieved passages and it passed every guard.',
  'served-corpus': 'Served straight from the approved corpus — no model in the loop.',
  'fallback-guard': 'A model answered but the guard rejected it. The approved text below was substituted.',
  'fallback-error': 'The model call failed. The approved text below was substituted.',
  withheld: 'The ladder declined. The learner has to try again before the next rung unlocks.',
}

export function CoachLabPanel(props: { sessionId: string; learnerLabel: string; aiEnabled: boolean }) {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [language, setLanguage] = useState<CorpusLanguage>('en-MY')
  const [ladder, setLadder] = useState<LadderState>({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
  const [history, setHistory] = useState<CoachRunResult[]>([])
  const [busy, setBusy] = useState(false)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!
  const composer = props.aiEnabled ? ragComposer() : undefined

  const reset = (nextScenarioId = scenarioId) => {
    setScenarioId(nextScenarioId)
    setLadder({ attempts: 1, hintsServed: 0, solved: false, teacherUnlocked: false })
    setHistory([])
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
    setHistory((prev) => [...prev, result])
    if (result.status === 'served') setLadder((prev) => ({ ...prev, hintsServed: prev.hintsServed + 1 }))
    setBusy(false)
  }

  const attemptAgain = () => setLadder((prev) => ({ ...prev, attempts: prev.attempts + 1 }))

  const markRepaired = () => {
    coachLog().recordOutcome(scenario.id, true)
    setLadder((prev) => ({ ...prev, solved: true }))
  }

  return (
    <div className="cl-lab">
      <div className="cl-controls">
        <label className="cl-field">
          <span className="cl-field-label">Misconception</span>
          <select className="cl-select" value={scenarioId} onChange={(e) => reset(e.target.value)}>
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        <span className="cl-field">
          <span className="cl-field-label">Hint language</span>
          <span className="cl-toggle" role="group" aria-label="Hint language">
            <button
              type="button"
              className={`cl-toggle-btn${language === 'en-MY' ? ' is-on' : ''}`}
              aria-pressed={language === 'en-MY'}
              onClick={() => setLanguage('en-MY')}
            >
              EN
            </button>
            <button
              type="button"
              className={`cl-toggle-btn${language === 'ms-MY' ? ' is-on' : ''}`}
              aria-pressed={language === 'ms-MY'}
              onClick={() => setLanguage('ms-MY')}
            >
              BM
            </button>
          </span>
        </span>

        <span className="cl-field">
          <span className="cl-field-label">Composer</span>
          <span className="cl-badge">
            {props.aiEnabled ? (ragComposerConfigured() ? 'AI on · coach-rag' : 'AI on · no backend configured') : 'AI off · deterministic'}
          </span>
        </span>
      </div>

      <section className="cl-evidence" aria-label="What the engine found">
        <p className="cl-situation">{scenario.situation}</p>
        <p className="cl-code-line">
          <span className="cl-code-chip">{scenario.diagnosis.code}</span>
          <span className="cl-code-note">
            diagnosed deterministically from the {scenario.mode} grader — the model never sees this decision being made
          </span>
        </p>
        <ul className="cl-findings">
          {scenario.diagnosis.evidence.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </section>

      <div className="cl-actions">
        <button type="button" className="cl-btn cl-btn-primary" onClick={ask} disabled={busy}>
          {busy ? 'Working…' : 'Ask for a hint'}
        </button>
        <button type="button" className="cl-btn" onClick={attemptAgain}>
          Learner attempts again
        </button>
        <button type="button" className="cl-btn" onClick={markRepaired} disabled={ladder.solved}>
          Mark repair successful
        </button>
        <button type="button" className="cl-btn cl-btn-quiet" onClick={() => reset()}>
          Reset
        </button>
        <span className="cl-ladder-state">
          attempts {ladder.attempts} · hints {ladder.hintsServed}
          {ladder.solved ? ' · repaired' : ''}
        </span>
      </div>

      {history.length === 0 ? (
        <p className="cl-empty">
          Ask for a hint to see the ladder run. The first request returns a nudge; the next rung only unlocks after the
          learner attempts again.
        </p>
      ) : (
        <ol className="cl-history">
          {history.map((result, index) => (
            <li key={index} className="cl-turn">
              {result.status === 'withheld' ? (
                <>
                  <p className="cl-turn-head">
                    <span className="cl-level cl-level-withheld">withheld</span>
                    <span className="cl-turn-note">{OUTCOME_NOTE.withheld}</span>
                  </p>
                  <p className="cl-hint cl-hint-withheld">{result.reason}</p>
                </>
              ) : (
                <>
                  <p className="cl-turn-head">
                    <span className="cl-level">Level {result.hint.level}</span>
                    <span className="cl-source">{SOURCE_LABEL[result.hint.source]}</span>
                    <span className="cl-latency">{result.log.latencyMs} ms</span>
                  </p>
                  <p className="cl-hint" lang={result.log.language === 'ms-MY' ? 'ms' : 'en'}>
                    {result.hint.text}
                  </p>
                  <p className="cl-turn-note">{OUTCOME_NOTE[result.log.outcome]}</p>
                  <Sources label="Retrieved" ids={result.log.retrievedChunkIds} />
                  <Sources label="Cited" ids={result.log.citedChunkIds} />
                  {result.log.guardViolations.length > 0 && (
                    <p className="cl-violations">
                      Guard caught: {result.log.guardViolations.join(', ')}
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Citation ids with their source metadata — the "prove it" affordance. */
function Sources({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null
  return (
    <p className="cl-sources">
      <span className="cl-sources-label">{label}</span>
      {ids.map((id) => {
        const chunk = chunkById(id)
        return (
          <span key={id} className="cl-source-chip" title={chunk ? `${chunk.concept} · level ${chunk.hintLevel} · ${chunk.version} · reviewed by ${chunk.reviewer}` : 'not in the corpus'}>
            {id}
          </span>
        )
      })}
    </p>
  )
}
