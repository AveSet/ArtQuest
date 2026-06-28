import { create } from 'zustand'
import { useQuestStore } from './useQuestStore'
import { useSkillStore, createInitialSkillNodes, getDefaultSkills } from './useSkillStore'
import { applyExperienceTierToStores } from '@/utils/experienceTier'
import achievementsData from '@/data/achievements.json'
import type { Quest, Settings, StreakState, Achievement, AdaptiveWeights, ActiveGoal, CompletedGoal } from './models'
import { DEFAULT_ADAPTIVE_WEIGHTS, DEFAULT_SETTINGS } from './models'
import { buildProgressData, saveProgressAsync, saveProgressSync as persistProgressSync } from '@/utils/progressService'
import { resetProgressPayloadLogTierForTests } from '@/utils/progressPayloadLog'
import { normalizeProgressPayload, type ProgressPayload } from '../../shared/progressSchema'
import type { LoadProgressResponse } from '../../shared/loadProgressResponse'
import { loadProgressFromBrowserWithStatus, readCorruptProgressBackupFromBrowser } from '@/utils/progressLoad'
import { buildExportEnvelope, downloadProgressJson } from '@/utils/progressExport'
import { computePlayerLevel as computePlayerLevelFromNodes, getPlayerRankKey } from '@/utils/playerLevel'
import { checkAndGenerateDailyQuests, initializeDailyQuests } from '@/utils/dailyQuestCoordinator'

import type { SaveErrorCode } from '@/utils/progressService'
export type { SaveErrorCode } from '@/utils/progressService'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { setBatchLoading, resetSaveFingerprint } from '@/utils/autoSave'
import { devInfo, devWarn } from '@/utils/devLog'
import { appLog } from '@/utils/appLog'
import { clearProgressFromBrowser } from '@/utils/browserProgress'
import { detectSystemLanguage } from '@/utils/detectSystemLanguage'
import type { LocalizedString } from '@/i18n/languages'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { EMPTY_FUNDAMENTALS_PROGRESS } from '@/utils/fundamentalsProgress'
import {
  hydrateGalleryOnlyFromDisk,
  hydrateStoresFromProgress,
  type SavedGalleryImage,
} from '@/persistence/progressHydrator'

export type LevelUpEvent = {
  nodeTitle: LocalizedString
  category: string
  newLevel: number
}

/** Player level from current skill store (sum of legacy category levels). */
export function computePlayerLevel(): number {
  const { skillNodes, legacySkills } = useSkillStore.getState()
  return computePlayerLevelFromNodes(skillNodes, legacySkills)
}

/** Rank label key based on player level. */
export function getPlayerRankLabel(level: number): string {
  return getPlayerRankKey(level)
}

