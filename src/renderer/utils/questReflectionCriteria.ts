import type { Language } from '@/i18n/translations'
import type { QuestFeedbackCriterion } from '@/store/models'
import { mistakeTagsToWeakCriteria } from '@/utils/mistakeTags'

export const REFLECTION_CRITERIA_OPTIONS: QuestFeedbackCriterion['label'][] = [
  'line_confidence',
  'proportion',
  'composition',
]

type CriterionLabelBucket = Partial<Record<Language, string>> & { en: string }

const CRITERION_LABELS: Record<QuestFeedbackCriterion['label'], CriterionLabelBucket> = {
  line_confidence: {
    en: 'Line confidence',
    ru: 'Уверенность линии',
    zh: '线条自信',
    'zh-tw': '線條自信',
    ja: '線の自信',
    ko: '선 자신감',
  },
  proportion: {
    en: 'Proportions',
    ru: 'Пропорции',
    zh: '比例',
    'zh-tw': '比例',
    ja: 'プロポーション',
    ko: '비율',
  },
  value_range: {
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
  timing: {
    en: 'Timing',
    ru: 'Тайминг',
    zh: '节奏',
    'zh-tw': '節奏',
    ja: 'タイミング',
    ko: '타이밍',
  },
  pose: {
    en: 'Pose / gesture',
    ru: 'Поза / жест',
    zh: '姿态',
    'zh-tw': '姿態',
    ja: 'ポーズ / ジェスチャー',
    ko: '포즈 / 제스처',
  },
}

function pickLabel(bucket: CriterionLabelBucket, language: Language): string {
  return bucket[language] ?? bucket.en
}

export function getReflectionCriterionLabel(
  label: QuestFeedbackCriterion['label'],
  language: Language,
): string {
  const bucket = CRITERION_LABELS[label]
  if (!bucket) return label
  return pickLabel(bucket, language)
}

export function buildQuestSubmissionCriteria(
  mistakeTags: string[],
  strengthRatings: Partial<Record<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>>,
): QuestFeedbackCriterion[] {
  const byLabel = new Map<QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']>()

  for (const weak of mistakeTagsToWeakCriteria(mistakeTags)) {
    byLabel.set(weak.label, weak.rating)
  }

  for (const [label, rating] of Object.entries(strengthRatings) as Array<
    [QuestFeedbackCriterion['label'], QuestFeedbackCriterion['rating']]
  >) {
    if (!rating) continue
    const existing = byLabel.get(label)
    if (!existing || rating < existing) {
      byLabel.set(label, rating)
    }
  }

  return [...byLabel.entries()].map(([label, rating]) => ({ label, rating }))
}
