/**
 * Print the RAG acceptance gate in both modes.
 *
 *   npm run eval:rag
 *
 * The output is meant to be pasted into the project report and re-run
 * immediately before submission, so the figures quoted are always the ones the
 * current repository produces. Exits non-zero when the gate fails.
 *
 * Bundled through esbuild (already present via vite) and piped into node, so
 * the report needs no extra dependency. The same gate also runs as a unit test
 * in src/coach/eval/eval.test.ts — this script only makes it readable.
 */
import { formatReport, runEval } from '../src/coach/eval/runEval'

const modes = ['deterministic', 'adversarial'] as const

const reports = []
for (const mode of modes) {
  const report = await runEval(mode)
  reports.push(report)
  console.log(formatReport(report))
  console.log('')
}

process.exit(reports.every((r) => r.pass) ? 0 : 1)
