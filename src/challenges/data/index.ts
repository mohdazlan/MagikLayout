import type { Challenge } from '../types'
import { PARSONS_CHALLENGES } from './parsons'
import { REFLOW_CHALLENGES } from './reflow'
import { REVERSE_CHALLENGES } from './reverse'

export const CHALLENGES: Challenge[] = [...PARSONS_CHALLENGES, ...REFLOW_CHALLENGES, ...REVERSE_CHALLENGES]

export function findChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}
