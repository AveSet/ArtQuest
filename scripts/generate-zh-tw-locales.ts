/**
 * Add Traditional Chinese (zh-tw) strings derived from Simplified Chinese (zh).
 * Usage: npx tsx scripts/generate-zh-tw-locales.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// @ts-expect-error opencc-js has no types
import * as OpenCC from 'opencc-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src/renderer/data')
const LOCALES_DIR = path.join(ROOT, 'src/renderer/i18n/locales')

const converter = OpenCC.Converter({ from: 'cn', to: 'tw' })

function toTraditional(text: string): string {
  if (!text?.trim()) return text
  return converter(text)
}

function addZhTwToRecord(record: Record<string, string>): boolean {
  if (!record.zh) return false
  const next = toTraditional(record.zh)
  if (record['zh-tw'] === next) return false
  record['zh-tw'] = next
  return true
}

function walkLocalized(obj: unknown): number {
  let n = 0
  if (!obj || typeof obj !== 'object') return n
  if (Array.isArray(obj)) {
    for (const item of obj) n += walkLocalized(item)
    return n
  }
  const rec = obj as Record<string, unknown>
  if (typeof rec.en === 'string' && typeof rec.zh === 'string') {
    if (addZhTwToRecord(rec as Record<string, string>)) n++
    return n
  }
  for (const value of Object.values(rec)) {
    n += walkLocalized(value)
  }
  return n
}

async function patchJsonFile(filePath: string): Promise<number> {
  const raw = await fs.readFile(filePath, 'utf8')
  const data = JSON.parse(raw) as unknown
  const n = walkLocalized(data)
  if (n > 0) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  }
  return n
}

async function patchSkillTree(): Promise<number> {
  const filePath = path.join(DATA_DIR, 'skillTree.ts')
  let content = await fs.readFile(filePath, 'utf8')
  let n = 0
  const re = /(zh: '((?:\\'|[^'])*)')(?![^}]*'zh-tw':)/g
  content = content.replace(re, (_full, zhPart: string, zhValue: string) => {
    const unescaped = zhValue.replace(/\\'/g, "'")
    const tw = toTraditional(unescaped).replace(/'/g, "\\'")
    n++
    return `${zhPart}, 'zh-tw': '${tw}'`
  })
  if (n > 0) await fs.writeFile(filePath, content, 'utf8')
  return n
}

async function patchZhLocale(): Promise<void> {
  const zhPath = path.join(LOCALES_DIR, 'zh.ts')
  const zhTwPath = path.join(LOCALES_DIR, 'zh-tw.ts')
  const raw = await fs.readFile(zhPath, 'utf8')
  const start = raw.indexOf('export const zh = ')
  const body = raw
    .slice(start + 'export const zh = '.length)
    .replace(/\s*as\s+Translations\s*;?\s*$/, '')
  const zhObj = JSON.parse(body) as Record<string, unknown>

  function convertNode(node: unknown): unknown {
    if (typeof node === 'string') return toTraditional(node)
    if (Array.isArray(node)) return node.map(convertNode)
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(node)) out[k] = convertNode(v)
      return out
    }
    return node
  }

  const zhTw = convertNode(zhObj)
  const out = `import type { Translations } from '../translations'\n\nexport const zhTw: Translations = ${JSON.stringify(zhTw, null, 2)} as Translations\n`
  await fs.writeFile(zhTwPath, out, 'utf8')
}

async function main(): Promise<void> {
  const questFiles = (await fs.readdir(DATA_DIR)).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))
  let total = 0
  total += await patchSkillTree()
  console.log(`skillTree.ts: ${total} zh-tw fields`)
  total = await patchJsonFile(path.join(DATA_DIR, 'achievements.json'))
  console.log(`achievements.json: ${total} records`)
  for (const file of questFiles) {
    const n = await patchJsonFile(path.join(DATA_DIR, file))
    console.log(`${file}: ${n} records`)
    total += n
  }
  await patchZhLocale()
  console.log('locales/zh-tw.ts generated')
  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
