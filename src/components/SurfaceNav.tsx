/**
 * The one control that moves between the two surfaces. Rendered identically in
 * both the Playground and the Challenges headers so navigation never depends on
 * which surface you happen to be on. Text-weight links (not a tab bar); the
 * current surface carries aria-current="page".
 */
type Surface = 'playground' | 'challenges'

export function SurfaceNav({ current }: { current: Surface }) {
  return (
    <nav className="surface-nav" aria-label="Surfaces">
      <a href="#/" className="surface-link" aria-current={current === 'playground' ? 'page' : undefined}>
        Playground
      </a>
      <a
        href="#/challenges"
        className="surface-link"
        aria-current={current === 'challenges' ? 'page' : undefined}
      >
        Challenges
      </a>
    </nav>
  )
}
