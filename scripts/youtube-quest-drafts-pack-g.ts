/**
 * Pack G — Large expansion: drawing-first drills and mini projects.
 * Focus: construction, perspective, gesture, composition, value, color, design.
 */
import { clamp, mc, type QuestDraft } from './youtube-quest-helpers.ts'

type ChannelKey =
  | 'prokotv'
  | 'brokendraw'
  | 'drawlikeasir'
  | 'keshart'
  | 'marcobucci'
  | 'sinixdesign'
  | 'rossdraws'
  | 'samdoesarts'
  | 'ytartschool'
  | 'niroxious'
  | 'animecharlie'
  | 'stevenmichaelhampton'
  | 'kaycemcrew'
  | 'aleiriau'
  | 'jazza'
  | 'ahmedaldoori'

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
  category: QuestDraft['category'] = 'drawing',
  medium: QuestDraft['medium'] = 'both',
  repeatable = true,
  review = 7,
  prerequisites: number[] = [],
  micro?: QuestDraft['microChallenges'],
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
    microChallenges:
      micro ??
      mc(
        `${id}-${category}`,
        { en: 'Warm up: 3 tiny thumbnails', ru: 'Разминка: 3 мини-эскиза' },
        { en: 'Main exercise', ru: 'Основное упражнение' },
        { en: 'Pick best and polish once', ru: 'Выбери лучшее и один раз дополируй' },
        [4, clamp(Math.round(est * 0.6), 8, 45), clamp(Math.round(est * 0.25), 4, 20)],
      ),
  }
}

function seriesConstruction(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const objects = [
    { en: 'chair', ru: 'стул' },
    { en: 'bicycle', ru: 'велосипед' },
    { en: 'kettle', ru: 'чайник' },
    { en: 'backpack', ru: 'рюкзак' },
    { en: 'phone', ru: 'телефон' },
    { en: 'shoe', ru: 'ботинок' },
    { en: 'camera', ru: 'камера' },
    { en: 'desk lamp', ru: 'лампа' },
  ]
  for (const o of objects) {
    out.push(
      q(
        id++,
        `Construction: ${o.en} (boxes first)`,
        `Построение: ${o.ru} (сначала кубы)`,
        'Block the object using boxes and cylinders first. No detail until forms read.',
        'Сначала кубы и цилиндры. Детали только после читаемости формы.',
        ['construction', 'shapes', 'simplify'],
        'novice',
        1,
        22,
        50,
        'drawlikeasir',
        'Draw Like a Sir (YouTube)',
      ),
    )
    out.push(
      q(
        id++,
        `Construction: ${o.en} (3 views)`,
        `Построение: ${o.ru} (3 вида)`,
        'Draw 3 views: front, 3/4, side. Keep proportions consistent.',
        '3 вида: фронт, 3/4, профиль. Сохрани пропорции.',
        ['construction', 'turnaround', 'practice'],
        'intermediate',
        4,
        35,
        80,
        'keshart',
        'KeshArt (YouTube)',
      ),
    )
  }
  // Mileage sheets
  for (let i = 0; i < 20; i++) {
    const n = 12 + i * 2
    out.push(
      q(
        id++,
        `Mileage page: ${n} boxes`,
        `Mileage-страница: ${n} кубов`,
        `Draw ${n} boxes in perspective. Ghost lines; no ruler. Deliverable: clean boxes, no shading.`,
        `${n} кубов в перспективе. Без линейки. Результат: чистые кубы, без тона.`,
        ['perspective', 'construction', 'quantity'],
        i < 8 ? 'novice' : i < 16 ? 'intermediate' : 'advanced',
        i < 8 ? 1 : i < 16 ? 4 : 8,
        18 + Math.floor(i / 2) * 2,
        45 + i * 3,
        'brokendraw',
        'brokendraw (YouTube)',
        'drawing',
        'traditional',
        true,
        7,
      ),
    )
  }
  return out
}

function seriesGesture(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const timers = [30, 45, 60, 90]
  for (const t of timers) {
    for (let set = 0; set < 10; set++) {
      const count = 6 + set
      out.push(
        q(
          id++,
          `Gesture set: ${count} poses × ${t}s`,
          `Жест: ${count} поз × ${t}с`,
          `Do ${count} figure gestures at ${t}s each. Line of action first; no hands/faces.`,
          `${count} жестов по ${t} секунд. Сначала линия действия; без кистей/лица.`,
          ['gesture', 'figure', 'speed', 'practice'],
          set < 3 ? 'novice' : set < 7 ? 'intermediate' : 'advanced',
          set < 3 ? 1 : set < 7 ? 3 : 6,
          14 + set * 2,
          40 + set * 6,
          'prokotv',
          'Proko (YouTube)',
          'drawing',
          'both',
          true,
          0,
        ),
      )
    }
  }
  return out
}

