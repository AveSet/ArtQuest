import fs from 'fs'
import path from 'path'

const DATA_DIR = 'src/renderer/data'
const FILES = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))

const latinInRu = []
const enIssues = []
const ruIssues = []
const sameAsEn = []

const patterns = {
  ruTrunc: /\b(рис\.|этюд\.|реф\.|мин\.|см\.|т\.д\.|др\.)\b/gi,
  enTrunc: /\b(ref\.|min\.|etc\.|e\.g\.|i\.e\.)\b/gi,
  doubleSpace: /  +/,
  ruBad: /\b(для для|на на|из из|с с |в в |к к )\b/i,
  enBad: /\b(the the|a a )\b/i,
  colonSpace: /:\S/,
}

for (const file of FILES) {
  const quests = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
  for (const q of quests) {
    for (const lang of ['en', 'ru']) {
      for (const field of ['title', 'description']) {
        const text = q[field]?.[lang]
        if (!text) continue
        if (lang === 'ru' && /[A-Za-z]{4,}/.test(text)) {
          latinInRu.push({ id: q.id, file, field, text: text.slice(0, 100) })
        }
        if (lang === 'en' && patterns.enTrunc.test(text)) {
          enIssues.push({ id: q.id, file, field, text })
        }
        if (lang === 'ru' && patterns.ruTrunc.test(text)) {
          ruIssues.push({ id: q.id, file, field, text })
        }
        if (patterns.ruBad.test(text) || patterns.enBad.test(text)) {
          ruIssues.push({ id: q.id, file, field, issue: 'duplicate_word', text })
        }
      }
    }
    if (q.title?.ru === q.title?.en) sameAsEn.push(q.id)
  }
}

console.log('latin in ru:', latinInRu.length)
console.log(latinInRu.slice(0, 20))
console.log('ru issues:', ruIssues.length, ruIssues.slice(0, 10))
console.log('same title ru=en:', sameAsEn.length)
