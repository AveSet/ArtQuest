import type { Language, LocalizedString } from '@/i18n/translations'
import type { Quest } from '@/store/models'

export const WARMUP_QUEST_ID_MIN = 95001
export const WARMUP_QUEST_ID_MAX = 95100
export const WARMUP_QUEST_COUNT = WARMUP_QUEST_ID_MAX - WARMUP_QUEST_ID_MIN + 1

type I18n = LocalizedString

type RuForms = {
  nom: string
  acc: string
  gen: string
  prep: string
  inst: string
  one: string
  two: string
  five: string
}

type Shape = I18n & { ruForms: RuForms }

/** 2D drawing primitives only — no characters, props, or anatomy. */
const SHAPES: Shape[] = [
  {
    en: 'circle', ru: 'круг', zh: '圆形', ja: '円', ko: '원',
    ruForms: { nom: 'круг', acc: 'круг', gen: 'круга', prep: 'круге', inst: 'кругом', one: 'один круг', two: 'два круга', five: 'пять кругов' },
  },
  {
    en: 'square', ru: 'квадрат', zh: '正方形', ja: '正方形', ko: '정사각형',
    ruForms: { nom: 'квадрат', acc: 'квадрат', gen: 'квадрата', prep: 'квадрате', inst: 'квадратом', one: 'один квадрат', two: 'два квадрата', five: 'пять квадратов' },
  },
  {
    en: 'triangle', ru: 'треугольник', zh: '三角形', ja: '三角形', ko: '삼각형',
    ruForms: { nom: 'треугольник', acc: 'треугольник', gen: 'треугольника', prep: 'треугольнике', inst: 'треугольником', one: 'один треугольник', two: 'два треугольника', five: 'пять треугольников' },
  },
  {
    en: 'rectangle', ru: 'прямоугольник', zh: '长方形', ja: '長方形', ko: '직사각형',
    ruForms: { nom: 'прямоугольник', acc: 'прямоугольник', gen: 'прямоугольника', prep: 'прямоугольнике', inst: 'прямоугольником', one: 'один прямоугольник', two: 'два прямоугольника', five: 'пять прямоугольников' },
  },
  {
    en: 'ellipse', ru: 'эллипс', zh: '椭圆', ja: '楕円', ko: '타원',
    ruForms: { nom: 'эллипс', acc: 'эллипс', gen: 'эллипса', prep: 'эллипсе', inst: 'эллипсом', one: 'один эллипс', two: 'два эллипса', five: 'пять эллипсов' },
  },
  {
    en: 'cylinder', ru: 'цилиндр', zh: '圆柱', ja: '円柱', ko: '원기둥',
    ruForms: { nom: 'цилиндр', acc: 'цилиндр', gen: 'цилиндра', prep: 'цилиндре', inst: 'цилиндром', one: 'один цилиндр', two: 'два цилиндра', five: 'пять цилиндров' },
  },
  {
    en: 'cube', ru: 'куб', zh: '立方体', ja: '立方体', ko: '정육면체',
    ruForms: { nom: 'куб', acc: 'куб', gen: 'куба', prep: 'кубе', inst: 'кубом', one: 'один куб', two: 'два куба', five: 'пять кубов' },
  },
  {
    en: 'cone', ru: 'конус', zh: '圆锥', ja: '円錐', ko: '원뿔',
    ruForms: { nom: 'конус', acc: 'конус', gen: 'конуса', prep: 'конусе', inst: 'конусом', one: 'один конус', two: 'два конуса', five: 'пять конусов' },
  },
  {
    en: 'trapezoid', ru: 'трапеция', zh: '梯形', ja: '台形', ko: '사다리꼴',
    ruForms: { nom: 'трапеция', acc: 'трапецию', gen: 'трапеции', prep: 'трапеции', inst: 'трапецией', one: 'одна трапеция', two: 'две трапеции', five: 'пять трапеций' },
  },
  {
    en: 'semicircle', ru: 'полукруг', zh: '半圆', ja: '半円', ko: '반원',
    ruForms: { nom: 'полукруг', acc: 'полукруг', gen: 'полукруга', prep: 'полукруге', inst: 'полукругом', one: 'один полукруг', two: 'два полукруга', five: 'пять полукругов' },
  },
]

type Recipe = (a: Shape, b: Shape, c: Shape) => { title: I18n; description: I18n }

function pick(lang: Language, row: I18n): string {
  return row[lang] ?? row.en
}

function ru(shape: Shape): RuForms {
  return shape.ruForms
}

