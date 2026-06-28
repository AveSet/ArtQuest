/**
 * Rewrite machine-generated quest titles (EN + RU) and generic micro-challenges
 * into clear, human-readable instructions.
 *
 * Usage: node scripts/humanize-quest-copy.mjs
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = 'src/renderer/data'
const FILES = [
  'quests_drawing.json',
  'quests_animation.json',
  'quests_anatomy.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

const GENERIC_MC = {
  warmupEn: 'Warm up: 5 quick rough sketches or strokes related to the quest topic',
  coreEn: 'Core step: complete the main exercise focus from the quest description',
  polishEn: 'Polish: refine edges, values, or timing for a clean finish',
}

const EN_SUBJECT_RU = new Map([
  ['electric arc (lightning)', 'электрическая дуга (молния)'],
  ['energy shield', 'энергетический щит'],
  ['ice spike', 'ледяной шип'],
  ['portal (opening)', 'портал (открытие)'],
  ['explosion (mushroom)', 'взрыв (грибовидный)'],
  ['dark sphere', 'тёмная сфера'],
  ['holy radiance', 'святое сияние'],
  ['magic barrier', 'магический барьер'],
  ['light sword', 'световой меч'],
  ['lava (bubbling)', 'лава (пузырение)'],
  ['tornado', 'торнадо'],
  ['flame (torch)', 'пламя (факел)'],
  ['glass crack', 'трещины на стекле'],
  ['waterfall', 'водопад'],
  ['magic bubbles', 'магические пузыри'],
  ['wind vortex', 'ветряной вихрь'],
  ['poison cloud', 'ядовитое облако'],
  ['earthen wall', 'земляная стена'],
])

function stripTechnicalSuffix(subject) {
  return subject
    .replace(/\s*\(base \+ detail(s)?\)\s*$/i, '')
    .replace(/\s*\(shape( \+ direction)?\)\s*$/i, '')
    .replace(/\s*\(форма\)\s*$/i, '')
    .replace(/\s*\(buildup\/decay\)\s*$/i, '')
    .replace(/\s*\(source → dissipation\)\s*$/i, '')
    .replace(/\s*\(source to dissipation\)\s*$/i, '')
    .replace(/\s*\(readability\)\s*$/i, '')
    .replace(/\s*\(2-3 panels\)\s*$/i, '')
    .replace(/\s*\(rule of thirds\)\s*$/i, '')
    .replace(/\s*\(light\/mid\/dark\)\s*$/i, '')
    .replace(/\s*\(3-5 layers\)\s*$/i, '')
    .replace(/\s*\(\d+ sec\)\s*$/i, '')
    .replace(/\s*\(\d+ frames?\)\s*$/i, '')
    .replace(/\s*\(\d+ min(utes?)?\)\s*$/i, '')
    .replace(/\s* on background\s*$/i, '')
    .replace(/\s* на фоне\s*$/i, '')
    .trim()
}

function parseColonTitle(title) {
  const idx = title.indexOf(':')
  if (idx <= 0) return null
  const prefix = title.slice(0, idx).trim()
  const rest = title.slice(idx + 1).trim()
  if (!rest) return null
  return { prefix, subject: stripTechnicalSuffix(rest) }
}

const EN_PREFIX = new Map([
  ['2-layer effect', (s) => `Create a two-layer «${s}» effect with a base layer and a detail layer`],
  ['Basic effect shape', (s) => `Create a basic shape for a ${s} effect`],
  ['Reference copy', (s) => `Draw the shape of ${s} from a reference`],
  ['Copy reference', (s) => `Draw the shape of ${s} from a reference`],
  ['Timing', (s) => `Study the timing of ${s}: buildup and decay`],
  ['Energy flow', (s) => `Show how ${s} flows from source to dissipation`],
  ['Simple composition', (s) => `Place ${s} in a simple scene with a background`],
  ['Volume retention', (s) => `Keep the volume of ${s} while it deforms`],
  ['Turbulence', (s) => `Add controlled turbulence to ${s}`],
  ['Surface interaction', (s) => `Show how ${s} interacts with a surface`],
  ['Color gradient', (s) => `Paint a color gradient for ${s} from core to edges`],
  ['Secondary effect', (s) => `Add secondary sparks, smoke, or dust to ${s}`],
  ['Effect timing chart', (s) => `Break down ${s} frame by frame on a timing chart`],
  ['Multi-layer effect', (s) => `Build ${s} in three to five layers`],
  ['Physics-based', (s) => `Animate ${s} with simplified physics`],
  ['Effect stylization', (s) => `Stylize ${s} in an anime or comic look`],
  ['Atmospheric effect', (s) => `Paint an atmospheric ${s} scene`],
  ['Impact frame', (s) => `Draw the impact frame for ${s}`],
  ['Looping effect', (s) => `Create a seamless looping ${s} effect`],
  ['Cinematic effect', (s) => `Design a cinematic ${s} effect with scale and drama`],
  ['Effect compositing', (s) => `Composite ${s} with layers and glow`],
  ['Procedural study', (s) => `Study procedural rules for ${s} and make variations`],
  ['Effect as storytelling', (s) => `Use ${s} to tell a story through form and motion`],
  ['Optimization', (s) => `Simplify ${s} for production while keeping it readable`],
  ['Studio effect copy', (s) => `Study and recreate a studio-style ${s} effect`],
  ['Final FX shot', (s) => `Finish a full ${s} effects shot from reference to composite`],
  ['Realtime effect', (s) => `Adapt ${s} for real-time particles and shaders`],
  ['FX direction', (s) => `Direct ${s} with focus and rhythm`],
  ['Multi-FX scene', (s) => `Combine multiple effects in a ${s} scene without visual noise`],
  ['Speed FX', (s) => `Create a readable ${s} effect in two to four hours`],
  ['Brief-based task', (s) => `Complete ${s} to a professional brief`],
  ['Silhouette', (s) => `Design a readable ${s} silhouette`],
  ['Shape Language', (s) => `Use shape language to design a ${s} character`],
  ['Proportions', (s) => `Study ${s} character proportions`],
  ['Personality', (s) => `Show the personality of a ${s} through design`],
  ['Character Variety', (s) => `Design character variety: ${s}`],
  ['Costume Design', (s) => `Design a costume for a ${s}`],
  ['Facial Expressions', (s) => `Draw facial expressions: ${s}`],
  ['Character Turnaround', (s) => `Draw a turnaround of a ${s}`],
  ['Model Sheet', (s) => `Create a model sheet for ${s}`],
  ['Creature Design', (s) => `Design a ${s} creature`],
  ['Mechanical Design', (s) => `Design mechanical ${s}`],
  ['Design Fundamentals', (s) => `Apply design fundamentals: ${s}`],
  ['Perspective', (s) => `Draw ${s} in perspective`],
  ['Composition', (s) => `Compose a scene: ${s}`],
  ['Architecture', (s) => `Study architecture: ${s}`],
  ['Nature Scene', (s) => `Paint a nature scene: ${s}`],
  ['Interior', (s) => `Design an interior: ${s}`],
  ['Prop Design', (s) => `Design a prop: ${s}`],
  ['Lighting', (s) => `Study lighting in ${s}`],
  ['Matte Painting', (s) => `Create a matte painting of ${s}`],
  ['Atmosphere', (s) => `Paint atmosphere in ${s}`],
  ['Gesture sketch', (s) => `Make gesture sketches of ${s}`],
  ['Gesture figure', (s) => `Draw timed gesture studies of ${s}`],
  ['Contour drawing', (s) => `Draw contours of ${s}`],
  ['Basic muscle groups', (s) => `Study basic muscle groups in ${s}`],
  ['Portfolio anatomy piece', (s) => `Create a portfolio anatomy study of ${s}`],
  ['Industry anatomy challenge', (s) => `Complete an industry-style anatomy study of ${s}`],
  ['Industry brief execution', (s) => `Execute an industry brief: ${s}`],
  ['Industry brief', (s) => `Work from an industry brief: ${s}`],
  ['Industry task', (s) => `Complete an industry task: ${s}`],
  ['Portfolio piece', (s) => `Create a portfolio piece: ${s}`],
  ['Master study', (s) => `Make a master study of ${s}`],
  ['Value block-in', (s) => `Block in values for ${s}`],
  ['Constructive drawing', (s) => `Draw ${s} with constructive forms`],
  ['Squash & stretch', (s) => `Animate squash and stretch on ${s}`],
  ['Anticipation', (s) => `Add anticipation to ${s}`],
  ['Pantomime Acting', (s) => `Act out ${s} through pantomime animation`],
  ['Dialogue scene', (s) => `Animate a dialogue scene: ${s}`],
  ['Walk cycle', (s) => `Animate a walk cycle: ${s}`],
  ['Simple layout', (s) => `Lay out a simple sequence: ${s}`],
  ['Framing', (s) => `Frame ${s} with strong composition`],
  ["Director's shot planning", (s) => `Plan director shots for ${s}`],
  ['Multi-Layer Breakdown', (s) => `Break down ${s} into multiple layers`],
  ['Foreshortening extremes', (s) => `Draw ${s} with extreme foreshortening`],
  ['Production brief', (s) => `Complete a production brief: ${s}`],
])

const RU_PREFIX = new Map([
  ['2-layer effect', (s) => `Создать двухслойный эффект «${s}» из двух слоёв: основной и дополнительный`],
  ['Basic effect shape', (s) => `Создать базовую форму эффекта: ${s}`],
  ['Reference copy', (s) => `Нарисовать форму «${s}» по референсу`],
  ['Copy reference', (s) => `Нарисовать форму «${s}» по референсу`],
  ['Timing', (s) => `Изучить тайминг эффекта «${s}»: нарастание и затухание`],
  ['Energy flow', (s) => `Показать поток энергии «${s}» от источника к рассеиванию`],
  ['Simple composition', (s) => `Разместить «${s}» в простой сцене на фоне`],
  ['Silhouette', (s) => `Сделать читаемый силуэт: ${s}`],
  ['Shape Language', (s) => `Использовать язык форм для персонажа: ${s}`],
  ['Proportions', (s) => `Изучить пропорции: ${s}`],
  ['Personality', (s) => `Передать характер через дизайн: ${s}`],
  ['Character Variety', (s) => `Показать разнообразие персонажей: ${s}`],
  ['Costume Design', (s) => `Спроектировать костюм: ${s}`],
  ['Facial Expressions', (s) => `Нарисовать мимику: ${s}`],
  ['Character Turnaround', (s) => `Сделать разворот персонажа: ${s}`],
  ['Model Sheet', (s) => `Создать лист модели: ${s}`],
  ['Creature Design', (s) => `Спроектировать существо: ${s}`],
  ['Mechanical Design', (s) => `Спроектировать механику: ${s}`],
  ['Design Fundamentals', (s) => `Применить основы дизайна: ${s}`],
  ['Perspective', (s) => `Нарисовать в перспективе: ${s}`],
  ['Composition', (s) => `Собрать композицию сцены: ${s}`],
  ['Architecture', (s) => `Изучить архитектуру: ${s}`],
  ['Nature Scene', (s) => `Написать природную сцену: ${s}`],
  ['Interior', (s) => `Спроектировать интерьер: ${s}`],
  ['Prop Design', (s) => `Спроектировать предмет: ${s}`],
  ['Lighting', (s) => `Изучить освещение: ${s}`],
  ['Matte Painting', (s) => `Создать матовую живопись: ${s}`],
  ['Atmosphere', (s) => `Передать атмосферу: ${s}`],
  ['Gesture sketch', (s) => `Сделать жестовые наброски: ${s}`],
  ['Gesture figure', (s) => `Сделать жестовые этюды: ${s}`],
  ['Contour drawing', (s) => `Нарисовать контур: ${s}`],
  ['Basic muscle groups', (s) => `Изучить основные группы мышц: ${s}`],
  ['Portfolio anatomy piece', (s) => `Сделать анатомическую работу для портфолио: ${s}`],
  ['Industry anatomy challenge', (s) => `Выполнить индустриальное анатомическое задание: ${s}`],
  ['Industry brief execution', (s) => `Выполнить производственное задание: ${s}`],
  ['Industry brief', (s) => `Работа по производственному брифу: ${s}`],
  ['Industry task', (s) => `Выполнить индустриальное задание: ${s}`],
  ['Portfolio piece', (s) => `Сделать работу для портфолио: ${s}`],
  ['Master study', (s) => `Сделать этюд по работе мастера: ${s}`],
  ['Value block-in', (s) => `Заблокировать тональные массы: ${s}`],
  ['Constructive drawing', (s) => `Нарисовать конструктивно: ${s}`],
  ['Squash & stretch', (s) => `Анимировать squash and stretch: ${s}`],
  ['Anticipation', (s) => `Добавить anticipation: ${s}`],
  ['Pantomime Acting', (s) => `Сыграть пантомиму: ${s}`],
  ['Dialogue scene', (s) => `Анимировать диалоговую сцену: ${s}`],
  ['Walk cycle', (s) => `Анимировать цикл ходьбы: ${s}`],
  ['Simple layout', (s) => `Сделать простой макет сцены: ${s}`],
  ['Framing', (s) => `Подобрать кадрирование: ${s}`],
  ["Director's shot planning", (s) => `Спланировать режиссёрские планы: ${s}`],
  ['Multi-Layer Breakdown', (s) => `Разобрать на слои: ${s}`],
  ['Foreshortening extremes', (s) => `Нарисовать с сильным foreshortening: ${s}`],
  ['Production brief', (s) => `Выполнить производственный бриф: ${s}`],
  ['Volume retention', (s) => `Сохранить объём при деформации: ${s}`],
  ['Turbulence', (s) => `Добавить турбулентность: ${s}`],
  ['Surface interaction', (s) => `Показать взаимодействие с поверхностью: ${s}`],
  ['Color gradient', (s) => `Сделать цветовой градиент: ${s}`],
  ['Secondary effect', (s) => `Добавить вторичный эффект: ${s}`],
  ['Effect timing chart', (s) => `Расписать тайминг по кадрам: ${s}`],
  ['Multi-layer effect', (s) => `Собрать многослойный эффект: ${s}`],
  ['Physics-based', (s) => `Анимировать с упрощённой физикой: ${s}`],
  ['Effect stylization', (s) => `Стилизовать эффект: ${s}`],
  ['Atmospheric effect', (s) => `Сделать атмосферный эффект: ${s}`],
  ['Impact frame', (s) => `Нарисовать кадр удара: ${s}`],
  ['Looping effect', (s) => `Сделать зацикленный эффект: ${s}`],
  ['Cinematic effect', (s) => `Сделать кинематографичный эффект: ${s}`],
  ['Effect compositing', (s) => `Собрать композит эффекта: ${s}`],
  ['Procedural study', (s) => `Изучить процедурные правила: ${s}`],
  ['Effect as storytelling', (s) => `Рассказать историю через эффект: ${s}`],
  ['Optimization', (s) => `Упростить эффект для продакшена: ${s}`],
  ['Studio effect copy', (s) => `Повторить студийный эффект: ${s}`],
  ['Final FX shot', (s) => `Завершить FX-шот: ${s}`],
  ['Realtime effect', (s) => `Адаптировать эффект под real-time: ${s}`],
  ['FX direction', (s) => `Режиссировать FX: ${s}`],
  ['Multi-FX scene', (s) => `Собрать сцену с несколькими эффектами: ${s}`],
  ['Speed FX', (s) => `Быстро сделать читаемый эффект: ${s}`],
  ['Brief-based task', (s) => `Выполнить задание по брифу: ${s}`],
])

function humanizeTitleEn(title) {
  if (!title) return title
  const parsed = parseColonTitle(title)
  if (!parsed) return title
  const fn = EN_PREFIX.get(parsed.prefix)
  if (fn) return fn(parsed.subject)
  return title
}

function resolveRuSubject(originalEn, titleRu) {
  const parsedEn = parseColonTitle(originalEn)
  if (!parsedEn) return titleRu
  const parsedRu = parseColonTitle(titleRu)
  const enKey = parsedEn.subject.toLowerCase()
  if (EN_SUBJECT_RU.has(enKey)) return EN_SUBJECT_RU.get(enKey)
  const ruSub = parsedRu?.subject?.trim()
  if (ruSub && !/основной и дополнительный/i.test(ruSub)) return ruSub
  return parsedEn.subject
}

function humanizeTitleRu(titleRu, titleEn, machineEn) {
  if (!titleRu) return titleRu

  let m
  if ((m = titleEn.match(/^Create a two-layer «(.+)» effect with a base layer and a detail layer$/))) {
    const sub = EN_SUBJECT_RU.get(m[1].toLowerCase()) ?? m[1]
    return `Создать двухслойный эффект «${sub}» из двух слоёв: основной и дополнительный`
  }
  if ((m = titleEn.match(/^Draw the shape of (.+) from a reference$/))) {
    const sub = EN_SUBJECT_RU.get(m[1].toLowerCase()) ?? m[1]
    return `Нарисовать форму «${sub}» по референсу`
  }
  if ((m = titleEn.match(/^Create a basic shape for a (.+) effect$/))) {
    const sub = EN_SUBJECT_RU.get(m[1].toLowerCase()) ?? m[1]
    return `Создать базовую форму эффекта: ${sub}`
  }
  if ((m = titleEn.match(/^Design a readable (.+) silhouette$/))) {
    return `Сделать читаемый силуэт: ${m[1]}`
  }
  if ((m = titleEn.match(/^Draw (.+) in perspective$/))) {
    return `Нарисовать в перспективе: ${m[1]}`
  }

  const parsedEn = parseColonTitle(machineEn ?? titleEn)
  if (!parsedEn) return titleRu
  const fn = RU_PREFIX.get(parsedEn.prefix)
  if (!fn) return titleRu
  return fn(resolveRuSubject(machineEn ?? titleEn, titleRu))
}

function isGenericMicroChallenges(microChallenges) {
  if (!microChallenges?.length) return false
  return microChallenges.some((mc) => {
    const en = mc.instruction?.en ?? ''
    const ru = mc.instruction?.ru ?? ''
    return (
      en === GENERIC_MC.warmupEn ||
      en === 'Warm up: make 5 quick rough sketches for this exercise' ||
      en.startsWith('Warm up: make 5 quick rough sketches for «') ||
      ru.startsWith('Разминка: сделай 5 быстрых набросков — «') ||
      ru.startsWith('Разминка: сделай 5 быстрых набросков для ')
    )
  })
}

function humanizeMicroChallenges(quest) {
  if (!isGenericMicroChallenges(quest.microChallenges)) return quest.microChallenges
  return quest.microChallenges.map((mc) => {
    if (
      mc.instruction?.en === GENERIC_MC.warmupEn ||
      mc.instruction?.en?.startsWith('Warm up: make 5 quick rough sketches')
    ) {
      return {
        ...mc,
        instruction: {
          en: 'Warm up: make 5 quick rough sketches for this exercise',
          ru: 'Разминка: сделай 5 быстрых набросков для этого упражнения',
        },
      }
    }
    if (
      mc.instruction?.en === GENERIC_MC.coreEn ||
      mc.instruction?.en === 'Main step: complete the core exercise described in the quest'
    ) {
      return {
        ...mc,
        instruction: {
          en: 'Main step: complete the core exercise described in the quest',
          ru: 'Основной шаг: выполни главную часть упражнения из описания',
        },
      }
    }
    if (
      mc.instruction?.en === GENERIC_MC.polishEn ||
      mc.instruction?.en === 'Polish: refine edges, values, or timing for a clean result'
    ) {
      return {
        ...mc,
        instruction: {
          en: 'Polish: refine edges, values, or timing for a clean result',
          ru: 'Полировка: доработай контуры, тон или тайминг для чистого результата',
        },
      }
    }
    return mc
  })
}

let titleChanges = 0
let mcChanges = 0

for (const file of FILES) {
  const fp = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const q of quests) {
    const machineEn = q.title?.en
    const nextEn = humanizeTitleEn(machineEn)
    if (nextEn && nextEn !== q.title.en) {
      q.title.en = nextEn
      titleChanges++
    }
    const nextRu = humanizeTitleRu(q.title?.ru, q.title.en, machineEn)
    if (nextRu && nextRu !== q.title.ru) {
      q.title.ru = nextRu
      titleChanges++
    }
    if (q.microChallenges?.length) {
      const nextMc = humanizeMicroChallenges(q)
      if (JSON.stringify(nextMc) !== JSON.stringify(q.microChallenges)) {
        q.microChallenges = nextMc
        mcChanges++
      }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(quests, null, 2) + '\n', 'utf8')
}

console.log(`Humanized ${titleChanges} title fields and ${mcChanges} quest micro-challenge sets.`)
