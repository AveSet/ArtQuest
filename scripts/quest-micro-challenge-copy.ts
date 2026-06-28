/**
 * Shared quest-specific micro-challenge copy for catalog quests.
 */

export type PhaseText = { en: string; ru: string }
export type PhaseTriple = [PhaseText, PhaseText, PhaseText]

export interface MicroChallengeDraft {
  id: string
  instruction: { en: string; ru: string }
  estimatedTime: number
  xp: number
  prerequisite?: string
}

export interface QuestMicroInput {
  id: number
  title: { en: string; ru: string; [k: string]: string | undefined }
  description: { en: string; ru: string; [k: string]: string | undefined }
  category: string
  estimatedTime: number
  tags: string[]
}

export const GENERIC_MICRO_EN = new Set([
  'Warm up: make 5 quick rough sketches for this exercise',
  'Main step: complete the core exercise described in the quest',
  'Polish: refine edges, values, or timing for a clean result',
  'Complete the main exercise from the quest description',
  'One focused refinement pass on the best result',
  'Warm up: 5 quick rough sketches or strokes related to the quest topic',
  'Core step: complete the main exercise focus from the quest description',
  'Polish: refine edges, values, or timing for a clean finish',
])

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)
}

function stripTechnicalSuffix(subject: string): string {
  return subject
    .replace(/\s*\(base \+ detail(s)?\)\s*$/i, '')
    .replace(/\s*\(shape( \+ direction)?\)\s*$/i, '')
    .replace(/\s*\(buildup\/decay\)\s*$/i, '')
    .replace(/\s*\(source → dissipation\)\s*$/i, '')
    .replace(/\s*\(readability\)\s*$/i, '')
    .replace(/\s*\(2-3 panels\)\s*$/i, '')
    .replace(/\s*\(rule of thirds\)\s*$/i, '')
    .replace(/\s*\(\d+ sec\)\s*$/i, '')
    .replace(/\s*\(\d+ frames?\)\s*$/i, '')
    .replace(/\s*\(\d+ min(utes?)?\)\s*$/i, '')
    .replace(/\s* on background\s*$/i, '')
    .trim()
}

function parseColonTitle(title: string): { prefix: string; subject: string } | null {
  const idx = title.indexOf(':')
  if (idx <= 0) return null
  const prefix = title.slice(0, idx).trim()
  const subject = stripTechnicalSuffix(title.slice(idx + 1).trim())
  if (!subject) return null
  return { prefix, subject }
}

function questSubject(quest: QuestMicroInput): { prefix: string | null; subjectEn: string; subjectRu: string } {
  const parsed = parseColonTitle(quest.title.en)
  if (parsed) {
    const ruParsed = parseColonTitle(quest.title.ru)
    return {
      prefix: parsed.prefix,
      subjectEn: parsed.subject,
      subjectRu: ruParsed?.subject?.trim() || quest.title.ru || parsed.subject,
    }
  }
  return {
    prefix: null,
    subjectEn: stripTechnicalSuffix(quest.title.en.trim()),
    subjectRu: quest.title.ru?.trim() || quest.title.en.trim(),
  }
}

function cleanDescriptionLead(desc: string): string {
  return desc
    .trim()
    .replace(/^Entry-level (?:\w+ )?exercise:\s*/i, '')
    .replace(/^[^:]+:\s*/i, '')
    .replace(/\.\s*$/, '')
    .trim()
}

function coreFromDescription(quest: QuestMicroInput, subjectEn: string, subjectRu: string): PhaseText {
  const enLead = cleanDescriptionLead(quest.description.en || '')
  const ruLead = cleanDescriptionLead(quest.description.ru || '')
  if (enLead.length >= 18 && enLead.length <= 160) {
    const en = enLead.charAt(0).toUpperCase() + enLead.slice(1)
    const ru =
      ruLead.length >= 12 && ruLead.length <= 180
        ? ruLead.charAt(0).toUpperCase() + ruLead.slice(1)
        : enLead.charAt(0).toLowerCase() + enLead.slice(1)
    return { en: `Main step: ${en.charAt(0).toLowerCase() + en.slice(1)}`, ru: `Основной шаг: ${ru}` }
  }
  return {
    en: `Main step: complete the «${subjectEn}» exercise from the quest description`,
    ru: `Основной шаг: выполни упражнение «${subjectRu}» по описанию квеста`,
  }
}

