/**
 * Statement-by-statement execution of Parsons code magnets against the same
 * component-tree model the Playground renders. Order must matter exactly as
 * it does in Swing:
 *
 * - Using a variable before its declaration is an error on that statement
 *   (rendered as a visible error state, never silently skipped).
 * - `Container.add` re-parents: adding a component that already sits in
 *   another container removes it there first (JDK addImpl behavior).
 * - Constraint-based managers only lay out components that were added while
 *   THAT manager was installed. `panel.add(b); panel.setLayout(new
 *   BorderLayout())` leaves `b` unknown to the new manager, so Swing never
 *   sizes it — it is invisible. We model this with a per-container manager
 *   generation; BorderLayout containers drop children registered under an
 *   older generation and report them as `unmanaged`.
 * - FlowLayout/GridLayout iterate getComponents() and ignore registration,
 *   so for them add-order alone decides the outcome — also like the JDK.
 */
import type { BorderRegion, LayoutSpec, SwingChild, SwingNode } from '../engine/types'
import { DEFAULT_LAYOUTS } from '../engine/types'
import { FRAME_VAR, type Stmt } from './types'

export interface StmtResult {
  ok: boolean
  /** javac-flavored message shown on the magnet's error indicator. */
  error?: string
}

export interface UnmanagedChild {
  varName: string
  containerVar: string
}

export interface ExecResult {
  /** Render tree rooted at the frame content pane (id: 'frame'). */
  root: SwingNode
  /** One entry per executed statement, in execution order. */
  results: StmtResult[]
  /** Children a constraint-based manager never registered — invisible in Swing. */
  unmanaged: UnmanagedChild[]
  /** True when every statement executed without error. */
  clean: boolean
}

interface Entry {
  varName: string
  type: SwingNode['type']
  text: string
  columns?: number
  items?: string[]
  layout: LayoutSpec | null
  /** Bumped by setLayout — models "a new manager instance was installed". */
  layoutGen: number
  children: { child: Entry; constraint?: BorderRegion; gen: number }[]
  parent: Entry | null
}

function isContainer(e: Entry): boolean {
  return e.type === 'JPanel'
}

function isAncestor(maybeAncestor: Entry, of: Entry): boolean {
  for (let p: Entry | null = of; p; p = p.parent) {
    if (p === maybeAncestor) return true
  }
  return false
}

export function executeStatements(stmts: Stmt[]): ExecResult {
  const frame: Entry = {
    varName: FRAME_VAR,
    type: 'JPanel',
    text: '',
    layout: { kind: 'border', hgap: 0, vgap: 0 }, // JFrame content pane default
    layoutGen: 0,
    children: [],
    parent: null,
  }
  const vars = new Map<string, Entry>([[FRAME_VAR, frame]])
  const results: StmtResult[] = []

  const fail = (error: string) => results.push({ ok: false, error })
  const pass = () => results.push({ ok: true })

  for (const stmt of stmts) {
    switch (stmt.kind) {
      case 'declare': {
        if (vars.has(stmt.varName)) {
          fail(`variable ${stmt.varName} is already defined`)
          break
        }
        const c = stmt.component
        vars.set(stmt.varName, {
          varName: stmt.varName,
          type: c.type,
          text: c.text,
          columns: c.columns,
          items: c.items,
          layout: c.type === 'JPanel' ? { ...(c.layout ?? DEFAULT_LAYOUTS.flow) } : null,
          layoutGen: 0,
          children: [],
          parent: null,
        })
        pass()
        break
      }
      case 'setLayout': {
        const target = vars.get(stmt.target)
        if (!target) {
          fail(`cannot find symbol: ${stmt.target}`)
          break
        }
        if (!isContainer(target)) {
          fail(`${stmt.target} is not a container`)
          break
        }
        target.layout = { ...stmt.spec }
        target.layoutGen += 1
        pass()
        break
      }
      case 'add': {
        const target = vars.get(stmt.target)
        const child = vars.get(stmt.child)
        if (!target) {
          fail(`cannot find symbol: ${stmt.target}`)
          break
        }
        if (!child) {
          fail(`cannot find symbol: ${stmt.child}`)
          break
        }
        if (!isContainer(target)) {
          fail(`${stmt.target} is not a container`)
          break
        }
        if (isAncestor(child, target)) {
          fail('adding container’s parent to itself')
          break
        }
        if (child.parent) {
          // Container.add re-parents: remove from the previous container first.
          child.parent.children = child.parent.children.filter((c) => c.child !== child)
        }
        child.parent = target
        target.children.push({ child, constraint: stmt.constraint, gen: target.layoutGen })
        pass()
        break
      }
    }
  }

  const unmanaged: UnmanagedChild[] = []
  const toNode = (e: Entry): SwingNode => {
    const node: SwingNode = { id: e.varName, type: e.type, text: e.text }
    if (e.columns !== undefined) node.columns = e.columns
    if (e.items !== undefined) node.items = e.items
    if (e.type === 'JPanel') {
      node.layout = e.layout!
      const kids: SwingChild[] = []
      for (const c of e.children) {
        // Only constraint-based managers track registration; Flow/Grid walk
        // getComponents() and lay out everything.
        if (e.layout!.kind === 'border' && c.gen !== e.layoutGen) {
          unmanaged.push({ varName: c.child.varName, containerVar: e.varName })
          continue
        }
        kids.push({ node: toNode(c.child), constraint: c.constraint })
      }
      node.children = kids
    }
    return node
  }

  const root = toNode(frame)
  return { root, results, unmanaged, clean: results.every((r) => r.ok) }
}
