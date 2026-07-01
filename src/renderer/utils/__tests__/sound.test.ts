import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSound, ensureAudioContext } from '../sound'
import { syncAmbientLoop, stopAmbientLoop, duckAmbient } from '../ambientSound'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SETTINGS } from '@/store/models'

vi.mock('../ambientSound', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ambientSound')>()
  return {
    ...actual,
    duckAmbient: vi.fn(),
  }
})

describe('sound', () => {
  beforeEach(() => {
    stopAmbientLoop()
    vi.mocked(duckAmbient).mockClear()
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, soundEnabled: true, soundVolume: 0.5, language: 'en', favoriteCategories: ['drawing', 'animation', 'anatomy'], useRandomCategories: false },
    })
  })

  it('does not play when audio is disabled', () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, soundEnabled: false, soundVolume: 0.5, language: 'en', favoriteCategories: ['drawing', 'animation', 'anatomy'], useRandomCategories: false },
    })
    playSound('complete')
    expect(duckAmbient).not.toHaveBeenCalled()
  })

  it('syncAmbientLoop is a no-op when master sound is disabled', () => {
    useUIStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        soundEnabled: false,
        ambientEnabled: true,
        language: 'en',
        favoriteCategories: ['drawing', 'animation', 'anatomy'],
        useRandomCategories: false,
      },
    })
    expect(() => syncAmbientLoop()).not.toThrow()
  })

  it('ensureAudioContext does not throw', () => {
    expect(() => ensureAudioContext()).not.toThrow()
  })

  it('ducks ambient bed for reward sounds', () => {
    playSound('complete')
    expect(duckAmbient).toHaveBeenCalledTimes(1)

    playSound('uiTap')
    expect(duckAmbient).toHaveBeenCalledTimes(1)
  })
})
