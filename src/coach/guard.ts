/**
 * Stage 5 of the pipeline — Guard.
 *
 * Everything the coach is allowed to say passes through here, whether it came
 * from a language model or straight from the corpus. The guard is deterministic
 * and runs on the client, so a compromised or simply unlucky model response can
 * never reach a student unchecked: a failed guard is not an error message, it is
 * a silent substitution of the reviewed deterministic hint.
 *
 * The checks correspond one-for-one to the strategy's stage-5 list — citation
 * IDs, prohibited answer leakage, language, length, and contradiction with the
 * engine's findings — plus an emptiness check so a blank response never renders
 * as a hint.
 *
 * What the guard deliberately does NOT do is judge pedagogy. It cannot tell a
 * good hint from a mediocre one; it can only tell a safe hint from an unsafe
 * one. Quality is the reviewer's job, enforced at authoring time.
 */
import { chunkById, type CorpusLanguage, type HintLevel } from './corpus'
import { BORDER_REGIONS } from '../engine/borderLayout'
import type { Diagnosis } from './misconceptions'

export type GuardViolationCode =
  | 'empty'
  | 'unknown-citation'
  | 'uncited'
  | 'citation-not-retrieved'
  | 'code-leakage'
  | 'level-leakage'
  | 'wrong-language'
  | 'too-long'
  | 'contradiction'

export interface GuardViolation {
  code: GuardViolationCode
  detail: string
}

export interface GuardInput {
  text: string
  /** Source ids the composed hint claims to be grounded in. */
  citedChunkIds: string[]
  /** Source ids retrieval actually supplied. */
  retrievedChunkIds: string[]
  language: CorpusLanguage
  level: HintLevel
  /** The engine's verdict the hint must not contradict. */
  diagnosis: Diagnosis
}

export type GuardVerdict = { ok: true } | { ok: false; violations: GuardViolation[] }

/** A hint is 1–2 sentences; the worked explanation may be a short paragraph. */
const MAX_CHARS: Record<HintLevel, number> = { 1: 400, 2: 400, 3: 400, 4: 900 }

