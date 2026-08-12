import { lazy, Suspense } from 'react'
import { useHashRoute } from '../router'
import { ChallengesRoute } from '../challenges/ChallengesRoute'
import { Playground } from './Playground'

const ARLab = lazy(() => import('../ar/ARLab').then((module) => ({ default: module.ARLab })))
// Lazy like the AR Lab: the Classroom carries the corpus and the teacher views,
// none of which a student opening the Playground needs to download.
const ClassroomRoute = lazy(() =>
  import('../classroom/ClassroomRoute').then((module) => ({ default: module.ClassroomRoute })),
)

export function App() {
  const route = useHashRoute()
  return (
    <div className="app">
      {route.view === 'challenges' ? (
        <ChallengesRoute challengeId={route.challengeId} />
      ) : route.view === 'ar-lab' ? (
        <Suspense fallback={<div className="ar-loading">Loading AR module…</div>}><ARLab /></Suspense>
      ) : route.view === 'classroom' ? (
        <Suspense fallback={<div className="ar-loading">Loading Classroom…</div>}>
          <ClassroomRoute sessionCode={route.sessionCode} />
        </Suspense>
      ) : (
        <Playground />
      )}
    </div>
  )
}
