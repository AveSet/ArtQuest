import type { Language, LocalizedString } from '@/i18n/translations'
import type { Quest } from '@/store/models'
import { getFundamentalsBookPagesForOrder } from '@/data/fundamentalsBookPages'

export const FUNDAMENTALS_TRACK_NOVICE_ID = 96001
export const FUNDAMENTALS_TRACK_NOVICE_B_ID = 96011
export const FUNDAMENTALS_TRACK_MEDIUM_ID = 96002
export const FUNDAMENTALS_ADVANCED_ID_MIN = 96003
export const FUNDAMENTALS_ADVANCED_ID_MAX = 96010
export const FUNDAMENTALS_QUEST_ID_MIN = FUNDAMENTALS_TRACK_NOVICE_ID
export const FUNDAMENTALS_QUEST_ID_MAX = FUNDAMENTALS_TRACK_NOVICE_B_ID
/** Total catalog entries: 2 novice parts + medium track + 8 advanced quests. */
export const FUNDAMENTALS_EXERCISE_COUNT = 11
export const FUNDAMENTALS_ADVANCED_GATE_COUNT = 3
export const FUNDAMENTALS_NOVICE_PART_A_COUNT = 6
export const FUNDAMENTALS_NOVICE_PART_B_COUNT = 2
export const FUNDAMENTALS_NOVICE_PHASE_COUNT =
  FUNDAMENTALS_NOVICE_PART_A_COUNT + FUNDAMENTALS_NOVICE_PART_B_COUNT
export const FUNDAMENTALS_MEDIUM_PHASE_COUNT = 9

export type BookTier = 'beginner' | 'intermediate' | 'advanced'
export type FundamentalsTrackKind = 'novice' | 'medium'

export type FundamentalsTrackPhase = {
  phaseIndex: number
  bookOrder: number
  title: LocalizedString
  description: LocalizedString
  steps: LocalizedString[]
  bookPages: number[]
  estimatedTime: number
  xp: number
  /** English search query for reference panels (phase title + topic tags). */
  referenceQuery: string
  /** Topic tags for reference search (excludes book/track meta tags). */
  topicTags: string[]
}

export type FundamentalsExercise = Quest & {
  bookOrder?: number
  bookTier: BookTier
  steps?: LocalizedString[]
  bookPages?: number[]
  trackKind?: FundamentalsTrackKind
  trackPhases?: FundamentalsTrackPhase[]
}

type I18n = LocalizedString

type ExerciseSpec = {
  bookOrder: number
  bookTier: BookTier
  difficulty: Quest['difficulty']
  estimatedTime: number
  xp: number
  icon: string
  tags: string[]
  title: I18n
  description: I18n
  steps: I18n[]
}

const SOURCE = 'David Petrov — 25 Drawing Exercises'

const FUNDAMENTALS_META_TAGS = new Set([
  'fundamentals',
  'book-25',
  'track',
  'novice',
  'medium',
  'drawing',
])

function fundamentalsTopicTags(tags: string[]): string[] {
  return tags.filter((tag) => !FUNDAMENTALS_META_TAGS.has(tag))
}

function fundamentalsReferenceQuery(titleEn: string, tags: string[]): string {
  const topicTags = fundamentalsTopicTags(tags)
  return [titleEn, ...topicTags, 'drawing reference'].join(' ').replace(/\s+/g, ' ').trim()
}

