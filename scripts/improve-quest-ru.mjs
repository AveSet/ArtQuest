/**
 * Batch-improve Russian quest copy: terminology, mixed EN fragments, grammar.
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

const TITLE_REPLACEMENTS = [
  [/Studio style analysis:/gi, 'Разбор студийного стиля:'],
  [/timing chart and spacing test/gi, 'тайминг-чарта и проверки спейсинга'],
  [/timing chart/gi, 'тайминг-чарта'],
  [/spacing test/gi, 'проверка спейсинга'],
  [/Still Life/gi, 'натюрморта'],
  [/for Render/gi, 'для рендера'],
  [/Custom brush creation:/gi, 'Создание кастомной кисти:'],
  [/Flat colors:/gi, 'Плоская заливка:'],
  [/Plant\b/g, 'растения'],
  [/Water Splashes/gi, 'брызги воды'],
  [/Atmospherics/gi, 'атмосфера'],
  [/\bsmoke\b/gi, 'дым'],
  [/\bfire\b/gi, 'огонь'],
  [/Keyframe/gi, 'ключевой кадр'],
  [/Walk cycle/gi, 'цикл ходьбы'],
  [/Run cycle/gi, 'цикл бега'],
  [/Line art/gi, 'лайн-арт'],
  [/Color study/gi, 'цветовой этюд'],
  [/Value study/gi, 'тоновый этюд'],
  [/Gesture drawing/gi, 'жестовый рисунок'],
  [/Thumbnail/gi, 'миниатюра'],
  [/Rough sketch/gi, 'черновой набросок'],
  [/Clean up/gi, 'чистовая обводка'],
  [/Turnaround/gi, 'разворот модели'],
  [/Silhouette/gi, 'силуэт'],
  [/Character design/gi, 'дизайн персонажа'],
  [/Environment design/gi, 'дизайн окружения'],
  [/Storyboard/gi, 'раскадровка'],
  [/Animatic/gi, 'аниматик'],
  [/Lighting study/gi, 'этюд освещения'],
  [/Composition/gi, 'композиция'],
  [/Sketch/gi, 'набросок'],
  [/Render/gi, 'рендер'],
  [/Paint over/gi, 'перерисовка'],
  [/Master study/gi, 'мастер-стади'],
  [/Figure drawing/gi, 'рисунок фигуры'],
  [/Life drawing/gi, 'рисунок с натуры'],
  [/Speedpaint/gi, 'спидпейнт'],
  [/Overlay/gi, 'оверлей'],
  [/Underpainting/gi, 'подмалёвок'],
  [/Grayscale/gi, 'градации серого'],
]

const DESC_REPLACEMENTS = [
  [/on separate layers/gi, 'на отдельных слоях'],
  [/No shadows or gradients/gi, 'Без теней и градиентов'],
  [/Fill with base colors/gi, 'Залей базовыми цветами'],
  [/Create a brush for the task/gi, 'Создай кисть под задачу'],
  [/Test on an object/gi, 'Проверь на объекте'],
  [/texture, scatter, dynamics/gi, 'текстура, разброс, динамика'],
  [/Use reference/gi, 'Используй референс'],
  [/Focus on/gi, 'Сосредоточься на'],
  [/Spend at least/gi, 'Удели минимум'],
  [/minutes on/gi, 'минут на'],
  [/Draw from/gi, 'Рисуй по'],
  [/Study the/gi, 'Изучи'],
  [/Practice/gi, 'Потренируй'],
  [/without reference/gi, 'без референса'],
  [/with reference/gi, 'с референсом'],
  [/layer by layer/gi, 'послойно'],
  [/from imagination/gi, 'из головы'],
  [/from life/gi, 'с натуры'],
  [/black and white/gi, 'в чёрно-белом'],
  [/high contrast/gi, 'с высоким контрастом'],
  [/soft edges/gi, 'мягкие края'],
  [/hard edges/gi, 'жёсткие края'],
]

function applyRules(text, rules) {
  let out = text
  for (const [re, rep] of rules) out = out.replace(re, rep)
  return out
}

let changed = 0
for (const file of FILES) {
  const fp = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const q of quests) {
    if (q.title?.ru) {
      const next = applyRules(q.title.ru, TITLE_REPLACEMENTS)
      if (next !== q.title.ru) {
        q.title.ru = next
        changed++
      }
    }
    if (q.description?.ru) {
      const next = applyRules(q.description.ru, DESC_REPLACEMENTS)
      if (next !== q.description.ru) {
        q.description.ru = next
        changed++
      }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(quests, null, 2) + '\n', 'utf8')
}

console.log(`Updated ${changed} Russian fields across quest JSON files.`)
