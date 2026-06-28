import type { Quest, QuestCompletionLog, CompletedWork } from '@/store/models'
import type { QuestCategory } from '@/data/skillTree'
import { relatedQuestTagsForMistakes } from '@/utils/mistakeTags'

const CRITERION_TO_TAGS: Record<string, string[]> = {
  line_confidence: ['line', 'sketch', 'clean_lines'],
  proportion: ['proportion', 'anatomy', 'figure'],
  value_range: ['value', 'shading', 'tone'],
  composition: ['composition', 'layout', 'storytelling'],
  timing: ['timing', 'animation'],
  pose: ['gesture', 'pose', 'dynamic'],
}

/** Map self-review criterion keys to catalog / quest tag vocabulary. */
export function criterionToFocusTags(criterion: string): string[] {
  const mapped = CRITERION_TO_TAGS[criterion]
  if (mapped?.length) return mapped
  return relatedQuestTagsForMistakes([criterion])
}

export function collectRecentMistakeTags(logs: QuestCompletionLog[], days = 14): string[] {
  const cutoff = Date.now() - days * 86_400_000
  const counts = new Map<string, number>()
  for (const log of logs) {
    if (new Date(log.completedAt).getTime() < cutoff) continue
    for (const tag of log.feedback?.mistakeTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)
}

function tagsFromImprovementText(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const tag of [
    'perspective',
    'proportion',
    'value',
    'composition',
    'gesture',
    'line',
    'color',
    'timing',
    'lighting',
    'anatomy',
    'pose',
    'shading',
  ]) {
    if (lower.includes(tag)) found.push(tag)
  }
  return found
}

/** Tags from logs, gallery improvement notes, and optional weak criterion. */
export function collectLearningFocusTags(opts: {
  questCompletionLogs: QuestCompletionLog[]
  completedWorks?: CompletedWork[]
  weakCriterion?: string
}): string[] {
  const set = new Set<string>()
  for (const tag of collectRecentMistakeTags(opts.questCompletionLogs)) {
    set.add(tag)
    for (const r of relatedQuestTagsForMistakes([tag])) set.add(r)
  }
  for (const work of opts.completedWorks ?? []) {
    for (const tag of work.tags ?? []) {
      set.add(tag)
      for (const r of relatedQuestTagsForMistakes([tag])) set.add(r)
    }
    if (work.improvementNotes) {
      for (const t of tagsFromImprovementText(work.improvementNotes)) set.add(t)
    }
  }
  if (opts.weakCriterion) {
    for (const t of criterionToFocusTags(opts.weakCriterion)) set.add(t)
  }
  return [...set]
}

export function buildMaterialsLearnPath(focusTags: string[]): string {
  const p = new URLSearchParams()
  p.set('view', 'learn')
  const tags = focusTags.filter(Boolean).slice(0, 8)
  if (tags.length > 0) p.set('tags', tags.join(','))
  return `/resources?${p.toString()}`
}

export function questMatchesFocusTags(quest: Quest, focusTags: string[]): number {
  if (focusTags.length === 0) return 0
  const lower = quest.tags.map((t) => t.toLowerCase())
  let score = 0
  for (const tag of focusTags) {
    const t = tag.toLowerCase()
    if (lower.some((q) => q === t || q.includes(t) || t.includes(q))) score += 2
  }
  if (focusTags.some((ft) => quest.category === ft)) score += 1
  return score
}

/** Best incomplete daily by focus tags and favorite categories. */
export function pickBestDailyQuest(
  incompleteDaily: Quest[],
  focusTags: string[],
  favoriteCategories?: QuestCategory[],
): Quest | null {
  if (incompleteDaily.length === 0) return null
  if (incompleteDaily.length === 1) return incompleteDaily[0]!

  const favSet = new Set(favoriteCategories ?? [])
  const sorted = [...incompleteDaily].sort((a, b) => {
    const tagA = questMatchesFocusTags(a, focusTags)
    const tagB = questMatchesFocusTags(b, focusTags)
    if (tagB !== tagA) return tagB - tagA
    const favA = favSet.has(a.category) ? 1 : 0
    const favB = favSet.has(b.category) ? 1 : 0
    if (favB !== favA) return favB - favA
    return a.estimatedTime - b.estimatedTime
  })
  return sorted[0] ?? null
}