const SPECS: ExerciseSpec[] = [
  {
    bookOrder: 1,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 12,
    icon: '✏️',
    tags: ['fundamentals', 'book-25', 'lines', 'drawing'],
    title: {
      en: 'Straights and Curves',
      ru: 'Прямые и кривые',
    },
    description: {
      en: 'Warm up motor control: repeat each line 8 times using wrist, elbow, and shoulder.',
      ru: 'Разогрев моторики: повтори каждую линию 8 раз, задействуя запястье, локоть и плечо.',
    },
    steps: [
      {
        en: 'Copy the sequence: horizontals, S/M/L curves, arcs, and verticals — ×8 each.',
        ru: 'Повтори последовательность: горизонтали, S/M/L-кривые, дуги и вертикали — по 8 раз.',
      },
      {
        en: 'Work stacked or separated; keep parallel lines truly parallel.',
        ru: 'Рисуй линии стопкой или отдельно; следи, чтобы параллельные линии оставались параллельными.',
      },
      {
        en: 'Use a pen; pull strokes toward you for control, practice pushing sometimes too.',
        ru: 'Используй ручку; тяни линию к себе для контроля, иногда практикуй и толкающие штрихи.',
      },
    ],
  },
  {
    bookOrder: 2,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 12,
    icon: '⭕',
    tags: ['fundamentals', 'book-25', 'circles', 'ellipses', 'drawing'],
    title: {
      en: 'Point Coordination',
      ru: 'Координация точек',
    },
    description: {
      en: 'Train hand–eye coordination: draw a straight line through a dot from one side of the page to the other.',
      ru: 'Тренируй координацию: проведи прямую через точку от одного края листа до другого.',
    },
    steps: [
      {
        en: 'Place a dot; draw a straight line through it edge to edge — longer is harder.',
        ru: 'Поставь точку; проведи прямую через неё от края до края — чем длиннее, тем сложнее.',
      },
      {
        en: 'Keep the line straight and equal length on both sides of the dot.',
        ru: 'Линия должна быть прямой, с равной длиной по обе стороны от точки.',
      },
      {
        en: 'Variation: connect several dots with single-stroke straight lines.',
        ru: 'Вариация: соедини несколько точек прямыми линиями одним штрихом.',
      },
    ],
  },
  {
    bookOrder: 3,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 12,
    icon: '📐',
    tags: ['fundamentals', 'book-25', 'angles', 'lines', 'drawing'],
    title: {
      en: 'Tilting Planes',
      ru: 'Наклонные плоскости',
    },
    description: {
      en: 'Build coordination drawing skewed planes and matching ellipses — prerequisite for 3D forms.',
      ru: 'Тренируй наклонные плоскости и соответствующие эллипсы — база для объёмных форм.',
    },
    steps: [
      {
        en: 'Draw columns A (tilted planes) and B (ellipses) as in the book.',
        ru: 'Нарисуй колонки A (наклонные плоскости) и B (эллипсы), как в книге.',
      },
      {
        en: 'Keep ellipse major axis 90° to the center line; avoid pointy ends.',
        ru: 'Большая ось эллипса — под 90° к центральной линии; без заострённых концов.',
      },
      {
        en: 'Challenge: 100 box planes and 100 ellipses — mix sizes and tilts.',
        ru: 'Челлендж: 100 плоскостей и 100 эллипсов — меняй размер и наклон.',
      },
    ],
  },
  {
    bookOrder: 4,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 14,
    icon: '📦',
    tags: ['fundamentals', 'book-25', 'boxes', 'construction', 'drawing'],
    title: {
      en: 'Parallel Ellipses',
      ru: 'Параллельные эллипсы',
    },
    description: {
      en: 'Stack ellipses perpendicular to a straight line; vary angles and sizes each session.',
      ru: 'Наноси эллипсы перпендикулярно прямой; меняй углы и размеры каждую сессию.',
    },
    steps: [
      {
        en: 'Draw a line; stack ellipses with major axis 90° from the line.',
        ru: 'Нарисуй линию; наноси эллипсы с большой осью под 90° к линии.',
      },
      {
        en: 'Two sets of 5: equal-sized ellipses, then progressively bigger.',
        ru: 'Два набора по 5: равные эллипсы, затем постепенно крупнее.',
      },
      {
        en: 'Advance: curve the line and match ellipse tilt on the curve.',
        ru: 'Усложнение: изогни линию и подстрой наклон эллипсов по кривой.',
      },
    ],
  },
  {
    bookOrder: 5,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 14,
    icon: '🛢️',
    tags: ['fundamentals', 'book-25', 'cylinder', 'volume', 'drawing'],
    title: {
      en: 'Ribbons',
      ru: 'Ленты',
    },
    description: {
      en: 'Draw a curvy line, repeat it beside, then connect to form a ribbon in perspective.',
      ru: 'Нарисуй кривую, повтори рядом и соедини — получится лента в перспективе.',
    },
    steps: [
      {
        en: 'First line: organic curve (not jagged).',
        ru: 'Первая линия: органическая кривая (не ломаная).',
      },
      {
        en: 'Repeat the curve at uniform distance; connect with parallel lines.',
        ru: 'Повтори кривую на равном расстоянии; соедини параллельными линиями.',
      },
      {
        en: 'Try bounce (chained ribbons) and arrow endings for variation.',
        ru: 'Попробуй bounce (цепочка лент) и стрелки на концах.',
      },
    ],
  },
  {
    bookOrder: 6,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 14,
    icon: '🔮',
    tags: ['fundamentals', 'book-25', 'sphere', 'cone', 'volume', 'drawing'],
    title: {
      en: 'Extrusion',
      ru: 'Экструзия',
    },
    description: {
      en: 'Create volume from flat shapes: mirror two shapes and connect with straight depth lines.',
      ru: 'Создавай объём из плоских форм: зеркальные фигуры + прямые линии глубины.',
    },
    steps: [
      {
        en: 'Draw a flat shape; mirror it and connect corners into a prism.',
        ru: 'Нарисуй плоскую форму; отзеркаль и соедини углы в призму.',
      },
      {
        en: 'Skew the front plane so depth lines converge for believable form.',
        ru: 'Наклони переднюю грань — линии глубины должны сходиться.',
      },
      {
        en: 'Practice varied flat shapes and block letters until extrusion feels natural.',
        ru: 'Тренируй разные плоские формы и буквы, пока экструзия не станет привычной.',
      },
    ],
  },
  {
    bookOrder: 7,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 15,
    xp: 16,
    icon: '🔲',
    tags: ['fundamentals', 'book-25', 'overlap', 'forms', 'drawing'],
    title: {
      en: 'Cube Grid',
      ru: 'Сетка кубов',
    },
    description: {
      en: 'Fill Krenz Cushart’s cube grid: vertical set A and horizontal set B for rotation patterns.',
      ru: 'Заполни сетку кубов Кренца: вертикальный ряд A и горизонтальный ряд B.',
    },
    steps: [
      {
        en: 'Copy sets A (5 vertical) and B (5 horizontal rotation) from the book.',
        ru: 'Скопируй ряды A (5 вертикальных) и B (5 поворотов) из книги.',
      },
      {
        en: 'Fill the 5×5 grid — draw through every cube.',
        ru: 'Заполни сетку 5×5 — прорисовывай сквозь каждый куб.',
      },
      {
        en: 'Notice how top vs front plane changes with distance from the horizon.',
        ru: 'Заметь, как меняется верхняя и передняя грань относительно горизонта.',
      },
    ],
  },
  {
    bookOrder: 8,
    bookTier: 'beginner',
    difficulty: 'novice',
    estimatedTime: 20,
    xp: 16,
    icon: '🌓',
    tags: ['fundamentals', 'book-25', 'value', 'hatching', 'drawing'],
    title: {
      en: 'Cylinders',
      ru: 'Цилиндры',
    },
    description: {
      en: 'Draw cylinders along a curving path — like toilet paper on a string. Scale for depth.',
      ru: 'Рисуй цилиндры вдоль изогнутой линии; масштабируй для передачи глубины.',
    },
    steps: [
      {
        en: 'Sketch a curving path; place cylinders along it — closer = bigger.',
        ru: 'Набросай изогнутую линию; расставь цилиндры — ближе = крупнее.',
      },
      {
        en: 'Start from a box to find ellipse shape and tube direction.',
        ru: 'Начни с коробки, чтобы найти форму эллипса и направление трубы.',
      },
      {
        en: 'Avoid parallel ellipses, pill shapes, and same-angle top/bottom planes.',
        ru: 'Избегай параллельных эллипсов, «таблеток» и одинакового угла верха/низа.',
      },
    ],
  },
  {
    bookOrder: 9,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 15,
    xp: 18,
    icon: '🖊️',
    tags: ['fundamentals', 'book-25', 'texture', 'pen', 'drawing'],
    title: {
      en: 'Rotating Forms',
      ru: 'Вращение форм',
    },
    description: {
      en: 'Rotate each basic form vertically and horizontally until you can draw them from memory.',
      ru: 'Поверни каждый примитив по вертикали и горизонтали, пока не сможешь рисовать без референса.',
    },
    steps: [
      {
        en: 'Rotate cubes, cylinders, pyramids, cones, and spheres — rows A–E in the book.',
        ru: 'Поверни кубы, цилиндры, пирамиды, конусы и сферы — ряды A–E из книги.',
      },
      {
        en: 'For boxes see exercise #7; pyramids from pinched cubes, cones from pinched cylinders.',
        ru: 'Для коробок см. #7; пирамиды — из сжатых кубов, конусы — из сжатых цилиндров.',
      },
      {
        en: 'Homework: draw the four complex forms in front, ¾, and near-side views.',
        ru: 'Домашка: нарисуй 4 сложные формы в анфасе, ¾ и почти сбоку.',
      },
    ],
  },
  {
    bookOrder: 10,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 18,
    icon: '🔷',
    tags: ['fundamentals', 'book-25', 'shapes', 'observation', 'drawing'],
    title: {
      en: 'Box Stacking',
      ru: 'Стопка коробок',
    },
    description: {
      en: 'Stack boxes in shared space with believable scale and perspective.',
      ru: 'Складывай коробки в общем пространстве с убедительным масштабом и перспективой.',
    },
    steps: [
      {
        en: 'Easier: parallel, similarly shaped stacks on a horizon line.',
        ru: 'Проще: параллельные стопки одинаковых коробок на линии горизонта.',
      },
      {
        en: 'Harder: different angles and draw-through construction.',
        ru: 'Сложнее: разные углы и прорисовка сквозь формы.',
      },
      {
        en: 'Hardest: many boxes in one scene using only a horizon line.',
        ru: 'Максимум: много коробок в одной сцене, опираясь на линию горизонта.',
      },
    ],
  },
  {
    bookOrder: 11,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 20,
    icon: '🌿',
    tags: ['fundamentals', 'book-25', 'organic', 'forms', 'drawing'],
    title: {
      en: 'Intersections',
      ru: 'Пересечения',
    },
    description: {
      en: 'Join two or more forms like LEGO blocks — overlap cubes, then mix primitives.',
      ru: 'Соединяй формы как кубики LEGO — сначала кубы, затем смешивай примитивы.',
    },
    steps: [
      {
        en: 'Overlap two cubes; pick intersection point and follow the dominant form.',
        ru: 'Наложи два куба; выбери точку пересечения и веди линию по доминирующей форме.',
      },
      {
        en: 'Progress: parallel boxes → one axis rotated → multi-axis → both rotated.',
        ru: 'Прогресс: параллельные → один поворот → несколько осей → оба повёрнуты.',
      },
      {
        en: 'Combine cube with cylinder, pyramid, cone — simple pairs before complex poses.',
        ru: 'Сочетай куб с цилиндром, пирамидой, конусом — сначала простые пары.',
      },
    ],
  },
  {
    bookOrder: 12,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 20,
    icon: '🏠',
    tags: ['fundamentals', 'book-25', 'perspective', 'one-point', 'drawing'],
    title: {
      en: 'Stack & Queue',
      ru: 'Стек и очередь',
    },
    description: {
      en: 'Draw stacked or queued boxes without a grid — build intuitive sense of space.',
      ru: 'Рисуй стопки и очереди коробок без сетки — развивай чувство пространства.',
    },
    steps: [
      {
        en: 'Stack boxes vertically; lines converge to the same point.',
        ru: 'Складывай коробки вертикально; линии сходятся в одну точку.',
      },
      {
        en: 'Queue boxes in perspective — try “sliced perspective” along a long volume.',
        ru: 'Выстрой очередь в перспективе — попробуй «нарезанную перспективу».',
      },
      {
        en: 'Span forms across vertical and horizontal axes of vision.',
        ru: 'Располагай формы от одной стороны оси зрения к другой.',
      },
    ],
  },
  {
    bookOrder: 13,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 25,
    xp: 22,
    icon: '🏙️',
    tags: ['fundamentals', 'book-25', 'perspective', 'two-point', 'drawing'],
    title: {
      en: 'Bending Forms',
      ru: 'Изгиб форм',
    },
    description: {
      en: 'Bend and twist primitives to match real references — anatomy, clothing, props.',
      ru: 'Изгибай и скручивай примитивы под реальные объекты — анатомия, одежда, предметы.',
    },
    steps: [
      {
        en: 'Slice a form, rotate pieces, outline with creases where it pinches.',
        ru: 'Разрежь форму, поверни части, обведи с заломами в местах сжатия.',
      },
      {
        en: 'Draw 50 bent cylinders and boxes as in the book examples.',
        ru: 'Нарисуй 50 изогнутых цилиндров и коробок по примерам из книги.',
      },
      {
        en: 'Variation: bend along a curved guide line; smooth vs bumpy sides.',
        ru: 'Вариация: изгиб по кривой-направляющей; гладкая и «буграстая» стороны.',
      },
    ],
  },
  {
    bookOrder: 14,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 25,
    xp: 22,
    icon: '👁️',
    tags: ['fundamentals', 'book-25', 'observation', 'drawing'],
    title: {
      en: 'Organic Forms',
      ru: 'Органические формы',
    },
    description: {
      en: 'Build arbitrary blob volumes; arrow defines contour direction on the surface.',
      ru: 'Создавай произвольные «капли»; стрелка задаёт направление контуров по поверхности.',
    },
    steps: [
      {
        en: 'Start with a random curvy silhouette.',
        ru: 'Начни со случайного изогнутого силуэта.',
      },
      {
        en: 'Draw an arrow through the form for contour direction.',
        ru: 'Проведи стрелку через форму — направление контуров.',
      },
      {
        en: 'Add contours; vary spacing (pinch at ends) and escalate complexity.',
        ru: 'Добавь контуры; меняй интервал (сжатие на концах) и усложняй форму.',
      },
    ],
  },
  {
    bookOrder: 15,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 20,
    icon: '⬜',
    tags: ['fundamentals', 'book-25', 'negative-space', 'observation', 'drawing'],
    title: {
      en: 'Texture Bar',
      ru: 'Полоса текстур',
    },
    description: {
      en: 'Draw a bar with a pattern from dark/dense to light/thin — hatch, cross-hatch, weave, etc.',
      ru: 'Нарисуй полосу с узором от тёмного/плотного к светлому/редкому — штрих, сетка, плетение и т.д.',
    },
    steps: [
      {
        en: 'Create a gradient bar: hatching then cross-hatching.',
        ru: 'Сделай градиентную полосу: штриховка, затем перекрёстная.',
      },
      {
        en: 'Try weave, wood, rocks, leaves, vines — pattern or value density.',
        ru: 'Попробуй плетение, дерево, камни, листья, лианы — по узору или плотности тона.',
      },
      {
        en: 'Build a texture bar in 5 steps: notes → base → contours → value groups → render.',
        ru: 'Собери полосу в 5 шагов: заметки → база → контуры → группы тона → прорисовка.',
      },
    ],
  },
  {
    bookOrder: 16,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 20,
    icon: '〰️',
    tags: ['fundamentals', 'book-25', 'contour', 'lines', 'drawing'],
    title: {
      en: 'Carving',
      ru: 'Вырезание',
    },
    description: {
      en: 'Subtract one form from another to create believable volumes without full construction.',
      ru: 'Вычитай одну форму из другой — создавай объёмы без полной прорисовки каркаса.',
    },
    steps: [
      {
        en: 'Overlap two forms; choose intersection and follow the subtracted plane.',
        ru: 'Наложи две формы; выбери пересечение и веди линию по вычитаемой грани.',
      },
      {
        en: 'Practice flat-shape extrusions, then carve from a box in perspective.',
        ru: 'Потренируй плоские экструзии, затем вырезай из коробки в перспективе.',
      },
      {
        en: 'Try varied carvings with boxes, cylinders, and curved intersections.',
        ru: 'Попробуй разные вырезания с коробками, цилиндрами и кривыми пересечениями.',
      },
    ],
  },
  {
    bookOrder: 17,
    bookTier: 'intermediate',
    difficulty: 'intermediate',
    estimatedTime: 20,
    xp: 22,
    icon: '🖼️',
    tags: ['fundamentals', 'book-25', 'thumbnails', 'composition', 'drawing'],
    title: {
      en: 'Form Clusters',
      ru: 'Кластеры форм',
    },
    description: {
      en: 'Invent random volume clusters from imagination — combine, subtract, and stack forms.',
      ru: 'Придумывай кластеры объёмов из воображения — комбинируй, вычитай, складывай формы.',
    },
    steps: [
      {
        en: 'Start with basic combinations; draw from above and below.',
        ru: 'Начни с простых комбинаций; рисуй сверху и снизу.',
      },
      {
        en: 'Use a perspective grid; build complexity slowly.',
        ru: 'Используй перспективную сетку; наращивай сложность постепенно.',
      },
      {
        en: 'Let real objects inspire clusters — invent forms, don’t trace photos.',
        ru: 'Пусть реальные предметы вдохновляют — придумывай формы, не копируй фото.',
      },
    ],
  },
  {
    bookOrder: 18,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 20,
    xp: 24,
    icon: '🏃',
    tags: ['fundamentals', 'book-25', 'gesture', 'figure', 'drawing'],
    title: {
      en: 'Box Figures',
      ru: 'Фигуры из коробок',
    },
    description: {
      en: 'Three box masses (skull, rib cage, pelvis) connected by the spine — capture pose orientation.',
      ru: 'Три коробки (череп, грудная клетка, таз) и позвоночник — передай ориентацию позы.',
    },
    steps: [
      {
        en: 'From reference, block head, torso, and pelvis as three boxes.',
        ru: 'По референсу заблокируй голову, торс и таз тремя коробками.',
      },
      {
        en: 'Connect with a curved spine line; exaggerate twist for gesture.',
        ru: 'Соедини изогнутой линией позвоночника; усиль скрутку для жеста.',
      },
      {
        en: '30 min: one pose per minute, then 10 poses from imagination.',
        ru: '30 мин: одна поза в минуту, затем 10 поз из воображения.',
      },
    ],
  },
  {
    bookOrder: 19,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 20,
    xp: 24,
    icon: '🧠',
    tags: ['fundamentals', 'book-25', 'memory', 'imagination', 'drawing'],
    title: {
      en: 'Volume Mapping',
      ru: 'Наложение объёма',
    },
    description: {
      en: 'Combine organic forms (#14) with texture bar (#15) — map patterns in perspective on volume.',
      ru: 'Соедини органические формы (#14) и полосу текстур (#15) — наноси узор в перспективе на объём.',
    },
    steps: [
      {
        en: 'Start on a single plane; tilt the “paper” in perspective.',
        ru: 'Начни с одной плоскости; «наклони лист» в перспективе.',
      },
      {
        en: 'Use a wireframe; hatch following each plane’s direction.',
        ru: 'Используй каркас; штрихуй по направлению каждой грани.',
      },
      {
        en: 'Challenge: create 10 textured volumes from objects around you.',
        ru: 'Челлендж: 10 текстурированных объёмов с предметов вокруг.',
      },
    ],
  },
  {
    bookOrder: 20,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 25,
    xp: 26,
    icon: '👤',
    tags: ['fundamentals', 'book-25', 'head', 'construction', 'drawing'],
    title: {
      en: 'Deconstruction',
      ru: 'Деконструкция',
    },
    description: {
      en: 'Break references into basic LEGO-block forms — simple (a), accurate (b), then subject (c).',
      ru: 'Разбей референс на базовые «кубики» — просто (a), точнее (b), затем объект (c).',
    },
    steps: [
      {
        en: 'Collect references from many angles.',
        ru: 'Собери референсы с разных ракурсов.',
      },
      {
        en: 'Research simplified pieces of the subject.',
        ru: 'Выдели упрощённые «детали» формы.',
      },
      {
        en: 'Combine pieces into a simplified deconstruction drawing.',
        ru: 'Собери детали в упрощённую деконструкцию.',
      },
    ],
  },
  {
    bookOrder: 21,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 25,
    xp: 26,
    icon: '👁️',
    tags: ['fundamentals', 'book-25', 'face', 'features', 'drawing'],
    title: {
      en: 'Mannequinization',
      ru: 'Манекенизация',
    },
    description: {
      en: 'Break any subject into basic volumes — simplifies anatomy and imagination drawing.',
      ru: 'Разбей любой объект на базовые объёмы — упрощает анатомию и рисунок из головы.',
    },
    steps: [
      {
        en: 'Build a figure or animal from boxes and cylinders in several angles.',
        ru: 'Построй фигуру или животное из коробок и цилиндров под разными углами.',
      },
      {
        en: 'Don’t change mannequin proportions to match the model — add detail on top.',
        ru: 'Не меняй пропорции манекена под модель — детали добавляй сверху.',
      },
      {
        en: 'Push the pose: clarify story, exaggerate dynamism, break the mannequin when needed.',
        ru: 'Усиль позу: ясная история, динамика; при необходимости «ломай» манекен.',
      },
    ],
  },
  {
    bookOrder: 22,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 25,
    xp: 28,
    icon: '✋',
    tags: ['fundamentals', 'book-25', 'hands', 'anatomy', 'drawing'],
    title: {
      en: 'Magic Observation',
      ru: 'Магическое наблюдение',
    },
    description: {
      en: 'Look at a reference and draw it from a different angle while keeping volumes consistent.',
      ru: 'Смотри на референс и нарисуй под другим углом, сохраняя объёмы.',
    },
    steps: [
      {
        en: 'Front/profile silhouettes → block construction → rotate → final form.',
        ru: 'Силуэты анфас/профиль → блоки → поворот → финальная форма.',
      },
      {
        en: 'Define a wireframe before rotating organic shapes.',
        ru: 'Построй каркас перед поворотом органических форм.',
      },
      {
        en: 'Practice seeing form, not flat shapes — build the rotation habit.',
        ru: 'Видь форму, а не плоские пятна — выработай привычку вращения.',
      },
    ],
  },
  {
    bookOrder: 23,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 25,
    xp: 28,
    icon: '🧩',
    tags: ['fundamentals', 'book-25', 'reference', 'imagination', 'drawing'],
    title: {
      en: 'POV Drawing',
      ru: 'Рисование от первого лица',
    },
    description: {
      en: 'Draw your point of view — room, desk, or a slice of life. Depth is the goal.',
      ru: 'Нарисуй свой ракурс — комната, стол или фрагмент сцены. Цель — глубина.',
    },
    steps: [
      {
        en: 'Pick scope: whole room or one object if overwhelmed.',
        ru: 'Выбери масштаб: вся комната или один объект, если сложно.',
      },
      {
        en: 'Use silhouette, wrapping contours, and straight-line relationships.',
        ru: 'Используй силуэт, обводящие контуры и прямые для связей объектов.',
      },
      {
        en: 'Keep forms simple; work often to build intuitive space sense.',
        ru: 'Упрощай формы; рисуй часто, чтобы выработать чувство пространства.',
      },
    ],
  },
  {
    bookOrder: 24,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 25,
    xp: 30,
    icon: '☁️',
    tags: ['fundamentals', 'book-25', 'imagination', 'creativity', 'drawing'],
    title: {
      en: 'Daily Highlight',
      ru: 'Событие дня',
    },
    description: {
      en: 'Pick a notable moment from your day; depict it with creative camera angles.',
      ru: 'Выбери яркий момент дня; изобрази его с выразительным ракурсом.',
    },
    steps: [
      {
        en: 'Recall the event and choose a camera angle for the story.',
        ru: 'Вспомни событие и выбери ракурс для истории.',
      },
      {
        en: 'Thumbnail 2–3 layouts; pick the clearest story.',
        ru: 'Сделай 2–3 эскиза композиции; выбери самый ясный сюжет.',
      },
      {
        en: 'Block perspective and basic forms, then finish the scene.',
        ru: 'Заблокируй перспективу и базовые формы, затем доработай сцену.',
      },
    ],
  },
  {
    bookOrder: 25,
    bookTier: 'advanced',
    difficulty: 'advanced',
    estimatedTime: 30,
    xp: 32,
    icon: '🎯',
    tags: ['fundamentals', 'book-25', 'composition', 'focal-point', 'drawing'],
    title: {
      en: 'Comic Book',
      ru: 'Комикс',
    },
    description: {
      en: 'Capstone: combine exercises into a short comic — form, texture, POV, and imagination.',
      ru: 'Финал: собери упражнения в короткий комикс — форма, текстура, POV и воображение.',
    },
    steps: [
      {
        en: 'Plan a simple 3-panel story using skills from the book.',
        ru: 'Запланируй простую историю из 3 панелей на навыках из книги.',
      },
      {
        en: 'Use intuitive perspective and simple forms — don’t fear ugly drawings.',
        ru: 'Интуитивная перспектива и простые формы — не бойся «некрасивых» набросков.',
      },
      {
        en: 'Draw freely; treat it as play, not a polished illustration.',
        ru: 'Рисуй свободно; это игра, а не финальная иллюстрация.',
      },
    ],
  },
]