/** Executable Java, in any of the shapes a model tends to produce. */
const CODE_PATTERNS: { re: RegExp; what: string }[] = [
  { re: /```/, what: 'a code fence' },
  { re: /\bnew\s+[A-Z]\w*\s*\(/, what: 'a constructor call' },
  { re: /\b\w+\.(add|setLayout|setBounds|setSize)\s*\(/, what: 'a method call on a variable' },
  { re: /;\s*$/m, what: 'a statement terminator' },
  { re: /\bpublic\s+(static|class|void)\b/, what: 'a Java declaration' },
]

/**
 * Level 1 is a nudge: it may name the manager the student is already using, but
 * naming the repair mechanism turns the nudge into the answer.
 */
const LEVEL_1_FORBIDDEN = /\bJPanel\b/i

/**
 * Claims that the ATTEMPT AS A WHOLE is correct — which the engine has already
 * contradicted by failing it. Scoped praise is legitimate and must survive: a
 * hint may truthfully say the components are all present while the arrangement
 * is wrong. Hence the sentence-initial anchor on the Malay "semuanya betul",
 * which distinguishes a standalone verdict from "Komponen anda semuanya betul".
 */
const CLAIMS_CORRECT = [
  /\b(everything|it all|your build|your layout|the layout|your code)\s+(is|looks)\s+(correct|right|fine|good)\b/i,
  /\bnothing (is )?wrong\b/i,
  /\byou (have )?(already )?(passed|solved) (it|this)\b/i,
  /(^|[.!?]\s+)(semuanya|semua)\s+(sudah\s+)?betul\b/i,
  /\b(binaan|kod|susun atur)\s+anda\s+(sudah\s+)?betul\b/i,
  /\btiada (apa-apa )?masalah\b/i,
  /\b(sudah|telah) lulus\b/i,
]

const CLAIMS_COMPILE_ERROR = /\b(does not compile|will not compile|compile error|ralat kompil|tidak dapat dikompil)\b/i

const MALAY_MARKERS = /\b(yang|anda|itu|ini|dan|adalah|ialah|kepada|dalam|tidak|kerana|boleh|mesti|dengan|kawasan|susunan|bekas|satu)\b/gi
const ENGLISH_MARKERS = /\b(the|your|and|is|are|that|this|to|of|not|because|can|must|with|region|order|container|one)\b/gi

function count(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length
}

/** Region names the hint asserts, in a text that has already been trimmed. */
function regionsMentioned(text: string): string[] {
  return BORDER_REGIONS.filter((region) => new RegExp(`\\b${region}\\b`).test(text))
}

export function guardHint(input: GuardInput): GuardVerdict {
  const violations: GuardViolation[] = []
  const text = input.text.trim()

  if (text.length === 0) {
    return { ok: false, violations: [{ code: 'empty', detail: 'The composed hint is empty.' }] }
  }

  // ── Citations ──────────────────────────────────────────────────────────
  for (const id of input.citedChunkIds) {
    if (!chunkById(id)) {
      violations.push({ code: 'unknown-citation', detail: `Cited source "${id}" is not in the corpus.` })
    } else if (!input.retrievedChunkIds.includes(id)) {
      violations.push({ code: 'citation-not-retrieved', detail: `Cited source "${id}" was not retrieved for this request.` })
    }
  }
  if (input.retrievedChunkIds.length > 0 && input.citedChunkIds.length === 0) {
    violations.push({ code: 'uncited', detail: 'Retrieval supplied approved sources but the hint cites none of them.' })
  }

  // ── Leakage ────────────────────────────────────────────────────────────
  for (const { re, what } of CODE_PATTERNS) {
    if (re.test(text)) violations.push({ code: 'code-leakage', detail: `The hint contains ${what}.` })
  }
  if (input.level === 1 && LEVEL_1_FORBIDDEN.test(text)) {
    violations.push({ code: 'level-leakage', detail: 'A level 1 nudge must not name the repair mechanism.' })
  }

  // ── Language ───────────────────────────────────────────────────────────
  const malay = count(text, MALAY_MARKERS)
  const english = count(text, ENGLISH_MARKERS)
  const wantMalay = input.language === 'ms-MY'
  if (wantMalay && malay <= english) {
    violations.push({ code: 'wrong-language', detail: 'Bahasa Malaysia was requested but the hint reads as English.' })
  }
  if (!wantMalay && english < malay) {
    violations.push({ code: 'wrong-language', detail: 'English was requested but the hint reads as Bahasa Malaysia.' })
  }

  // ── Length ─────────────────────────────────────────────────────────────
  const max = MAX_CHARS[input.level]
  if (text.length > max) {
    violations.push({ code: 'too-long', detail: `The hint is ${text.length} characters; the limit at level ${input.level} is ${max}.` })
  }

  // ── Contradiction with the engine ──────────────────────────────────────
  for (const re of CLAIMS_CORRECT) {
    if (re.test(text)) {
      violations.push({ code: 'contradiction', detail: 'The hint tells the student their attempt is correct, but the engine failed it.' })
      break
    }
  }
  if (CLAIMS_COMPILE_ERROR.test(text) && input.diagnosis.code !== 'COMPILE-ERROR') {
    violations.push({
      code: 'contradiction',
      detail: `The hint claims a compile error, but the engine diagnosed ${input.diagnosis.code}.`,
    })
  }
  if (input.diagnosis.region) {
    const named = regionsMentioned(text)
    if (named.length === 1 && named[0] !== input.diagnosis.region) {
      violations.push({
        code: 'contradiction',
        detail: `The hint points at ${named[0]}, but the engine's finding is about ${input.diagnosis.region}.`,
      })
    }
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations }
}
