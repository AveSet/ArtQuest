import { create } from 'zustand'
import type { Quest, QuestCompletionLog, CompletedWork, QuestTitleOverrides, QuestSavedReference, QuestPhaseMediaEntry } from './models'
import type { Language } from '@/i18n/translations'
import { CATEGORY_INFO, type QuestCategory } from '@/data/skillTree'
import { mergeQuestLists } from '@/utils/mergeQuestLists'
import { estimateQuestMetrics, nextUserQuestId, USER_QUEST_ID_MIN } from '@/utils/questMetricsEstimator'
import { buildUserQuestTags } from '@/utils/userQuestTags'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import { removeQuestReviewScheduleEntry } from './questReviewScheduleActions'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { resolvePlayerAvgLevel } from '@/utils/dailyQuestOrchestrator'
import { useSkillStore } from './useSkillStore'
import { distributePartialXp } from '@/utils/questXpReward'
import {
  appendQuestCompletionLogPatch,
  awardMicroChallengePhaseXp,
  buildCatalogQuestCompletion,
  buildCatalogQuestCompletionPatch,
  buildMicroChallengeCompletionPatch,
  buildSimpleQuestCompletion,
  buildQuestTimeoutLogEntry,
  emitQuestCompletionXpFloat,
  finalizeQuestCompletion,
  playMicroChallengeCompleteSound,
} from '@/utils/questCompletionService'
import { readFileAsDataURL } from '@/utils/fileHelpers'
import { getPhaseMediaStorageId } from '@/utils/questPhaseKeys'
import {
  getPhaseMediaEntries,
  newPhaseMediaId,
  type QuestPhaseMediaMap,
} from '@/utils/questPhaseMedia'
import { getFundamentalsQuestById, getFundamentalsTrackKind, isFundamentalsAdvancedId, isFundamentalsQuestId, isFundamentalsTrackId } from '@/data/fundamentalsExercises'
import { getWarmupQuestById, isWarmupQuestId } from '@/data/warmupQuests'
import {
  applyFundamentalsTrackSessionComplete,
  canCompleteFundamentalsExercise,
  normalizeFundamentalsProgress,
  type FundamentalsProgress,
} from '@/utils/fundamentalsProgress'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { pickDailyQuestReplacement } from '@/utils/dailyQuestGenerator'
import { devLog } from '@/utils/devLog'
import { syncWeeklyChallengeState } from '@/utils/weeklyChallenge'
import { loadQuestsProgressive } from '@/data/quests_data'

export type QuestCompletionReward = {
  questXp: number
  /** Base skill XP from the quest (excludes daily/weekly bonuses). */
  skillXp: number
  category?: string
  bonusDailyXp?: number
  bonusWeeklyXp?: number
}

export type QuestCompletionOptions = {
  /** Minutes actually spent (session). Falls back to quest.estimatedTime when omitted. */
  practiceMinutes?: number
  /** Main session timer ended before submit — track XP gets an overtime penalty. */
  isOvertime?: boolean
  /** When set, all skill XP goes to this node (must be unlocked). */
  targetSkillNodeId?: string
  /** Optional self-review notes entered in Focus Mode. */
  notes?: string
  /** Self-reported difficulty / quality feedback after quest completion */
  feedback?: import('./models').QuestFeedback
}

export type CreateUserQuestInput = {
  title: string
  /** Optional extra context for the artist; does not affect rewards if empty. */
  description?: string
  category: QuestCategory
  language: Language
}

