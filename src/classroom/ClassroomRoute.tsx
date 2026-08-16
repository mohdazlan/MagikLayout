/**
 * The Classroom surface — an add-on alongside Playground, AR Lab and
 * Challenges, not a replacement for any of them.
 *
 * Three tabs, in the order a teacher meets them:
 *   Lesson pack   what to teach, and how the 25 minutes run.
 *   AI Debugging Studio  a visual repair workspace with a grounded coach.
 *   Class session the code to read out, and the evidence to export afterwards.
 *
 * A session is created on demand. Until one exists the Coach Lab still works
 * against a preview session id, so nobody has to set up a class just to see
 * how the coach behaves.
 */
import { useEffect, useState } from 'react'
import { SurfaceNav } from '../components/SurfaceNav'
import { CoachLabPanel } from './CoachLabPanel'
import { LessonPackPanel } from './LessonPackPanel'
import { SessionPanel } from './SessionPanel'
import { BORDER_LAYOUT_SOUTH_LESSON } from './lessons'
import { createSession, currentLearnerLabel, loadSession, normalizeSessionCode, saveSession, type ClassSession } from './session'
import './classroom.css'

type Tab = 'lesson' | 'lab' | 'session'

const TABS: { id: Tab; label: string }[] = [
  { id: 'lesson', label: 'Lesson pack' },
  { id: 'lab', label: 'AI Debugging Studio' },
  { id: 'session', label: 'Class session' },
]

/** Used by the Coach Lab before a class session exists, so nothing is blocked. */
const PREVIEW_SESSION = 'PREVIEW'

export function ClassroomRoute({ sessionCode }: { sessionCode: string | null }) {
  const [tab, setTab] = useState<Tab>('lesson')
  const [session, setSession] = useState<ClassSession | null>(() => loadSession())
  const [learnerLabel] = useState(() => currentLearnerLabel())
  const pack = BORDER_LAYOUT_SOUTH_LESSON

  // A join link (#/classroom/CODE) opens the session view on that code, so a
  // learner or a second device lands where the teacher expects.
  useEffect(() => {
    if (!sessionCode) return
    const code = normalizeSessionCode(sessionCode)
    if (!code) return
    setTab('session')
    setSession((current) =>
      current && current.code === code
        ? current
        : { code, createdAt: new Date().toISOString(), label: 'Joined session', lessonId: pack.id, aiEnabled: false },
    )
  }, [sessionCode, pack.id])

  const update = (next: ClassSession | null) => {
    setSession(next)
    saveSession(next)
  }

  return (
    <>
      <header className="app-header">
        <h1 className="wordmark">
          Magik<em>Layout</em>
        </h1>
        <SurfaceNav current="classroom" />
      </header>

      <main className={`cl-page${tab === 'lab' ? ' cl-page-studio' : ''}`}>
        <div className="cl-intro">
          <h2 className="cl-page-title">Classroom</h2>
          <p className="cl-page-sub">
            Teach one visible problem from first prediction to verified repair. The layout engine establishes truth,
            retrieval selects approved guidance, and AI helps the learner find the next useful question.
          </p>
        </div>

        <nav className="cl-tabs" aria-label="Classroom sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`cl-tab${tab === item.id ? ' is-current' : ''}`}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'lesson' && <LessonPackPanel pack={pack} />}

        {tab === 'lab' && (
          <CoachLabPanel
            sessionId={session ? session.code : PREVIEW_SESSION}
            learnerLabel={learnerLabel}
            aiEnabled={session ? session.aiEnabled : false}
          />
        )}

        {tab === 'session' &&
          (session ? (
            <SessionPanel session={session} onChange={update} onEnd={() => update(null)} />
          ) : (
            <NewSession
              onCreate={(label, aiEnabled) => update(createSession({ label, lessonId: pack.id, aiEnabled }))}
              onJoin={(code) =>
                update({ code, createdAt: new Date().toISOString(), label: 'Joined session', lessonId: pack.id, aiEnabled: false })
              }
            />
          ))}
      </main>
    </>
  )
}

function NewSession(props: { onCreate: (label: string, aiEnabled: boolean) => void; onJoin: (code: string) => void }) {
  const [label, setLabel] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)

  const join = () => {
    const code = normalizeSessionCode(joinCode)
    if (!code) {
      setJoinError('That is not a six-character class code. Check the board and try again.')
      return
    }
    setJoinError(null)
    props.onJoin(code)
  }

  return (
    <div className="cl-new">
      <section className="cl-card">
        <h3 className="cl-h3">Open a class session</h3>
        <p className="cl-pack-note">
          A session is a six-character code you read out. No accounts, no student names — learners are labelled per
          device.
        </p>
        <label className="cl-field">
          <span className="cl-field-label">Class label (for your own records)</span>
          <input
            className="cl-input"
            value={label}
            placeholder="4 Amanah / Wed p3"
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="cl-check">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
          <span>
            Enable the AI composer
            <em className="cl-check-note">Leave it off to run entirely on approved hints — every case is covered.</em>
          </span>
        </label>
        <button type="button" className="cl-btn cl-btn-primary" onClick={() => props.onCreate(label, aiEnabled)}>
          Open session
        </button>
      </section>

      <section className="cl-card">
        <h3 className="cl-h3">Join an existing session</h3>
        <label className="cl-field">
          <span className="cl-field-label">Class code</span>
          <input
            className="cl-input cl-input-code"
            value={joinCode}
            placeholder="QRTUVW"
            maxLength={9}
            onChange={(e) => setJoinCode(e.target.value)}
          />
        </label>
        {joinError && (
          <p className="cl-error" role="alert">
            {joinError}
          </p>
        )}
        <button type="button" className="cl-btn" onClick={join}>
          Join
        </button>
      </section>
    </div>
  )
}
