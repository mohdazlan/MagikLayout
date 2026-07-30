// LayoutLab AI Layout Coach — Supabase Edge Function (Deno).
//
// Holds ANTHROPIC_API_KEY as a Supabase secret; the key never reaches the
// browser. The client (src/challenges/coach.ts) POSTs the deterministic
// engine's findings here, and this function turns them into one Socratic hint.
//
// Integrity model — "the engine judges, the AI explains":
//   • The layout engine has ALREADY graded the student's build. This function
//     receives its findings verbatim and only rephrases them as guidance.
//   • The system prompt forbids the model from giving the solution, emitting
//     Java, or re-deciding correctness. Grading stays 100% deterministic, so the
//     AI can never teach wrong Swing behaviour.
//
// Deploy:
//   supabase functions deploy coach --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Then set VITE_COACH_URL in the web app's .env to the function URL.

import Anthropic from 'npm:@anthropic-ai/sdk'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

const SYSTEM = `You are the layout coach inside LayoutLab, a tool that teaches Java Swing layout managers (BorderLayout, FlowLayout, GridLayout) to first-year polytechnic students.

A deterministic layout engine has ALREADY graded the student's work and computed the exact findings given to you. Your only job is to turn those findings into ONE short, Socratic hint that helps the student fix it themselves.

Hard rules — never break these:
- NEVER give the full solution. NEVER output Java code, and NEVER spell out a component-by-component layout. The student must make the change.
- NEVER re-judge, contradict, or add to the engine's findings. You explain what it already found; you do not decide what is correct.
- Anchor the hint in the underlying Swing rule (for example: "a BorderLayout region shows only the last component added to it", or "GridLayout fills cells in add order, row by row") or ask one guiding question.
- Keep it to 1–2 warm, encouraging sentences.
- Reply in the requested language only: "en" = English, "ms" = Bahasa Malaysia.`

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }

  const challengeTitle = String(body.challengeTitle ?? '')
  const prompt = String(body.prompt ?? '')
  const language = body.language === 'ms' ? 'ms' : 'en'
  const mode = body.mode === 'parsons' ? 'parsons' : body.mode === 'reflow' ? 'reflow' : 'reverse'
  const findings = Array.isArray(body.findings) ? body.findings.map(String) : []
  const studentCode = typeof body.studentCode === 'string' ? body.studentCode : ''

  if (findings.length === 0) return json({ error: 'No findings to explain.' }, 400)

  const codeLabel =
    mode === 'parsons'
      ? "The student's program, in their current order, is:"
      : mode === 'reflow'
        ? 'The read-only code whose reflow the student is predicting:'
        : "The student's current build generates this Java:"

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return json({ error: 'Coach is not configured (missing ANTHROPIC_API_KEY).' }, 500)

  const userContent = [
    `Challenge: ${challengeTitle}`,
    `Task the student saw: ${prompt}`,
    `Reply language: ${language}`,
    ``,
    `The engine found these issues with the student's build (verbatim — do not re-judge or add to them):`,
    ...findings.map((f) => `- ${f}`),
    studentCode ? `\n${codeLabel}\n\`\`\`java\n${studentCode}\n\`\`\`` : '',
    ``,
    `Give exactly one Socratic hint.`,
  ].join('\n')

  try {
    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      output_config: { effort: 'low' }, // a short hint from given facts — no deep reasoning needed
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })
    const hint = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
    return json({ hint })
  } catch (e) {
    return json({ error: 'The coach failed to respond.', detail: String(e) }, 502)
  }
})

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}
