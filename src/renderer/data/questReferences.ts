import type { Quest } from '@/store/models'
import type { Language } from '@/i18n/translations'

export type QuestReferenceGuide = {
  visual: string
  /** Path under public/ (e.g. refs/perspective.svg) */
  imageSrc?: string
  tips: Record<Language, string[]>
}

function refImage(name: string): string {
  return `refs/${name}.svg`
}

function locTips(en: string[], ru: string[], zh?: string[], ja?: string[], ko?: string[]): Record<Language, string[]> {
  const zhList = zh ?? en
  return {
    en,
    ru,
    zh: zhList,
    'zh-tw': zhList,
    ja: ja ?? en,
    ko: ko ?? en,
  }
}

const TAG_GUIDES: Record<string, QuestReferenceGuide> = {
  perspective: {
    visual: '📐',
    imageSrc: refImage('perspective'),
    tips: locTips(
      ['Use a horizon line and vanishing points.', 'Block forms with boxes before details.'],
      ['Используй линию горизонта и точки схода.', 'Сначала блокируй формы кубами, потом детали.'],
      ['使用地平线与消失点。', '先用立方体块面概括形体，再画细节。'],
      ['地平線と消失点を使う。', '細部の前に箱で形をブロックする。'],
      ['수평선과 소실점을 사용하세요.', '세부 묘사 전에 상자로 형태를 블로킹하세요.'],
    ),
  },
  walk: {
    visual: '🚶',
    imageSrc: refImage('walk'),
    tips: locTips(
      ['Track hips, feet, and contact poses key to key.', 'Exaggerate up/down on contact frames.'],
      ['Отслеживай таз, стопы и контакты кадр к кадру.', 'Усиливай вертикальное движение в кадрах контакта.'],
      ['逐关键帧跟踪髋部、脚和接触姿势。', '在接触帧上夸张上下起伏。'],
      ['腰・足・接地ポーズをキーで追う。', '接地フレームの上下動を強調する。'],
      ['골반, 발, 접지 포즈를 키프레임마다 추적하세요.', '접지 프레임에서 상하 움직임을 과장하세요.'],
    ),
  },
  timing: {
    visual: '⏱',
    imageSrc: refImage('animation'),
    tips: locTips(
      ['Slow in = slow out; fast actions need snappy spacing.', 'Use holds on anticipation poses.'],
      ['Медленный вход — медленный выход; быстрые действия — короткий spacing.', 'Делай на позах ожидания.'],
      ['缓入缓出；快速动作需要紧凑的间距。', '在预期姿势上使用停留。'],
      ['スローイン＝スローアウト。速い動きはタメの間隔を。', '予備ポーズでホールドを入れる。'],
      ['슬로우 인·아웃; 빠른 동작은 간격을 촘촘히.', '예비 포즈에 홀드를 넣으세요.'],
    ),
  },
  anatomy: {
    visual: '🦴',
    imageSrc: refImage('anatomy'),
    tips: locTips(
      ['Land major masses before small details.', 'Check joint angles against a reference.'],
      ['Сначала крупные массы, потом мелкие детали.', 'Сверяй углы суставов с референсом.'],
      ['先确定大体积块，再画小细节。', '对照参考检查关节角度。'],
      ['細部の前に大きなマスを置く。', '関節角度を参考と照合する。'],
      ['작은 디테일 전에 큰 덩어리를 잡으세요.', '관절 각도를 레퍼런스와 비교하세요.'],
    ),
  },
  effects: {
    visual: '✨',
    imageSrc: refImage('effects'),
    tips: locTips(
      ['Silhouette + color pop reads better than noise alone.', 'Layer glow, particles, and impact separately.'],
      ['Силуэт + цветовой акцент читается лучше, чем шум один.', 'Разделяй glow, частицы и удар по слоям.'],
      ['剪影加色彩点缀比单纯噪点更易读。', '将光晕、粒子和冲击分层处理。'],
      ['シルエット＋色のアクセントはノイズだけより読みやすい。', 'グロー・パーティクル・インパクトはレイヤー分け。'],
      ['실루엣과 색 포인트가 노이즈만 쓰는 것보다 잘 읽힙니다.', '글로우, 파티클, 임팩트는 레이어로 나누세요.'],
    ),
  },
  gesture: {
    visual: '✏️',
    imageSrc: refImage('gesture'),
    tips: locTips(
      ['Capture flow in 30–90 second poses first.', 'Exaggerate line of action for clarity.'],
      ['Сначала 30–90 секундных поз, лови движения.', 'Преувеличай линию действия для читаемости.'],
      ['先用30–90秒姿势捕捉动感。', '夸张动作线以提高可读性。'],
      ['まず30〜90秒ポーズで流れを捉える。', '動きのラインを誇張して読みやすく。'],
      ['먼저 30–90초 포즈로 흐름을 잡으세요.', '동작선을 과장해 가독성을 높이세요.'],
    ),
  },
  composition: {
    visual: '🖼',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['Pick one focal point; avoid equal visual weight everywhere.', 'Use leading lines toward the subject.'],
      ['Один фокус; не распределяй вес по всему кадру.', 'Направляющие линии к объекту.'],
      ['选一个焦点；避免画面处处权重相同。', '用引导线指向主体。'],
      ['焦点を一つに。画面全体で同じ重量感にしない。', '被写体へ視線を導く線を使う。'],
      ['초점을 하나 정하세요. 화면 전체에 동일한 비중을 두지 마세요.', '피사체로 이어지는 유도선을 쓰세요.'],
    ),
  },
  practice: {
    visual: '🔁',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['Set a timer; stop when it rings even if unfinished.', 'Same subject, 3 passes: rough → clean → polish.'],
      ['Поставь таймер; остановись по звонку, даже если не готово.', 'Один объект, 3 прохода: эскиз → чище → полировка.'],
      ['设定计时器；到时即停，即使未完成。', '同一主题三遍：粗稿→清理→润色。'],
      ['タイマーをセット。未完成でも鳴ったら止める。', '同じ題材を3パス：ラフ→清書→仕上げ。'],
      ['타이머를 맞추고, 끝나면 미완이어도 멈추세요.', '같은 대상 3회: 러프 → 정리 → 마무리.'],
    ),
  },
  spacing: {
    visual: '↔️',
    imageSrc: refImage('animation'),
    tips: locTips(
      ['Closer frames = slower motion; wider gaps = faster.', 'Mark slow-in and slow-out on your spacing strip.'],
      ['Ближе кадры — медленнее; дальше — быстрее.', 'Отметь slow-in и slow-out на полосе spacing.'],
      ['帧距越近越慢，越远越快。', '在间距条上标出缓入缓出。'],
      ['コマが近いほど遅く、離れるほど速い。', 'スペーシング帯にスローイン・アウトを印す。'],
      ['프레임이 가까울수록 느리고, 멀수록 빠릅니다.', '스페이싱 스트립에 슬로우 인·아웃을 표시하세요.'],
    ),
  },
  smear: {
    visual: '💨',
    imageSrc: refImage('animation'),
    tips: locTips(
      ['Smear frames bridge fast poses — keep mass volume.', 'Silhouette must stay readable on impact.'],
      ['Smear связывает быстрые позы — сохраняй объём.', 'Силуэт на impact должен читаться.'],
      ['涂抹帧连接快速姿势——保持体积感。', '冲击瞬间剪影必须清晰可读。'],
      ['スミアで速いポーズをつなぐ—体積を保つ。', 'インパクト時もシルエットが読めること。'],
      ['스미어 프레임으로 빠른 포즈를 잇되 덩어리감을 유지하세요.', '임팩트에서도 실루엣이 읽혀야 합니다.'],
    ),
  },
  layout: {
    visual: '📋',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['Thumbnail first — camera height and horizon before detail.', 'Check character scale vs environment.'],
      ['Сначала миниатюра — высота камеры и горизонт.', 'Сверь масштаб персонажа с окружением.'],
      ['先画小稿——再定机位高度和地平线。', '检查角色与环境的比例。'],
      ['まずサムネ—細部の前にカメラ高さと地平線。', 'キャラと環境のスケールを確認。'],
      ['먼저 썸네일—디테일 전에 카메라 높이와 수평선.', '캐릭터와 배경의 스케일을 확인하세요.'],
    ),
  },
  pipeline: {
    visual: '🏭',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['One stage per pass: plan → board → layout → keys.', 'Do not polish before the beat reads.'],
      ['Один этап за проход: план → борд → layout → ключи.', 'Не полируй, пока бит не читается.'],
      ['每遍一个阶段：策划→分镜→布局→关键帧。', '节拍可读之前不要精修。'],
      ['1パス1段階：企画→ボード→レイアウト→キー。', 'ビートが読めるまで仕上げない。'],
      ['패스마다 한 단계: 기획 → 보드 → 레이아웃 → 키.', '비트가 읽히기 전엔 폴리싱하지 마세요.'],
    ),
  },
  study_plan: {
    visual: '📓',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['Log time and topic after each session.', 'One measurable fix per study block.'],
      ['Записывай время и тему после сессии.', 'Одно измеримое улучшение за блок.'],
      ['每次练习后记录时间和主题。', '每个学习块设定一个可衡量的改进点。'],
      ['セッション後に時間とテーマを記録。', '1ブロックに1つ測定可能な改善。'],
      ['세션마다 시간과 주제를 기록하세요.', '블록마다 측정 가능한 개선 한 가지를 정하세요.'],
    ),
  },
}

