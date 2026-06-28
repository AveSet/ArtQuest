import fs from 'node:fs'

const cache = JSON.parse(fs.readFileSync('scripts/locale-cache.json', 'utf8'))
const p = 'src/renderer/data/achievements.json'
const items = JSON.parse(fs.readFileSync(p, 'utf8'))
for (const item of items) {
  for (const field of ['title', 'description']) {
    const en = item[field].en
    if (!en) continue
    item[field].zh = cache[en]?.zh ?? item[field].zh ?? en
    item[field].ja = cache[en]?.ja ?? item[field].ja ?? en
    item[field].ko = cache[en]?.ko ?? item[field].ko ?? en
  }
}
fs.writeFileSync(p, JSON.stringify(items, null, 2) + '\n')
console.log('achievements patched', items.length)
