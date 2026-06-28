/**
 * Pack H — supporting quests for anatomy/storytelling/effects that strengthen animation + drawing.
 */
import { clamp, mc, type QuestDraft } from './youtube-quest-helpers.ts'

type ChannelKey =
  | 'prokotv'
  | 'stevenmichaelhampton'
  | 'animecharlie'
  | 'kaycemcrew'
  | 'dongchang'
  | 'sakugafoundry'
  | 'spywis'
  | 'rtfxanimation'
  | 'olofstorm'
  | 'cgspeak'

function q(
  id: number,
  category: QuestDraft['category'],
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
  medium: QuestDraft['medium'] = 'both',
  repeatable = true,
  review = 14,
  prerequisites: number[] = [],
): QuestDraft {
  return {
    id,
    category,
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
    microChallenges: mc(
      `${id}-${category}`,
      { en: 'Warm up: 2 tiny sketches', ru: 'Разминка: 2 мини-скетча' },
      { en: 'Main exercise', ru: 'Основное упражнение' },
      { en: 'Polish best pass once', ru: 'Один проход полировки' },
      [4, clamp(Math.round(est * 0.6), 8, 55), clamp(Math.round(est * 0.25), 4, 25)],
    ),
  }
}

function anatomyForAnimation(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const parts = [
    { en: 'shoulder + arm cylinders', ru: 'плечо + рука цилиндрами', tag: 'arm' },
    { en: 'hip + leg cylinders', ru: 'таз + нога цилиндрами', tag: 'legs' },
    { en: 'ribcage vs pelvis twist', ru: 'скрутка грудь/таз', tag: 'torso' },
    { en: 'hands simplified blocks', ru: 'кисти упрощённо', tag: 'hands' },
    { en: 'feet wedge + arch', ru: 'ступня: клин + свод', tag: 'feet' },
    { en: 'head tilt + jaw wedge', ru: 'наклон головы + челюсть', tag: 'head' },
  ]
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!
    out.push(
      q(
        id++,
        'anatomy',
        `Animation anatomy: ${p.en} (12 sketches)`,
        `Анатомия для анимации: ${p.ru} (12)`,
        '12 quick sketches focusing on rhythm and overlap. No rendering.',
        '12 быстрых эскизов: ритм и перекрытие. Без рендера.',
        ['anatomy', 'gesture', p.tag, 'practice'],
        i < 2 ? 'novice' : i < 5 ? 'intermediate' : 'advanced',
        i < 2 ? 2 : i < 5 ? 5 : 9,
        30 + i * 4,
        65 + i * 10,
        i % 2 === 0 ? 'prokotv' : 'stevenmichaelhampton',
        i % 2 === 0 ? 'Proko (YouTube)' : 'Steven Michael Hampton (YouTube)',
      ),
    )
  }
  // Foreshortening sets
  for (let i = 0; i < 18; i++) {
    const n = 6 + (i % 4)
    out.push(
      q(
        id++,
        'anatomy',
        `Foreshortening set: ${n} limbs`,
        `Ракурс: ${n} конечностей`,
        `Draw ${n} limbs coming toward camera. Use cylinders + overlap; add cross-contours on 2.`,
        `${n} конечностей «в камеру». Цилиндры + перекрытие; перекрёстный контур на 2.`,
        ['foreshortening', 'perspective', 'limbs', 'anatomy'],
        i < 6 ? 'intermediate' : i < 14 ? 'advanced' : 'master',
        i < 6 ? 5 : i < 14 ? 9 : 14,
        35 + i * 2,
        85 + i * 6,
        'kaycemcrew',
        'Kaycem Crew (YouTube)',
      ),
    )
  }
  // AnimeCharlie basics recap sheets
  for (let i = 0; i < 12; i++) {
    out.push(
      q(
        id++,
        'anatomy',
        `Basic anatomy mileage: 20 torsos (${i + 1})`,
        `База анатомии: 20 торсов (${i + 1})`,
        '20 torso thumbnails: ribcage + pelvis only. Mark tilt line.',
        '20 торсов: грудь + таз. Отметь линию наклона.',
        ['torso', 'gesture', 'mileage', 'anatomy'],
        i < 6 ? 'novice' : 'intermediate',
        i < 6 ? 2 : 4,
        24 + i * 2,
        55 + i * 4,
        'animecharlie',
        'Anime Charlie (YouTube)',
        'both',
        true,
        7,
      ),
    )
  }
  return out
}

