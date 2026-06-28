/**
 * Pack F — Large expansion: animation-first drills and mini projects.
 * Generated via small templates to add lots of repeatable practice.
 */
import { clamp, mc, type QuestDraft } from './youtube-quest-helpers.ts'

type ChannelKey =
  | 'alanbeckertutorials'
  | 'howardwimshurst'
  | 'tonikopantoja'
  | 'dongchang'
  | 'sakugafoundry'
  | 'spywis'
  | 'pikat'
  | 'rjanimationstoo'
  | 'animationschool_live'
  | 'mother_is_ape'

function q(
  id: number,
  titleEn: string,
  titleRu: string,
  descEn: string,
  descRu: string,
  tags: string[],
  difficulty: QuestDraft['difficulty'],
  min_level: number,
  est: number,
  xp: number,
  inspiredBy: ChannelKey,
  source: string,
  medium: QuestDraft['medium'] = 'digital',
  repeatable = true,
  review = 7,
  prerequisites: number[] = [],
  micro?: QuestDraft['microChallenges'],
): QuestDraft {
  return {
    id,
    category: 'animation',
    difficulty,
    inspiredBy,
    source,
    title: { en: titleEn, ru: titleRu },
    description: { en: descEn, ru: descRu },
    xp,
    estimatedTime: est,
    min_level,
    tags,
    medium,
    is_repeatable: repeatable,
    review_after_days: review,
    prerequisites,
    microChallenges:
      micro ??
      mc(
        `${id}-anim`,
        { en: 'Warm up: 2 tiny thumbnails of the motion', ru: 'Разминка: 2 мини-эскиза движения' },
        { en: 'Do the main exercise', ru: 'Выполни основное упражнение' },
        { en: 'Polish readability (silhouette + timing)', ru: 'Полировка читаемости (силуэт + тайминг)' },
        [4, clamp(Math.round(est * 0.55), 8, 35), clamp(Math.round(est * 0.25), 4, 20)],
      ),
  }
}

function seriesSpacingTiming(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  const levels: Array<{ diff: QuestDraft['difficulty']; min: number; est: number; xp: number }> = [
    { diff: 'novice', min: 1, est: 18, xp: 50 },
    { diff: 'intermediate', min: 4, est: 26, xp: 70 },
    { diff: 'advanced', min: 8, est: 34, xp: 95 },
    { diff: 'master', min: 14, est: 45, xp: 140 },
  ]
  const topics = [
    {
      tag: 'spacing',
      en: 'Spacing ladder: 7 dots → 7 frames',
      ru: 'Лестница spacing: 7 точек → 7 кадров',
      den: 'Draw a spacing ladder (7 dots) and convert into 7 frames. Label slow-in/out.',
      dru: 'Нарисуй лестницу spacing (7 точек) и преврати в 7 кадров. Подпиши slow-in/out.',
      ch: 'alanbeckertutorials' as const,
      src: 'Alan Becker Tutorials (YouTube)',
    },
    {
      tag: 'timing',
      en: 'Timing chart: 3 holds + 1 snap',
      ru: 'График тайминга: 3 hold + 1 snap',
      den: 'Create a timing chart for a simple action with 3 holds and one snappy move.',
      dru: 'Сделай график тайминга простого действия с 3 hold и одним резким движением.',
      ch: 'dongchang' as const,
      src: 'Dong Chang (YouTube)',
    },
    {
      tag: 'arcs',
      en: 'Arc accuracy test: 9-frame swing',
      ru: 'Тест дуг: 9 кадров взмаха',
      den: 'Animate/draw a 9-frame swing. Plot the arc and fix off-arc frames.',
      dru: '9 кадров взмаха. Построй дугу и исправь кадры, выбивающиеся из дуги.',
      ch: 'howardwimshurst' as const,
      src: 'Howard Wimshurst (YouTube)',
    },
    {
      tag: 'ease',
      en: 'Slow-in/slow-out: pendulum with chart',
      ru: 'Slow-in/slow-out: маятник с графиком',
      den: 'Pendulum swing with chart: denser near extremes, wider in middle.',
      dru: 'Маятник с графиком: плотнее на крайних, шире в середине.',
      ch: 'howardwimshurst' as const,
      src: 'Howard Wimshurst (YouTube)',
    },
  ]

  let id = startId
  for (const t of topics) {
    for (let i = 0; i < levels.length; i++) {
      const L = levels[i]!
      const frames = 5 + i * 2
      out.push(
        q(
          id++,
          `${t.en} (${frames} frames)`,
          `${t.ru} (${frames} кадров)`,
          `${t.den} Deliverable: ${frames} frames + chart/arc marks on the page.`,
          `${t.dru} Результат: ${frames} кадров + график/дуга на листе.`,
          [t.tag, 'practice', 'charts'],
          L.diff,
          L.min,
          L.est,
          L.xp,
          t.ch,
          t.src,
          'both',
          true,
          L.diff === 'novice' ? 0 : 7,
        ),
      )
    }
  }
  return out
}