function seriesComposition(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const themes = [
    { en: 'lost item', ru: 'потерянная вещь' },
    { en: 'chase', ru: 'погоня' },
    { en: 'quiet room', ru: 'тихая комната' },
    { en: 'storm', ru: 'шторм' },
    { en: 'festival', ru: 'фестиваль' },
    { en: 'mystery door', ru: 'таинственная дверь' },
  ]
  for (const th of themes) {
    for (let i = 0; i < 8; i++) {
      const n = 4 + i
      out.push(
        q(
          id++,
          `Composition thumbnails: ${th.en} (${n})`,
          `Композиция: ${th.ru} (${n})`,
          `Draw ${n} thumbnails exploring focal point and value grouping. 3 minutes each.`,
          `${n} миниатюр с фокусом и группировкой тона. По 3 минуты.`,
          ['composition', 'focal', 'thumbnails'],
          i < 3 ? 'novice' : i < 6 ? 'intermediate' : 'advanced',
          i < 3 ? 1 : i < 6 ? 4 : 8,
          18 + i * 3,
          55 + i * 8,
          'sinixdesign',
          'Sinix Design (YouTube)',
        ),
      )
    }
  }
  return out
}

function seriesValueAndColor(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId

  // Value distillation sets (ErgoJosh style, but using listed channels: Marco/Sinix/Ahmed)
  for (let i = 0; i < 20; i++) {
    const values = 2 + (i % 4)
    out.push(
      q(
        id++,
        `Value distillation: ${values} values`,
        `Value distillation: ${values} тона`,
        `Pick a reference photo. Reduce it to ${values} values only (big shapes).`,
        `Возьми фото-референс. Сведи к ${values} тонам (крупные формы).`,
        ['value', 'render', 'study'],
        i < 6 ? 'intermediate' : i < 14 ? 'advanced' : 'master',
        i < 6 ? 4 : i < 14 ? 8 : 14,
        28 + i * 2,
        75 + i * 5,
        'ahmedaldoori',
        'Ahmed Aldoori (YouTube)',
        'drawing',
        'digital',
        true,
        14,
      ),
    )
  }

  // Color constraints
  const constraints = [
    { en: '3 colors', ru: '3 цвета', tag: 'constraint' },
    { en: 'monochrome + accent', ru: 'монохром + акцент', tag: 'harmony' },
    { en: 'complementary pair', ru: 'комплементарная пара', tag: 'harmony' },
    { en: 'analogous palette', ru: 'аналоговая палитра', tag: 'harmony' },
  ]
  for (const c of constraints) {
    for (let i = 0; i < 10; i++) {
      out.push(
        q(
          id++,
          `Color constraint: ${c.en} (scene)`,
          `Ограничение цвета: ${c.ru} (сцена)`,
          'Paint a simple scene thumbnail honoring the constraint. Deliverable: swatches + thumbnail.',
          'Мини-сцена по ограничению. Результат: образцы + миниатюра.',
          ['color', c.tag, 'harmony'],
          i < 4 ? 'intermediate' : i < 8 ? 'advanced' : 'master',
          i < 4 ? 4 : i < 8 ? 8 : 14,
          25 + i * 3,
          70 + i * 7,
          'marcobucci',
          'Marco Bucci (YouTube)',
          'drawing',
          'digital',
          true,
          14,
        ),
      )
    }
  }

  // YT Art School basics sets
  for (let i = 0; i < 12; i++) {
    out.push(
      q(
        id++,
        `Color wheel practice: ${i + 1}`,
        `Практика круга цвета: ${i + 1}`,
        'Do one small page: hue shifts + 3 harmonies + one tiny application.',
        'Одна страница: сдвиги hue + 3 гармонии + мини-применение.',
        ['color', 'hue', 'harmony', 'practice'],
        i < 4 ? 'novice' : i < 8 ? 'intermediate' : 'advanced',
        i < 4 ? 1 : i < 8 ? 4 : 8,
        18 + i * 2,
        45 + i * 4,
        'ytartschool',
        'YT Art School (YouTube)',
        'drawing',
        'both',
        true,
        14,
      ),
    )
  }
  return out
}

function seriesSilhouetteDesign(startId: number): QuestDraft[] {
  const out: QuestDraft[] = []
  let id = startId
  const archetypes = [
    { en: 'explorer', ru: 'исследователь' },
    { en: 'mage', ru: 'маг' },
    { en: 'mechanic', ru: 'механик' },
    { en: 'chef', ru: 'повар' },
    { en: 'pilot', ru: 'пилот' },
    { en: 'musician', ru: 'музыкант' },
  ]
  for (const a of archetypes) {
    for (let i = 0; i < 10; i++) {
      const n = 6 + i
      out.push(
        q(
          id++,
          `Silhouette lineup: ${a.en} (${n})`,
          `Силуэты: ${a.ru} (${n})`,
          `Draw ${n} silhouettes exploring shape language. One shared motif required.`,
          `${n} силуэтов, исследуй shape language. Нужен общий мотив.`,
          ['silhouette', 'design', 'shape_language'],
          i < 4 ? 'novice' : i < 8 ? 'intermediate' : 'advanced',
          i < 4 ? 2 : i < 8 ? 5 : 9,
          22 + i * 2,
          55 + i * 7,
          'rossdraws',
          'Ross Draws (YouTube)',
          'character_design',
          'both',
          true,
          7,
        ),
      )
    }
  }
  return out
}

export const PACK_G: QuestDraft[] = [
  ...seriesConstruction(11350),
  ...seriesGesture(11420),
  ...seriesComposition(11520),
  ...seriesValueAndColor(11620),
  ...seriesSilhouetteDesign(11740),
]