const RECIPES: Recipe[] = [
  (a) => ({
    title: {
      en: `Primitive Study: Single ${pick('en', a)}`,
      ru: `Один примитив: ${ru(a).nom}`,
      zh: `基础形练习：单个${pick('zh', a)}`,
      ja: `基本形ドリル：${pick('ja', a)}を1つ`,
      ko: `기본 도형 연습: ${pick('ko', a)} 하나`,
    },
    description: {
      en: `Draw one clean ${pick('en', a)} that fills most of the canvas. Keep the contour smooth and closed.`,
      ru: `Нарисуй ${ru(a).one}, занимающий большую часть листа. Контур должен быть ровным и замкнутым.`,
      zh: `画一个占满画面大部分的${pick('zh', a)}，轮廓要光滑、闭合。`,
      ja: `キャンバスの大部分を占める${pick('ja', a)}を1つ描く。輪郭は滑らかに閉じる。`,
      ko: `캔버스 대부분을 채우는 ${pick('ko', a)} 하나를 그리세요. 윤곽은 매끄럽고 닫혀 있어야 합니다.`,
    },
  }),
  (a, b) => ({
    title: {
      en: `Primitive Overlap: ${pick('en', a)} + ${pick('en', b)}`,
      ru: `Наложение: ${ru(a).nom} и ${ru(b).nom}`,
      zh: `形体重叠：${pick('zh', a)}与${pick('zh', b)}`,
      ja: `重なり：${pick('ja', a)}と${pick('ja', b)}`,
      ko: `겹치기: ${pick('ko', a)}와 ${pick('ko', b)}`,
    },
    description: {
      en: `Draw a ${pick('en', a)} and a ${pick('en', b)} overlapping. Show the intersection with clear contour lines.`,
      ru: `Нарисуй ${ru(a).acc} и ${ru(b).acc} с наложением. Пересечение обозначь чёткими контурами.`,
      zh: `绘制${pick('zh', a)}与${pick('zh', b)}的重叠，用清晰轮廓标出相交区域。`,
      ja: `${pick('ja', a)}と${pick('ja', b)}を重ねて描く。交差部分をはっきりした輪郭で示す。`,
      ko: `${pick('ko', a)}와 ${pick('ko', b)}를 겹쳐 그리세요. 교차 구간은 윤곽선으로 분명히 표시하세요.`,
    },
  }),
  (a, b) => ({
    title: {
      en: `Shape Cutout: ${pick('en', b)} from ${pick('en', a)}`,
      ru: `Вырез в ${ru(a).prep}: ${ru(b).nom}`,
      zh: `形体挖空：从${pick('zh', a)}中减去${pick('zh', b)}`,
      ja: `切り抜き：${pick('ja', a)}から${pick('ja', b)}をくり抜く`,
      ko: `도형 빼기: ${pick('ko', a)}에서 ${pick('ko', b)} 빼기`,
    },
    description: {
      en: `Draw a large ${pick('en', a)} with a ${pick('en', b)} cut out of the center — a flat boolean subtraction.`,
      ru: `Нарисуй большой ${ru(a).acc} с вырезанным по центру ${ru(b).inst} — плоское вычитание формы.`,
      zh: `画一个大${pick('zh', a)}，从中心挖去${pick('zh', b)}的形状（平面布尔减法）。`,
      ja: `大きな${pick('ja', a)}の中央に${pick('ja', b)}の形をくり抜いて描く（平面の減算）。`,
      ko: `큰 ${pick('ko', a)} 중앙에 ${pick('ko', b)} 모양을 뚫어 그리세요(평면 부울 빼기).`,
    },
  }),
  (a, b) => ({
    title: {
      en: `Side by Side: ${pick('en', a)} and ${pick('en', b)}`,
      ru: `Рядом: ${ru(a).nom} и ${ru(b).nom}`,
      zh: `并排：${pick('zh', a)}与${pick('zh', b)}`,
      ja: `並置：${pick('ja', a)}と${pick('ja', b)}`,
      ko: `나란히: ${pick('ko', a)}와 ${pick('ko', b)}`,
    },
    description: {
      en: `Place a ${pick('en', a)} and a ${pick('en', b)} next to each other with equal spacing between edges.`,
      ru: `Размести ${ru(a).acc} и ${ru(b).acc} рядом, оставив одинаковый зазор между контурами.`,
      zh: `将${pick('zh', a)}与${pick('zh', b)}并排摆放，边缘间距相等。`,
      ja: `${pick('ja', a)}と${pick('ja', b)}を並べ、輪郭間の余白を均等にする。`,
      ko: `${pick('ko', a)}와 ${pick('ko', b)}를 나란히 배치하고 가장자리 간격을 같게 맞추세요.`,
    },
  }),
  (a) => ({
    title: {
      en: `Distorted ${pick('en', a)}: Tall and Wide`,
      ru: `Искажение ${ru(a).gen}: высокий и широкий`,
      zh: `形变练习：${pick('zh', a)}（高与宽）`,
      ja: `変形：${pick('ja', a)}（縦長と横長）`,
      ko: `변형: ${pick('ko', a)} — 세로·가로`,
    },
    description: {
      en: `Draw the same ${pick('en', a)} twice: one stretched tall, one stretched wide. Keep the primitive readable.`,
      ru: `Нарисуй ${ru(a).acc} дважды: один вытянутый по вертикали, другой — по горизонтали. Форма должна оставаться узнаваемой.`,
      zh: `同一${pick('zh', a)}画两次：一次纵向拉伸，一次横向拉伸，仍需可辨认。`,
      ja: `同じ${pick('ja', a)}を2つ描く。1つは縦に、1つは横に伸ばす。形は識別できること。`,
      ko: `같은 ${pick('ko', a)}를 두 번 그리세요. 하나는 세로로, 하나는 가로로 늘립니다. 형태는 알아볼 수 있어야 합니다.`,
    },
  }),
  (a, b, c) => ({
    title: {
      en: `Primitive Row: ${pick('en', a)}, ${pick('en', b)}, ${pick('en', c)}`,
      ru: `Ряд примитивов: ${ru(a).nom}, ${ru(b).nom}, ${ru(c).nom}`,
      zh: `形体横排：${pick('zh', a)}、${pick('zh', b)}、${pick('zh', c)}`,
      ja: `基本形並び：${pick('ja', a)}・${pick('ja', b)}・${pick('ja', c)}`,
      ko: `도형 나열: ${pick('ko', a)}, ${pick('ko', b)}, ${pick('ko', c)}`,
    },
    description: {
      en: `Draw three flat primitives in a row: ${pick('en', a)}, ${pick('en', b)}, ${pick('en', c)}. Match height and spacing.`,
      ru: `Нарисуй в ряд три плоских примитива: ${ru(a).acc}, ${ru(b).acc} и ${ru(c).acc}. Выровняй высоту и промежутки.`,
      zh: `横排绘制三个平面形体：${pick('zh', a)}、${pick('zh', b)}、${pick('zh', c)}，高度与间距一致。`,
      ja: `平面の基本形を3つ横に並べる：${pick('ja', a)}、${pick('ja', b)}、${pick('ja', c)}。高さと間隔を揃える。`,
      ko: `평면 기본 도형 세 개를 나란히 그리세요: ${pick('ko', a)}, ${pick('ko', b)}, ${pick('ko', c)}. 높이와 간격을 맞추세요.`,
    },
  }),
  (a, b) => ({
    title: {
      en: `Nested Shapes: ${pick('en', b)} inside ${pick('en', a)}`,
      ru: `Вложение: ${ru(b).nom} внутри ${ru(a).gen}`,
      zh: `嵌套：${pick('zh', b)}在${pick('zh', a)}内`,
      ja: `入れ子：${pick('ja', a)}の中に${pick('ja', b)}`,
      ko: `중첩: ${pick('ko', a)} 안의 ${pick('ko', b)}`,
    },
    description: {
      en: `Draw a large ${pick('en', a)} with a smaller ${pick('en', b)} centered inside. Both contours stay visible.`,
      ru: `Нарисуй большой ${ru(a).acc} и меньший ${ru(b).acc} по центру внутри. Оба контура должны быть видны.`,
      zh: `画一个大${pick('zh', a)}，中心放入较小的${pick('zh', b)}，两个轮廓都清晰可见。`,
      ja: `大きな${pick('ja', a)}の中央に小さな${pick('ja', b)}を描く。両方の輪郭を見えるようにする。`,
      ko: `큰 ${pick('ko', a)} 안 중앙에 작은 ${pick('ko', b)}를 그리세요. 두 윤곽 모두 보여야 합니다.`,
    },
  }),
  (a) => ({
    title: {
      en: `Rotated Pair: Two ${pick('en', a)}s`,
      ru: `Поворот: ${ru(a).two}`,
      zh: `旋转对比：两个${pick('zh', a)}`,
      ja: `回転ペア：${pick('ja', a)}を2つ`,
      ko: `회전 쌍: ${pick('ko', a)} 두 개`,
    },
    description: {
      en: `Draw two ${pick('en', a)}s with the same size: one upright, one rotated about 30°.`,
      ru: `Нарисуй ${ru(a).two} одинакового размера: один прямо, второй повёрнут примерно на 30°.`,
      zh: `画两个等大的${pick('zh', a)}：一个正放，一个旋转约30°。`,
      ja: `同じサイズの${pick('ja', a)}を2つ描く。1つは正立、もう1つは約30°回転。`,
      ko: `같은 크기의 ${pick('ko', a)} 두 개를 그리세요. 하나는 똑바로, 다른 하나는 약 30° 회전.`,
    },
  }),
  (a) => ({
    title: {
      en: `Scaling Line: Five ${pick('en', a)}s`,
      ru: `Масштаб: ${ru(a).five}`,
      zh: `大小渐变：五个${pick('zh', a)}`,
      ja: `サイズ段階：${pick('ja', a)}を5つ`,
      ko: `크기 단계: ${pick('ko', a)} 다섯 개`,
    },
    description: {
      en: `Draw five ${pick('en', a)}s from small to large in one line. Keep proportions of the primitive consistent.`,
      ru: `Нарисуй ${ru(a).five} от маленького к большому в одну линию. Пропорции формы сохраняй.`,
      zh: `在一行中画五个由小到大的${pick('zh', a)}，保持形体比例一致。`,
      ja: `${pick('ja', a)}を小→大の順に5つ一列に描く。形の比率は一定に。`,
      ko: `${pick('ko', a)}를 작은 것부터 큰 것까지 다섯 개 한 줄로 그리세요. 형태 비율은 일정하게 유지하세요.`,
    },
  }),
  (a, b) => ({
    title: {
      en: `Combined Silhouette: ${pick('en', a)} + ${pick('en', b)}`,
      ru: `Силуэт: ${ru(a).nom} и ${ru(b).nom} как одна форма`,
      zh: `组合轮廓：${pick('zh', a)}与${pick('zh', b)}合一`,
      ja: `合成シルエット：${pick('ja', a)}と${pick('ja', b)}`,
      ko: `합성 실루엣: ${pick('ko', a)}와 ${pick('ko', b)}`,
    },
    description: {
      en: `Merge a ${pick('en', a)} and a ${pick('en', b)} into one flat combined shape — shared edges, no gaps.`,
      ru: `Объедини ${ru(a).acc} и ${ru(b).acc} в одну плоскую форму — общие грани, без разрывов.`,
      zh: `将${pick('zh', a)}与${pick('zh', b)}合并为一个平面整体，边缘衔接、无空隙。`,
      ja: `${pick('ja', a)}と${pick('ja', b)}を1つの平面形状に合体させる。境界はつながり、隙間なし。`,
      ko: `${pick('ko', a)}와 ${pick('ko', b)}를 하나의 평면 형태로 합치세요. 경계가 맞닿고 틈이 없어야 합니다.`,
    },
  }),
]

