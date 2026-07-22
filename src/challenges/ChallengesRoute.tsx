import { CHALLENGES, findChallenge } from './data'
import { challengeHref } from '../router'
import { ParsonsPlayer } from './ParsonsPlayer'
import { ReflowPlayer } from './ReflowPlayer'
import { ReversePlayer } from './ReversePlayer'
import { SwingFrame, useMeasurer } from './SwingFrame'
import { SurfaceNav } from '../components/SurfaceNav'
import './challenges.css'

export function ChallengesRoute({ challengeId }: { challengeId: string | null }) {
  const challenge = challengeId ? findChallenge(challengeId) : undefined

  return (
    <>
      <header className="app-header">
        <h1 className="wordmark">
          Layout<em>Lab</em>
        </h1>
        <SurfaceNav current="challenges" />
        {challenge && (
          <nav className="ch-breadcrumb" aria-label="Breadcrumb">
            <a href={challengeHref()} className="ch-crumb">
              Challenges
            </a>
            <span className="ch-crumb-sep" aria-hidden="true">
              /
            </span>
            <span className="ch-crumb ch-crumb-current">{challenge.title}</span>
          </nav>
        )}
      </header>
      {challenge ? (
        challenge.type === 'parsons' ? (
          <ParsonsPlayer key={challenge.id} challenge={challenge} />
        ) : challenge.type === 'reflow' ? (
          <ReflowPlayer key={challenge.id} challenge={challenge} />
        ) : (
          <ReversePlayer key={challenge.id} challenge={challenge} />
        )
      ) : (
        <ChallengeList unknownId={challengeId} />
      )}
    </>
  )
}

const TYPE_LABEL = {
  parsons: 'Parsons — order the code',
  reflow: 'Reflow — predict the reflow',
  reverse: 'Reverse — rebuild the target',
} as const

/** Fixed section order for the index, one group per mode. */
const MODE_ORDER = ['parsons', 'reflow', 'reverse'] as const

const CARD_PREVIEW_SCALE = 0.45

function ChallengeList({ unknownId }: { unknownId: string | null }) {
  const measure = useMeasurer()
  return (
    <main className="ch-list-page">
      {unknownId && (
        <p className="ch-unknown" role="alert">
          No challenge named <code>{unknownId}</code> — pick one below.
        </p>
      )}
      <p className="ch-list-intro">
        Everything here is graded by the same layout engine that renders the Playground — no screenshots, no
        approximations. What you see is what Swing does.
      </p>
      {MODE_ORDER.map((mode) => {
        const inMode = CHALLENGES.filter((c) => c.type === mode)
        if (inMode.length === 0) return null
        return (
          <section key={mode} className="ch-mode-group" aria-labelledby={`ch-mode-${mode}`}>
            <h2 id={`ch-mode-${mode}`} className="ch-mode-heading">
              {TYPE_LABEL[mode]}
            </h2>
            <ul className="ch-cards">
              {inMode.map((c) => (
                <li key={c.id}>
                  <a className="ch-card" href={challengeHref(c.id)}>
                    <span className="ch-card-title">{c.title}</span>
                    {c.type === 'reverse' && (
                      <span className="ch-card-preview" aria-hidden="true">
                        <span
                          className="ch-card-preview-scale"
                          style={{
                            width: (c.frameSize.width + 2) * CARD_PREVIEW_SCALE,
                            height: (c.frameSize.height + 32) * CARD_PREVIEW_SCALE,
                          }}
                        >
                          <SwingFrame root={c.target} size={c.frameSize} title="Target" dims={null} measure={measure} />
                        </span>
                      </span>
                    )}
                    <span className="ch-card-prompt">{c.prompt}</span>
                    <span className={`ch-diff ch-diff-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
