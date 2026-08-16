import { describe, expect, it } from 'vitest'
import { diagnoseReverse, primaryDiagnosis } from '../coach/misconceptions'
import {
  BROKEN_SOUTH_TREE, PREDICTIONS, REPAIRED_SOUTH_TREE, isCorrectPrediction,
  javaLinesForStage, nextRepairStage, southInspector, studioProgress,
  repairPasses,
} from './debugStudio'

describe('AI Debugging Studio mission', () => {
  it('starts with the real SOUTH collision diagnosed by the engine', () => {
    const diagnosis = primaryDiagnosis(diagnoseReverse(REPAIRED_SOUTH_TREE, BROKEN_SOUTH_TREE))
    expect(diagnosis.code).toBe('BL-SOUTH-COLLISION')
    expect(southInspector('broken')).toMatchObject({ direct: 2, visible: 'Cancel' })
  })

  it('uses one unambiguous prediction grounded in the engine rule', () => {
    expect(PREDICTIONS.filter((prediction) => prediction.correct)).toHaveLength(1)
    expect(isCorrectPrediction('collision')).toBe(true)
    expect(isCorrectPrediction('deleted')).toBe(false)
  })

  it('requires two visible repair actions and then remains solved', () => {
    expect(nextRepairStage('broken')).toBe('panel-ready')
    expect(nextRepairStage('panel-ready')).toBe('repaired')
    expect(nextRepairStage('repaired')).toBe('repaired')
    expect([studioProgress('broken'), studioProgress('panel-ready'), studioProgress('repaired')]).toEqual([1, 2, 3])
    expect(repairPasses('broken')).toBe(false)
    expect(repairPasses('panel-ready')).toBe(false)
    expect(repairPasses('repaired')).toBe(true)
  })

  it('finishes with one direct SOUTH container and explicit nested Java', () => {
    expect(southInspector('repaired')).toMatchObject({ direct: 1, visible: 'buttonRow' })
    const code = javaLinesForStage('repaired').map((line) => line.text).join('\n')
    expect(code).toContain('buttonRow.add(save)')
    expect(code).toContain('buttonRow.add(cancel)')
    expect(code).toContain('frame.add(buttonRow, BorderLayout.SOUTH)')
  })
})
