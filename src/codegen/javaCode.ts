/**
 * Deterministic Java source generation from the component tree.
 * No LLM anywhere near this: the code panel is ground truth, so it must be
 * instant, reproducible, and compilable vanilla javax.swing / java.awt.
 */
import type { LayoutSpec, Size, SwingChild, SwingNode } from '../engine/types'
import { DEFAULT_TEXTFIELD_COLUMNS } from '../engine/metrics'

const TYPE_VAR_PREFIX: Record<SwingNode['type'], string> = {
  JButton: 'button',
  JLabel: 'label',
  JTextField: 'textField',
  JCheckBox: 'checkBox',
  JComboBox: 'comboBox',
  JPanel: 'panel',
}

function escape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function layoutConstructor(spec: LayoutSpec): { expr: string; comment?: string } {
  switch (spec.kind) {
    case 'border':
      if (spec.hgap === 0 && spec.vgap === 0) {
        return { expr: 'new BorderLayout()', comment: 'already the JFrame default' }
      }
      return { expr: `new BorderLayout(${spec.hgap}, ${spec.vgap})` }
    case 'flow':
      if (spec.align === 'CENTER' && spec.hgap === 5 && spec.vgap === 5) {
        return { expr: 'new FlowLayout()' }
      }
      if (spec.hgap === 5 && spec.vgap === 5) {
        return { expr: `new FlowLayout(FlowLayout.${spec.align})` }
      }
      return { expr: `new FlowLayout(FlowLayout.${spec.align}, ${spec.hgap}, ${spec.vgap})` }
    case 'grid':
      if (spec.hgap === 0 && spec.vgap === 0) {
        return { expr: `new GridLayout(${spec.rows}, ${spec.cols})` }
      }
      return { expr: `new GridLayout(${spec.rows}, ${spec.cols}, ${spec.hgap}, ${spec.vgap})` }
  }
}

export interface GeneratedCode {
  code: string
  /** node id → Java variable name, for cross-highlighting UI ↔ code */
  varNames: Map<string, string>
}

export function generateJava(root: SwingNode, frameSize: Size): GeneratedCode {
  const counters = new Map<string, number>()
  const varNames = new Map<string, string>()
  const lines: string[] = []

  const nextVar = (node: SwingNode): string => {
    const prefix = TYPE_VAR_PREFIX[node.type]
    const n = (counters.get(prefix) ?? 0) + 1
    counters.set(prefix, n)
    const name = `${prefix}${n}`
    varNames.set(node.id, name)
    return name
  }

  const emitConstruction = (node: SwingNode, indent: string): string => {
    const v = nextVar(node)
    switch (node.type) {
      case 'JButton':
        lines.push(`${indent}JButton ${v} = new JButton("${escape(node.text)}");`)
        break
      case 'JLabel':
        lines.push(`${indent}JLabel ${v} = new JLabel("${escape(node.text)}");`)
        break
      case 'JTextField':
        lines.push(`${indent}JTextField ${v} = new JTextField(${node.columns ?? DEFAULT_TEXTFIELD_COLUMNS});`)
        break
      case 'JCheckBox':
        lines.push(`${indent}JCheckBox ${v} = new JCheckBox("${escape(node.text)}");`)
        break
      case 'JComboBox': {
        const items = (node.items?.length ? node.items : [node.text]).map((s) => `"${escape(s)}"`).join(', ')
        lines.push(`${indent}JComboBox<String> ${v} = new JComboBox<>(new String[] { ${items} });`)
        break
      }
      case 'JPanel': {
        const spec = node.layout!
        if (spec.kind === 'flow' && spec.align === 'CENTER' && spec.hgap === 5 && spec.vgap === 5) {
          lines.push(`${indent}JPanel ${v} = new JPanel(); // FlowLayout by default`)
        } else {
          lines.push(`${indent}JPanel ${v} = new JPanel(${layoutConstructor(spec).expr});`)
        }
        for (const child of node.children ?? []) {
          const childVar = emitConstruction(child.node, indent)
          lines.push(`${indent}${v}.add(${addArgs(childVar, node.layout!, child)});`)
        }
        break
      }
    }
    return v
  }

  const addArgs = (childVar: string, parentSpec: LayoutSpec, child: SwingChild): string => {
    if (parentSpec.kind === 'border') {
      return `${childVar}, BorderLayout.${child.constraint ?? 'CENTER'}`
    }
    return childVar
  }

  const rootSpec = root.layout!
  const ctor = layoutConstructor(rootSpec)

  lines.push('import java.awt.*;')
  lines.push('import javax.swing.*;')
  lines.push('')
  lines.push('public class LayoutDemo {')
  lines.push('')
  lines.push('    public static void main(String[] args) {')
  lines.push('        JFrame frame = new JFrame("LayoutLab");')
  lines.push('        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);')
  lines.push(`        frame.setLayout(${ctor.expr});${ctor.comment ? ` // ${ctor.comment}` : ''}`)

  const children = root.children ?? []
  for (const child of children) {
    lines.push('')
    const childVar = emitConstruction(child.node, '        ')
    lines.push(`        frame.add(${addArgs(childVar, rootSpec, child)});`)
  }

  lines.push('')
  lines.push(`        frame.setSize(${frameSize.width}, ${frameSize.height}); // includes the title bar`)
  lines.push('        frame.setVisible(true);')
  lines.push('    }')
  lines.push('}')

  return { code: lines.join('\n'), varNames }
}
