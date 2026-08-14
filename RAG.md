# The MagikLayout coach: what it is, and what we may claim about it

This document exists because the easiest way to lose technical credibility with
judges and educators is to call something RAG before it retrieves anything. It
records exactly what the coach does, what the evidence supports, and what we
still may not say.

Regenerate the figures below with `npm test` and `npm run eval:rag` immediately
before any submission. Every number here is reproducible from this repository.

---

## 1. Claim status

| Claim | Status | Use in submission |
| --- | --- | --- |
| Four product surfaces are built (Playground, Challenges, AR Lab, Classroom); the first three are deployed to the public URL | Current fact | Yes — "built", not "all deployed"; the Classroom's `coach-rag` backend is live on Supabase, but the Classroom surface is not yet on the public site |
| 192 automated tests pass | Current fact | Yes — after rerunning `npm test` |
| The Classroom coach performs runtime retrieval over a governed corpus, with source ids and logging | **Current fact** | **Yes** — the retrieval, citation and evaluation machinery is in `src/coach/` |
| The Challenges coach is RAG | Not true | No — it is grounded contextual prompting. Say so plainly |
| Retrieval precision ≥ 95% on the supported misconception set | Current fact | Yes — 100% on the 138-case gate, quote the gate |
| Zero hint contradictions on the release evaluation set | Current fact | Yes — quote it as an evaluation result, not a classroom result |
| AR produces learning gains | Not established | No — describe technical acceptance and the planned pilot separately |
| MagikLayout improves learning outcomes | Not established | No — no pre/post study has been run yet |
| MagikLayout is market-leading | Not established | No — say "differentiated", and name the white space |
| Schools have adopted it | Not established | No — say "potential to scale" until a second teacher runs a second lesson |

### The product name

The product is **MagikLayout**. `LayoutLab` is retained only as a module and
asset name, in exactly two places where changing it would break something real:
the simulated `JFrame` title in the Playground canvas, and the printed AR target
card `public/ar/layoutlab-target.png` (reprinting every card to rename a file
would be a poor trade). Everything a judge, teacher or student reads says
MagikLayout. `DESIGN.md`, `AR_P0.md` and `swing-layout-lab-spec.md` are
historical documents and keep their original titles.

### Two coaches, and why the distinction matters

The repository contains two coach paths. They are not the same thing and must
not be described as one.

| | `supabase/functions/coach` | `supabase/functions/coach-rag` |
| --- | --- | --- |
| Used by | Challenges | Classroom |
| Receives | Engine findings | Engine findings **plus retrieved approved passages** |
| Grounding | The prompt | A governed corpus, searched at request time |
| Citations | None | Chunk ids, verified against the corpus |
| Honest label | Grounded contextual prompting | Retrieval-augmented generation |

The original function is unchanged and still serves the Challenges surface. If
someone asks whether "the AI Coach" is RAG, the correct answer names which one.

---

## 2. What runs, stage by stage

```
Observe → Diagnose → Retrieve → Compose → Guard → Log
```

| Stage | Where | What it does |
| --- | --- | --- |
| Observe | `src/challenges/grade.ts`, `execute.ts` | The deterministic engine grades the attempt. Unchanged by this work. |
| Diagnose | `src/coach/misconceptions.ts` | Maps the engine's verdict to one of **23 stable codes** in **8 families**. Decides nothing itself. |
| Retrieve | `src/coach/retrieve.ts` | Metadata-first search over **112 chunks** (56 bilingual pairs, corpus **v1.0**). |
| Compose | `supabase/functions/coach-rag/` | Optional. A model (`claude-haiku-4-5`) turns the retrieved passages into one hint and cites them. Deployed and smoke-tested; off by default per surface. |
| Guard | `src/coach/guard.ts` | Citations, leakage, language, length, contradiction. A failure substitutes approved text silently. |
| Log | `src/coach/log.ts` | One record per request: code, chunk ids, model, corpus version, latency, outcome. |

**The architectural rule.** The deterministic engine is the authority for
correctness. Retrieval selects the knowledge. The model only explains. If
retrieval confidence is low, no model is called at all.

### Why metadata-first, and not a vector database

The engine emits a precise misconception code, so the highest-precision
retrieval key already exists — there is nothing for an embedding to recover that
the code does not already state. A managed vector database would add operational
cost, a second copy of the content to keep in sync, and non-determinism that
would make the acceptance gate meaningless. The corpus is a versioned in-repo
artefact searched at request time. That is retrieval; the infrastructure should
follow content volume, not fashion.

---

## 3. The hint ladder

