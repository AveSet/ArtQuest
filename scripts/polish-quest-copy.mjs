/**
 * Polish quest title/description copy in EN and RU:
 * full words, grammar, consistent terminology.
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

/** Longest-first replacement pairs per language field */
const RULES = {
  ru: {
    title: [
      ['воды с брызгами', 'вода с брызгами'],
      ['Studio style analysis:', 'Разбор студийного стиля:'],
      ['Matte painting:', 'Матовая живопись:'],
      ['Spritesheet магического удара: impact и искры', 'Лист спрайтов магического удара: удар и искры'],
      ['Плоские цвета: растения', 'Плоская заливка: растения'],
      ['Создание кастомной кисти: натюрморта для рендера', 'Создание кисти для натюрморта: финальный рендер'],
      ['Сложная композиция: архитектуры', 'Сложная композиция: архитектура'],
      ['Спидпейнт:', 'Быстрая заливка:'],
      ['Лайнарт:', 'Линейный рисунок:'],
      ['лайнарт:', 'линейный рисунок:'],
      [': натюрморта', ': натюрморт'],
      [': архитектуры', ': архитектура'],
      [': интерьера', ': интерьер'],
      [': сферы', ': сфера'],
      [': цилиндра', ': цилиндр'],
      [': куба', ': куб'],
      [': атмосферы', ': атмосфера'],
      [': огня', ': огонь'],
      [': дыма', ': дым'],
      [': града', ': град'],
      [': водопада', ': водопад'],
      [': одежды', ': одежда'],
      [': ландшафта', ': ландшафт'],
      [': портрета', ': портрет'],
      [': пейзажа', ': пейзаж'],
      [': одежды', ': одежда'],
      [': фигуры', ': фигура'],
      [': персонажа', ': персонаж'],
      [': лица', ': лицо'],
      [': руки', ': рука'],
      [': животного', ': животное'],

      ['(45 мин)', '(45 минут)'],
      ['(Ufotable/Pixar)', '(студии Ufotable и Pixar)'],
      ['тайминг-чарта', 'диаграмма тайминга'],
      ['спейсинга', 'интервалов движения'],
      ['мастер-стади', 'этюд по работе мастера'],
      ['спидпейнт', 'быстрая заливка'],
      ['лайнарт', 'линейный рисунок'],
      ['оверлей', 'наложение'],
      ['Оверлей', 'Наложение'],
      ['портфолио работа', 'работа для портфолио'],
      ['Готовая портфолио работа', 'Готовая работа для портфолио'],
      ['Выполнение производственного ТЗ', 'Работа по производственному техническому заданию'],
      [': диалога', ': диалог'],
      ['(10-15 сек)', '(10–15 секунд)'],
      ['(проф уровень)', '(профессиональный уровень)'],
      ['для рила', 'для короткого ролика'],
      ['Диалоговая сцена: напильника (рука туда-сюда) (интонация)', 'Диалоговая сцена: лопание пузыря (интонация)'],
      ['(60 кадры)', '(60 кадров)'],
    ],
    description: [
      ['без Ctrl+Z', 'без отмены действий'],
      ['. без ', '. Без '],
      ['. фокус ', '. Сосредоточься '],
      ['Фокус на главное, игнорируй второстепенное', 'Сосредоточься на главном и не отвлекайся на детали'],
      ['Фокус на', 'Сосредоточься на'],
      ['фокус на', 'сосредоточься на'],
      ['кистями и режимы наложения', 'кистями и режимами наложения'],
      ['Контроль непрозрачность', 'Контроль непрозрачности'],
      ['30% непрозрачность', '30% непрозрачности'],
      ['Сделай оверлей референса', 'Сделай наложение референса'],
      ['От референса до композита: тайминг, слои, свет, полировка', 'От референса до композита: тайминг, слои, свет и полировка'],
      ['по ТЗ:', 'по техническому заданию:'],
      ['по ТЗ', 'по техническому заданию'],
      ['хит-эффект', 'эффект удара'],
      ['spritesheet', 'лист спрайтов'],
      ['индустриальным стандартам', 'профессиональным стандартам'],
      ['печати/вебу', 'печати и веба'],
      ['Разбор техник профессионалов: слои, тайминг, стилистика', 'Разбери приёмы профессионалов: слои, тайминг и стилистику'],
      ['Разбор техники, слоёв, тайминга и стилистики профессиональных студий', 'Разбери технику, слои, тайминг и стилистику профессиональных студий'],
      ['Разделение на: ядро, свечение, частицы, дым/пыль', 'Раздели на слои: ядро, свечение, частицы, дым и пыль'],
      ['Интеграция всех навыков в сжатые сроки', 'Собери все навыки в сжатые сроки'],
      ['Быстрый рендер с таймером', 'Быстрая прорисовка по таймеру'],
      ['Профессиональный композитинг', 'Профессиональная сборка кадра'],
      ['Сборка финального кадра', 'Сборка финального кадра'],
    ],
  },
  en: {
    title: [
      ['Still Life for Render', 'Still Life for Final Rendering'],
      ['Custom brush creation:', 'Custom Brush Creation:'],
      ['Flat colors: Plant', 'Flat Color Fill: Plants'],
      ['Flat colors:', 'Flat Color Fill:'],
      ['Complex composition:', 'Complex Composition:'],
      ['Speedpaint:', 'Speed Painting:'],
      ['Line art:', 'Line Art:'],
      ['Final polish & export:', 'Final Polish and Export:'],
      ['Portfolio-ready piece:', 'Portfolio-Ready Piece:'],
      ['Material study:', 'Material Study:'],
      ['Color adjustment:', 'Color Adjustment:'],
      ['Copy reference:', 'Reference Copy:'],
      ['Professional compositing:', 'Professional Compositing:'],
      ['Multi-layer breakdown:', 'Multi-Layer Breakdown:'],
      ['Studio style analysis:', 'Studio Style Analysis:'],
      ['Studio effect copy:', 'Studio Effect Study:'],
      ['Atmospherics', 'Atmospheric Effects'],
      ['timing chart and spacing test', 'Timing Chart and Spacing Test'],
      ['(45 min)', '(45 minutes)'],
      ['(10-15 sec)', '(10–15 seconds)'],
      ['Flat Color Fill: Plant', 'Flat Color Fill: Plants'],
      ['Pantomime acting:', 'Pantomime Acting:'],
      ['filing motion (hand back/forth)', 'hand filing motion (back and forth)'],
      ['Showreel scene:', 'Showreel Scene:'],
    ],
    description: [
      ['Focus on the main, ignore the secondary', 'Focus on the main subject and ignore secondary details'],
      ['Quick render with timer', 'Quick timed rendering session'],
      ['Cleanliness, wholeness, industry standard compliance', 'Polish, visual cohesion, and professional presentation standards'],
      ['Final portfolio piece. Cleanliness, wholeness', 'Final portfolio piece. Polish and visual cohesion'],
      ['Final portfolio work. Cleanliness, wholeness', 'Final portfolio work. Polish and visual cohesion'],
      ['preparation for print/web', 'preparation for print and web'],
      ['streamline/stabilizer', 'streamline and stabilizer brushes'],
      ['Breakdown of technique, layers, timing and stylistics of professional studios', 'Analyze technique, layers, timing, and style of professional studios'],
      ['Breakdown of pro techniques: layers, timing, style', 'Study professional techniques: layers, timing, and style'],
      ['Breakdown of technique, layers, timing and stylistics', 'Analyze technique, layers, timing, and style'],
      ['Render different materials with digital brushes and blend modes. Focus on reflections', 'Render different materials with digital brushes and blend modes. Focus on reflections'],
      ['Split into: core, glow, particles, smoke/dust. Opacity control', 'Separate into layers: core, glow, particles, and smoke or dust. Control opacity'],
      ['Use rule of thirds, leading lines, visual weight. Balance of voids and masses', 'Use the rule of thirds, leading lines, and visual weight. Balance negative space and masses'],
      ['Create a brush for the task (texture, scatter, dynamics). Test on an object', 'Create a brush for the task (texture, scatter, and dynamics). Test it on an object'],
      ['Fill with base colors on separate layers. No shadows or gradients', 'Fill with base colors on separate layers. Do not add shadows or gradients'],
      ['Adjust the palette through adjustment layers. Maintain tonal balance', 'Adjust the palette with adjustment layers. Keep the tonal balance'],
      ['Create clean line art. Use streamline/stabilizer brushes', 'Create clean line art. Use streamline and stabilizer brushes'],
      ['Micro-detailing, sharpening, color grading, preparation for print/web', 'Fine detailing, sharpening, color grading, and preparation for print and web'],
      ['Integration of objects, light, effects, color correction', 'Integrate objects, light, effects, and color correction'],
      ['No undo', 'Work without using undo'],
      ['Sync animation with speech, emotion, and subtext', 'Sync the animation with speech, emotion, and subtext'],
      ['Five colors max', 'Use no more than five colors'],
      ['Professional storyboard: cleanliness, readability, style', 'Professional storyboard: clarity, readability, and style'],
    ],
  },
}