function seriesActingAndFace(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const emotions = [
    { en: 'surprise', ru: 'удивление' },
    { en: 'anger', ru: 'злость' },
    { en: 'fear', ru: 'страх' },
    { en: 'joy', ru: 'радость' },
    { en: 'sadness', ru: 'грусть' },
    { en: 'disgust', ru: 'отвращение' },
  ]
  for (const e of emotions) {
    out.push(
      q(
        id++,
        `Acting keys: ${e.en} (3 poses)`,
        `Актинг-ключи: ${e.ru} (3 позы)`,
        'Draw 3 key poses for one character showing a clear emotion. No in-betweens; focus on silhouette.',
        '3 ключевые позы одного персонажа с ясной эмоцией. Без промежуточных; упор на силуэт.',
        ['acting', 'silhouette', 'keys', 'character'],
        'intermediate',
        5,
        30,
        80,
        'tonikopantoja',
        'Toniko Pantoja (YouTube)',
        'both',
        true,
        14,
        [],
        mc(
          `${id}-acting-${e.en}`,
          { en: 'Warmup: 2 gesture heads', ru: 'Разминка: 2 жестовые головы' },
          { en: '3 emotion key poses', ru: '3 ключевые позы эмоции' },
          { en: 'Push 1 pose for clarity', ru: 'Усиль 1 позу для читаемости' },
          [5, 18, 7],
        ),
      ),
    )
  }

  // Lip sync micro-set
  for (let i = 0; i < 8; i++) {
    const n = i + 4
    out.push(
      q(
        id++,
        `Lip sync sheet: ${n} mouth shapes`,
        `Lip sync-лист: ${n} форм рта`,
        `Draw ${n} mouth shapes on the same head angle. Label phoneme (A/E/O/M etc).`,
        `${n} форм рта на одном ракурсе головы. Подпиши фонемы (A/E/O/M…).`,
        ['lip_sync', 'face', 'mouth', 'practice'],
        i < 3 ? 'novice' : i < 6 ? 'intermediate' : 'advanced',
        i < 3 ? 2 : i < 6 ? 5 : 9,
        22 + i * 3,
        55 + i * 8,
        'rjanimationstoo',
        'RJ Animations Too (YouTube)',
        'digital',
        true,
        14,
      ),
    )
  }
  return out
}