export interface UIState {
  selectedNodeId: string | null
  settings: Settings
  streakState: StreakState
  adaptiveWeights: AdaptiveWeights
  lastRefreshDate: string
  questReviewSchedule: Record<string, { nextReviewAt: string; intervalDays: number; easeFactor: number }>
  feedbackStats: Record<string, { count: number; avgDifficulty: number; weakCriteria: string[] }>
  lastExportAt: string | undefined
  activeGoal: ActiveGoal | null
  completedGoals: CompletedGoal[]
  isLoaded: boolean
  saveError: SaveErrorCode | null
  loadProgressError: 'corrupt' | 'load_failed' | null
  corruptProgressBackupPath: string | null
  clearLoadProgressError: () => void
  retryLoadProgress: () => Promise<void>
  exportCorruptProgressBackup: () => Promise<void>
  dismissCorruptAndStartFresh: () => Promise<void>
  fullOnboardingRequested: boolean
  lastLevelUp: LevelUpEvent | null
  levelUpSweepKey: number
  portraitCelebrateUntil: number
  celebrationCategory: string | null
  achievementQueue: Achievement[]
  pushAchievements: (ach: Achievement[]) => void
  shiftNextAchievement: () => void
  clearAchievementQueue: () => void
  triggerPortraitCelebrate: (category?: string) => void
  selectNode: (nodeId: string | null) => void
  clearSaveError: () => void
  showLevelUp: (event: LevelUpEvent) => void
  clearLevelUp: () => void
  requestFullOnboarding: () => void
  clearFullOnboarding: () => void
  setSettings: (partial: Partial<Settings>) => void
  setActiveGoal: (text: string) => void
  completeActiveGoal: () => void
  /** Persist that the day-complete celebration was shown for this calendar day */
  markDailyRitualShown: (today: string) => void
  /** Persist that the streak-recovery shield hint was shown for this calendar day */
  markStreakRecoveryHintShown: (today: string) => void
  buildProgressData: () => Record<string, unknown>
  saveProgress: () => Promise<void>
  saveProgressSync: () => void
  loadProgress: () => Promise<void>
  resetProgress: () => Promise<void>
  /** Reset quest/skill progress; keeps gallery works and user settings. */
  softRestartProgress: () => Promise<void>
  getDailyQuests: () => Quest[]
  checkAndGenerateDailyQuests: () => Quest[]
  initializeDailyQuests: () => Quest[]
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedNodeId: null,
  settings: DEFAULT_SETTINGS,
  streakState: { current: 0, longest: 0, lastActiveDate: '' },
  adaptiveWeights: DEFAULT_ADAPTIVE_WEIGHTS,
  lastRefreshDate: '',
  questReviewSchedule: {},
  feedbackStats: {},
  lastExportAt: undefined,
  activeGoal: null,
  completedGoals: [],
  isLoaded: false,
  saveError: null,
  loadProgressError: null,
  corruptProgressBackupPath: null,
  fullOnboardingRequested: false,
  lastLevelUp: null,
  levelUpSweepKey: 0,
  portraitCelebrateUntil: 0,
  celebrationCategory: null,
  achievementQueue: [],
  pushAchievements: (achList) => {
    set((state) => ({ achievementQueue: [...state.achievementQueue, ...achList] }))
  },
  shiftNextAchievement: () => {
    const queue = get().achievementQueue
    if (queue.length <= 1) {
      set({ achievementQueue: [] })
    } else {
      set({ achievementQueue: queue.slice(1) })
    }
  },
  clearAchievementQueue: () => set({ achievementQueue: [] }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  clearSaveError: () => set({ saveError: null }),
  clearLoadProgressError: () =>
    set({ loadProgressError: null, corruptProgressBackupPath: null }),
  showLevelUp: (event) => set({ lastLevelUp: event, levelUpSweepKey: Date.now() }),
  clearLevelUp: () => set({ lastLevelUp: null }),
  triggerPortraitCelebrate: (category?: string) =>
    set({ portraitCelebrateUntil: Date.now() + 3000, celebrationCategory: category ?? null }),
  requestFullOnboarding: () => set({ fullOnboardingRequested: true }),
  clearFullOnboarding: () => set({ fullOnboardingRequested: false }),
  setSettings: (partial) => {
    set((s) => ({ settings: { ...s.settings, ...partial } }))
  },

  setActiveGoal: (text) => {
    const trimmed = text.trim()
    if (!trimmed) {
      set({ activeGoal: null })
      return
    }
    set((s) => ({
      activeGoal: {
        text: trimmed.slice(0, 500),
        createdAt: s.activeGoal?.createdAt ?? new Date().toISOString(),
      },
    }))
  },

  completeActiveGoal: () => {
    const { activeGoal } = get()
    if (!activeGoal) return
    const completed: CompletedGoal = {
      id: crypto.randomUUID(),
      text: activeGoal.text,
      createdAt: activeGoal.createdAt,
      completedAt: new Date().toISOString(),
    }
    set((s) => ({
      activeGoal: null,
      completedGoals: [completed, ...s.completedGoals],
    }))
  },

  markDailyRitualShown: (today) => {
    set((s) => ({
      streakState: { ...s.streakState, lastDailyRitualDate: today },
    }))
  },

  markStreakRecoveryHintShown: (today) => {
    set((s) => ({
      streakState: { ...s.streakState, streakRecoveryHintShownDate: today },
    }))
  },

  buildProgressData,

  saveProgress: async () => {
    const result = await saveProgressAsync()
    set({ saveError: result.ok ? null : result.error })
  },

  saveProgressSync: () => {
    const result = persistProgressSync()
    set({ saveError: result.ok ? null : result.error })
  },

  loadProgress: async () => {
    try {
      setBatchLoading(true)
      set({ loadProgressError: null, corruptProgressBackupPath: null })

      const response: LoadProgressResponse = window.electronAPI?.loadProgress
        ? await window.electronAPI.loadProgress()
        : loadProgressFromBrowserWithStatus()

      let savedImages: SavedGalleryImage[] = []
      if (window.electronAPI?.getSavedImages) {
        savedImages = await window.electronAPI.getSavedImages()
      }

      if (response.status === 'ok') {
        const data = normalizeProgressPayload(response.data) as ProgressPayload | null
        if (!data) {
          appLog('error', 'persistence', 'loadProgress ok response failed re-normalize')
          set({
            isLoaded: true,
            loadProgressError: 'corrupt',
          })
          setBatchLoading(false)
          resetSaveFingerprint()
          return
        }
        devInfo('[loadProgress] loaded', {
          completedToday: data.completedToday,
          lastDailyQuestDate: data.lastDailyQuestDate,
          dailyQuestsIds: data.dailyQuestsIds,
        })
        const uiSlice = hydrateStoresFromProgress(data, savedImages)
        set({ ...uiSlice, isLoaded: true, loadProgressError: null, corruptProgressBackupPath: null })
      } else if (response.status === 'corrupt') {
        if (savedImages.length > 0) {
          hydrateGalleryOnlyFromDisk(savedImages)
        }
        devWarn('[loadProgress] corrupt progress — backup created, awaiting user action')
        appLog('warn', 'persistence', 'corrupt progress on load', { message: response.message })
        set({
          isLoaded: true,
          loadProgressError: 'corrupt',
          corruptProgressBackupPath: response.backupPath ?? null,
        })
      } else if (response.status === 'failed') {
        console.error('Failed to load progress:', response.message)
        appLog('error', 'persistence', 'loadProgress failed', { err: response.message })
        set({ isLoaded: true, loadProgressError: 'load_failed' })
      } else {
        if (savedImages.length > 0) {
          hydrateGalleryOnlyFromDisk(savedImages)
        }
        devInfo('[loadProgress] no saved data')
        const prefersReduceMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
        set({
          isLoaded: true,
          loadProgressError: null,
          corruptProgressBackupPath: null,
          settings: {
            ...get().settings,
            language: detectSystemLanguage(),
            reduceMotion: prefersReduceMotion ? true : get().settings.reduceMotion,
          },
        })
      }
      setBatchLoading(false)
      resetSaveFingerprint()
    } catch (error) {
      console.error('Failed to load progress:', error)
      appLog('error', 'persistence', 'loadProgress failed', { err: String(error) })
      set({ isLoaded: true, loadProgressError: 'load_failed' })
      setBatchLoading(false)
      resetSaveFingerprint()
    }
  },

  retryLoadProgress: async () => {
    await get().loadProgress()
  },

  exportCorruptProgressBackup: async () => {
    const { corruptProgressBackupPath } = get()
    let backupRaw: Record<string, unknown> | null = null
    if (corruptProgressBackupPath && window.electronAPI?.readCorruptProgressBackup) {
      const result = await window.electronAPI.readCorruptProgressBackup(corruptProgressBackupPath)
      if (result.success) backupRaw = result.data
    }
    if (!backupRaw) {
      backupRaw = readCorruptProgressBackupFromBrowser()
    }
    const envelope = buildExportEnvelope(backupRaw ?? { note: 'No corrupt backup found' })
    downloadProgressJson(envelope, `artquest-corrupt-backup-${envelope.exportedAt.slice(0, 10)}.json`)
  },

  dismissCorruptAndStartFresh: async () => {
    devWarn('[loadProgress] user chose fresh start after corrupt save')
    set({ loadProgressError: null, corruptProgressBackupPath: null })
    await get().resetProgress()
  },

  resetProgress: async () => {
    try {
      if (window.electronAPI?.clearProgress) {
        const clearResult = await window.electronAPI.clearProgress()
        if (clearResult && !clearResult.success) {
          console.error('Failed to clear progress:', clearResult.error)
          set({ saveError: 'reset_failed' })
          return
        }
      } else if (!clearProgressFromBrowser()) {
        set({ saveError: 'reset_failed' })
        return
      }

      useQuestStore.setState({
        userQuests: [],
        deletedQuestIds: [],
        questTitleOverrides: {},
        catalogQuests: useQuestStore.getState().catalogQuests,
        quests: useQuestStore.getState().catalogQuests,
        completedQuests: [],
        completedWorks: [],
        questCompletionLogs: [],
        dailyQuestsIds: [],
        completedToday: [],
        lastDailyQuestDate: '',
        lastFavCategories: '',
        dailyBonusGrantedDate: '',
        weeklyChallengeWeek: '',
        weeklyChallengeQuestId: 0,
        weeklyChallengeCompletedWeek: '',
        lastWarmupCompletedDate: '',
        fundamentalsProgress: { completedIds: [], trackPhaseDone: {}, lastCompletedDate: '' },
        lastCompletionReward: null,
        microChallengesCompleted: {},
        questSavedReferences: {},
        questPhaseMedia: {},
      })

      useQuestSessionStore.getState().hydrateSession(null)
      useSkillPracticeStore.getState().clearSession()
      usePortraitStore.getState().resetPortrait()

      const prevSettings = get().settings
      const prevExperienceTier = prevSettings.experienceTier ?? 'beginner'

      useSkillStore.setState({
        skillNodes: createInitialSkillNodes(),
        legacySkills: getDefaultSkills(),
        achievements: (achievementsData as Achievement[]).map(a => ({ ...a, unlocked: false })),
      })

      resetProgressPayloadLogTierForTests()

      set({
        achievementQueue: [],
        settings: {
          ...DEFAULT_SETTINGS,
          soundEnabled: prevSettings.soundEnabled,
          soundVolume: prevSettings.soundVolume,
          language: prevSettings.language,
          minimizeToTray: prevSettings.minimizeToTray,
          sessionWidgetMode: prevSettings.sessionWidgetMode,
          openAtLogin: prevSettings.openAtLogin,
          remindersEnabled: prevSettings.remindersEnabled,
          reminderHour: prevSettings.reminderHour,
          reminderMinute: prevSettings.reminderMinute,
          fontScale: prevSettings.fontScale,
          contrastBoost: prevSettings.contrastBoost,
          reduceMotion: prevSettings.reduceMotion,
          favoriteCategories: ['drawing', 'animation', 'anatomy'],
          useRandomCategories: false,
          hasSeenOnboarding: false,
          profileSetupComplete: false,
          materialFavoriteIds: prevSettings.materialFavoriteIds,
          materialEngagement: prevSettings.materialEngagement ?? {},
          materialCustomLinks: prevSettings.materialCustomLinks,
          experienceTier: prevExperienceTier,
        },
        streakState: { current: 0, longest: 0, lastActiveDate: '', streakRecoveryDueDate: undefined },
        adaptiveWeights: structuredClone(DEFAULT_ADAPTIVE_WEIGHTS),
        lastRefreshDate: '',
        questReviewSchedule: {},
        feedbackStats: {},
        lastExportAt: undefined,
        activeGoal: null,
        completedGoals: [],
      })

      applyExperienceTierToStores(prevExperienceTier)

      initializeDailyQuests()
      useQuestStore.getState().ensureWeeklyChallenge()
      await get().saveProgress()
      devWarn('Progress reset')
    } catch (error) {
      console.error('Failed to reset progress:', error)
    }
  },

  softRestartProgress: async () => {
    const prevSettings = get().settings
    const prevLongest = get().streakState.longest
    const galleryWorks = useQuestStore.getState().completedWorks

    useQuestStore.setState({
      completedQuests: [],
      questCompletionLogs: [],
      dailyQuestsIds: [],
      completedToday: [],
      lastDailyQuestDate: '',
      lastFavCategories: '',
      dailyBonusGrantedDate: '',
      weeklyChallengeWeek: '',
      weeklyChallengeQuestId: 0,
      weeklyChallengeCompletedWeek: '',
      lastWarmupCompletedDate: '',
      fundamentalsProgress: { ...EMPTY_FUNDAMENTALS_PROGRESS },
      lastCompletionReward: null,
      microChallengesCompleted: {},
      questSavedReferences: {},
      questPhaseMedia: {},
      completedWorks: galleryWorks,
    })

    useQuestSessionStore.getState().hydrateSession(null)
    useSkillPracticeStore.getState().clearSession()

    useSkillStore.setState({
      skillNodes: createInitialSkillNodes(),
      legacySkills: getDefaultSkills(),
      achievements: (achievementsData as Achievement[]).map((a) => ({ ...a, unlocked: false })),
    })

    set({
      streakState: { current: 0, longest: prevLongest, lastActiveDate: getLocalDateStr(), streakRecoveryDueDate: undefined },
      adaptiveWeights: structuredClone(DEFAULT_ADAPTIVE_WEIGHTS),
      lastRefreshDate: '',
      questReviewSchedule: {},
      feedbackStats: {},
      activeGoal: null,
      completedGoals: [],
      settings: {
        ...prevSettings,
        hasSeenOnboarding: true,
        profileSetupComplete: true,
      },
    })

    applyExperienceTierToStores(prevSettings.experienceTier ?? 'beginner')

    initializeDailyQuests()
    useQuestStore.getState().ensureWeeklyChallenge()
    await get().saveProgress()
  },

  getDailyQuests: () => {
    const questState = useQuestStore.getState()
    return questState.quests.filter(q => questState.dailyQuestsIds.includes(q.id))
  },

  checkAndGenerateDailyQuests: () => checkAndGenerateDailyQuests(),

  initializeDailyQuests: () => initializeDailyQuests(),

}))
