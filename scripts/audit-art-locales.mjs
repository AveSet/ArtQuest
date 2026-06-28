import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '..')
const ach = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/renderer/data/achievements.json'), 'utf8'))

const skillSrc = fs.readFileSync(path.join(ROOT, 'src/renderer/data/skillTree.ts'), 'utf8')
const recordRe =
  /\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*,\s*zh:\s*'((?:\\'|[^'])*)'\s*,\s*ja:\s*'((?:\\'|[^'])*)'\s*,\s*ko:\s*'((?:\\'|[^'])*)'\s*\}/g

function unesc(s) {
  return s.replace(/\\'/g, "'")
}

const issues = []

function flag(scope, id, field, lang, type, en, value) {
  issues.push({ scope, id, field, lang, type, en, value })
}

const abbrPatterns = [
  { re: /\bFX\b/, type: 'fx_abbr' },
  { re: /\bXP\b/, type: 'xp_abbr' },
  { re: /\b\d+k\b/i, type: 'k_number_abbr' },
  { re: /&/, type: 'ampersand' },
  { re: /——/, type: 'em_dash_cn' },
  { re: /——/, type: 'em_dash_ko' },
  { re: /\b쿼스트\b/, type: 'quest_romanization_ko' },
  { re: /任务/, type: 'zh_renwu_task' },
  { re: /讲故事/, type: 'zh_storytelling_literal' },
  { re: /影响/, type: 'zh_yingxiang_wrong' },
  { re: /火灾/, type: 'zh_fire_disaster' },
  { re: /ドリル/, type: 'ja_drill_sports' },
  { re: /バリュー/, type: 'ja_value_katakana_only' },
  { re: /モーションインパクト/, type: 'ja_motion_impact_en' },
  { re: /문체/, type: 'ko_munce_writing_style' },
  { re: /재향 군인/, type: 'ko_veteran_military' },
  { re: /관행/, type: 'ko_custom_not_practice' },
]

for (const item of ach) {
  for (const field of ['title', 'description']) {
    const en = item[field].en?.trim()
    for (const lang of ['zh', 'ja', 'ko']) {
      const v = item[field][lang]?.trim() ?? ''
      if (v === en) flag('achievement', item.id, field, lang, 'equals_en', en, v)
      if (/^[\x00-\x7F]+$/.test(v) && !/^\d+$/.test(v)) flag('achievement', item.id, field, lang, 'ascii_only', en, v)
      for (const { re, type } of abbrPatterns) {
        if (re.test(v)) flag('achievement', item.id, field, lang, type, en, v)
      }
    }
  }
}

let m
while ((m = recordRe.exec(skillSrc)) !== null) {
  const en = unesc(m[1])
  const zh = unesc(m[3])
  const ja = unesc(m[4])
  const ko = unesc(m[5])
  const vals = { zh, ja, ko }
  for (const [lang, v] of Object.entries(vals)) {
    if (v === en) flag('skillTree', en.slice(0, 40), 'record', lang, 'equals_en', en, v)
    if (/^[\x00-\x7F]+$/.test(v)) flag('skillTree', en.slice(0, 40), 'record', lang, 'ascii_only', en, v)
    for (const { re, type } of abbrPatterns) {
      if (re.test(v)) flag('skillTree', en.slice(0, 40), 'record', lang, type, en, v)
    }
  }
}

const grouped = new Map()
for (const i of issues) {
  const k = i.type
  grouped.set(k, (grouped.get(k) ?? 0) + 1)
}
console.log('Issue counts by type:')
for (const [k, c] of [...grouped.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${c}`)

console.log('\nSample issues (first 80):')
issues.slice(0, 80).forEach((i) => console.log(`${i.scope}|${i.lang}|${i.type}|${i.en?.slice(0, 50)} => ${i.value?.slice(0, 60)}`))

console.log('\nTotal issues:', issues.length)
fs.writeFileSync(path.join(ROOT, 'scripts/audit-art-locales-report.json'), JSON.stringify(issues, null, 2))