function storyboardAnimaticPipeline(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const beats = [
    { en: 'enter room → notice → react', ru: 'вход → заметил → реакция' },
    { en: 'pickup → reveal → surprise', ru: 'взял → показал → сюрприз' },
    { en: 'argument → turn away → regret', ru: 'ссора → отвернулся → сожаление' },
    { en: 'chase → stumble → escape', ru: 'погоня → споткнулся → спасся' },
  ]
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i]!
    out.push(
      q(
        id++,
        'storytelling',
        `Storyboard beat: ${b.en} (8 panels)`,
        `Сториборд-бит: ${b.ru} (8 панелей)`,
        '8 panels: clear staging, camera notes on 2 panels. No polish.',
        '8 панелей: staging, пометки камеры на 2. Без полировки.',
        ['storyboard', 'panels', 'pipeline'],
        'intermediate',
        5,
        45,
        90,
        'dongchang',
        'Dong Chang (YouTube)',
        'both',
        true,
        14,
      ),
    )
    out.push(
      q(
        id++,
        'storytelling',
        `Animatic timing: ${b.en} (12 panels)`,
        `Аниматик-тайминг: ${b.ru} (12 панелей)`,
        '12 panels with durations (frames or seconds). Deliverable: total duration sum + beats.',
        '12 панелей с длительностью (кадры/сек). Результат: сумма длительности + биты.',
        ['animatic', 'pacing', 'pipeline'],
        'advanced',
        9,
        55,
        115,
        'sakugafoundry',
        'Sakuga Foundry (YouTube)',
        'both',
        false,
        21,
      ),
    )
  }
  // Efficiency / camera / layers
  for (let i = 0; i < 16; i++) {
    out.push(
      q(
        id++,
        'storytelling',
        `Efficiency shot plan: layers + camera (${i + 1})`,
        `План шота: слои + камера (${i + 1})`,
        'Plan a shot with static layers + camera move + one looping FX. Deliverable: layer list + rough thumb.',
        'План шота: статичные слои + движение камеры + один FX-луп. Результат: список слоёв + миниатюра.',
        ['efficiency', 'camera', 'layers', 'pipeline'],
        i < 8 ? 'intermediate' : 'advanced',
        i < 8 ? 6 : 9,
        35 + i * 2,
        85 + i * 5,
        'spywis',
        "Spywi's Mind Palace (YouTube)",
        'digital',
        true,
        14,
      ),
    )
  }
  // Career / reel checklists (CGSpeak)
  for (let i = 0; i < 10; i++) {
    out.push(
      q(
        id++,
        'storytelling',
        `Reel checklist: pick 3 best shots (${i + 1})`,
        `Рил: 3 лучших шота (${i + 1})`,
        'Pick 3 shots (or exercises) to represent your skill. Write 1 sentence goal per shot.',
        'Выбери 3 шота (или упражнения). По 1 предложению: цель каждого.',
        ['portfolio', 'reel', 'career', 'study_plan'],
        i < 5 ? 'intermediate' : 'advanced',
        i < 5 ? 4 : 8,
        22 + i * 2,
        65 + i * 4,
        'cgspeak',
        'CGSpeak (YouTube)',
        'both',
        true,
        21,
      ),
    )
  }
  return out
}

function effectsForAnimation(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const fx = [
    { en: 'smoke puff', ru: 'пых дыма', tag: 'smoke' },
    { en: 'spark burst', ru: 'вспышка искр', tag: 'sparks' },
    { en: 'impact dust', ru: 'пыль удара', tag: 'impact' },
    { en: 'fire loop', ru: 'луп огня', tag: 'fire' },
    { en: 'water splash', ru: 'всплеск воды', tag: 'water' },
    { en: 'energy hit', ru: 'энерго-удар', tag: 'glow' },
  ]
  for (let i = 0; i < fx.length; i++) {
    const f = fx[i]!
    out.push(
      q(
        id++,
        'effects',
        `FX loop: ${f.en} (8 frames)`,
        `FX-луп: ${f.ru} (8 кадров)`,
        'Draw an 8-frame FX loop. Deliverable: loop test + one pass to simplify silhouette.',
        '8 кадров FX-лупа. Результат: тест лупа + упрощение силуэта.',
        ['effects', 'loop', f.tag, 'animation'],
        i < 2 ? 'novice' : i < 5 ? 'intermediate' : 'advanced',
        i < 2 ? 2 : i < 5 ? 6 : 10,
        30 + i * 4,
        70 + i * 12,
        i % 2 === 0 ? 'rtfxanimation' : 'olofstorm',
        i % 2 === 0 ? 'RTFX animation (YouTube)' : 'Olof Storm (YouTube)',
        'digital',
        true,
        14,
      ),
    )
  }
  // Extra variations (lots of mileage)
  for (let i = 0; i < 24; i++) {
    const frames = 6 + (i % 5)
    out.push(
      q(
        id++,
        'effects',
        `FX thumbnails: ${frames} frames (shape first)`,
        `FX миниатюры: ${frames} кадров (форма)`,
        `Draw ${frames} frames of a simple FX using big shapes only. No detail until the motion reads.`,
        `${frames} кадров FX крупными формами. Детали только после читаемости движения.`,
        ['effects', 'shapes', 'timing', 'practice'],
        i < 10 ? 'novice' : i < 18 ? 'intermediate' : 'advanced',
        i < 10 ? 2 : i < 18 ? 6 : 10,
        18 + i,
        45 + i * 4,
        'rtfxanimation',
        'RTFX animation (YouTube)',
        'digital',
        true,
        7,
      ),
    )
  }
  return out
}

export const PACK_H: QuestDraft[] = [
  ...anatomyForAnimation(11880),
  ...storyboardAnimaticPipeline(11940),
  ...effectsForAnimation(12020),
]