function pick(lang: Language, row: I18n): string {
  return row[lang] ?? row.en
}

function buildTrackPhase(spec: ExerciseSpec, phaseIndex: number): FundamentalsTrackPhase {
  const topicTags = fundamentalsTopicTags(spec.tags)
  return {
    phaseIndex,
    bookOrder: spec.bookOrder,
    title: spec.title,
    description: spec.description,
    steps: spec.steps,
    bookPages: getFundamentalsBookPagesForOrder(spec.bookOrder),
    estimatedTime: spec.estimatedTime,
    xp: spec.xp,
    referenceQuery: fundamentalsReferenceQuery(spec.title.en, spec.tags),
    topicTags,
  }
}

function buildFundamentalsExercises(): FundamentalsExercise[] {
  const noviceSpecs = SPECS.filter((s) => s.bookTier === 'beginner')
  const mediumSpecs = SPECS.filter((s) => s.bookTier === 'intermediate')
  const advancedSpecs = SPECS.filter((s) => s.bookTier === 'advanced')

  const novicePhases = noviceSpecs.map((spec, i) => buildTrackPhase(spec, i))
  const novicePartAPhases = novicePhases.slice(0, FUNDAMENTALS_NOVICE_PART_A_COUNT)
  const novicePartBPhases = novicePhases.slice(FUNDAMENTALS_NOVICE_PART_A_COUNT)
  const mediumPhases = mediumSpecs.map((spec, i) => buildTrackPhase(spec, i))

  const noviceTrackPartA: FundamentalsExercise = {
    id: FUNDAMENTALS_TRACK_NOVICE_ID,
    code: 'FUN-NOVICE-A',
    title: { en: 'Fundamentals — Novice (Part 1)', ru: 'Основы — Новичок (Часть 1)' },
    category: 'drawing',
    difficulty: 'novice',
    description: {
      en: 'Phases 1–6: line control through form extrusion.',
      ru: 'Фазы 1–6: контроль линии и экструзия форм.',
    },
    xp: novicePartAPhases.reduce((sum, p) => sum + p.xp, 0),
    estimatedTime: novicePartAPhases.reduce((sum, p) => sum + p.estimatedTime, 0),
    source: SOURCE,
    icon: '📘',
    color: '#8b5cf6',
    min_level: 1,
    tags: ['fundamentals', 'book-25', 'track', 'novice'],
    prerequisites: [],
    medium: 'both',
    is_repeatable: true,
    review_after_days: 0,
    streak_bonus: 1,
    bookTier: 'beginner',
    trackKind: 'novice',
    trackPhases: novicePartAPhases,
  }

  const noviceTrackPartB: FundamentalsExercise = {
    id: FUNDAMENTALS_TRACK_NOVICE_B_ID,
    code: 'FUN-NOVICE-B',
    title: { en: 'Fundamentals — Novice (Part 2)', ru: 'Основы — Новичок (Часть 2)' },
    category: 'drawing',
    difficulty: 'novice',
    description: {
      en: 'Phases 7–8: cube grid and cylinders.',
      ru: 'Фазы 7–8: сетка кубов и цилиндры.',
    },
    xp: novicePartBPhases.reduce((sum, p) => sum + p.xp, 0),
    estimatedTime: novicePartBPhases.reduce((sum, p) => sum + p.estimatedTime, 0),
    source: SOURCE,
    icon: '📘',
    color: '#8b5cf6',
    min_level: 1,
    tags: ['fundamentals', 'book-25', 'track', 'novice'],
    prerequisites: [FUNDAMENTALS_TRACK_NOVICE_ID],
    medium: 'both',
    is_repeatable: true,
    review_after_days: 0,
    streak_bonus: 1,
    bookTier: 'beginner',
    trackKind: 'novice',
    trackPhases: novicePartBPhases,
  }

  const mediumTrack: FundamentalsExercise = {
    id: FUNDAMENTALS_TRACK_MEDIUM_ID,
    code: 'FUN-MEDIUM',
    title: { en: 'Fundamentals — Intermediate', ru: 'Основы — Средний' },
    category: 'drawing',
    difficulty: 'intermediate',
    description: {
      en: 'Nine sequential phases: rotating forms through form clusters.',
      ru: 'Девять фаз подряд: вращение форм и кластеры форм.',
    },
    xp: mediumPhases.reduce((sum, p) => sum + p.xp, 0),
    estimatedTime: mediumPhases.reduce((sum, p) => sum + p.estimatedTime, 0),
    source: SOURCE,
    icon: '📗',
    color: '#8b5cf6',
    min_level: 1,
    tags: ['fundamentals', 'book-25', 'track', 'medium'],
    prerequisites: [],
    medium: 'both',
    is_repeatable: true,
    review_after_days: 0,
    streak_bonus: 1,
    bookTier: 'intermediate',
    trackKind: 'medium',
    trackPhases: mediumPhases,
  }

  const advancedQuests: FundamentalsExercise[] = advancedSpecs.map((spec, index) => {
    const id = FUNDAMENTALS_ADVANCED_ID_MIN + index
    return {
      id,
      code: `FUN-${String(spec.bookOrder).padStart(5, '0')}`,
      title: spec.title,
      category: 'drawing',
      difficulty: spec.difficulty,
      description: spec.description,
      xp: spec.xp,
      estimatedTime: spec.estimatedTime,
      source: SOURCE,
      icon: spec.icon,
      color: '#8b5cf6',
      min_level: 1,
      tags: spec.tags,
      referenceQuery: fundamentalsReferenceQuery(spec.title.en, spec.tags),
      prerequisites: [],
      medium: 'both',
      is_repeatable: true,
      review_after_days: 0,
      streak_bonus: 1,
      bookOrder: spec.bookOrder,
      bookTier: spec.bookTier,
      bookPages: getFundamentalsBookPagesForOrder(spec.bookOrder),
      steps: spec.steps,
    }
  })

  return [noviceTrackPartA, noviceTrackPartB, mediumTrack, ...advancedQuests]
}

