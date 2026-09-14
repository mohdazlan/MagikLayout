import { describe, expect, it } from 'vitest'
import { COMPONENTS, initialState, javaFor, lessonTree, sceneFor, update, type LabState } from './model'

function buildComplete(): LabState {
  let s = update(initialState(), { type: 'lesson', lesson: 'build' })
  for (const [index, region] of [[4, 'NORTH'], [1, 'CENTER'], [0, 'SOUTH']] as const) {
    s = update(s, { type: 'component', index }); s = update(s, { type: 'place', region })
  }
  return update(s, { type: 'check' })
}
describe('Swing Discovery learning loop', () => {
  it('starts with one floating JButton and only adds it to Java when placed', () => {
    const s = initialState()
    expect(sceneFor(s).pieces.map(p => p.type)).toEqual(['JButton'])
    expect(javaFor(s)).toContain('new JButton("Click Me")')
    expect(javaFor(s)).not.toContain('frame.add(button1)')
    const placed = update(s, { type: 'place' })
    expect(lessonTree(placed).children).toHaveLength(1)
    expect(javaFor(placed)).toContain('frame.add(button1)')
  })
  it('switches all five specimens with matching constructors and a root-only JFrame', () => {
    COMPONENTS.forEach((component, index) => {
      const s = update(initialState(), { type: 'component', index })
      expect(sceneFor(s).pieces[0].type).toBe(component.type)
      expect(javaFor(s)).toContain(`new ${component.type}(`)
      if (component.type === 'JFrame') expect(lessonTree(update(s, { type: 'place' })).children).toEqual([])
    })
  })
  it('keeps layout exploration code-free until the learner requests Java', () => {
    let s = update(initialState(), { type: 'lesson', lesson: 'layouts' })
    expect(s.revealed).toBe(false)
    s = update(s, { type: 'layout', layout: 'flow' })
    expect(javaFor(s)).toContain('new FlowLayout')
    s = update(s, { type: 'layout', layout: 'border' })
    expect(javaFor(s)).toContain('frame.add(button1, BorderLayout.NORTH)')
    expect(s.completed).toContain('layouts')
    expect(s.revealed).toBe(false)
  })
  it('gives missing-component feedback for an empty target rebuild', () => {
    const s = update(update(initialState(), { type: 'lesson', lesson: 'build' }), { type: 'check' })
    expect(s.buildPassed).toBe(false)
    expect(s.feedback).toContain('Missing')
    expect(update(s, { type: 'reveal' }).revealed).toBe(false)
  })
  it('checks structural correctness and reveals Java after an accurate rebuild', () => {
    const s = buildComplete()
    expect(s.buildPassed).toBe(true)
    expect(s.revealed).toBe(true)
    expect(s.completed).toContain('build')
  })
  it('revokes the build result when a correct region is changed', () => {
    let s = update(buildComplete(), { type: 'component', index: 0 })
    s = update(s, { type: 'place', region: 'NORTH' })
    expect(s.buildPassed).toBe(false)
    expect(s.revealed).toBe(false)
    expect(s.completed).not.toContain('build')
    expect(update(s, { type: 'check' }).buildPassed).toBe(false)
  })
  it('keeps the hidden button in the broken tree, then nests both controls during repair', () => {
    let s = update(initialState(), { type: 'lesson', lesson: 'debug' })
    expect(lessonTree(s).children).toHaveLength(2)
    expect(sceneFor(s).pieces.some(p => p.id === 'save')).toBe(false)
    expect(update(s, { type: 'repair' }).repaired).toBe(false)
    s = update(s, { type: 'inspect' })
    expect(sceneFor(s).pieces.some(p => p.ghost)).toBe(true)
    s = update(s, { type: 'repair' })
    expect(lessonTree(s).children).toHaveLength(1)
    expect(lessonTree(s).children![0].node.children).toHaveLength(2)
    expect(javaFor(s)).toContain('frame.add(panel1, BorderLayout.SOUTH)')
    expect(s.completed).toContain('debug')
  })
  it('runs an event only after a listener is attached', () => {
    let s = update(initialState(), { type: 'lesson', lesson: 'events' })
    s = update(s, { type: 'tap' }); expect(s.clicks).toBe(0)
    expect(javaFor(s)).not.toContain('addActionListener')
    s = update(s, { type: 'listener' }); s = update(s, { type: 'tap' })
    expect(s.clicks).toBe(1)
    expect(sceneFor(s).pieces.find(p => p.id === 'event-status')?.text).toBe('You clicked the button!')
    expect(javaFor(s)).toContain('label1.setText("You clicked the button!")')
    expect(s.completed).toContain('events')
  })
  it('resets just the current activity and keeps other explored activities', () => {
    const s = update({ ...buildComplete(), completed: ['build', 'events'] }, { type: 'reset' })
    expect(s.build).toEqual([])
    expect(s.completed).toEqual(['events'])
  })
  it('treats 3D magnification as a viewing aid rather than a Swing size change', () => {
    const s = initialState()
    expect(javaFor(update(s, { type: 'scale', value: 1.4 }))).toBe(javaFor(s))
    expect(javaFor(update(s, { type: 'width', value: 510 }))).toContain('frame.setSize(510, 300)')
    expect(update(s, { type: 'width', value: NaN })).toEqual(s)
  })
})
