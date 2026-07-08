/**
 * Swing-realistic preferred sizes for leaf components.
 *
 * Swing computes preferred sizes from FontMetrics + L&F insets; we approximate
 * the Metal L&F at its default 12pt Dialog font, using an injectable text
 * measurer so the engine stays framework-free and unit-testable in Node.
 */
import type { Size, SwingNode } from './types'

/** Returns the pixel width of `text` in the canvas font. Height is constant. */
export type TextMeasurer = (text: string) => number

export const LINE_HEIGHT = 16

export function createCanvasMeasurer(font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`): TextMeasurer {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  const cache = new Map<string, number>()
  return (text: string) => {
    let w = cache.get(text)
    if (w === undefined) {
      w = Math.ceil(ctx.measureText(text).width)
      cache.set(text, w)
    }
    return w
  }
}

/** Deterministic measurer for tests: 7px per character. */
export const testMeasurer: TextMeasurer = (text) => text.length * 7

export const DEFAULT_TEXTFIELD_COLUMNS = 10

/**
 * Preferred size of a non-container component. JPanel preferred size depends
 * on its layout manager and lives in layoutTree.ts to avoid a module cycle.
 */
export function leafPreferredSize(node: SwingNode, measure: TextMeasurer): Size {
  switch (node.type) {
    case 'JButton':
      // Metal: text + margin(2,14,2,14) + border
      return { width: measure(node.text) + 28, height: LINE_HEIGHT + 11 }
    case 'JLabel':
      return { width: Math.max(measure(node.text), 2), height: LINE_HEIGHT }
    case 'JTextField': {
      // JDK: columns * columnWidth (width of 'm') + insets
      const cols = node.columns ?? DEFAULT_TEXTFIELD_COLUMNS
      return { width: cols * measure('m') + 10, height: LINE_HEIGHT + 8 }
    }
    case 'JCheckBox':
      // 13px icon + icon-text gap + text + margins
      return { width: 20 + measure(node.text) + 6, height: LINE_HEIGHT + 6 }
    case 'JComboBox': {
      const items = node.items?.length ? node.items : [node.text]
      const maxItem = Math.max(...items.map(measure))
      // widest item + arrow button + insets
      return { width: maxItem + 32, height: LINE_HEIGHT + 10 }
    }
    case 'JPanel':
      throw new Error('JPanel preferred size is computed by layoutTree (it depends on the layout manager)')
  }
}
