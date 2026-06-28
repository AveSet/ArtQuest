/**
 * Rewrite awkward Russian quest titles using English source + clear templates.
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

const EN_SUBJECT_RU = new Map([
  ['electric arc (lightning)', 'электрическая дуга (молния)'],
  ['magic barrier', 'магический барьер'],
  ['light sword', 'световой меч'],
  ['lava (bubbling)', 'лава (пузырение)'],
  ['holy radiance', 'святое сияние'],
  ['tornado', 'торнадо'],
  ['flame (torch)', 'пламя (факел)'],
  ['glass crack', 'трещины на стекле'],
  ['portal (opening)', 'портал (открытие)'],
  ['waterfall', 'водопад'],
  ['magic bubbles', 'магические пузыри'],
  ['energy shield', 'энергетический щит'],
  ['wind vortex', 'ветряной вихрь'],
  ['poison cloud', 'ядовитое облако'],
  ['ice spike', 'ледяной шип'],
  ['earthen wall', 'земляная стена'],
  ['explosion (mushroom)', 'взрыв (грибовидный)'],
  ['dark sphere', 'тёмная сфера'],
  ['flame (torch)', 'пламя (факел)'],
  ['holy radiance', 'святое сияние'],
  ['emotional moment', 'эмоциональный момент'],
  ['unexpected discovery', 'неожиданное открытие'],
  ['overheard conversation', 'подслушанный разговор'],
  ['secret conspiracy', 'тайный заговор'],
  ['tense silence', 'напряжённое молчание'],
  ['joy of surprise gift', 'радость от неожиданного подарка'],
])

function cleanParen(s) {
  return s.replace(/^\s*\(/, '').replace(/\)\s*$/, '').trim()
}

function enSubjectToRu(subject) {
  const key = subject.trim().toLowerCase()
  if (EN_SUBJECT_RU.has(key)) return EN_SUBJECT_RU.get(key)
  return subject.trim()
}

function rewriteRuFromEn(en, ru) {
  if (!en || !ru) return ru
  const e = en.trim()

  let m
  if ((m = e.match(/^2-layer effect:\s*(.+?)\s*\(base \+ detail\)$/i))) {
    const sub = enSubjectToRu(m[1])
    return `Создать двухслойный эффект «${sub}» из 2 слоёв: основной и дополнительный`
  }
  if ((m = e.match(/^Basic effect shape:\s*(.+)$/i))) {
    return `Создать базовую форму эффекта: ${enSubjectToRu(m[1])}`
  }
  if ((m = e.match(/^Copy reference:\s*(.+?)\s*\(shape\)$/i))) {
    return `Повторить по референсу: ${enSubjectToRu(m[1])} (форма)`
  }
  if ((m = e.match(/^Timing:\s*(.+?)\s*\(buildup\/decay\)$/i))) {
    return `Тайминг эффекта: ${enSubjectToRu(m[1])} (нарастание и затухание)`
  }
  if ((m = e.match(/^Scene blocking:\s*emotional (moment|beat)\s*(\([^)]+\))?$/i))) {
    const extra = m[2] ? ` ${cleanParen(m[2])}` : ''
    return `Блокинг сцены эмоционального момента${extra}`
  }
  if ((m = e.match(/^(.+?):\s*emotional (moment|beat)\s*(\([^)]+\))?$/i))) {
    const taskMap = {
      'Emotional framing': 'Эмоциональное кадрирование',
      'Environmental storytelling': 'Окружающее повествование',
      '3-5 frame storyboard': 'Раскадровка на 3–5 кадров',
      'Dynamic camera move': 'Динамическое движение камеры',
      'Animatic timing': 'Тайминг аниматика',
      'Visual metaphors': 'Визуальные метафоры',
      'Pitch sequence': 'Питч-последовательность',
      'Multi-panel continuity': 'Многокадровая непрерывность',
    }
    const prefix = taskMap[m[1].trim()] ?? m[1].trim()
    const extra = m[3] ? ` ${cleanParen(m[3])}` : ''
    return `${prefix} эмоционального момента${extra}`
  }
  if ((m = e.match(/^Simple layout:\s*(.+?)\s*\(2-3 panels\)$/i))) {
    return `Простой макет: ${enSubjectToRu(m[1])} (2–3 панели)`
  }
  if ((m = e.match(/^Framing:\s*(.+?)\s*\(([^)]+)\)\s*\(([^)]+)\)$/i))) {
    return `Кадрирование: ${enSubjectToRu(m[1])} (${m[2]}, ${m[3]})`
  }
  if ((m = e.match(/^Tonal grouping:\s*(.+?)\s*\(light\/mid\/dark\)$/i))) {
    return `Тональная группировка: ${enSubjectToRu(m[1])} (светлый / средний / тёмный)`
  }
  if ((m = e.match(/^Production brief:\s*(.+?)\s*\(pipeline-ready\)$/i))) {
    return `Производственный бриф: ${enSubjectToRu(m[1])} (готово к конвейеру)`
  }
  if ((m = e.match(/^Silent storytelling:\s*(.+?)\s*\(no dialogue\)$/i))) {
    return `Немое повествование: ${enSubjectToRu(m[1])} (без диалогов)`
  }
  if ((m = e.match(/^Visual rhythm:\s*(.+?)\s*\(shot alternation\)$/i))) {
    return `Визуальный ритм: ${enSubjectToRu(m[1])} (чередование планов)`
  }
  if ((m = e.match(/^Silhouette:\s*(.+?)\s*\(readability\)$/i))) {
    return `Силуэт: ${enSubjectToRu(m[1])} (читаемость)`
  }
  if ((m = e.match(/^Visual metaphor:\s*(.+?)\s*\(symbolism\)$/i))) {
    return `Визуальная метафора: ${enSubjectToRu(m[1])} (символизм)`
  }

  // Genitive-after-colon fixes when EN uses plain subject
  if (/:\s+[а-яё]+(ого|его|ей|ых)\b/i.test(ru) && e.includes(':')) {
    const parts = e.split(':')
    if (parts.length >= 2) {
      const head = parts[0].trim()
      const tail = parts.slice(1).join(':').trim()
      const headRu = {
        'Secondary effect': 'Вторичный эффект',
        'Color gradient': 'Цветовой градиент',
        'Cinematic effect': 'Кинематографичный эффект',
        'Effect on brief': 'Эффект по заданию',
        'Final FX frame': 'Финальный кадр эффектов',
      }[head]
      if (headRu) {
        const sub = enSubjectToRu(tail.replace(/\s*\([^)]*\)\s*/g, ' ').trim())
        const paren = [...tail.matchAll(/\(([^)]+)\)/g)].map((x) => x[1]).join(', ')
        return paren ? `${headRu}: ${sub} (${paren})` : `${headRu}: ${sub}`
      }
    }
  }

  return ru
}

let changed = 0
for (const file of FILES) {
  const fp = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const q of quests) {
    const next = rewriteRuFromEn(q.title?.en, q.title?.ru)
    if (next && next !== q.title.ru) {
      q.title.ru = next
      changed++
    }
  }
  fs.writeFileSync(fp, JSON.stringify(quests, null, 2) + '\n', 'utf8')
}

console.log(`Rewrote ${changed} Russian quest titles.`)