export const FUNDAMENTALS_EXERCISES: FundamentalsExercise[] = buildFundamentalsExercises()

const fundamentalsById = new Map(FUNDAMENTALS_EXERCISES.map((q) => [q.id, q]))

export function isFundamentalsQuestId(questId: number): boolean {
  return questId >= FUNDAMENTALS_QUEST_ID_MIN && questId <= FUNDAMENTALS_QUEST_ID_MAX
}

export function isFundamentalsTrackId(questId: number): boolean {
  return (
    questId === FUNDAMENTALS_TRACK_NOVICE_ID ||
    questId === FUNDAMENTALS_TRACK_NOVICE_B_ID ||
    questId === FUNDAMENTALS_TRACK_MEDIUM_ID
  )
}

export function isFundamentalsNovicePartAId(questId: number): boolean {
  return questId === FUNDAMENTALS_TRACK_NOVICE_ID
}

export function isFundamentalsNovicePartBId(questId: number): boolean {
  return questId === FUNDAMENTALS_TRACK_NOVICE_B_ID
}

export function isFundamentalsAdvancedId(questId: number): boolean {
  return questId >= FUNDAMENTALS_ADVANCED_ID_MIN && questId <= FUNDAMENTALS_ADVANCED_ID_MAX
}

export function getFundamentalsTrackKind(questId: number): FundamentalsTrackKind | undefined {
  if (questId === FUNDAMENTALS_TRACK_NOVICE_ID || questId === FUNDAMENTALS_TRACK_NOVICE_B_ID) {
    return 'novice'
  }
  if (questId === FUNDAMENTALS_TRACK_MEDIUM_ID) return 'medium'
  return undefined
}

