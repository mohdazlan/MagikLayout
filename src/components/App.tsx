import { useHashRoute } from '../router'
import { ChallengesRoute } from '../challenges/ChallengesRoute'
import { Playground } from './Playground'

export function App() {
  const route = useHashRoute()
  return (
    <div className="app">
      {route.view === 'challenges' ? <ChallengesRoute challengeId={route.challengeId} /> : <Playground />}
    </div>
  )
}
