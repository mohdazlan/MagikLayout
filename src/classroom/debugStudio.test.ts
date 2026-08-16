import { describe, expect, it } from 'vitest'
import { STUDIO_MISSIONS, isCorrectPrediction, nextRepairStage, repairPasses, studioProgress } from './debugStudio'

describe('AI Debugging Studio mission catalogue', () => {
  it('contains at least ten real engine-diagnosed missions', () => {
    expect(STUDIO_MISSIONS.length).toBeGreaterThanOrEqual(10)
    expect(new Set(STUDIO_MISSIONS.map((mission) => mission.id)).size).toBe(STUDIO_MISSIONS.length)
    expect(STUDIO_MISSIONS.every((mission) => mission.diagnosis.code !== 'UNKNOWN')).toBe(true)
  })

  it('covers multiple managers and misconception families', () => {
    expect(new Set(STUDIO_MISSIONS.map((mission) => mission.manager)).size).toBeGreaterThanOrEqual(4)
    expect(new Set(STUDIO_MISSIONS.map((mission) => mission.diagnosis.family)).size).toBeGreaterThanOrEqual(5)
  })

  it('gives every mission one unambiguous prediction', () => {
    for (const mission of STUDIO_MISSIONS) {
      const correct = mission.predictions.filter((prediction) => prediction.correct)
      expect(correct).toHaveLength(1)
      expect(isCorrectPrediction(mission, correct[0].id)).toBe(true)
    }
  })

  it('requires two actions and grades only the final target as repaired', () => {
    expect(nextRepairStage('broken')).toBe('tool-ready')
    expect(nextRepairStage('tool-ready')).toBe('repaired')
    expect(nextRepairStage('repaired')).toBe('repaired')
    expect([studioProgress('broken'), studioProgress('tool-ready'), studioProgress('repaired')]).toEqual([1, 2, 3])
    for (const mission of STUDIO_MISSIONS) {
      expect(repairPasses(mission, 'broken')).toBe(false)
      expect(repairPasses(mission, 'repaired')).toBe(true)
    }
  })

  it('ships visual, code, structure, and inspector evidence for every stage', () => {
    for (const mission of STUDIO_MISSIONS) {
      for (const stage of ['broken', 'tool-ready', 'repaired'] as const) {
        expect(mission.java[stage].length).toBeGreaterThan(0)
        expect(mission.structure[stage].length).toBeGreaterThan(0)
        expect(mission.inspector[stage].rule.length).toBeGreaterThan(0)
      }
    }
  })
})