export interface QuestState {
  quests: Quest[]
  catalogQuests: Quest[]
  userQuests: Quest[]
  deletedQuestIds: number[]
  questTitleOverrides: QuestTitleOverrides
  questsLoaded: boolean
  questsLoadError: boolean
  completedQuests: number[]
  completedWorks: CompletedWork[]
  questCompletionLogs: QuestCompletionLog[]
  dailyQuestsIds: number[]
  completedToday: number[]
  lastDailyQuestDate: string
  lastFavCategories: string
  dailyBonusGrantedDate: string
  weeklyChallengeWeek: string
  weeklyChallengeQuestId: number
  weeklyChallengeCompletedWeek: string
  lastWarmupCompletedDate: string
  fundamentalsProgress: FundamentalsProgress
  lastCompletionReward: QuestCompletionReward | null
  microChallengesCompleted: Record<string, string[]>
  questSavedReferences: Record<string, QuestSavedReference[]>
  questPhaseMedia: QuestPhaseMediaMap
  // actions
  loadQuests: () => Promise<void>
  recomputeQuests: () => void
  setQuestTitleOverride: (questId: number, lang: Language, title: string) => void
  clearQuestTitleOverride: (questId: number, lang?: Language) => void
  addUserQuest: (input: CreateUserQuestInput) => Quest | null
  deleteQuest: (questId: number) => boolean
  completeQuest: (questId: number, xp?: number, category?: string, opts?: QuestCompletionOptions) => void
  completeWarmupQuest: (questId: number, opts?: QuestCompletionOptions) => void
  completeFundamentalsExercise: (questId: number, opts?: QuestCompletionOptions) => void
  clearLastCompletionReward: () => void
  uploadWork: (
    questId: number,
    imageUrl: string,
    savedPath?: string,
    notes?: string,
    mediaType?: 'image' | 'video',
    meta?: Partial<CompletedWork>,
  ) => void
  toggleWorkFavorite: (workKey: { id?: string; questId: number; date: string }) => void
  updateWorkReview: (
    workKey: { id?: string; questId: number; date: string },
    patch: { notes?: string; improvementNotes?: string; tags?: string[] },
  ) => void
  getDailyQuests: () => Quest[]
  ensureWeeklyChallenge: () => void
  setDailyQuestsDate: (dateStr: string) => void
  /** Attach feedback to the most recent completion log entry for a quest */
  updateLastCompletionFeedback: (questId: number, feedback: import('./models').QuestFeedback) => void
  completeMicroChallenge: (questId: number, challengeId: string, opts?: { silent?: boolean; skipXp?: boolean }) => void
  awardPhaseSpeedBonus: (questId: number, challengeId: string) => void
  failQuestTimeout: (questId: number, practiceMinutes: number) => void
  getQuestReferences: (questId: number) => QuestSavedReference[]
  addQuestReferenceFromFile: (questId: number, file: File) => Promise<boolean>
  removeQuestReference: (questId: number, refId: string) => Promise<void>
  getPhaseMediaEntries: (questId: number, phaseKey: string) => QuestPhaseMediaEntry[]
  appendPhaseMediaFromFile: (questId: number, phaseKey: string, file: File) => Promise<boolean>
  removePhaseMediaEntry: (questId: number, phaseKey: string, index: number) => Promise<void>
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  catalogQuests: [],
  userQuests: [],
  deletedQuestIds: [],
  questTitleOverrides: {},
  questsLoaded: false,
  questsLoadError: false,
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
  fundamentalsProgress: normalizeFundamentalsProgress(undefined),
  lastCompletionReward: null,
  microChallengesCompleted: {},
  questSavedReferences: {},
  questPhaseMedia: {},

  recomputeQuests: () => {
    const { catalogQuests, userQuests, deletedQuestIds } = get()
    if (catalogQuests.length === 0 && userQuests.length === 0) return
    set({ quests: mergeQuestLists(catalogQuests, userQuests, deletedQuestIds) })
  },

  loadQuests: async () => {
    if (get().questsLoaded && !get().questsLoadError) return
    set({ questsLoadError: false })
    try {
      const applyCatalog = (catalog: Quest[]) => {
        const merged = mergeQuestLists(catalog, get().userQuests, get().deletedQuestIds)
        set({ catalogQuests: catalog, quests: merged, questsLoaded: true, questsLoadError: false })
      }
      await loadQuestsProgressive((partial) => {
        applyCatalog(partial)
        get().ensureWeeklyChallenge()
      })
      get().ensureWeeklyChallenge()
    } catch (err) {
      console.error('Failed to load quests data:', err)
      set({ questsLoaded: false, quests: [], catalogQuests: [], questsLoadError: true })
    }
  },

  setQuestTitleOverride: (questId, lang, title) => {
    const trimmed = title.trim()
    set((state) => {
      const next = { ...state.questTitleOverrides }
      if (!trimmed) {
        const row = { ...next[questId] }
        delete row[lang]
        if (!row.en && !row.ru && !row.zh && !row['zh-tw'] && !row.ja && !row.ko) delete next[questId]
        else next[questId] = row
      } else {
        next[questId] = { ...next[questId], [lang]: trimmed }
      }
      return { questTitleOverrides: next }
    })
  },