/** Pair EN keyword patterns to corrected RU titles when machine translation drifted */
const EN_RU_TITLE_PAIRS = [
  [/Dialogue scene: popping bubble/i, 'Dialogue scene: Popping Bubble (intonation)', 'Диалоговая сцена: лопание пузыря (интонация)'],
]

function applyRules(text, rules) {
  if (!text) return text
  let out = text
  for (const [from, to] of rules) {
    if (out.includes(from)) out = out.split(from).join(to)
  }
  return out
}

function capitalizeFirst(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

let changed = 0
for (const file of FILES) {
  const fp = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(fp, 'utf8'))
    for (const q of quests) {
    for (const [pattern, enTitle, ruTitle] of EN_RU_TITLE_PAIRS) {
      if (pattern.test(q.title?.en ?? '')) {
        if (q.title.en !== enTitle) {
          q.title.en = enTitle
          changed++
        }
        if (q.title.ru !== ruTitle) {
          q.title.ru = ruTitle
          changed++
        }
      }
    }
    for (const lang of ['ru', 'en']) {
      const titleRules = RULES[lang].title
      const descRules = RULES[lang].description
      if (q.title?.[lang]) {
        const next = applyRules(q.title[lang], titleRules)
        if (next !== q.title[lang]) {
          q.title[lang] = next
          changed++
        }
      }
      if (q.description?.[lang]) {
        let next = applyRules(q.description[lang], descRules)
        if (lang === 'ru' && /^[а-яё]/.test(next)) {
          next = capitalizeFirst(next)
        }
        if (next !== q.description[lang]) {
          q.description[lang] = next
          changed++
        }
      }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(quests, null, 2) + '\n', 'utf8')
}

console.log(`Polished ${changed} quest text fields.`)
