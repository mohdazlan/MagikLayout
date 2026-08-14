# Classroom Coach — retrieval-grounded Supabase Edge Function

Composes hints from the passages retrieval already selected client-side, and
cites them by id. See [`../../../RAG.md`](../../../RAG.md) for how this differs
from `../coach/` (grounded contextual prompting, no retrieval) — they are two
different things and must not be described as the same.

Holds `ANTHROPIC_API_KEY` as a Supabase secret; the key never reaches the
browser. The client (`src/classroom/ragComposer.ts`) posts the retrieved
passages plus the engine's findings; this function must compose only from what
it was given and refuses outright if no passages are supplied.

**Model:** `claude-haiku-4-5`. The job is composition from supplied passages
plus one Socratic question, not open-ended reasoning — Haiku is the right tier
(five times cheaper than Opus, lower latency in a classroom that fires the coach
many times a lesson). Change `MODEL` in `index.ts` to `claude-sonnet-5` for
richer phrasing at higher cost. `output_config.effort` is not passed: the
Sonnet 4.5 / Haiku 4.5 line rejects it.

**Current status:** deployed and smoke-tested against a live key. The function
URL lives in the (gitignored) `.env` as `VITE_COACH_RAG_URL`, not in this repo —
the endpoint runs with `--no-verify-jwt` (open), so publishing it here would let
anyone spend the key. See "Locking it down" below before pointing a real class
at it.

## Prerequisites

- A Supabase project and the Supabase CLI. No install needed — `npx supabase`
  works, or `brew install supabase/tap/supabase`.
- An Anthropic API key.
- If `supabase/functions/coach` is already deployed for this project, reuse the
  same linked project — this is a second function on it, not a new project.

## Deploy

```bash
# from the repo root (MagikLayout/)
supabase login                                    # opens a browser — interactive only
supabase link --project-ref <your-project-ref>    # skip if already linked

# only if not already set for the coach function:
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

supabase functions deploy coach-rag --no-verify-jwt
```

The deploy output prints the function URL, e.g.
`https://<project-ref>.functions.supabase.co/coach-rag`.

## Wire up the web app

```bash
# MagikLayout/.env
VITE_COACH_RAG_URL=https://<project-ref>.functions.supabase.co/coach-rag
```

Rebuild (`npm run build`). Until this is set, the Classroom's "AI composer"
toggle has nothing to call and the Coach Lab runs entirely on approved corpus
text — a fully supported mode, not a degraded one (see RAG.md §4, criterion 7).

## Test the function directly

```bash
curl -X POST "$VITE_COACH_RAG_URL" \
  -H 'content-type: application/json' \
  -d '{
    "misconceptionCode": "BL-SOUTH-COLLISION",
    "language": "en-MY",
    "hintLevel": 2,
    "challengeTitle": "Rebuild the target — button row",
    "evidence": [
      "2 components are added directly to BorderLayout.SOUTH of the frame.",
      "Swing lays out only the last component added to SOUTH; the other one is never sized and stays invisible."
    ],
    "passages": [
      { "chunkId": "ML-BLS-L2:en-MY", "text": "BorderLayout has exactly five slots, and SOUTH is one slot — not a row. When a second component is added to the same region, it replaces the first in that slot, and the earlier one is never given a size or a position." }
    ]
  }'
# → {"hint":"...","citedChunkIds":["ML-BLS-L2:en-MY"],"model":"claude-haiku-4-5"}
```

A request with `"passages": []` should return `400` — that refusal is
intentional, not a bug (see `index.ts`).

## Locking it down (before a real classroom deployment)

Same considerations as `../coach/README.md`: `--no-verify-jwt` leaves the
endpoint open. Add a shared-secret header or origin restriction before pointing
a real class at it.
