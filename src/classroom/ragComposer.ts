/**
 * The client half of the retrieval-grounded coach.
 *
 * A `Composer` for the pipeline: it posts the retrieved passages and the
 * engine's findings to the coach-rag Edge Function and returns what came back.
 * It performs no validation of its own — the pipeline hands every response to
 * the guard, which is the single place responses are judged. Duplicating those
 * checks here would create two rules that could disagree.
 *
 * When VITE_COACH_RAG_URL is unset, `ragComposer()` returns undefined and the
 * pipeline runs in deterministic mode. That is a supported configuration, not a
 * degraded one: approved corpus text answers every case on its own.
 */
import type { ComposeInput, ComposeOutput, Composer } from '../coach/pipeline'

const COACH_RAG_URL = (import.meta.env.VITE_COACH_RAG_URL as string | undefined) || ''

export function ragComposerConfigured(): boolean {
  return COACH_RAG_URL.length > 0
}

/** The composer for this build, or undefined when no backend is configured. */
export function ragComposer(): Composer | undefined {
  if (!COACH_RAG_URL) return undefined
  return async (input: ComposeInput, signal?: AbortSignal): Promise<ComposeOutput> => {
    const res = await fetch(COACH_RAG_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        evidence: input.evidence,
        misconceptionCode: input.misconceptionCode,
        language: input.language,
        hintLevel: input.hintLevel,
        passages: input.passages,
        challengeTitle: input.challengeTitle,
      }),
      signal,
    })
    if (!res.ok) throw new Error(`coach-rag responded ${res.status}`)
    const data = (await res.json()) as { hint?: string; citedChunkIds?: string[]; model?: string; error?: string }
    if (data.error) throw new Error(data.error)
    return {
      text: data.hint ?? '',
      citedChunkIds: data.citedChunkIds ?? [],
      model: data.model,
    }
  }
}
