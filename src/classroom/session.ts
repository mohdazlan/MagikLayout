/**
 * Class sessions without student accounts.
 *
 * The strategy is explicit that the first classroom trial must not require
 * learner accounts if a privacy-safe session code can prove value faster. So a
 * session is a six-character code a teacher reads out, and a learner is an
 * anonymous label generated on their own device. Nothing here collects a name,
 * an email, a device id or anything else that identifies a person; the teacher
 * knows who sat where, and the exported evidence carries only the labels.
 *
 * The code alphabet excludes characters that are misread aloud or on a
 * whiteboard — no O/0, no I/1, no S/5 — because a code that gets typed wrong is
 * a lesson that starts three minutes late.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'
const CODE_LENGTH = 6
const LEARNER_LENGTH = 4

const SESSION_KEY = 'magiklayout.classroom.session.v1'
const LEARNER_KEY = 'magiklayout.classroom.learner.v1'

export interface ClassSession {
  code: string
  /** ISO-8601 creation time — the evidence export's "when". */
  createdAt: string
  /** Teacher-visible label for the class, e.g. "4 Amanah / Wed p3". Free text, no student names. */
  label: string
  /** The lesson this session was opened for. */
  lessonId: string
  /** Whether the AI composer is enabled; deterministic hints work either way. */
  aiEnabled: boolean
}

type RandomFn = () => number

function pick(random: RandomFn, alphabet: string, length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(random() * alphabet.length)]
  return out
}

/** A fresh session code. Injectable randomness so tests and demos are reproducible. */
export function generateSessionCode(random: RandomFn = Math.random): string {
  return pick(random, ALPHABET, CODE_LENGTH)
}

/**
 * An anonymous per-device learner label, e.g. `L-7QK4`. Stable for the browser
 * so one learner's attempts group together in the cohort view, and meaningless
 * outside it.
 */
export function generateLearnerLabel(random: RandomFn = Math.random): string {
  return `L-${pick(random, ALPHABET, LEARNER_LENGTH)}`
}

/**
 * Accept what a learner actually types: lower case, spaces, and the confusable
 * characters the alphabet deliberately omits. Returns null when the result is
 * not a well-formed code, so a typo shows as a typo rather than as an empty class.
 */
export function normalizeSessionCode(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/0/g, 'Q') // 0 and O are not in the alphabet; Q is the nearest intent
    .replace(/1/g, 'L')
    .replace(/5/g, 'W')
  if (cleaned.length !== CODE_LENGTH) return null
  if (![...cleaned].every((char) => ALPHABET.includes(char))) return null
  return cleaned
}

export function createSession(args: {
  label: string
  lessonId: string
  aiEnabled: boolean
  random?: RandomFn
  now?: () => number
}): ClassSession {
  return {
    code: generateSessionCode(args.random ?? Math.random),
    createdAt: new Date((args.now ?? Date.now)()).toISOString(),
    label: args.label,
    lessonId: args.lessonId,
    aiEnabled: args.aiEnabled,
  }
}

/** The join link a teacher shares — a plain hash route, so it works from any device. */
export function joinLink(code: string, origin = typeof location === 'undefined' ? '' : location.origin + location.pathname): string {
  return `${origin}#/classroom/${code}`
}

// ── Persistence ────────────────────────────────────────────────────────────
// Best-effort, exactly like the coach log: a private window must never break a
// lesson, so every failure degrades to "no saved session" rather than throwing.

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadSession(storage: Storage | null = safeStorage()): ClassSession | null {
  try {
    const raw = storage?.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as ClassSession) : null
  } catch {
    return null
  }
}

export function saveSession(session: ClassSession | null, storage: Storage | null = safeStorage()): void {
  try {
    if (session) storage?.setItem(SESSION_KEY, JSON.stringify(session))
    else storage?.removeItem(SESSION_KEY)
  } catch {
    // Ignored: the session stays in React state for this lesson.
  }
}

/** The device's learner label, created on first use. */
export function currentLearnerLabel(storage: Storage | null = safeStorage(), random: RandomFn = Math.random): string {
  try {
    const existing = storage?.getItem(LEARNER_KEY)
    if (existing) return existing
    const label = generateLearnerLabel(random)
    storage?.setItem(LEARNER_KEY, label)
    return label
  } catch {
    return generateLearnerLabel(random)
  }
}