function buildWarmupQuests(): Quest[] {
  const quests: Quest[] = []
  for (let i = 0; i < WARMUP_QUEST_COUNT; i++) {
    const id = WARMUP_QUEST_ID_MIN + i
    const a = SHAPES[i % SHAPES.length]!
    const b = SHAPES[(i * 3 + 2) % SHAPES.length]!
    const c = SHAPES[(i * 7 + 5) % SHAPES.length]!
    const recipe = RECIPES[i % RECIPES.length]!
    const copy = recipe(a, b, c)
    quests.push({
      id,
      code: `WRM-${String(i + 1).padStart(5, '0')}`,
      title: copy.title,
      category: 'drawing',
      difficulty: 'novice',
      description: copy.description,
      xp: 8,
      estimatedTime: 5,
      source: 'ArtQuest Warmup',
      icon: '✏️',
      color: '#6366f1',
      min_level: 1,
      tags: ['warmup', 'primitive', 'form', 'novice', 'drawing'],
      prerequisites: [],
      medium: 'both',
      is_repeatable: true,
      review_after_days: 0,
      streak_bonus: 1,
    })
  }
  return quests
}

export const WARMUP_QUESTS: Quest[] = buildWarmupQuests()

const warmupById = new Map(WARMUP_QUESTS.map((q) => [q.id, q]))

export function isWarmupQuestId(questId: number): boolean {
  return questId >= WARMUP_QUEST_ID_MIN && questId <= WARMUP_QUEST_ID_MAX
}

export function getWarmupQuestById(questId: number): Quest | undefined {
  return warmupById.get(questId)
}
