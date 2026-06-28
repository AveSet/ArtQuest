import type { QuestCategory } from '@/data/skillTree'
import { useUIStore } from '@/store/useUIStore'
import { useXpFloatStore } from '@/store/xpFloatStore'
import { playSound, type SoundType } from '@/utils/sound'

export type FeedbackMoment =
  | { kind: 'quest_complete'; category?: QuestCategory }
  | { kind: 'daily_complete'; category?: QuestCategory }
  | { kind: 'weekly_complete'; category?: QuestCategory }
  | { kind: 'achievement'; category?: QuestCategory }
  | { kind: 'level_up'; category?: QuestCategory }
  | { kind: 'xp_float'; amount: number }

const SOUND_BY_MOMENT: Partial<Record<FeedbackMoment['kind'], SoundType>> = {
  quest_complete: 'complete',
  daily_complete: 'dailyComplete',
  weekly_complete: 'weeklyComplete',
  achievement: 'achievement',
  level_up: 'levelup',
}

/** Centralizes sound, float animation, and motion preferences for reward moments. */
export function dispatchFeedbackMoment(moment: FeedbackMoment): void {
  const { settings } = useUIStore.getState()
  const soundType = SOUND_BY_MOMENT[moment.kind]

  if (soundType && settings.soundEnabled) {
    playSound(soundType, 'category' in moment ? moment.category : undefined)
  }

  if (moment.kind === 'xp_float' && moment.amount > 0 && !settings.reduceMotion) {
    useXpFloatStore.getState().push(moment.amount)
  }
}
