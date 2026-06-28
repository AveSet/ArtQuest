import fs from 'node:fs'
import path from 'node:path'

const cache = JSON.parse(fs.readFileSync('scripts/locale-cache.json', 'utf8'))
const file = 'src/renderer/data/skillTree.ts'
let src = fs.readFileSync(file, 'utf8')

src = src.replace(/\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*,\s*zh:\s*'((?:\\'|[^'])*)'\s*,\s*ja:\s*'((?:\\'|[^'])*)'\s*,\s*ko:\s*'((?:\\'|[^'])*)'\s*\}/g, (m, en, ru) => {
  const zh = cache[en]?.zh?.replace(/'/g, "\\'") ?? en
  const ja = cache[en]?.ja?.replace(/'/g, "\\'") ?? en
  const ko = cache[en]?.ko?.replace(/'/g, "\\'") ?? en
  return `{ en: '${en}', ru: '${ru}', zh: '${zh}', ja: '${ja}', ko: '${ko}' }`
})

fs.writeFileSync(file, src)
console.log('skillTree patched from cache')
