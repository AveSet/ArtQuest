import fs from 'fs'
import path from 'path'

const DATA_DIR = 'src/renderer/data'
const FILES = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))

const TAIL_MAP = [
  [/Work without using undo\.?$/i, 'Без отмены действий.'],
  [/Use no more than five colors\.?$/i, 'Не больше пяти цветов.'],
  [/Five colors max\.?$/i, 'Не больше пяти цветов.'],
]

let changed = 0
for (const file of FILES) {
  const fp = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const q of quests) {
    const en = q.description?.en?.trim()
    if (!en) continue
    for (const [re, ruTail] of TAIL_MAP) {
      if (!re.test(en)) continue
      const base = q.description.ru?.replace(/\s*\.?\s*пять проходов анимации\s*\.?$/i, '').trim()
      const next = `${base}. ${ruTail}`.replace(/\.\s*\./g, '.')
      if (q.description.ru !== next) {
        q.description.ru = next
        changed++
      }
      break
    }
  }
  fs.writeFileSync(fp, JSON.stringify(quests, null, 2) + '\n', 'utf8')
}
console.log('Fixed', changed, 'description tails')