function seriesWalkRunOverlap(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const cycles = [
    { key: 'walk', en: 'Walk cycle keys', ru: 'Ключи шага', min: 4, base: 32, ch: 'alanbeckertutorials' as const, src: 'Alan Becker Tutorials (YouTube)' },
    { key: 'run', en: 'Run cycle keys', ru: 'Ключи бега', min: 5, base: 34, ch: 'alanbeckertutorials' as const, src: 'Alan Becker Tutorials (YouTube)' },
    { key: 'idle', en: 'Idle / breathing loop', ru: 'Idle / дыхание', min: 3, base: 26, ch: 'tonikopantoja' as const, src: 'Toniko Pantoja (YouTube)' },
  ]

  for (const c of cycles) {
    for (let variant = 0; variant < 8; variant++) {
      const keys = 4 + variant
      const diff: QuestDraft['difficulty'] = variant < 2 ? 'novice' : variant < 5 ? 'intermediate' : 'advanced'
      out.push(
        q(
          id++,
          `${c.en}: ${keys} keys`,
          `${c.ru}: ${keys} ключей`,
          `Create a ${c.key} with ${keys} key poses. Deliverable: labeled contacts/passing + loop test.`,
          `${c.key === 'idle' ? 'Сделай idle' : c.key === 'run' ? 'Сделай бег' : 'Сделай шаг'} из ${keys} ключей. Результат: подписи contact/passing + тест лупа.`,
          [c.key, 'cycle', 'timing', 'practice'],
          diff,
          c.min + Math.floor(variant / 2),
          c.base + variant * 3,
          65 + variant * 10,
          c.ch,
          c.src,
          'digital',
          true,
          diff === 'novice' ? 7 : 14,
        ),
      )
    }
  }

  // Overlap / follow-through drills
  const overlaps = [
    { en: 'Scarf overlap', ru: 'Overlап шарфа', tag: 'overlap' },
    { en: 'Hair follow-through', ru: 'Follow-through волос', tag: 'follow_through' },
    { en: 'Tail drag', ru: 'Drag хвоста', tag: 'drag' },
    { en: 'Sleeve lag', ru: 'Запаздывание рукава', tag: 'overlap' },
    { en: 'Backpack bounce', ru: 'Подпрыгивание рюкзака', tag: 'overlap' },
  ]
  for (let i = 0; i < overlaps.length; i++) {
    const o = overlaps[i]!
    out.push(
      q(
        id++,
        `Overlap drill: ${o.en}`,
        `Дрилл overlap: ${o.ru}`,
        'Add overlap to an existing walk/run/idle: secondary element delayed by 2–3 frames. Deliverable: loop test.',
        'Добавь overlap к существующему циклу: вторичный элемент с задержкой 2–3 кадра. Результат: тест лупа.',
        [o.tag, 'secondary', 'cycle', 'practice'],
        'intermediate',
        6,
        35,
        90,
        'alanbeckertutorials',
        'Alan Becker Tutorials (YouTube)',
        'digital',
        true,
        14,
      ),
    )
  }

  return out
}

function seriesImpactSmear(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const actions = [
    { en: 'punch', ru: 'удар кулаком' },
    { en: 'kick', ru: 'удар ногой' },
    { en: 'sword swing', ru: 'взмах мечом' },
    { en: 'head turn snap', ru: 'резкий поворот головы' },
    { en: 'landing', ru: 'приземление' },
    { en: 'throw', ru: 'бросок' },
  ]
  for (const a of actions) {
    out.push(
      q(
        id++,
        `Impact trio: ${a.en}`,
        `Impact трио: ${a.ru}`,
        'Draw 3 frames: before / impact / after. Smear allowed on impact. Deliverable: readable silhouettes.',
        '3 кадра: до / impact / после. Smear на impact допустим. Результат: читаемые силуэты.',
        ['impact', 'smear', 'combat', 'staging'],
        'advanced',
        10,
        42,
        115,
        'howardwimshurst',
        'Howard Wimshurst (YouTube)',
        'digital',
        false,
        21,
      ),
    )
  }
  // Smear strip variants
  for (let i = 0; i < 12; i++) {
    const frames = 3 + (i % 3)
    out.push(
      q(
        id++,
        `Smear strip: ${frames} frames`,
        `Smear-полоса: ${frames} кадра`,
        `Fast motion test with ${frames} frames, including 1 smear. Deliverable: arc marks + spacing notes.`,
        `Тест быстрого движения: ${frames} кадра, один smear. Результат: дуга + пометки spacing.`,
        ['smear', 'spacing', 'speed'],
        i < 4 ? 'intermediate' : i < 9 ? 'advanced' : 'master',
        i < 4 ? 7 : i < 9 ? 10 : 15,
        28 + i * 2,
        80 + i * 7,
        'howardwimshurst',
        'Howard Wimshurst (YouTube)',
        'digital',
        true,
        14,
      ),
    )
  }
  return out
}

export const PACK_F: QuestDraft[] = [
  ...seriesSpacingTiming(11100),
  ...seriesActingAndFace(11140),
  ...seriesWalkRunOverlap(11180),
  ...seriesImpactSmear(11240),
]