export function getFundamentalsTrackPhaseCount(
  kind: FundamentalsTrackKind,
  questId?: number,
): number {
  if (kind === 'medium') return FUNDAMENTALS_MEDIUM_PHASE_COUNT
  if (questId === FUNDAMENTALS_TRACK_NOVICE_B_ID) return FUNDAMENTALS_NOVICE_PART_B_COUNT
  return FUNDAMENTALS_NOVICE_PART_A_COUNT
}

export function getFundamentalsTrackPhase(
  exercise: FundamentalsExercise,
  phaseIndex: number,
): FundamentalsTrackPhase | undefined {
  return findFundamentalsTrackPhase(exercise, phaseIndex)
}

function findFundamentalsTrackPhase(
  exercise: Pick<FundamentalsExercise, 'trackPhases'>,
  phaseIndex: number,
): FundamentalsTrackPhase | undefined {
  return (
    exercise.trackPhases?.find((phase) => phase.phaseIndex === phaseIndex) ??
    exercise.trackPhases?.[phaseIndex]
  )
}

export function getFundamentalsQuestById(questId: number): FundamentalsExercise | undefined {
  return fundamentalsById.get(questId)
}

export function getFundamentalsExerciseSteps(
  questId: number,
  language: Language,
): string[] {
  const exercise = getFundamentalsQuestById(questId)
  if (!exercise) return []
  const steps = exercise.steps ?? exercise.trackPhases?.[0]?.steps ?? []
  return steps.map((step) => pick(language, step))
}