function triple(
  warmupEn: string,
  warmupRu: string,
  coreEn: string,
  coreRu: string,
  polishEn: string,
  polishRu: string,
): PhaseTriple {
  return [
    { en: warmupEn, ru: warmupRu },
    { en: coreEn, ru: coreRu },
    { en: polishEn, ru: polishRu },
  ]
}

function subjectPhases(subjectEn: string, subjectRu: string, quest: QuestMicroInput): PhaseTriple {
  const core = coreFromDescription(quest, subjectEn, subjectRu)
  return triple(
    `Warm up: 5 quick exploratory sketches of ${subjectEn}`,
    `Разминка: 5 быстрых пробных набросков — ${subjectRu}`,
    core.en,
    core.ru,
    `Polish: one focused refinement pass on your best ${subjectEn} result`,
    `Полировка: один точный проход по лучшему результату — ${subjectRu}`,
  )
}

const PREFIX_BUILDERS: Record<string, (sEn: string, sRu: string, q: QuestMicroInput) => PhaseTriple> = {
  'Prop scatter': (sEn, sRu) =>
    triple(
      `Warm up: sketch 5 quick studies of ${sEn} from different angles`,
      `Разминка: 5 быстрых этюдов «${sRu}» с разных ракурсов`,
      `Main step: scatter ${sEn} in a readable scene — vary scale, rotation, and overlap`,
      `Основной шаг: разложи «${sRu}» в читаемой сцене — меняй масштаб, поворот и перекрытия`,
      `Polish: clean silhouettes and spatial readability`,
      `Полировка: уточни силуэты и пространственную читаемость`,
    ),
  'Reference copy': (sEn, sRu) =>
    triple(
      `Warm up: 3 loose shape studies of ${sEn}`,
      `Разминка: 3 свободных формы «${sRu}»`,
      `Main step: draw ${sEn} from reference with a clear silhouette`,
      `Основной шаг: нарисуй «${sRu}» по референсу с чётким силуэтом`,
      `Polish: simplify detail and sharpen edges`,
      `Полировка: упрости детали и подчисти контуры`,
    ),
  'Copy reference': (sEn, sRu) => PREFIX_BUILDERS['Reference copy']!(sEn, sRu, {} as QuestMicroInput),
  'Basic effect shape': (sEn, sRu) =>
    triple(
      `Warm up: 5 quick thumbnails exploring ${sEn}`,
      `Разминка: 5 быстрых эскизов формы «${sRu}»`,
      `Main step: block the core ${sEn} effect shape clearly`,
      `Основной шаг: заблокируй основную форму эффекта «${sRu}»`,
      `Polish: refine silhouette and edge clarity`,
      `Полировка: уточни силуэт и читаемость краёв`,
    ),
  '2-layer effect': (sEn, sRu) =>
    triple(
      `Warm up: sketch base and detail layers separately for ${sEn}`,
      `Разминка: отдельно набросай базовый и детальный слои «${sRu}»`,
      `Main step: combine base + detail layers for ${sEn}`,
      `Основной шаг: собери базовый и детальный слои эффекта «${sRu}»`,
      `Polish: balance layer contrast and cleanup`,
      `Полировка: сбалансируй контраст слоёв и подчисти`,
    ),
  Timing: (sEn, sRu) =>
    triple(
      `Warm up: mark key poses on a timing strip for ${sEn}`,
      `Разминка: отметь ключевые позы на тайминг-полоске — ${sRu}`,
      `Main step: draw buildup and decay for ${sEn}`,
      `Основной шаг: покажи нарастание и затухание «${sRu}»`,
      `Polish: adjust spacing for a clearer timing read`,
      `Полировка: подстрой интервалы для более читаемого тайминга`,
    ),
  'Energy flow': (sEn, sRu) =>
    triple(
      `Warm up: arrow thumbnails showing ${sEn} direction`,
      `Разминка: эскизы-стрелки с направлением «${sRu}»`,
      `Main step: show ${sEn} flowing from source to dissipation`,
      `Основной шаг: покажи поток «${sRu}» от источника к рассеиванию`,
      `Polish: strengthen focal path and fade-out`,
      `Полировка: усиль главный поток и затухание`,
    ),
  Silhouette: (sEn, sRu) =>
    triple(
      `Warm up: draw 3 ${sEn} silhouettes in different poses`,
      `Разминка: 3 силуэта «${sRu}» в разных позах`,
      `Main step: make ${sEn} readable with no internal lines`,
      `Основной шаг: сделай «${sRu}» узнаваемым без внутренних линий`,
      `Polish: push 3 silhouette variations — scale or attitude`,
      `Полировка: три варианта силуэта — масштаб или характер`,
    ),
  'Shape Language': (sEn, sRu) =>
    triple(
      `Warm up: explore circle-based shapes for a ${sEn} character`,
      `Разминка: формы на кругах для персонажа «${sRu}»`,
      `Main step: redesign using square-based shapes`,
      `Основной шаг: переработай на квадратных формах`,
      `Polish: mix shapes — assign each body part a base shape`,
      `Полировка: смешай формы — каждой части тела своя база`,
    ),
  'Gesture sketch': (sEn, sRu) =>
    triple(
      `Warm up: 5 one-minute gesture lines of ${sEn}`,
      `Разминка: 5 жестовых линий по минуте — ${sRu}`,
      `Main step: complete the timed gesture set from the quest description`,
      `Основной шаг: выполни жестовый набор по описанию квеста`,
      `Polish: pick your 2 best and strengthen line of action`,
      `Полировка: выбери 2 лучших и усиль линию действия`,
    ),
  'Gesture figure': (sEn, sRu) => PREFIX_BUILDERS['Gesture sketch']!(sEn, sRu, {} as QuestMicroInput),
  'Walk cycle': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: thumbnail the key poses for ${sEn}`,
      `Разминка: ключевые позы цикла — ${sRu}`,
      core.en,
      core.ru,
      `Polish: fix foot plants and hip arc on the cycle`,
      `Полировка: поправь опоры стоп и дугу бёдер в цикле`,
    )
  },
  'Compose a scene': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 3 small composition thumbnails for ${sEn}`,
      `Разминка: 3 мини-эскиза композиции — ${sRu}`,
      core.en,
      core.ru,
      `Polish: strengthen focal point and value grouping`,
      `Полировка: усиль фокус и группировку тонов`,
    )
  },
  'Design a prop': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 5 quick prop silhouettes for ${sEn}`,
      `Разминка: 5 быстрых силуэтов предмета — ${sRu}`,
      core.en,
      core.ru,
      `Polish: add material read and clean edges`,
      `Полировка: добавь читаемость материала и подчисти контуры`,
    )
  },
  'Study architecture': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: block main masses of ${sEn} in perspective`,
      `Разминка: блокируй главные массы — ${sRu}`,
      core.en,
      core.ru,
      `Polish: refine perspective lines and detail hierarchy`,
      `Полировка: уточни перспективу и иерархию деталей`,
    )
  },
  'Paint a nature scene': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: rough value masses for ${sEn}`,
      `Разминка: грубые тональные массы — ${sRu}`,
      core.en,
      core.ru,
      `Polish: push atmosphere and edge variety`,
      `Полировка: усиль атмосферу и разнообразие краёв`,
    )
  },
  'Design an interior': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: floor plan + eye-level block-in for ${sEn}`,
      `Разминка: план и блокинг на уровне глаз — ${sRu}`,
      core.en,
      core.ru,
      `Polish: clarify lighting and prop placement`,
      `Полировка: проясни свет и расстановку реквизита`,
    )
  },
  'Draw facial expressions': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 3 expression thumbnails — ${sEn}`,
      `Разминка: 3 эскиза мимики — ${sRu}`,
      core.en,
      core.ru,
      `Polish: push brows, eyes, and mouth contrast on the strongest`,
      `Полировка: усиль брови, глаза и рот на лучшем варианте`,
    )
  },
  'Facial expressions': (sEn, sRu, q) => PREFIX_BUILDERS['Draw facial expressions']!(sEn, sRu, q),
  Framing: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 3 thumbnail frames for ${sEn}`,
      `Разминка: 3 эскиза кадра — ${sRu}`,
      core.en,
      core.ru,
      `Polish: strengthen subject placement and leading lines`,
      `Полировка: усиль расположение объекта и направляющие`,
    )
  },
  'Shot type': (sEn, sRu, q) => PREFIX_BUILDERS.Framing!(sEn, sRu, q),
  '3-5 frame storyboard': (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: beat thumbnails for ${sEn}`,
      `Разминка: эскизы битов — ${sRu}`,
      core.en,
      core.ru,
      `Polish: clarify panel flow and readability`,
      `Полировка: проясни переходы между кадрами`,
    )
  },
}

const CATEGORY_BUILDERS: Record<string, (sEn: string, sRu: string, q: QuestMicroInput) => PhaseTriple> = {
  drawing: subjectPhases,
  anatomy: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 3 loose studies of ${sEn} — no erasing`,
      `Разминка: 3 свободных этюда «${sRu}» — без ластика`,
      core.en,
      core.ru,
      `Polish: overlay or refine one study for accuracy`,
      `Полировка: доработай один этюд для точности`,
    )
  },
  animation: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: key pose thumbnails for ${sEn}`,
      `Разминка: эскизы ключевых поз — ${sRu}`,
      core.en,
      core.ru,
      `Polish: fix spacing, arcs, or timing on the best pass`,
      `Полировка: поправь интервалы, дуги или тайминг`,
    )
  },
  effects: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 5 quick shape explorations for ${sEn}`,
      `Разминка: 5 быстрых форм эффекта «${sRu}»`,
      core.en,
      core.ru,
      `Polish: refine edges, glow, and layer contrast`,
      `Полировка: уточни края, свечение и контраст слоёв`,
    )
  },
  storytelling: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 3 story beat thumbnails for ${sEn}`,
      `Разминка: 3 эскиза story-beat — ${sRu}`,
      core.en,
      core.ru,
      `Polish: clarify read order and emotional focus`,
      `Полировка: проясни порядок чтения и эмоциональный акцент`,
    )
  },
  character_design: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: 5 quick character explorations for ${sEn}`,
      `Разминка: 5 быстрых вариантов персонажа — ${sRu}`,
      core.en,
      core.ru,
      `Polish: push silhouette and design clarity on the best`,
      `Полировка: усиль силуэт и ясность дизайна`,
    )
  },
  environment: (sEn, sRu, q) => {
    const core = coreFromDescription(q, sEn, sRu)
    return triple(
      `Warm up: block main shapes for ${sEn}`,
      `Разминка: заблокируй главные формы — ${sRu}`,
      core.en,
      core.ru,
      `Polish: refine depth, overlap, and atmosphere`,
      `Полировка: уточни глубину, перекрытия и атмосферу`,
    )
  },
}

