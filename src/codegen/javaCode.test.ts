import { describe, expect, it } from 'vitest'
import { generateJava, layoutConstructor } from './javaCode'
import type { SwingNode } from '../engine/types'

describe('layoutConstructor', () => {
  it('collapses to the shortest real Java constructor', () => {
    expect(layoutConstructor({ kind: 'border', hgap: 0, vgap: 0 }).expr).toBe('new BorderLayout()')
    expect(layoutConstructor({ kind: 'border', hgap: 8, vgap: 4 }).expr).toBe('new BorderLayout(8, 4)')
    expect(layoutConstructor({ kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }).expr).toBe('new FlowLayout()')
    expect(layoutConstructor({ kind: 'flow', align: 'LEFT', hgap: 5, vgap: 5 }).expr).toBe('new FlowLayout(FlowLayout.LEFT)')
    expect(layoutConstructor({ kind: 'flow', align: 'RIGHT', hgap: 10, vgap: 2 }).expr).toBe(
      'new FlowLayout(FlowLayout.RIGHT, 10, 2)',
    )
    expect(layoutConstructor({ kind: 'grid', rows: 2, cols: 3, hgap: 0, vgap: 0 }).expr).toBe('new GridLayout(2, 3)')
    expect(layoutConstructor({ kind: 'grid', rows: 2, cols: 3, hgap: 4, vgap: 4 }).expr).toBe('new GridLayout(2, 3, 4, 4)')
  })
})

describe('generateJava', () => {
  it('emits compilable code with per-type variable counters and nested panels', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: { id: 'a', type: 'JButton', text: 'Save' }, constraint: 'NORTH' },
        {
          node: {
            id: 'p',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 1, cols: 2, hgap: 0, vgap: 0 },
            children: [
              { node: { id: 'b', type: 'JButton', text: 'OK' } },
              { node: { id: 'c', type: 'JLabel', text: 'Name:' } },
            ],
          },
          constraint: 'CENTER',
        },
      ],
    }
    const { code, varNames } = generateJava(root, { width: 480, height: 340 })
    expect(code).toContain('JButton button1 = new JButton("Save");')
    expect(code).toContain('frame.add(button1, BorderLayout.NORTH);')
    expect(code).toContain('JPanel panel1 = new JPanel(new GridLayout(1, 2));')
    expect(code).toContain('JButton button2 = new JButton("OK");')
    expect(code).toContain('panel1.add(button2);')
    expect(code).toContain('frame.add(panel1, BorderLayout.CENTER);')
    expect(code).toContain('frame.setSize(480, 340);')
    expect(varNames.get('b')).toBe('button2')
    // declaration order: construction precedes add
    expect(code.indexOf('JButton button2')).toBeLessThan(code.indexOf('panel1.add(button2)'))
  })

  it('escapes quotes in user text', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [{ node: { id: 'a', type: 'JLabel', text: 'Say "hi"' } }],
    }
    expect(generateJava(root, { width: 100, height: 100 }).code).toContain('new JLabel("Say \\"hi\\"")')
  })
})
