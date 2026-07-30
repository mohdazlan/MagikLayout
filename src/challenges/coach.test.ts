import { describe, expect, it } from 'vitest'
import { buildCoachRequest, coachConfigured } from './coach'

describe('coach request builder', () => {
  it('packages the engine findings verbatim, adding nothing', () => {
    const findings = ['Missing from your build: a JButton “Clear”.', 'Not in the target: a JLabel “Total”.']
    const req = buildCoachRequest({
      mode: 'reverse',
      challengeTitle: 'Mukah Airport canteen receipt',
      prompt: 'Rebuild the canteen receipt panel…',
      findings,
      studentCode: 'frame.add(button1, BorderLayout.SOUTH);',
      language: 'ms',
    })
    expect(req.mode).toBe('reverse')
    expect(req.language).toBe('ms')
    // the coach only ever forwards the engine's own findings — same array, same order
    expect(req.findings).toEqual(findings)
    expect(req.challengeTitle).toBe('Mukah Airport canteen receipt')
    expect(req.studentCode).toContain('BorderLayout.SOUTH')
  })

  it('carries the mode for every challenge type', () => {
    for (const mode of ['reverse', 'parsons', 'reflow'] as const) {
      expect(buildCoachRequest({ mode, challengeTitle: 't', prompt: 'p', findings: ['f'], studentCode: 'c', language: 'en' }).mode).toBe(mode)
    }
  })

  it('carries no answer-key fields — only what the student already saw or the engine computed', () => {
    const req = buildCoachRequest({
      mode: 'reverse',
      challengeTitle: 't',
      prompt: 'p',
      findings: ['f'],
      studentCode: 'c',
      language: 'en',
    })
    // guardrail: the request must never contain the target tree or a solution
    expect(Object.keys(req).sort()).toEqual(
      ['challengeTitle', 'findings', 'language', 'mode', 'prompt', 'studentCode'].sort(),
    )
  })

  it('reports itself unconfigured when no backend URL is set (default dev build)', () => {
    // VITE_COACH_URL is unset under vitest → the coach stays dormant, app unaffected
    expect(coachConfigured()).toBe(false)
  })
})
