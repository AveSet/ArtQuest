import fs from 'node:fs'
import path from 'node:path'

const FILES = [
  'src/renderer/data/skillTree.ts',
  'src/renderer/data/questReferences.ts',
  'src/renderer/utils/contextualHints.ts',
]

const LANGS = ['zh', 'ja', 'ko']

for (const rel of FILES) {
  let c = fs.readFileSync(rel, 'utf8')
  const o = c
  c = c.replace(/\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*\}/g, (m, en, ru) => {
    if (m.includes('zh:')) return m
    return `{ en: '${en}', ru: '${ru}', zh: '${en}', ja: '${en}', ko: '${en}' }`
  })
  c = c.replace(/\{\s*en:\s*\[([\s\S]*?)\]\s*,\s*ru:\s*\[([\s\S]*?)\]\s*\}/g, (m, enArr, ruArr) => {
    if (m.includes('zh:')) return m
    return `{ en: [${enArr}], ru: [${ruArr}], zh: [${enArr}], ja: [${enArr}], ko: [${enArr}] }`
  })
  if (c !== o) {
    fs.writeFileSync(rel, c)
    console.log('patched', rel)
  }
}
