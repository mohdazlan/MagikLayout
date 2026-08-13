// MagikLayout Classroom — retrieval-grounded coach (Supabase Edge Function, Deno).
//
// This is a SECOND function, deployed alongside the original `coach`. The
// original is untouched and still serves the Challenges surface; this one is
// what the Classroom section calls, and it differs in one decisive way:
//
//   `coach`      receives the engine's findings and asks a model to rephrase
//                them. Grounded contextual prompting.
//   `coach-rag`  receives the engine's findings AND the approved passages that
//                the client's retrieval step selected, and requires the model to
//                compose from those passages and cite them by id. Retrieval.
//
// Retrieval runs on the client because the corpus is a small, versioned in-repo
// artefact — shipping it to a server to be queried again would add a round trip
// and a second copy to keep in sync, without improving precision. What this
// function adds is the composition step and a server-side refusal to answer
// without passages.
//
// The client re-runs every guard on the response (src/coach/guard.ts). Nothing
// here is trusted: this function is a convenience, and the Classroom works
// completely without it.
//
// Deploy:
//   supabase functions deploy coach-rag --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Then set VITE_COACH_RAG_URL in the web app's .env to the function URL.

import Anthropic from 'npm:@anthropic-ai/sdk'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

// Haiku 4.5 is the right tier for this job: the task is composition from
// supplied passages, not open-ended reasoning. It's ~5x cheaper than Opus
// ($1/$5 vs $5/$25 per MTok) and lower-latency, which matters in a classroom
// where a teacher may fire the coach many times in a lesson. The `effort`
// parameter isn't supported on Haiku 4.5 (Sonnet 4.5 / Haiku 4.5 reject it),
// so it's omitted below — a low-effort control isn't needed anyway since
// Haiku is already the low-latency tier.
const MODEL = 'claude-haiku-4-5'

const SYSTEM = `You are the layout coach inside MagikLayout, which teaches Java Swing layout managers to Malaysian secondary vocational and TVET learners.

A deterministic layout engine has ALREADY graded the student's work and computed the findings you are given. A retrieval step has ALREADY selected the approved teaching passages you are given. Your only job is to compose ONE short Socratic hint from those passages, about those findings.

Hard rules — never break these:
- Compose ONLY from the supplied passages. If they do not support a point, do not make it. You have no other source of Swing knowledge in this task.
- NEVER give the full solution. NEVER output Java code, a code fence, or a component-by-component layout. The student makes the change.
- NEVER re-judge, contradict, or add to the engine's findings. You explain what it already found; you do not decide what is correct.
- Respect the hint level. Level 1 is a single question that names no structure and no repair mechanism. Level 2 states the underlying rule. Level 3 names the mechanism to reach for but not the code. Level 4 is a worked explanation, released only after the student has already succeeded.
- Keep it to 1-2 warm, encouraging sentences (a short paragraph at level 4).
- Reply in the requested language only: "en-MY" = English, "ms-MY" = Bahasa Malaysia. Keep Java identifiers (BorderLayout, JPanel, FlowLayout, setLayout) in English in both.
- Reply as JSON only: {"hint": "...", "citedChunkIds": ["..."]} where every id is one of the supplied passage ids you actually used.`

interface Passage {
  chunkId: string
  text: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }

  const language = body.language === 'ms-MY' ? 'ms-MY' : 'en-MY'
  const hintLevel = clampLevel(body.hintLevel)
  const evidence = Array.isArray(body.evidence) ? body.evidence.map(String) : []
  const misconceptionCode = String(body.misconceptionCode ?? '')
  const challengeTitle = String(body.challengeTitle ?? '')
  const passages: Passage[] = Array.isArray(body.passages)
    ? (body.passages as Passage[]).filter((p) => p && typeof p.chunkId === 'string' && typeof p.text === 'string')
    : []

  // Without passages this would be ungrounded generation, which is exactly what
  // this function exists to avoid. The client falls back to approved text.
  if (passages.length === 0) return json({ error: 'No approved passages supplied; refusing to answer ungrounded.' }, 400)
  if (evidence.length === 0) return json({ error: 'No engine findings to explain.' }, 400)

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return json({ error: 'Coach is not configured (missing ANTHROPIC_API_KEY).' }, 500)

  const userContent = [
    `Challenge: ${challengeTitle}`,
    `Misconception code: ${misconceptionCode}`,
    `Hint level: ${hintLevel}`,
    `Reply language: ${language}`,
    '',
    'Engine findings (verbatim — do not re-judge or add to them):',
    ...evidence.map((finding) => `- ${finding}`),
    '',
    'Approved passages — compose only from these, and cite the ones you use:',
    ...passages.map((p) => `[${p.chunkId}] ${p.text}`),
    '',
    'Return the JSON object now.',
  ].join('\n')

  try {
    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })
    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    const parsed = parseHint(raw)
    if (!parsed) return json({ error: 'The coach returned an unusable response.' }, 502)
    return json({ ...parsed, model: MODEL })
  } catch (e) {
    return json({ error: 'The coach failed to respond.', detail: String(e) }, 502)
  }
})

function clampLevel(value: unknown): 1 | 2 | 3 | 4 {
  const n = Number(value)
  return n === 2 || n === 3 || n === 4 ? n : 1
}

/** Tolerate a fenced or prose-wrapped JSON object; reject anything else. */
function parseHint(raw: string): { hint: string; citedChunkIds: string[] } | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const obj = JSON.parse(match[0]) as { hint?: unknown; citedChunkIds?: unknown }
    const hint = typeof obj.hint === 'string' ? obj.hint.trim() : ''
    if (!hint) return null
    const citedChunkIds = Array.isArray(obj.citedChunkIds) ? obj.citedChunkIds.map(String) : []
    return { hint, citedChunkIds }
  } catch {
    return null
  }
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}
