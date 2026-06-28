import { shouldUseFullReflection, FULL_REFLECTION_EVERY_N } from '@/utils/questSubmitReflectionSampling'

describe('questSubmitReflectionSampling', () => {
  it('requests full reflection on overtime and speed run', () => {
    expect(
      shouldUseFullReflection({ completedQuestCount: 2, isOvertime: true, isSpeedRun: false }),
    ).toBe(true)
    expect(
      shouldUseFullReflection({ completedQuestCount: 2, isOvertime: false, isSpeedRun: true }),
    ).toBe(true)
  })

  it('requests full reflection every N quests', () => {
    expect(
      shouldUseFullReflection({
        completedQuestCount: FULL_REFLECTION_EVERY_N,
        isOvertime: false,
        isSpeedRun: false,
      }),
    ).toBe(true)
    expect(
      shouldUseFullReflection({ completedQuestCount: 3, isOvertime: false, isSpeedRun: false }),
    ).toBe(false)
  })

  it('always full on first completion', () => {
    expect(
      shouldUseFullReflection({ completedQuestCount: 0, isOvertime: false, isSpeedRun: false }),
    ).toBe(true)
  })
})
