/**
 * Class session and cohort evidence.
 *
 * The teacher's half of the surface: open a session, read the code out, watch
 * the misconceptions accumulate, export the evidence. Every number shown comes
 * from summarizeCohort over the deterministic log — a model never contributes
 * to a figure a teacher reports.
 *
 * Rates render as an em dash until there is something to divide by. A teacher
 * looking at "—" knows no repair outcome has been recorded yet; a teacher
 * looking at "0%" would reasonably conclude the class is failing.
 */
import { useMemo, useState } from 'react'
import { toCsv } from '../coach/log'
import { buildEvidenceBundle, formatRate, summarizeCohort } from './cohort'
import { joinLink, type ClassSession } from './session'
import { coachLog } from './store'

export function SessionPanel(props: {
  session: ClassSession
  onChange: (session: ClassSession) => void
  onEnd: () => void
}) {
  const [tick, setTick] = useState(0)
  const records = useMemo(() => [...coachLog().all()], [tick])
  const summary = useMemo(() => summarizeCohort(props.session.code, records), [props.session.code, records])
  const link = joinLink(props.session.code)

  const download = (filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () =>
    download(`magiklayout-${props.session.code}.csv`, toCsv(records.filter((r) => r.sessionId === props.session.code)), 'text/csv')

  const exportJson = () =>
    download(
      `magiklayout-${props.session.code}.json`,
      JSON.stringify(buildEvidenceBundle({ session: props.session, records }), null, 2),
      'application/json',
    )

  return (
    <div className="cl-session">
      <section className="cl-session-head">
        <div>
          <p className="cl-session-label">{props.session.label || 'Untitled class'}</p>
          <p className="cl-session-code" aria-label="Class session code">
            {props.session.code}
          </p>
          <p className="cl-session-link">
            <a href={link}>{link}</a>
          </p>
        </div>
        <div className="cl-session-controls">
          <label className="cl-check">
            <input
              type="checkbox"
              checked={props.session.aiEnabled}
              onChange={(e) => props.onChange({ ...props.session, aiEnabled: e.target.checked })}
            />
            <span>
              AI composer on
              <em className="cl-check-note">Off is fully supported — approved hints answer every case.</em>
            </span>
          </label>
          <button type="button" className="cl-btn" onClick={() => setTick((n) => n + 1)}>
            Refresh
          </button>
          <button type="button" className="cl-btn cl-btn-quiet" onClick={props.onEnd}>
            End session
          </button>
        </div>
      </section>

      <p className="cl-privacy">
        No accounts, no names. Learners are labelled per device (for example <code>L-7QK4</code>) and repair outcomes
        come from the layout engine, not from a model.
      </p>

      <section aria-label="Cohort summary">
        <ul className="cl-metrics">
          <Metric value={String(summary.learners)} label="learners" />
          <Metric value={String(summary.episodes)} label="episodes" />
          <Metric value={formatRate(summary.repairRate)} label="repair rate" />
          <Metric value={formatRate(summary.hintIndependence)} label="hint independence" />
          <Metric value={String(summary.hintRequests)} label="hints served" />
          <Metric value={String(summary.withheld)} label="ladder held back" />
        </ul>

        {summary.byMisconception.length === 0 ? (
          <p className="cl-empty">
            Nothing recorded yet. Run the Coach Lab, or have learners work the linked challenges, and the misconceptions
            will appear here.
          </p>
        ) : (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <caption className="cl-table-caption">Misconceptions in this session, most frequent first</caption>
              <thead>
                <tr>
                  <th scope="col">Misconception</th>
                  <th scope="col">Family</th>
                  <th scope="col">Occurrences</th>
                  <th scope="col">Learners</th>
                </tr>
              </thead>
              <tbody>
                {summary.byMisconception.map((row) => (
                  <tr key={row.code}>
                    <th scope="row"><code>{row.code}</code></th>
                    <td>{row.family}</td>
                    <td>{row.occurrences}</td>
                    <td>{row.learners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {summary.guardViolations > 0 && (
          <p className="cl-violations">
            {summary.guardViolations} guard violation{summary.guardViolations === 1 ? '' : 's'} caught this session — a
            model response was rejected and approved text was served instead. Learners were unaffected.
          </p>
        )}
      </section>

      <div className="cl-actions">
        <button type="button" className="cl-btn" onClick={exportCsv} disabled={records.length === 0}>
          Export CSV
        </button>
        <button type="button" className="cl-btn" onClick={exportJson} disabled={records.length === 0}>
          Export evidence bundle
        </button>
        <button
          type="button"
          className="cl-btn cl-btn-quiet"
          onClick={() => {
            coachLog().clear()
            setTick((n) => n + 1)
          }}
        >
          Clear log
        </button>
      </div>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <li className="cl-metric">
      <span className="cl-metric-value">{value}</span>
      <span className="cl-metric-label">{label}</span>
    </li>
  )
}
