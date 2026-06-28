import { describe, expect, it } from 'vitest'
import { FUNDAMENTALS_EXERCISES } from '@/data/fundamentalsExercises'
import { WARMUP_QUESTS } from '@/data/warmupQuests'
import { buildQuestDetailNavState, resolveQuestById } from '../resolveQuestById'

describe('resolveQuestById', () => {
  it('finds fundamentals exercises outside the main catalog', () => {
    const exercise = FUNDAMENTALS_EXERCISES[0]!
    const resolved = resolveQuestById(exercise.id, [])
    expect(resolved?.id).toBe(exercise.id)
  })

  it('auto-starts fundamentals sessions with exercise duration', () => {
    const exercise = FUNDAMENTALS_EXERCISES[0]!
    expect(buildQuestDetailNavState(exercise.id)).toEqual({
      quickStartMinutes: exercise.estimatedTime,
      isFundamentalsSession: true,
    })
  })

  it('finds warmup quests outside the main catalog', () => {
    const warmup = WARMUP_QUESTS[0]!
    const resolved = resolveQuestById(warmup.id, [])
    expect(resolved?.id).toBe(warmup.id)
  })

  it('auto-starts warmup sessions by default in nav state', () => {
    const warmup = WARMUP_QUESTS[0]!
    expect(buildQuestDetailNavState(warmup.id)).toEqual({
      quickStartMinutes: 5,
      isWarmupSession: true,
    })
  })

  it('allows opening warmup details without auto-start for title editing', () => {
    const warmup = WARMUP_QUESTS[0]!
    expect(buildQuestDetailNavState(warmup.id, { autoStart: false })).toBeUndefined()
  })
})
