# AI Layout Coach — Supabase Edge Function

Turns the layout engine's deterministic findings into a Socratic, bilingual hint.
The Anthropic API key lives here as a Supabase secret and never reaches the
browser — the web app only knows this function's URL.

## Design: "the engine judges, the AI explains"

The engine has already graded the student's build. This function receives its
findings verbatim and only rephrases them. The system prompt forbids the model
from giving the solution, emitting Java, or re-deciding correctness — so the AI
can never teach wrong Swing behaviour. Grading stays 100% deterministic.

- **Model:** `claude-opus-4-8` (change `model` in `index.ts` to `claude-haiku-4-5`
  or `claude-sonnet-5` if you want a cheaper/faster hint tier).
- **No thinking, low effort:** a one-line hint from given facts doesn't need deep
  reasoning; this keeps latency and cost down.

## Prerequisites

- A Supabase project (free tier is enough) and the Supabase CLI:
  `brew install supabase/tap/supabase`
- An Anthropic API key.

## Deploy

```bash
# from the repo root (MagikLayout/)
supabase login
supabase link --project-ref <your-project-ref>

# store the key as a secret (never committed, never shipped to the browser)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# deploy. --no-verify-jwt because the coach is called from the public web app;
# see "Locking it down" below before going to production.
supabase functions deploy coach --no-verify-jwt
```

The deploy output prints the function URL, e.g.
`https://<project-ref>.functions.supabase.co/coach`.

## Wire up the web app

Put the URL in the web app's environment (see `.env.example`):

```bash
# MagikLayout/.env
VITE_COACH_URL=https://<project-ref>.functions.supabase.co/coach
```

Rebuild (`npm run build`). Until this is set, the app runs exactly as before and
the coach button reports itself unconfigured — nothing else changes.

## Test the function directly

```bash
curl -X POST "$VITE_COACH_URL" \
  -H 'content-type: application/json' \
  -d '{
    "mode": "reverse",
    "challengeTitle": "Mukah Airport canteen receipt",
    "prompt": "Rebuild the canteen receipt panel...",
    "language": "en",
    "findings": ["Missing from your build: a JButton \"Clear\"."],
    "studentCode": "frame.add(button1, BorderLayout.SOUTH);"
  }'
# → {"hint":"..."}
```

## Notes on the SDK import

`index.ts` imports `npm:@anthropic-ai/sdk` (Supabase Edge Functions support the
`npm:` specifier). For reproducible deploys, pin a version once you've confirmed
it resolves — e.g. `import Anthropic from 'npm:@anthropic-ai/sdk@0.68.0'`.

## Locking it down (before production)

`--no-verify-jwt` leaves the endpoint open. For a classroom deployment, add at
least one of:

- A Supabase anon-key check, or a shared secret header the web app sends.
- Rate limiting per IP (Supabase provides request metadata).
- `Access-Control-Allow-Origin` restricted to your app's origin instead of `*`
  (edit `CORS` in `index.ts`).