  clearQuestTitleOverride: (questId, lang) => {
    set((state) => {
      const next = { ...state.questTitleOverrides }
      if (!lang) {
        delete next[questId]
        return { questTitleOverrides: next }
      }
      const row = { ...next[questId] }
      delete row[lang]
      if (!row.en && !row.ru && !row.zh && !row['zh-tw'] && !row.ja && !row.ko) delete next[questId]
      else next[questId] = row
      return { questTitleOverrides: next }
    })
  },

  addUserQuest: (input) => {
    const title = input.title.trim()
    if (!title) return null

    const description = input.description?.trim() ?? ''
    const category = input.category
    const catalog = get().catalogQuests.length > 0 ? get().catalogQuests : get().quests
    const metrics = estimateQuestMetrics(title, catalog, category, description || undefined)
    const nodeDef = SKILL_TREE_NODES.find((n) => n.id === metrics.skillNodeId)
    if (!nodeDef) return null
    const id = nextUserQuestId([
      ...get().userQuests.map((q) => q.id),
      ...catalog.map((q) => q.id),
    ])
    const catMeta = CATEGORY_INFO[category]
    const titleRecord = { en: title, ru: title, zh: title, 'zh-tw': title, ja: title, ko: title, [input.language]: title }
    const descRecord = description
      ? { en: description, ru: description, zh: description, 'zh-tw': description, ja: description, ko: description, [input.language]: description }
      : { en: '', ru: '', zh: '', 'zh-tw': '', ja: '', ko: '', }

    const quest: Quest = {
      id,
      code: `CUS-${String(id - USER_QUEST_ID_MIN + 1).padStart(5, '0')}`,
      title: titleRecord,
      description: descRecord,
      category,
      difficulty: metrics.difficulty,
      xp: metrics.xp,
      estimatedTime: metrics.estimatedTime,
      source: ({ en: 'Custom', ru: 'Своё', zh: '自定义', 'zh-tw': '自訂', ja: 'カスタム', ko: '사용자 지정' })[input.language] ?? 'Custom',
      icon: catMeta?.icon ?? '✨',
      color: catMeta?.color ?? 'var(--accent)',
      min_level: 1,
      tags: buildUserQuestTags(title, category, metrics.difficulty, nodeDef.tags),
      prerequisites: [],
      medium: 'digital',
      is_repeatable: true,
      review_after_days: 0,
      streak_bonus: 1,
    }

    set((state) => {
      const userQuests = [...state.userQuests, quest]
      return {
        userQuests,
        quests: mergeQuestLists(state.catalogQuests, userQuests, state.deletedQuestIds),
      }
    })
    return quest
  },

  deleteQuest: (questId) => {
    const state = get()
    if (!state.quests.some((q) => q.id === questId)) return false

    const deletedQuestIds = state.deletedQuestIds.includes(questId)
      ? state.deletedQuestIds
      : [...state.deletedQuestIds, questId]
    const userQuests = state.userQuests.filter((q) => q.id !== questId)
    const questTitleOverrides = { ...state.questTitleOverrides }
    delete questTitleOverrides[questId]

    set({
      deletedQuestIds,
      userQuests,
      questTitleOverrides,
      quests: mergeQuestLists(state.catalogQuests, userQuests, deletedQuestIds),
      completedQuests: state.completedQuests.filter((id) => id !== questId),
      dailyQuestsIds: state.dailyQuestsIds.filter((id) => id !== questId),
      completedToday: state.completedToday.filter((id) => id !== questId),
      completedWorks: state.completedWorks.filter((w) => w.questId !== questId),
      questCompletionLogs: state.questCompletionLogs.filter((l) => l.questId !== questId),
      weeklyChallengeQuestId:
        state.weeklyChallengeQuestId === questId ? 0 : state.weeklyChallengeQuestId,
    })
    removeQuestReviewScheduleEntry(questId)
    return true
  },

  clearLastCompletionReward: () => set({ lastCompletionReward: null }),

