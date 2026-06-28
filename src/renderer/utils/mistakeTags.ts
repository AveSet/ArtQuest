import type { Language } from '@/i18n/translations'
import type { QuestFeedbackCriterion } from '@/store/models'

export type MistakeTag =
  | 'perspective'
  | 'proportion'
  | 'value'
  | 'composition'
  | 'gesture'
  | 'line'
  | 'color'
  | 'timing'
  | 'lighting'

export const MISTAKE_TAGS: MistakeTag[] = [
  'perspective',
  'proportion',
  'value',
  'composition',
  'gesture',
  'line',
  'color',
  'timing',
  'lighting',
]

type MistakeLabelBucket = Partial<Record<Language, string>> & { en: string }

const LABELS: Record<MistakeTag, MistakeLabelBucket> = {
  perspective: {
    en: 'Perspective',
    ru: 'Перспектива',
    zh: '透视',
    'zh-tw': '透視',
    ja: 'パース',
    ko: '원근',
  },
  proportion: {
    en: 'Proportions',
    ru: 'Пропорции',
    zh: '比例',
    'zh-tw': '比例',
    ja: 'プロポーション',
    ko: '비율',
  },
  value: {
    en: 'Values',
    ru: 'Тон',
    zh: '明暗',
    'zh-tw': '明暗',
    ja: 'バリュー',
    ko: '명암',
  },
  composition: {
    en: 'Composition',
    ru: 'Композиция',
    zh: '构图',
    'zh-tw': '構圖',
    ja: '構図',
    ko: '구도',
  },
  gesture: {
    en: 'Gesture / pose',
    ru: 'Жест / поза',
    zh: '姿态',
    'zh-tw': '姿態',
    ja: 'ジェスチャー / ポーズ',
    ko: '제스처 / 포즈',
  },
  line: {
    en: 'Line confidence',
    ru: 'Линия',
    zh: '线条',
    'zh-tw': '線條',
    ja: '線の自信',
    ko: '선',
  },
  color: {
    en: 'Color',
    ru: 'Цвет',
    zh: '色彩',
    'zh-tw': '色彩',
    ja: '色彩',
    ko: '색',
  },
  timing: {
    en: 'Timing',
    ru: 'Тайминг',
    zh: '节奏',
    'zh-tw': '節奏',
    ja: 'タイミング',
    ko: '타이밍',
  },
  lighting: {
    en: 'Lighting',
    ru: 'Свет',
    zh: '光影',
    'zh-tw': '光影',
    ja: 'ライティング',
    ko: '조명',
  },
}

function pickLabel(bucket: MistakeLabelBucket, language: Language): string {
  return bucket[language] ?? bucket.en
}

const RELATED_QUEST_TAGS: Record<MistakeTag, string[]> = {
  perspective: ['perspective', 'space', 'environment'],
  proportion: ['proportion', 'anatomy', 'figure'],
  value: ['value', 'shading', 'tone'],
  composition: ['composition', 'storytelling', 'layout'],
  gesture: ['gesture', 'pose', 'dynamic'],
  line: ['line', 'clean_lines', 'sketch'],
  color: ['color', 'palette'],
  timing: ['timing', 'animation'],
  lighting: ['lighting', 'light'],
}

export function getMistakeTagLabel(tag: string, language: Language): string {
  const key = tag as MistakeTag
  const bucket = LABELS[key]
  if (!bucket) return tag
  return pickLabel(bucket, language)
}

export function mistakeTagsToWeakCriteria(tags: string[]): QuestFeedbackCriterion[] {
  const criteria = new Map<MistakeTag, QuestFeedbackCriterion['label']>([
    ['line', 'line_confidence'],
    ['proportion', 'proportion'],
    ['value', 'value_range'],
    ['composition', 'composition'],
    ['timing', 'timing'],
    ['gesture', 'pose'],
  ])
  return tags
    .map((tag) => criteria.get(tag as MistakeTag))
    .filter((label): label is QuestFeedbackCriterion['label'] => Boolean(label))
    .map((label) => ({ label, rating: 2 as const }))
}

/** Legacy quest-tag keys mapped to canonical adaptive-weight keys. */
const ADAPTIVE_TAG_ALIASES: Record<string, string> = {
  proportions: 'proportion',
  clean_lines: 'line',
  light: 'lighting',
}

export function canonicalAdaptiveTag(tag: string): string {
  return ADAPTIVE_TAG_ALIASES[tag] ?? tag
}

export function resolveAdaptiveWeight(
  weights: Record<string, number | undefined>,
  tag: string,
): number {
  const canonical = canonicalAdaptiveTag(tag)
  const direct = weights[canonical] ?? weights[tag]
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct
  return weights.default ?? 1
}

export function relatedQuestTagsForMistakes(tags: string[]): string[] {
  const result = new Set<string>()
  for (const tag of tags) {
    for (const related of RELATED_QUEST_TAGS[tag as MistakeTag] ?? [tag]) {
      result.add(canonicalAdaptiveTag(related))
    }
  }
  return [...result]
}
