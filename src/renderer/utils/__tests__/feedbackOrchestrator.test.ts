import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from '@/store/useUIStore'
import { dispatchFeedbackMoment } from '../feedbackOrchestrator'

vi.mock('@/utils/sound', () => ({
  playSound: vi.fn(),
}))

const pushXpFloat = vi.fn()

vi.mock('@/store/xpFloatStore', () => ({
  useXpFloatStore: {
    getState: () => ({ push: pushXpFloat }),
  },
}))

import { playSound } from '@/utils/sound'

describe('dispatchFeedbackMoment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState((state) => ({
      settings: {
        ...state.settings,
        soundEnabled: true,
        reduceMotion: false,
      },
    }))
  })

  it('plays completion sound when sound is enabled', () => {
    dispatchFeedbackMoment({ kind: 'quest_complete', category: 'drawing' })
    expect(playSound).toHaveBeenCalledWith('complete', 'drawing')
  })

  it('skips xp float when reduce motion is enabled', () => {
    useUIStore.setState((state) => ({
      settings: { ...state.settings, reduceMotion: true },
    }))
    dispatchFeedbackMoment({ kind: 'xp_float', amount: 42 })
    expect(pushXpFloat).not.toHaveBeenCalled()
  })

  it('emits xp float when motion is allowed', () => {
    dispatchFeedbackMoment({ kind: 'xp_float', amount: 42 })
    expect(pushXpFloat).toHaveBeenCalledWith(42)
  })
})