  completeQuest: (questId, xp = 0, category, opts) => {
    const state = get()
    const quest = state.quests.find((q) => q.id === questId)
    if (!quest) return
    if (!quest.is_repeatable && state.completedQuests.includes(questId)) return

    const today = getLocalDateStr()

    const questXp = xp > 0 ? xp : quest.xp ?? 0
    const rawPracticeMinutes = opts?.practiceMinutes ?? quest.estimatedTime ?? 0
    const practiceMinutes = Number.isFinite(rawPracticeMinutes) ? Math.max(0, rawPracticeMinutes) : 0
    const rewardCategory = (category ?? quest.category) as QuestCategory
    const { logEntry, trackXp, nodeXp, isSpeedRun } = buildCatalogQuestCompletion({
      quest,
      questId,
      questXp,
      rewardCategory,
      practiceMinutes,
      targetSkillNodeId: opts?.targetSkillNodeId,
      notes: opts?.notes,
      feedback: opts?.feedback,
      isOvertime: opts?.isOvertime,
    })

    devLog('[completeQuest] before set', { completedToday: get().completedToday, today })

    set((state) =>
      buildCatalogQuestCompletionPatch(state, {
        quest,
        questId,
        trackXp,
        nodeXp,
        rewardCategory,
        logEntry,
        today,
      }),
    )

    finalizeQuestCompletion({
      questId,
      quest,
      logEntry,
      trackXp,
      nodeXp,
      rewardCategory,
      practiceMinutes,
      isSpeedRun,
      targetSkillNodeId: opts?.targetSkillNodeId,
      feedback: opts?.feedback,
    })

    devLog('[completeQuest] after set', {
      completedToday: get().completedToday,
      lastDailyQuestDate: get().lastDailyQuestDate,
    })
  },

  completeWarmupQuest: (questId, opts) => {
    if (!isWarmupQuestId(questId)) return
    const quest = getWarmupQuestById(questId)
    if (!quest) return

    const today = getLocalDateStr()
    if (get().lastWarmupCompletedDate === today) return

    const practiceMinutes = Math.min(opts?.practiceMinutes ?? 5, 15)
    const { logEntry, trackXp, nodeXp, rewardCategory, isSpeedRun } = buildSimpleQuestCompletion({
      quest,
      questId,
      practiceMinutes,
      notes: opts?.notes,
      feedback: opts?.feedback,
      forceSpeedRunFalse: true,
    })

    set((state) => ({
      lastWarmupCompletedDate: today,
      ...appendQuestCompletionLogPatch(state, {
        trackXp,
        nodeXp,
        rewardCategory,
        logEntry,
      }),
    }))

    finalizeQuestCompletion({
      questId,
      quest,
      logEntry,
      trackXp,
      nodeXp,
      rewardCategory,
      practiceMinutes,
      isSpeedRun,
      feedback: opts?.feedback,
      playCompleteSound: true,
    })
  },

  completeFundamentalsExercise: (questId, opts) => {
    if (!isFundamentalsQuestId(questId)) return
    const quest = getFundamentalsQuestById(questId)
    if (!quest) return

    const progress = get().fundamentalsProgress
    if (!canCompleteFundamentalsExercise(questId, progress)) return

    const session = useQuestSessionStore.getState().session
    let nextProgress = progress
    if (isFundamentalsTrackId(questId)) {
      const kind = getFundamentalsTrackKind(questId)
      if (
        !kind
        || session?.questId !== questId
        || !session.phases.length
        || !session.phasesComplete
      ) {
        return
      }
      nextProgress = applyFundamentalsTrackSessionComplete(
        progress,
        kind,
        session.phases.length,
        questId,
      )
    } else if (isFundamentalsAdvancedId(questId) && !progress.completedIds.includes(questId)) {
      nextProgress = {
        ...progress,
        completedIds: [...progress.completedIds, questId],
      }
    }

    const practiceMinutes = Math.min(
      opts?.practiceMinutes ?? quest.estimatedTime,
      quest.estimatedTime * 3,
    )
    const { logEntry, trackXp, nodeXp, rewardCategory, isSpeedRun } = buildSimpleQuestCompletion({
      quest,
      questId,
      practiceMinutes,
      notes: opts?.notes,
      feedback: opts?.feedback,
    })

    const today = getLocalDateStr()

    set((state) => ({
      fundamentalsProgress: {
        ...nextProgress,
        lastCompletedDate: today,
      },
      ...appendQuestCompletionLogPatch(state, {
        trackXp,
        nodeXp,
        rewardCategory,
        logEntry,
      }),
    }))

    finalizeQuestCompletion({
      questId,
      quest,
      logEntry,
      trackXp,
      nodeXp,
      rewardCategory,
      practiceMinutes,
      isSpeedRun,
      feedback: opts?.feedback,
      playCompleteSound: true,
    })
  },

