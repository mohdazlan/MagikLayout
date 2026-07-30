/**
 * Shared AI-coach panel for every challenge mode. Given the engine's findings
 * (already computed, already the verdict) it offers an opt-in, bilingual Socratic
 * hint. It owns its own request state; mount it only when there is a failed
 * verdict to explain, and give it a `key` that changes per check so a new attempt
 * starts fresh. The coach never grades and never returns the answer — see coach.ts.
 */
import { useState } from 'react'
import { askCoach, buildCoachRequest, type CoachLanguage, type CoachMode, type CoachResult } from './coach'

export function CoachPanel(props: {
  mode: CoachMode
  challengeTitle: string
  prompt: string
  findings: string[]
  /** Java tied to the attempt: the build/program, or the reflow snippet. */
  studentCode: string
}) {
  const [coach, setCoach] = useState<CoachResult | 'loading' | null>(null)
  const [lang, setLang] = useState<CoachLanguage>('en')

  const onAsk = async () => {
    setCoach('loading')
    const result = await askCoach(
      buildCoachRequest({
        mode: props.mode,
        challengeTitle: props.challengeTitle,
        prompt: props.prompt,
        findings: props.findings,
        studentCode: props.studentCode,
        language: lang,
      }),
    )
    setCoach(result)
  }

  return (
    <div className="ch-coach">
      <div className="ch-coach-bar">
        <button type="button" className="ch-coach-ask" onClick={onAsk} disabled={coach === 'loading'}>
          {coach === 'loading' ? 'Coach is thinking…' : 'Ask the AI coach for a hint'}
        </button>
        <span className="ch-coach-lang" role="group" aria-label="Coach language">
          <button
            type="button"
            className={`ch-coach-lang-btn${lang === 'en' ? ' active' : ''}`}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`ch-coach-lang-btn${lang === 'ms' ? ' active' : ''}`}
            aria-pressed={lang === 'ms'}
            onClick={() => setLang('ms')}
          >
            BM
          </button>
        </span>
      </div>
      {coach && coach !== 'loading' && coach.status === 'ok' && (
        <p className="ch-coach-hint" aria-live="polite">
          {coach.hint}
        </p>
      )}
      {coach && coach !== 'loading' && coach.status === 'error' && coach.message !== 'cancelled' && (
        <p className="ch-coach-note" role="status">
          {coach.message}
        </p>
      )}
      {coach && coach !== 'loading' && coach.status === 'unconfigured' && (
        <p className="ch-coach-note" role="status">
          The AI coach isn’t enabled in this build. The engine feedback above is complete on its own.
        </p>
      )}
      <p className="ch-coach-integrity">
        The engine graded your work; the coach only explains its findings — it never gives the answer.
      </p>
    </div>
  )
}
