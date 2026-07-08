import type { BorderRegion, ComponentType, LayoutSpec, Size, SwingChild, SwingNode } from '../engine/types'
import { DEFAULT_LAYOUTS } from '../engine/types'

export interface PlaygroundState {
  root: SwingNode
  frameSize: Size
  selectedId: string
  past: Snapshot[]
  future: Snapshot[]
}

interface Snapshot {
  root: SwingNode
  frameSize: Size
  selectedId: string
}

export const MIN_FRAME: Size = { width: 180, height: 140 }

export const initialState: PlaygroundState = {
  root: { id: 'root', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children: [] },
  frameSize: { width: 480, height: 340 },
  selectedId: 'root',
  past: [],
  future: [],
}

let nodeCounter = 0

export function makeNode(type: ComponentType): SwingNode {
  const id = `n${++nodeCounter}-${Math.random().toString(36).slice(2, 7)}`
  switch (type) {
    case 'JButton':
      return { id, type, text: 'Button' }
    case 'JLabel':
      return { id, type, text: 'Label' }
    case 'JTextField':
      return { id, type, text: '', columns: 10 }
    case 'JCheckBox':
      return { id, type, text: 'Check me' }
    case 'JComboBox':
      return { id, type, text: 'Item 1', items: ['Item 1', 'Item 2', 'Item 3'] }
    case 'JPanel':
      return { id, type, text: '', layout: { ...DEFAULT_LAYOUTS.flow }, children: [] }
  }
}

export function findNode(root: SwingNode, id: string): SwingNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const found = findNode(child.node, id)
    if (found) return found
  }
  return null
}

export function findParent(root: SwingNode, id: string): SwingNode | null {
  for (const child of root.children ?? []) {
    if (child.node.id === id) return root
    const found = findParent(child.node, id)
    if (found) return found
  }
  return null
}

function mapNode(node: SwingNode, id: string, fn: (n: SwingNode) => SwingNode): SwingNode {
  if (node.id === id) return fn(node)
  if (!node.children?.length) return node
  let changed = false
  const children = node.children.map((c) => {
    const next = mapNode(c.node, id, fn)
    if (next !== c.node) {
      changed = true
      return { ...c, node: next }
    }
    return c
  })
  return changed ? { ...node, children } : node
}

/** Immutable add — exported for drop-preview trees too. */
export function addChild(root: SwingNode, parentId: string, node: SwingNode, constraint?: BorderRegion): SwingNode {
  return mapNode(root, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children ?? []), { node, constraint } satisfies SwingChild],
  }))
}

function removeChild(node: SwingNode, id: string): SwingNode {
  if (!node.children?.length) return node
  const filtered = node.children.filter((c) => c.node.id !== id)
  if (filtered.length !== node.children.length) return { ...node, children: filtered }
  let changed = false
  const children = node.children.map((c) => {
    const next = removeChild(c.node, id)
    if (next !== c.node) {
      changed = true
      return { ...c, node: next }
    }
    return c
  })
  return changed ? { ...node, children } : node
}

/** First free BorderLayout region for click-to-add, most useful first. */
export function firstFreeRegion(container: SwingNode): BorderRegion {
  const order: BorderRegion[] = ['CENTER', 'NORTH', 'SOUTH', 'WEST', 'EAST']
  const used = new Set((container.children ?? []).map((c) => c.constraint ?? 'CENTER'))
  return order.find((r) => !used.has(r)) ?? 'CENTER'
}

export type Action =
  | { type: 'add'; parentId: string; node: SwingNode; constraint?: BorderRegion }
  | { type: 'remove'; id: string }
  | { type: 'setLayout'; containerId: string; spec: LayoutSpec }
  | { type: 'setText'; id: string; text: string }
  | { type: 'resizeFrame'; size: Size }
  | { type: 'select'; id: string }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }

function snapshot(state: PlaygroundState): Snapshot {
  return { root: state.root, frameSize: state.frameSize, selectedId: state.selectedId }
}

function withHistory(state: PlaygroundState, next: Partial<PlaygroundState>): PlaygroundState {
  return {
    ...state,
    ...next,
    past: [...state.past.slice(-49), snapshot(state)],
    future: [],
  }
}

export function reducer(state: PlaygroundState, action: Action): PlaygroundState {
  switch (action.type) {
    case 'add':
      return withHistory(state, {
        root: addChild(state.root, action.parentId, action.node, action.constraint),
        selectedId: action.node.id,
      })
    case 'remove': {
      if (action.id === 'root') return state
      const parent = findParent(state.root, action.id)
      return withHistory(state, {
        root: removeChild(state.root, action.id),
        selectedId: parent?.id ?? 'root',
      })
    }
    case 'setLayout':
      return withHistory(state, {
        root: mapNode(state.root, action.containerId, (n) => ({ ...n, layout: action.spec })),
      })
    case 'setText':
      return withHistory(state, {
        root: mapNode(state.root, action.id, (n) => ({ ...n, text: action.text })),
      })
    case 'resizeFrame':
      return withHistory(state, { frameSize: action.size })
    case 'select':
      return { ...state, selectedId: action.id }
    case 'clear':
      return withHistory(state, { root: { ...initialState.root, children: [] }, selectedId: 'root' })
    case 'undo': {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return {
        ...state,
        root: prev.root,
        frameSize: prev.frameSize,
        selectedId: findNode(prev.root, prev.selectedId) ? prev.selectedId : 'root',
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, 50),
      }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        root: next.root,
        frameSize: next.frameSize,
        selectedId: findNode(next.root, next.selectedId) ? next.selectedId : 'root',
        past: [...state.past, snapshot(state)],
        future: state.future.slice(1),
      }
    }
  }
}

/** The container the layout controls edit: the selected panel, the selected leaf's parent, or the root. */
export function activeContainer(state: PlaygroundState): SwingNode {
  const selected = findNode(state.root, state.selectedId)
  if (!selected) return state.root
  if (selected.type === 'JPanel') return selected
  return findParent(state.root, selected.id) ?? state.root
}
