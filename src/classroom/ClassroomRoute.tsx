/** The Classroom route is now a single-purpose visual debugging studio. */
import { useState } from 'react'
import { SurfaceNav } from '../components/SurfaceNav'
import { CoachLabPanel } from './CoachLabPanel'
import { currentLearnerLabel, loadSession, normalizeSessionCode } from './session'
import './classroom.css'

const PREVIEW_SESSION = 'PREVIEW'

export function ClassroomRoute({ sessionCode }: { sessionCode: string | null }) {
  const [session] = useState(() => loadSession())
  const [learnerLabel] = useState(() => currentLearnerLabel())
  const joinedCode = sessionCode ? normalizeSessionCode(sessionCode) : null

  return (
    <>
      <header className="app-header">
        <h1 className="wordmark">Magik<em>Layout</em></h1>
        <SurfaceNav current="classroom" />
      </header>

      <main className="cl-page cl-page-studio">
        <div className="cl-intro cl-intro-studio">
          <div>
            <p className="ds-eyebrow">Interactive Java GUI learning</p>
            <h2 className="cl-page-title">AI Debugging Studio</h2>
          </div>
          <p className="cl-page-sub">
            See the broken interface, predict the cause, repair the real Swing structure, and ask for grounded help only when you need it.
          </p>
        </div>

        <CoachLabPanel
          sessionId={joinedCode ?? session?.code ?? PREVIEW_SESSION}
          learnerLabel={learnerLabel}
          aiEnabled={session?.aiEnabled ?? true}
        />
      </main>
    </>
  )
}