function splitTimes(total: number): [number, number, number] {
  const warmup = Math.max(4, Math.min(8, Math.round(total * 0.18)))
  const polish = Math.max(8, Math.min(14, Math.round(total * 0.32)))
  const core = Math.max(5, total - warmup - polish)
  return [warmup, core, polish]
}

export function buildQuestPhaseTriple(quest: QuestMicroInput): PhaseTriple {
  const { prefix, subjectEn, subjectRu } = questSubject(quest)
  if (prefix && PREFIX_BUILDERS[prefix]) {
    return PREFIX_BUILDERS[prefix]!(subjectEn, subjectRu, quest)
  }
  const categoryBuilder = CATEGORY_BUILDERS[quest.category] ?? subjectPhases
  return categoryBuilder(subjectEn, subjectRu, quest)
}

export function buildQuestMicroChallenges(quest: QuestMicroInput): MicroChallengeDraft[] {
  const base = slugify(quest.title.en || String(quest.id))
  const phases = buildQuestPhaseTriple(quest)
  const times = splitTimes(Math.max(15, quest.estimatedTime || 25))
  const xp: [number, number, number] = [5, 10, 15]
  const ids = [`mc-${base}-warmup`, `mc-${base}-core`, `mc-${base}-polish`]
  return phases.map((phase, i) => ({
    id: ids[i]!,
    instruction: phase,
    estimatedTime: times[i]!,
    xp: xp[i]!,
    ...(i > 0 ? { prerequisite: ids[i - 1]! } : {}),
  }))
}

export function questMicroChallengesNeedPersonalize(
  microChallenges: Array<{ instruction: { en?: string } }>,
): boolean {
  return microChallenges.some((mc) => {
    const en = mc.instruction.en ?? ''
    return (
      GENERIC_MICRO_EN.has(en) ||
      en.startsWith('3 quick exploratory sketches for:') ||
      / shapes from different angles$/.test(en)
    )
  })
}

export function isGenericMicroInstruction(en: string): boolean {
  return GENERIC_MICRO_EN.has(en) || en.startsWith('3 quick exploratory sketches for:')
}
