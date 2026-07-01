import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from '../useUIStore'
import { useQuestStore } from '../useQuestStore'
import { useSkillStore } from '../useSkillStore'
import { DEFAULT_SETTINGS } from '../models'
import { CURRENT_PROGRESS_SCHEMA_VERSION, normalizeProgressPayload } from '../../../shared/progressSchema'

beforeEach(() => {
  useQuestStore.setState({
    quests: [],
    completedQuests: [],
    completedWorks: [],
    questCompletionLogs: [],
    dailyQuestsIds: [],
    completedToday: [],
    lastDailyQuestDate: '',
  })
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    isLoaded: false,
    saveError: null,
    settings: { ...DEFAULT_SETTINGS },
    streakState: { current: 0, longest: 0, lastActiveDate: '' },
    adaptiveWeights: { default: 1.0 },
    lastRefreshDate: '',
  })
})

describe('useUIStore', () => {
  describe('loadProgress', () => {
    it('sets isLoaded=true when electron API is unavailable', async () => {
      useUIStore.setState({ isLoaded: false })
      await useUIStore.getState().loadProgress()
      expect(useUIStore.getState().isLoaded).toBe(true)
    })

    it('loads saved settings and streak state', async () => {
      vi.stubGlobal('window', {
        electronAPI: {
          progress: {
            load: vi.fn(async () => ({
              status: 'ok' as const,
              data: {
                settings: { soundEnabled: false, soundVolume: 0.5, language: 'ru', favoriteCategories: ['animation'], useRandomCategories: true },
                streakState: { current: 7, longest: 14, lastActiveDate: '2026-05-09' },
                skillNodes: [],
                completedQuests: [1, 2],
                completedWorks: [],
                questCompletionLogs: [],
                adaptiveWeights: { default: 1.0 },
                lastRefreshDate: '',
                dailyQuestsIds: [],
                completedToday: [],
                lastDailyQuestDate: '',
              },
            })),
          },
          gallery: { listImages: vi.fn(async () => []) },
        },
      })

      await useUIStore.getState().loadProgress()
      const state = useUIStore.getState()
      expect(state.settings.language).toBe('ru')
      expect(state.streakState.current).toBe(7)
      expect(useQuestStore.getState().completedQuests).toEqual([1, 2])
      expect(state.isLoaded).toBe(true)
      vi.unstubAllGlobals()
    })

    it('starts fresh when no saved data', async () => {
      vi.stubGlobal('window', {
        electronAPI: {
          progress: { load: vi.fn(async () => ({ status: 'empty' as const })) },
          gallery: { listImages: vi.fn(async () => []) },
        },
      })

      useUIStore.setState({ isLoaded: false })
      await useUIStore.getState().loadProgress()
      expect(useUIStore.getState().isLoaded).toBe(true)
      expect(useUIStore.getState().loadProgressError).toBeNull()
      vi.unstubAllGlobals()
    })

    it('shows corrupt error instead of silent fresh start', async () => {
      vi.stubGlobal('window', {
        electronAPI: {
          progress: {
            load: vi.fn(async () => ({
              status: 'corrupt' as const,
              backupPath: '/mock/backups/progress-corrupt.json',
              message: 'Invalid feedbackStats',
            })),
          },
          gallery: { listImages: vi.fn(async () => []) },
        },
      })

      await useUIStore.getState().loadProgress()
      expect(useUIStore.getState().loadProgressError).toBe('corrupt')
      expect(useUIStore.getState().corruptProgressBackupPath).toBe('/mock/backups/progress-corrupt.json')
      expect(useQuestStore.getState().completedQuests).toEqual([])
      vi.unstubAllGlobals()
    })

    it('honors prefers-reduced-motion on first launch (no save file)', async () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn(() => ({ matches: true })),
        electronAPI: {
          progress: { load: vi.fn(async () => ({ status: 'empty' as const })) },
          gallery: { listImages: vi.fn(async () => []) },
        },
      })
      useUIStore.setState({ isLoaded: false, settings: { ...DEFAULT_SETTINGS, reduceMotion: false } })
      await useUIStore.getState().loadProgress()
      expect(useUIStore.getState().settings.reduceMotion).toBe(true)
      vi.unstubAllGlobals()
    })
  })
  describe('setSettings', () => {
    it('updates sound settings', () => {
      useUIStore.getState().setSettings({ soundEnabled: false })
      expect(useUIStore.getState().settings.soundEnabled).toBe(false)
    })

    it('allows empty favoriteCategories', () => {
      useUIStore.getState().setSettings({ favoriteCategories: [] })
      expect(useUIStore.getState().settings.favoriteCategories).toEqual([])
    })

    it('updates language', () => {
      useUIStore.getState().setSettings({ language: 'ru' })
      expect(useUIStore.getState().settings.language).toBe('ru')
    })
  })

  describe('buildProgressData', () => {
    it('returns all required fields', () => {
      const data = useUIStore.getState().buildProgressData()
      expect(data.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION)
      expect(data).toHaveProperty('skillNodes')
      expect(data).toHaveProperty('legacySkills')
      expect(data).toHaveProperty('achievements')
      expect(data).toHaveProperty('completedQuests')
      expect(data).toHaveProperty('completedWorks')
      expect(data).toHaveProperty('questCompletionLogs')
      expect(data).toHaveProperty('settings')
      expect(data).toHaveProperty('streakState')
      expect(data).toHaveProperty('dailyQuestsIds')
      expect(data).toHaveProperty('completedToday')
      expect(data).toHaveProperty('lastDailyQuestDate')
      const parsed = normalizeProgressPayload(data)
      expect(parsed).not.toBeNull()
    })
  })

  describe('resetProgress', () => {
    it('resets all progress fields', async () => {
      useUIStore.setState({
        achievementQueue: [{ id: 'x', title: { en: 'T', ru: 'T', zh: 'T', ja: 'T', ko: 'T' }, description: { en: 'D', ru: 'D', zh: 'D', ja: 'D', ko: 'D' }, icon: '⭐' }],
      })
      useQuestStore.setState({
        lastFavCategories: '["drawing"]',
        lastCompletionReward: { questXp: 10, skillXp: 5 },
      })
      await useUIStore.getState().resetProgress()
      const state = useUIStore.getState()
      expect(state.streakState.current).toBe(0)
      expect(state.settings.favoriteCategories).toEqual(['drawing', 'animation', 'anatomy'])
      expect(state.achievementQueue).toEqual([])
      const questState = useQuestStore.getState()
      expect(questState.completedQuests).toEqual([])
      expect(questState.lastFavCategories).toBe('')
      expect(questState.lastCompletionReward).toBeNull()
    })

    it('does not reset when electron clear fails', async () => {
      useQuestStore.setState({
        completedQuests: [1, 2],
        lastFavCategories: '"x"',
      })
      const api = window.electronAPI!
      const originalClear = api.progress.clear
      api.progress.clear = async () => ({ success: false as const, error: 'disk' })
      await useUIStore.getState().resetProgress()
      api.progress.clear = originalClear
      expect(useQuestStore.getState().completedQuests).toEqual([1, 2])
      expect(useUIStore.getState().saveError).toBe('reset_failed')
    })
  })
})
