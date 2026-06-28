import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSound, ensureAudioContext } from '../sound'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SETTINGS } from '@/store/models'

describe('sound', () => {
  beforeEach(() => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, soundEnabled: true, soundVolume: 0.5, language: 'en', favoriteCategories: ['drawing', 'animation', 'anatomy'], useRandomCategories: false },
    })
  })

  it('does not play when audio is disabled', () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, soundEnabled: false, soundVolume: 0.5, language: 'en', favoriteCategories: ['drawing', 'animation', 'anatomy'], useRandomCategories: false },
    })
    const mockOsc = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 } }
    const mockGain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }
    const mockCtx = {
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {},
      currentTime: 0,
    }
    vi.spyOn(window, 'AudioContext').mockImplementationOnce(() => mockCtx as any)

    playSound('complete')
    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  it('ensureAudioContext does not throw', () => {
    expect(() => ensureAudioContext()).not.toThrow()
  })
})