| Level | Name | Rule |
| --- | --- | --- |
| 1 | Nudge | One question. Names no structure and no repair mechanism. |
| 2 | Concept reminder | The Swing rule, stated generally. |
| 3 | Structural clue | Names the mechanism to reach for. Still no code. |
| 4 | Worked explanation | Why the repair works. **Released only after success, or by teacher unlock.** |

Escalation is earned by **re-attempting**, not by asking again. A student who
asks twice without touching the canvas is told to try their idea first. Students
are capped at level 3.

---

## 4. The acceptance gate

`npm run eval:rag` — 138 cases (every misconception code × levels 1–3 × both
languages), run in two modes.

**Deterministic mode** (no model in the loop) — proves the system meets every
criterion with AI switched off:

```
retrieval precision 100%  ·  top-source accuracy 100%  ·  coverage 100%
contradiction rate 0%     ·  leakage rate 0%
```

**Adversarial mode** — a composer that deliberately leaks Java, invents
citations, contradicts the engine and answers in the wrong language:

```
zero model responses reach a student; every case still serves an approved hint
```

The gold standard in `src/coach/eval/cases.ts` is written by hand, independently
of the retrieval code, so a scoring regression is caught rather than ratified.

### The seven minimum-viable RAG criteria

1. ✅ Every supported misconception retrieves at least one approved chunk with a valid source id.
2. ✅ The final hint cites its retrieved source and never contradicts the engine finding.
3. ✅ Level 1 does not reveal the final code or the complete component tree.
4. ✅ English and Bahasa Malaysia outputs preserve the same Swing terminology.
5. ✅ Empty or low-confidence retrieval falls back to reviewed deterministic text.
6. ✅ Every request logs code, chunk ids, model/version, response, latency and outcome.
7. ✅ Teachers can disable AI and complete the challenge on deterministic feedback alone.

Criterion 7 is not a degraded mode. It is the default, and it is what makes a
network failure during judging a non-event.

---

## 5. Corpus governance

Content lives in `src/coach/corpus/entries.ts`, authored as bilingual pairs so a
reviewer checks technical equivalence side by side. Every chunk carries
`source_id`, `misconception_code`, `concept`, `learner_level`, `language`,
`hint_level`, `curriculum_tag`, `version` and `reviewer`.

**To add or change teaching content:**

1. Add an entry with both `en` and `ms` text and a new, never-reused `sourceId`.
2. Scope it to a misconception code, or to a family if it teaches the general idea.
3. Bump `version` and set `reviewer` to the initials of the teacher who approved it.
4. Run `npm test` — `validateCorpus()` enforces unique ids, non-empty text, a
   named reviewer, a well-formed version, and bilingual parity for every source.
5. Run `npm run eval:rag` — the gate fails if the change breaks retrieval
   precision, the ladder, or the zero-contradiction rule.
6. If you changed a gold-standard mapping, update `src/coach/eval/cases.ts`
   deliberately, as a reviewed judgement — never to make a failing gate pass.

Source ids are citations. They appear in exported classroom evidence, so
renaming one invalidates historical records; add a new id instead.

---

## 6. Evidence language

Use these exact framings. They are the difference between a defensible claim and
one a judge can dismantle in a single question.

| Say this | Not this |
| --- | --- |
| "Formative feedback suggests…" | "Students learned more" |
| "Technical acceptance confirmed on iPhone 13" | "The AR module works for everyone" |
| "The evaluation gate reports zero contradictions" | "The AI is never wrong" |
| "Learning gain was observed" — only after a same-learner pre/post design, with n | "Learning gain was observed" |
| "Potential to scale" | "Scales across institutions" |
| "Differentiated" | "Market-leading" |

Three kinds of evidence are separate and must not be blended:

- **Formative feedback** — what a small group of students said.
- **Technical acceptance** — devices, builds, automated tests, the RAG gate.
- **Causal learning evidence** — a same-learner pre/post design. **Not yet run.**

---

## 7. What is still missing

Honest gaps, in the order they block adoption:

- **No classroom pilot has been run.** The evidence plan (8–15 learners,
  five-item pre/post, repair rate, time, hint level) is designed but not
  executed. Until it is, there is no learning-gain claim of any kind.
- **No live-model evaluation.** The `coach-rag` function is deployed and
  smoke-tested (a handful of live calls, guard-passed), but that is not an
  evaluation: the gate proves no model output can reach a student unchecked, and
  it does not measure how good a live model's phrasing is across the corpus.
  That needs a scored run with a key and a rubric.
- **Teacher challenge authoring** does not exist. Teachers can run the lesson
  pack and export evidence, but cannot yet author their own challenges.
- **Cohort data is per-device.** A learner who switches machines starts a new
  label. Adequate for a single lesson, not for multi-week progression.
- **One lesson pack.** The BorderLayout SOUTH collision only. Expansion should
  follow proven repeat usage, not preference.
