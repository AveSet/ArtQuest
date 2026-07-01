import type { Quest } from '../models'
import { syncWeeklyChallengeState } from '@/utils/weeklyChallenge'
import type { FundamentalsProgress } from '@/utils/fundamentalsProgress'
import { normalizeFundamentalsProgress } from '@/utils/fundamentalsProgress'
import type { QuestStoreSliceCreator } from './types'

export type QuestCadenceSlice = {
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
  getDailyQuests: () => Quest[]
  ensureWeeklyChallenge: () => void
  setDailyQuestsDate: (dateStr: string) => void
}

export const questCadenceInitialState: Pick<
  QuestCadenceSlice,
  | 'dailyQuestsIds'
  | 'completedToday'
  | 'lastDailyQuestDate'
  | 'lastFavCategories'
  | 'dailyBonusGrantedDate'
  | 'weeklyChallengeWeek'
  | 'weeklyChallengeQuestId'
  | 'weeklyChallengeCompletedWeek'
  | 'lastWarmupCompletedDate'
  | 'fundamentalsProgress'
> = {
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
}

export const createQuestCadenceSlice: QuestStoreSliceCreator<QuestCadenceSlice> = (set, get) => ({
  ...questCadenceInitialState,
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
  getDailyQuests: () => {
    const { quests, dailyQuestsIds } = get()
    return quests.filter((q) => dailyQuestsIds.includes(q.id))
  },
  setDailyQuestsDate: (dateStr) => {
    set({ lastDailyQuestDate: dateStr, completedToday: [] })
  },
})

export function pickQuestCadenceSlice<T extends QuestCadenceSlice>(state: T): QuestCadenceSlice {
  return {
    dailyQuestsIds: state.dailyQuestsIds,
    completedToday: state.completedToday,
    lastDailyQuestDate: state.lastDailyQuestDate,
    lastFavCategories: state.lastFavCategories,
    dailyBonusGrantedDate: state.dailyBonusGrantedDate,
    weeklyChallengeWeek: state.weeklyChallengeWeek,
    weeklyChallengeQuestId: state.weeklyChallengeQuestId,
    weeklyChallengeCompletedWeek: state.weeklyChallengeCompletedWeek,
    lastWarmupCompletedDate: state.lastWarmupCompletedDate,
    fundamentalsProgress: state.fundamentalsProgress,
    getDailyQuests: state.getDailyQuests,
    ensureWeeklyChallenge: state.ensureWeeklyChallenge,
    setDailyQuestsDate: state.setDailyQuestsDate,
  }
}
