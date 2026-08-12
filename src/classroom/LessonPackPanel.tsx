/**
 * The lesson pack, rendered for a teacher who is about to teach it.
 *
 * Reading order is the running order: outcome first, then the hook, then the
 * timed arc, then the exit ticket. Differentiation and the video arc sit at the
 * end because they are prepared before the lesson, not consulted during it.
 *
 * Bilingual text is shown as pairs rather than behind a language switch — a
 * teacher in a Malaysian TVET classroom uses both in the same sentence, and
 * making them choose would cost a click at exactly the wrong moment.
 */
import { challengeHref } from '../router'
import { findChallenge } from '../challenges/data'
import type { LessonPack } from './lessons'

export function LessonPackPanel({ pack }: { pack: LessonPack }) {
  return (
    <article className="cl-pack">
      <header className="cl-pack-head">
        <p className="cl-pack-meta">
          {pack.durationMinutes} minutes · NOSS {pack.noss.unit} · {pack.noss.workActivity} · {pack.version}
        </p>
        <h2 className="cl-pack-title">{pack.title.en}</h2>
        <p className="cl-pack-title-ms" lang="ms">
          {pack.title.ms}
        </p>
      </header>

      <section className="cl-pack-section" aria-labelledby="cl-outcome">
        <h3 id="cl-outcome" className="cl-h3">
          Learning outcome
        </h3>
        <p className="cl-outcome">{pack.learningOutcome.en}</p>
        <p className="cl-outcome cl-ms" lang="ms">
          {pack.learningOutcome.ms}
        </p>
        <p className="cl-pack-note">
          Targets <code>{pack.misconception}</code> — the coach retrieves approved content for this code at every rung
          of the ladder, in both languages.
        </p>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-hook">
        <h3 id="cl-hook" className="cl-h3">
          The hook
        </h3>
        <blockquote className="cl-hook">
          <p>{pack.hook.en}</p>
          <p className="cl-ms" lang="ms">
            {pack.hook.ms}
          </p>
        </blockquote>
        <h4 className="cl-h4">Assumed prior knowledge</h4>
        <ul className="cl-list">
          {pack.priorKnowledge.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-arc">
        <h3 id="cl-arc" className="cl-h3">
          Lesson arc
        </h3>
        <ol className="cl-phases">
          {pack.phases.map((phase) => (
            <li key={phase.name} className="cl-phase">
              <p className="cl-phase-head">
                <span className="cl-phase-time">{phase.time}</span>
                <span className="cl-phase-name">{phase.name}</span>
              </p>
              <dl className="cl-phase-body">
                <dt>Teacher</dt>
                <dd>{phase.teacher}</dd>
                <dt>Learner</dt>
                <dd>{phase.learner}</dd>
                <dt>Evidence</dt>
                <dd>{phase.evidence}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-practice">
        <h3 id="cl-practice" className="cl-h3">
          Challenges used
        </h3>
        <ChallengeLinks label="Practice" ids={pack.practiceChallengeIds} />
        <ChallengeLinks label="Transfer" ids={pack.transferChallengeIds} />
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-exit">
        <h3 id="cl-exit" className="cl-h3">
          Exit ticket
        </h3>
        <ol className="cl-exit">
          {pack.exitTicket.map((item) => (
            <li key={item.prompt.en} className="cl-exit-item">
              <p>{item.prompt.en}</p>
              <p className="cl-ms" lang="ms">
                {item.prompt.ms}
              </p>
              <p className="cl-exit-look">Look for:</p>
              <ul className="cl-list">
                {item.lookFor.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-diff">
        <h3 id="cl-diff" className="cl-h3">
          Differentiation
        </h3>
        <div className="cl-two-col">
          <div>
            <h4 className="cl-h4">If a learner is stuck</h4>
            <ul className="cl-list">
              {pack.differentiation.support.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="cl-h4">If a learner finishes early</h4>
            <ul className="cl-list">
              {pack.differentiation.extension.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-video">
        <h3 id="cl-video" className="cl-h3">
          Recording arc
        </h3>
        <p className="cl-pack-note">
          For the competition entry: 16:9, minimum 1080p, one concept, captions on. The arc below lands at 4:15.
        </p>
        <div className="cl-table-wrap">
          <table className="cl-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Sequence</th>
                <th scope="col">On screen</th>
              </tr>
            </thead>
            <tbody>
              {pack.videoArc.map((beat) => (
                <tr key={beat.time}>
                  <th scope="row">{beat.time}</th>
                  <td>{beat.sequence}</td>
                  <td>{beat.onScreen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cl-pack-section" aria-labelledby="cl-materials">
        <h3 id="cl-materials" className="cl-h3">
          In the room
        </h3>
        <ul className="cl-list">
          {pack.materials.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  )
}

function ChallengeLinks({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null
  return (
    <p className="cl-challenge-links">
      <span className="cl-sources-label">{label}</span>
      {ids.map((id) => {
        const challenge = findChallenge(id)
        return (
          <a key={id} className="cl-challenge-link" href={challengeHref(id)}>
            {challenge ? challenge.title : id}
          </a>
        )
      })}
    </p>
  )
}
