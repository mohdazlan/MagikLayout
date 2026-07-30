/**
 * AI Layout Coach — client half.
 *
 * The integrity model is "the engine judges, the AI explains": the deterministic
 * grader in grade.ts has already decided what is wrong, and this module only
 * packages that verdict for a natural-language explanation. The coach never
 * grades, never sees the answer key, and never returns the layout — it turns the
 * engine's own findings into a Socratic hint.
 *
 * The Anthropic API key lives in a Supabase Edge Function (see
 * supabase/functions/coach/), never in this bundle. If VITE_COACH_URL is unset
 * the coach reports itself unconfigured and the rest of the app is unaffected.
 */
export type CoachLanguage = 'en' | 'ms'

/** Which challenge mode produced the findings — lets the backend frame its wording. */
export type CoachMode = 'reverse' | 'parsons' | 'reflow'

export interface CoachRequest {
  mode: CoachMode
  challengeTitle: string
  /** The task statement the student already saw — grounds the hint in their goal. */
  prompt: string
  language: CoachLanguage
  /** Verbatim, deterministic engine output. The coach explains these; it does not add to them. */
  findings: string[]
  /** The Java tied to the attempt (the student's build/program, or the reflow snippet). */
  studentCode: string
}

/**
 * Assemble the grounded payload for any failed attempt. Pure — every field comes
 * from something the engine already computed or the student already saw, so this
 * is unit-testable and carries no answer-key data. Each player is responsible for
 * translating its own grade result into `findings` strings before calling this.
 */
export function buildCoachRequest(args: {
  mode: CoachMode
  challengeTitle: string
  prompt: string
  findings: string[]
  studentCode: string
  language: CoachLanguage
}): CoachRequest {
  return {
    mode: args.mode,
    challengeTitle: args.challengeTitle,
    prompt: args.prompt,
    language: args.language,
    findings: args.findings,
    studentCode: args.studentCode,
  }
}

const COACH_URL = (import.meta.env.VITE_COACH_URL as string | undefined) || ''

/** True when a coach backend URL is configured for this build. */
export function coachConfigured(): boolean {
  return COACH_URL.length > 0
}

export type CoachResult =
  | { status: 'ok'; hint: string }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string }

/**
 * POST the grounded request to the Supabase Edge Function and return its hint.
 * Uses fetch only — no SDK, no new dependency in the client bundle.
 */
export async function askCoach(req: CoachRequest, signal?: AbortSignal): Promise<CoachResult> {
  if (!COACH_URL) return { status: 'unconfigured' }
  try {
    const res = await fetch(COACH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    })
    if (!res.ok) return { status: 'error', message: `Coach unavailable (HTTP ${res.status}).` }
    const data = (await res.json()) as { hint?: string; error?: string }
    if (data.error) return { status: 'error', message: data.error }
    const hint = (data.hint ?? '').trim()
    if (!hint) return { status: 'error', message: 'The coach returned an empty hint.' }
    return { status: 'ok', hint }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { status: 'error', message: 'cancelled' }
    }
    return { status: 'error', message: 'Could not reach the coach.' }
  }
}
