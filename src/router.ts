/**
 * Hash-based routing — deliberately tiny. The IA is flat (Playground +
 * Challenges), so a dependency-free hash switch keeps the Playground bundle
 * and behavior byte-identical to Phase 1.
 */
import { useMemo, useSyncExternalStore } from 'react'

export type Route =
  | { view: 'playground' }
  | { view: 'ar-lab' }
  | { view: 'challenges'; challengeId: string | null }

export function parseRoute(hash: string): Route {
  if (/^#\/ar-lab\/?$/.test(hash)) return { view: 'ar-lab' }
  const m = /^#\/challenges(?:\/([^/]+))?\/?$/.exec(hash)
  if (m) return { view: 'challenges', challengeId: m[1] ? decodeURIComponent(m[1]) : null }
  return { view: 'playground' }
}

export function challengeHref(challengeId?: string): string {
  return challengeId ? `#/challenges/${encodeURIComponent(challengeId)}` : '#/challenges'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(() => parseRoute(hash), [hash])
}