export function getFundamentalsPhaseSteps(
  exercise: FundamentalsExercise,
  phaseIndex: number,
  language: Language,
): string[] {
  const phase = findFundamentalsTrackPhase(exercise, phaseIndex)
  if (!phase) return getFundamentalsExerciseSteps(exercise.id, language)
  return phase.steps.map((step) => pick(language, step))
}

export function getFundamentalsBookPageRange(
  exercise: Pick<FundamentalsExercise, 'bookPages'>,
): { start: number; end: number } {
  const pages = exercise.bookPages ?? []
  if (pages.length === 0) return { start: 0, end: 0 }
  return { start: pages[0]!, end: pages[pages.length - 1]! }
}

export function getFundamentalsBookPageNumbers(
  exercise: Pick<FundamentalsExercise, 'bookPages'> & { trackPhases?: FundamentalsTrackPhase[] },
  phaseIndex?: number,
): number[] {
  if (phaseIndex != null) {
    const phase = findFundamentalsTrackPhase(exercise, phaseIndex)
    if (phase) return [...phase.bookPages]
  }
  return [...(exercise.bookPages ?? [])]
}

/** Relative public asset URL — works in Vite dev and Electron file:// renderer. */
export function getFundamentalsBookPageUrl(page: number): string {
  const nn = String(page).padStart(2, '0')
  const base = import.meta.env.BASE_URL ?? './'
  const normalized = base.endsWith('/') ? base : `${base}/`
  const rel = `${normalized}fundamentals/pages/${nn}.png`.replace(/([^:]\/)\/+/g, '$1')
  if (typeof window !== 'undefined' && window.location?.href) {
    try {
      return new URL(rel, window.location.href).href
    } catch {
      return rel
    }
  }
  return rel
}

export function buildFundamentalsTrackSessionPhases(
  exercise: FundamentalsExercise,
  startPhaseIndex: number,
): import('@/utils/questSessionPlan').SessionPhase[] {
  if (!exercise.trackPhases || !exercise.trackKind) return []
  return exercise.trackPhases.slice(startPhaseIndex).map((phase) => ({
    kind: 'fundamentals' as const,
    trackKind: exercise.trackKind!,
    phaseIndex: phase.phaseIndex,
    durationSec: phase.estimatedTime * 60,
    xp: phase.xp,
  }))
}
