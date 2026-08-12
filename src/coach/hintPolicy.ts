/**
 * The hint ladder and the deterministic fallback.
 *
 * Two jobs, both about protecting learning rather than producing text:
 *
 *  1. **Authorise a level.** Productive struggle is the point of the exercise,
 *     so a student gets a nudge first and escalates only after *another
 *     attempt*. Asking twice in a row without re-attempting does not buy a
 *     stronger hint. Level 4 — the worked explanation — is released only after
 *     a successful repair or by explicit teacher authorisation.
 *
 *  2. **Answer without a model.** Every hint the system can give must also be
 *     giveable with no network and no LLM: retrieval alone returns approved
 *     text, and this module assembles it. That single path covers three
 *     requirements at once — the low-confidence fallback (MVP criterion 5), the
 *     teacher's AI-off switch (criterion 7), and the "network or model failure
 *     during judging" risk in the strategy's risk table.
 */
import type { CorpusLanguage, HintLevel } from './corpus'
import type { Diagnosis } from './misconceptions'
import { retrieve, type RetrievalResult } from './retrieve'

export const MAX_STUDENT_LEVEL: HintLevel = 3
export const WORKED_EXPLANATION_LEVEL: HintLevel = 4

export interface LadderState {
  /** Failed checks submitted for this challenge in this session. */
  attempts: number
  /** Hints already served for this challenge in this session. */
  hintsServed: number
  /** The student has passed the challenge — the worked explanation is now educational, not a give-away. */
  solved: boolean
  /** A teacher has deliberately unlocked the full explanation (demo, remediation, or after the assessment). */
  teacherUnlocked: boolean
}

export type LadderDecision =
  | { granted: true; level: HintLevel; reason: string }
  | { granted: false; reason: string }

/**
 * Decide which hint level this request has earned. Pure: the caller owns the
 * counters, so the same state always yields the same decision and the rule can
 * be shown to a teacher without running the app.
 */
export function authorizeHintLevel(state: LadderState): LadderDecision {
  if (state.solved || state.teacherUnlocked) {
    return {
      granted: true,
      level: WORKED_EXPLANATION_LEVEL,
      reason: state.solved
        ? 'The repair succeeded, so the full worked explanation is released.'
        : 'A teacher unlocked the full worked explanation.',
    }
  }

  if (state.attempts === 0) {
    return { granted: false, reason: 'Run a check first — the coach explains what the engine found on a real attempt.' }
  }

  // Escalation is earned by attempting again, not by asking again.
  if (state.hintsServed >= state.attempts) {
    return {
      granted: false,
      reason: 'Try your idea on the canvas first. The next hint unlocks after your next check.',
    }
  }

  const level = Math.min(state.hintsServed + 1, MAX_STUDENT_LEVEL) as HintLevel
  return {
    granted: true,
    level,
    reason:
      level === 1
        ? 'First hint: a nudge.'
        : level === 2
          ? 'Second hint: the underlying Swing rule.'
          : 'Third hint: a structural clue. The repair itself is still yours to make.',
  }
}

export interface DeterministicHint {
  text: string
  level: HintLevel
  /** Citation ids backing the text — never empty when `source` is 'corpus'. */
  chunkIds: string[]
  source: 'corpus' | 'engine-only'
}

/**
 * Compose a hint from approved corpus text alone — no model involved.
 *
 * When retrieval finds nothing at all (a code with no coverage, or a corpus
 * loading failure) it degrades to the engine's own findings, which are always
 * true because the engine computed them. It never invents teaching content.
 */
export function deterministicHint(
  diagnosis: Diagnosis,
  language: CorpusLanguage,
  level: HintLevel,
  retrieval?: RetrievalResult,
): DeterministicHint {
  const result = retrieval ?? retrieve({ code: diagnosis.code, language, hintLevel: level, evidence: diagnosis.evidence, limit: 1 })

  // Serve the single best passage, not every passage retrieved. Retrieval hands
  // the composer more than one so a model has room to ground itself, but a
  // student reading two overlapping explanations of the same rule is worse off
  // than a student reading the better one — and a nudge stops being a nudge.
  const best = result.hits[0]
  if (best) {
    return {
      text: best.chunk.text,
      level: best.chunk.hintLevel,
      chunkIds: [best.chunk.chunkId],
      source: 'corpus',
    }
  }

  return {
    text:
      diagnosis.evidence.length > 0
        ? diagnosis.evidence.join(' ')
        : language === 'ms-MY'
          ? 'Semakan itu tidak lulus. Bandingkan binaan anda dengan sasaran satu bekas pada satu masa.'
          : 'The check did not pass. Compare your build with the target one container at a time.',
    level,
    chunkIds: [],
    source: 'engine-only',
  }
}
