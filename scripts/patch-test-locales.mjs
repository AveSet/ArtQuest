import fs from 'node:fs'
import path from 'node:path'

const LANGS = ['zh', 'ja', 'ko']

function patchObjectLiteral(match, en, ru) {
  const parts = [`en: '${en}'`, `ru: '${ru}'`]
  for (const lang of LANGS) {
    if (!match.includes(`${lang}:`)) parts.push(`${lang}: '${en}'`)
  }
  return `{ ${parts.join(', ')} }`
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.test.ts') || ent.name.endsWith('.test.tsx')) {
      let c = fs.readFileSync(p, 'utf8')
      const o = c
      c = c.replace(/\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*\}/g, (m, en, ru) =>
        m.includes('zh:') ? m : patchObjectLiteral(m, en, ru),
      )
      c = c.replace(/\{\s*en:\s*`([^`]+)`\s*,\s*ru:\s*`([^`]+)`\s*\}/g, (m, en, ru) => {
        if (m.includes('zh:')) return m
        return `{ en: \`${en}\`, ru: \`${ru}\`, zh: \`${en}\`, ja: \`${en}\`, ko: \`${en}\` }`
      })
      if (c !== o) fs.writeFileSync(p, c)
    }
  }
}
walk(path.join(process.cwd(), 'src'))
console.log('patched test files')
