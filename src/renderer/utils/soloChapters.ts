import type { QuestCategory } from '@/data/skillTree'
import type { Quest, QuestCompletionLog } from '@/store/models'

export type EnergyMode = 'short' | 'medium' | 'long'

export const ENERGY_MODE_MAX_MINUTES: Record<EnergyMode, number> = {
  short: 15,
  medium: 30,
  long: 60,
}

export function filterQuestsByEnergyMode(
  quests: Quest[],
  mode: EnergyMode,
  resolveMinutes?: (quest: Quest) => number,
): Quest[] {
  const max = ENERGY_MODE_MAX_MINUTES[mode]
  const minutes = (q: Quest) => resolveMinutes?.(q) ?? q.estimatedTime
  return quests.filter((q) => minutes(q) <= max)
}

export function pickEnergyModeQuest(
  quests: Quest[],
  mode: EnergyMode,
  completedIds: number[],
): Quest | undefined {
  const pool = filterQuestsByEnergyMode(
    quests.filter((q) => !completedIds.includes(q.id) || q.is_repeatable),
    mode,
  )
  if (pool.length === 0) return undefined
  return pool[Math.floor(Math.random() * pool.length)]
}

export type SoloChapterDef = {
  id: string
  titleKey: string
  category: QuestCategory
  questIds: number[]
  weeks: number
}

export type SoloChapterProgress = {
  activeChapterId: string | null
  completedChapterIds: string[]
  completedQuestIdsInChapter: Record<string, number[]>
}

export const DEFAULT_SOLO_CHAPTER_PROGRESS: SoloChapterProgress = {
  activeChapterId: null,
  completedChapterIds: [],
  completedQuestIdsInChapter: {},
}

const CHAPTER_BLUEPRINTS: Omit<SoloChapterDef, 'questIds'>[] = [
  { id: 'chapter-foundation', titleKey: 'chapterFoundation', category: 'drawing', weeks: 4 },
  { id: 'chapter-anatomy', titleKey: 'chapterAnatomy', category: 'anatomy', weeks: 4 },
  { id: 'chapter-motion', titleKey: 'chapterMotion', category: 'animation', weeks: 6 },
]

/** Build chapter quest lists from catalog (5 novice/intermediate quests per category). */
export function buildSoloChapters(quests: Quest[]): SoloChapterDef[] {
  return CHAPTER_BLUEPRINTS.map((bp) => {
    const ids = quests
      .filter(
        (q) =>
          q.category === bp.category &&
          (q.difficulty === 'novice' || q.difficulty === 'intermediate'),
      )
      .sort((a, b) => a.id - b.id)
      .slice(0, 5)
      .map((q) => q.id)
    return { ...bp, questIds: ids }
  }).filter((c) => c.questIds.length > 0)
}

export function getChapterProgressPercent(
  chapter: SoloChapterDef,
  _progress: SoloChapterProgress,
  logs: QuestCompletionLog[],
): number {
  const loggedIds = new Set(logs.map((l) => l.questId))
  const done = chapter.questIds.filter((id) => loggedIds.has(id)).length
  return Math.round((done / Math.max(1, chapter.questIds.length)) * 100)
}

export function isChapterComplete(
  chapter: SoloChapterDef,
  logs: QuestCompletionLog[],
): boolean {
  const loggedIds = new Set(logs.map((l) => l.questId))
  return chapter.questIds.every((id) => loggedIds.has(id))
}

export function pickActiveChapter(
  chapters: SoloChapterDef[],
  progress: SoloChapterProgress,
  logs: QuestCompletionLog[],
): SoloChapterDef | null {
  if (progress.activeChapterId) {
    const found = chapters.find((c) => c.id === progress.activeChapterId)
    if (found && !isChapterComplete(found, logs)) return found
  }
  const next = chapters.find(
    (c) => !progress.completedChapterIds.includes(c.id) && !isChapterComplete(c, logs),
  )
  return next ?? null
}
