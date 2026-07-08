import { useMemo, useRef, useState, type JSX } from 'react'

/* Tiny Java tokenizer for display purposes — keywords, types, strings, numbers, comments. */
const KEYWORDS = /\b(?:import|public|private|static|void|class|new|extends|implements|return)\b/g
const TYPES = /\b(?:JFrame|JButton|JLabel|JTextField|JCheckBox|JComboBox|JPanel|BorderLayout|FlowLayout|GridLayout|String)\b/g

function highlight(line: string): JSX.Element[] {
  const out: JSX.Element[] = []
  let key = 0
  const commentIdx = findCommentStart(line)
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : ''

  // strings first, then keywords/types/numbers inside non-string spans
  const stringRe = /"(?:[^"\\]|\\.)*"/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = stringRe.exec(codePart))) {
    if (m.index > last) out.push(...plainTokens(codePart.slice(last, m.index), () => key++))
    out.push(
      <span key={key++} className="tok-str">
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < codePart.length) out.push(...plainTokens(codePart.slice(last), () => key++))
  if (commentPart) {
    out.push(
      <span key={key++} className="tok-com">
        {commentPart}
      </span>,
    )
  }
  return out
}

/** Index of a // that is not inside a string literal. */
function findCommentStart(line: string): number {
  let inString = false
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i]
    if (ch === '"' && line[i - 1] !== '\\') inString = !inString
    else if (!inString && ch === '/' && line[i + 1] === '/') return i
  }
  return -1
}

function plainTokens(text: string, nextKey: () => number): JSX.Element[] {
  const out: JSX.Element[] = []
  const re = new RegExp(`${KEYWORDS.source}|${TYPES.source}|\\b\\d+\\b`, 'g')
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={nextKey()}>{text.slice(last, m.index)}</span>)
    const cls = /^\d/.test(m[0]) ? 'tok-num' : KEYWORDS.source.includes(m[0]) ? 'tok-kw' : 'tok-type'
    out.push(
      <span key={nextKey()} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={nextKey()}>{text.slice(last)}</span>)
  return out
}

/** LCS-based line diff: marks lines in `next` that are not part of the common subsequence. */
function changedLines(prev: string[], next: string[]): boolean[] {
  const n = prev.length
  const m = next.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = prev[i] === next[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const changed = new Array<boolean>(m).fill(true)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (prev[i] === next[j]) {
      changed[j] = false
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
  return changed
}

interface CodePanelProps {
  code: string
  /** Java variable name of the selected component, for subtle cross-highlighting. */
  selectedVar: string | null
}

export function CodePanel({ code, selectedVar }: CodePanelProps) {
  const [copied, setCopied] = useState(false)
  const prevRef = useRef<string[]>([])
  const genRef = useRef(0)

  const lines = useMemo(() => code.split('\n'), [code])
  const { changed, gen } = useMemo(() => {
    const prev = prevRef.current
    const changed = prev.length ? changedLines(prev, lines) : lines.map(() => false)
    prevRef.current = lines
    genRef.current += 1
    return { changed, gen: genRef.current }
  }, [lines])

  const selRe = useMemo(() => (selectedVar ? new RegExp(`\\b${selectedVar}\\b`) : null), [selectedVar])

  return (
    <section className="code-pane" aria-label="Generated Java code">
      <div className="code-header">
        <span className="code-filename">LayoutDemo.java</span>
        <button
          type="button"
          className="ghost-btn"
          onClick={async () => {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <div className="code-scroll">
        {lines.map((line, i) => (
          <div
            key={`${gen}-${i}`}
            className={`code-line${changed[i] ? ' flash' : ''}${selRe?.test(line) ? ' sel' : ''}`}
          >
            <span className="ln">{i + 1}</span>
            <pre>{highlight(line)}</pre>
          </div>
        ))}
      </div>
    </section>
  )
}