const CATEGORY_FALLBACK: Record<string, QuestReferenceGuide> = {
  drawing: {
    visual: '🎨',
    imageSrc: refImage('drawing'),
    tips: locTips(
      ['Keep strokes light on the first pass.', 'Step back often — check proportions from a distance.'],
      ['Первый проход — лёгкими штрихами.', 'Чаще отходи — проверяй пропорции издалека.'],
      ['第一遍笔触要轻。', '经常退远检查比例。'],
      ['最初のパスは線を軽く。', '離れてプロポーションを確認。'],
      ['첫 패스는 가볍게.', '자주 물러나 비율을 확인하세요.'],
    ),
  },
  animation: TAG_GUIDES.walk!,
  anatomy: TAG_GUIDES.anatomy!,
  effects: TAG_GUIDES.effects!,
}

function firstMatchingTag(quest: Quest, keys: string[]): QuestReferenceGuide | null {
  for (const tag of quest.tags) {
    const key = tag.toLowerCase()
    if (keys.includes(key) && TAG_GUIDES[key]) return TAG_GUIDES[key]
  }
  return null
}

export function getQuestReferenceGuide(quest: Quest): QuestReferenceGuide {
  const fromTag =
    firstMatchingTag(quest, Object.keys(TAG_GUIDES)) ??
    CATEGORY_FALLBACK[quest.category] ??
    CATEGORY_FALLBACK.drawing!
  return fromTag
}

export function getQuestReferenceImageUrl(guide: QuestReferenceGuide): string | null {
  if (!guide.imageSrc) return null
  const base = import.meta.env.BASE_URL ?? './'
  return `${base}${guide.imageSrc}`.replace(/\/{2,}/g, '/')
}
