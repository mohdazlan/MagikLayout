import { lazy, Suspense } from 'react'
import { useHashRoute } from '../router'
import { ChallengesRoute } from '../challenges/ChallengesRoute'
import { Playground } from './Playground'

const ARLab = lazy(() => import('../ar/ARLab').then((module) => ({ default: module.ARLab })))

export function App() {
  const route = useHashRoute()
  return (
    <div className="app">
      {route.view === 'challenges' ? (
        <ChallengesRoute challengeId={route.challengeId} />
      ) : route.view === 'ar-lab' ? (
        <Suspense fallback={<div className="ar-loading">Loading AR module…</div>}><ARLab /></Suspense>
      ) : (
        <Playground />
      )}
    </div>
  )
}