  ensureWeeklyChallenge: () => {
    const { quests, weeklyChallengeWeek, weeklyChallengeQuestId, weeklyChallengeCompletedWeek, completedQuests } =
      get()
    if (quests.length === 0) return
    const sync = syncWeeklyChallengeState(
      quests,
      weeklyChallengeWeek,
      weeklyChallengeQuestId,
      weeklyChallengeCompletedWeek,
      completedQuests,
    )
    if (sync.needsPersist) {
      set({
        weeklyChallengeWeek: sync.weekKey,
        weeklyChallengeQuestId: sync.questId,
      })
    }
  },

  uploadWork: (questId, imageUrl, savedPath, notes, mediaType, meta) => {
    set((state) => ({
      completedWorks: [
        ...state.completedWorks,
        {
          ...meta,
          questId,
          imageUrl,
          savedPath,
          date: new Date().toISOString(),
          notes: notes?.trim() || undefined,
          mediaType,
        },
      ],
    }))
  },

  toggleWorkFavorite: (workKey) => {
    set((state) => ({
      completedWorks: state.completedWorks.map((work) => {
        const sameId = workKey.id && work.id === workKey.id
        const sameFallback = !workKey.id && work.questId === workKey.questId && work.date === workKey.date
        if (!sameId && !sameFallback) return work
        return { ...work, favorite: !work.favorite }
      }),
    }))
  },

  updateWorkReview: (workKey, patch) => {
    set((state) => ({
      completedWorks: state.completedWorks.map((work) => {
        const sameId = workKey.id && work.id === workKey.id
        const sameFallback = !workKey.id && work.questId === workKey.questId && work.date === workKey.date
        if (!sameId && !sameFallback) return work
        return {
          ...work,
          ...(patch.notes !== undefined ? { notes: patch.notes.trim() || undefined } : {}),
          ...(patch.improvementNotes !== undefined
            ? { improvementNotes: patch.improvementNotes.trim() || undefined }
            : {}),
          ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        }
      }),
    }))
  },

  getDailyQuests: () => {
    const { quests, dailyQuestsIds } = get()
    return quests.filter((q) => dailyQuestsIds.includes(q.id))
  },

  setDailyQuestsDate: (dateStr) => {
    set({ lastDailyQuestDate: dateStr, completedToday: [] })
  },

