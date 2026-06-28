import fs from 'node:fs'
import path from 'node:path'

let updated = 0
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory() && ent.name !== 'node_modules') walk(p)
    else if (/\.(ts|tsx)$/.test(ent.name)) {
      let c = fs.readFileSync(p, 'utf8')
      const o = c
      c = c.replace(/ as 'en' \| 'ru'/g, '')
      c = c.replace(/lang: 'en' \| 'ru'/g, 'lang: Language')
      c = c.replace(/language: 'en' \| 'ru'/g, 'language: Language')
      if (c !== o) {
        fs.writeFileSync(p, c)
        updated++
        console.log(p)
      }
    }
  }
}
walk(path.join(process.cwd(), 'src'))
console.log('updated', updated)