  updateLastCompletionFeedback: (questId, feedback) => {
    set((state) => {
      const logs = [...state.questCompletionLogs]
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i]
        if (log.questId === questId && !log.feedback) {
          logs[i] = { ...log, feedback }
          break
        }
      }
      return { questCompletionLogs: logs }
    })
  },

  completeMicroChallenge: (questId, challengeId, opts) => {
    const state = get()
    const patch = buildMicroChallengeCompletionPatch(state, questId, challengeId)
    if (!patch) return

    const quest = state.quests.find((q) => q.id === questId)
    if (!opts?.skipXp && quest) {
      awardMicroChallengePhaseXp(quest, challengeId)
    }

    set(patch)
    if (quest) playMicroChallengeCompleteSound(quest, opts)
  },

  awardPhaseSpeedBonus: (_questId, _challengeId) => {
    // Phase speed bonuses removed — quest XP is awarded only on completion.
  },

  failQuestTimeout: (questId, practiceMinutes) => {
    const state = get()
    const quest = state.quests.find((q) => q.id === questId)
    if (!quest) return

    const { trackXp, nodeXp } = distributePartialXp(0, quest.category, {
      tags: quest.tags,
      practiceMinutes,
      estimatedTime: quest.estimatedTime,
      isSpeedRun:
        quest.estimatedTime > 0 &&
        practiceMinutes > 0 &&
        practiceMinutes < quest.estimatedTime / 2,
    })
    const skillXp = trackXp + nodeXp
    const logEntry = buildQuestTimeoutLogEntry(quest, questId, practiceMinutes, trackXp, nodeXp)

    if (skillXp > 0) {
      set((s) =>
        appendQuestCompletionLogPatch(s, {
          trackXp,
          nodeXp,
          rewardCategory: quest.category,
          logEntry,
        }),
      )
      emitQuestCompletionXpFloat(skillXp)
    } else {
      set((s) => ({ questCompletionLogs: [...s.questCompletionLogs, logEntry] }))
    }

    const isDaily = state.dailyQuestsIds.includes(questId)
    if (isDaily) {
      const skillState = useSkillStore.getState()
      const avgLevel = resolvePlayerAvgLevel(
        skillState.skillNodes,
        skillState.legacySkills,
        'beginner',
      )
      const replacementId = pickDailyQuestReplacement({
        allQuests: state.quests,
        failedQuest: quest,
        excludeIds: state.dailyQuestsIds,
        avgLevel,
        completedQuests: state.completedQuests,
        questCompletionLogs: state.questCompletionLogs,
      })
      if (replacementId != null) {
        set({
          dailyQuestsIds: state.dailyQuestsIds.map((id) =>
            id === questId ? replacementId : id,
          ),
        })
      }
    }

  },

  getQuestReferences: (questId) => {
    return get().questSavedReferences[String(questId)] ?? []
  },

  addQuestReferenceFromFile: async (questId, file) => {
    if (!file.type.startsWith('image/')) return false
    const api = window.electronAPI
    if (!api?.saveQuestReference) return false
    try {
      const base64 = await readFileAsDataURL(file)
      const result = await api.saveQuestReference(base64, String(questId))
      if (!result.success || !result.path || !result.id) return false
      const entry: QuestSavedReference = {
        id: result.id,
        path: result.path,
        addedAt: new Date().toISOString(),
      }
      set((state) => {
        const key = String(questId)
        const prev = state.questSavedReferences[key] ?? []
        return {
          questSavedReferences: {
            ...state.questSavedReferences,
            [key]: [...prev, entry],
          },
        }
      })
      return true
    } catch {
      return false
    }
  },

  removeQuestReference: async (questId, refId) => {
    const key = String(questId)
    const list = get().questSavedReferences[key] ?? []
    const ref = list.find((r) => r.id === refId)
    if (ref?.path) {
      await window.electronAPI?.deleteQuestReference?.(ref.path)
    }
    set((state) => ({
      questSavedReferences: {
        ...state.questSavedReferences,
        [key]: (state.questSavedReferences[key] ?? []).filter((r) => r.id !== refId),
      },
    }))
  },

  getPhaseMediaEntries: (questId, phaseKey) =>
    getPhaseMediaEntries(get().questPhaseMedia, questId, phaseKey),

  appendPhaseMediaFromFile: async (questId, phaseKey, file) => {
    if (!file.type.startsWith('image/')) return false
    const questKey = String(questId)
    const entryId = newPhaseMediaId()
    const api = window.electronAPI
    let entry: QuestPhaseMediaEntry

    if (api?.saveQuestReference) {
      try {
        const base64 = await readFileAsDataURL(file)
        const storageId = getPhaseMediaStorageId(questId, phaseKey, entryId)
        const result = await api.saveQuestReference(base64, storageId)
        if (!result.success || !result.path) return false
        entry = {
          id: entryId,
          path: result.path,
          mimeType: file.type,
          addedAt: new Date().toISOString(),
        }
      } catch {
        return false
      }
    } else {
      try {
        const dataUrl = await readFileAsDataURL(file)
        entry = {
          id: entryId,
          dataUrl,
          mimeType: file.type,
          addedAt: new Date().toISOString(),
        }
      } catch {
        return false
      }
    }

    set((state) => {
      const prev = state.questPhaseMedia[questKey]?.[phaseKey] ?? []
      return {
        questPhaseMedia: {
          ...state.questPhaseMedia,
          [questKey]: {
            ...(state.questPhaseMedia[questKey] ?? {}),
            [phaseKey]: [...prev, entry],
          },
        },
      }
    })
    return true
  },

  removePhaseMediaEntry: async (questId, phaseKey, index) => {
    const questKey = String(questId)
    const list = get().questPhaseMedia[questKey]?.[phaseKey] ?? []
    const existing = list[index]
    if (!existing) return
    if (existing.path) {
      await window.electronAPI?.deleteQuestReference?.(existing.path)
    }
    set((state) => {
      const prevList = state.questPhaseMedia[questKey]?.[phaseKey] ?? []
      const nextList = prevList.filter((_, i) => i !== index)
      const prev = { ...(state.questPhaseMedia[questKey] ?? {}) }
      if (nextList.length === 0) delete prev[phaseKey]
      else prev[phaseKey] = nextList
      const next = { ...state.questPhaseMedia }
      if (Object.keys(prev).length === 0) delete next[questKey]
      else next[questKey] = prev
      return { questPhaseMedia: next }
    })
  },
}))