/**
 * Batch-translate quest/content strings and UI locale from English.
 * Uses a local cache (scripts/locale-cache.json) for resume.
 *
 * Usage:
 *   npx tsx scripts/generate-cjk-locales.ts --ui
 *   npx tsx scripts/generate-cjk-locales.ts --quests
 *   npx tsx scripts/generate-cjk-locales.ts --data   # achievements, skillTree, hints
 *   npx tsx scripts/generate-cjk-locales.ts --data --force-cjk  # re-translate zh/ja/ko
 *   npx tsx scripts/generate-cjk-locales.ts --data --from-ru --force-cjk  # translate from RU (better art terms)
 *   npx tsx scripts/generate-cjk-locales.ts --data --glossary-only  # apply art-data-glossary.json only
 *   npx tsx scripts/generate-cjk-locales.ts --all
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Language } from '../src/renderer/i18n/languages.ts'
import { TRANSLATE_TARGET } from '../src/renderer/i18n/languages.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_PATH = path.join(__dirname, 'locale-cache.json')
const GLOSSARY_PATH = path.join(__dirname, 'art-data-glossary.json')
const DATA_DIR = path.join(ROOT, 'src/renderer/data')
const QUEST_TARGET_LANGS: Exclude<Language, 'en'>[] = ['zh', 'ja', 'ko']

const QUEST_FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

const DELAY_MS = 40
const POOL_SIZE = 6

type Cache = Record<string, Partial<Record<Language, string>>>
type Glossary = Record<string, Partial<Record<'zh' | 'ja' | 'ko', string>>>

async function loadGlossary(): Promise<Glossary> {
  try {
    const raw = JSON.parse(await fs.readFile(GLOSSARY_PATH, 'utf8')) as { entries?: Glossary }
    return raw.entries ?? {}
  } catch {
    return {}
  }
}

function applyGlossary(en: string, lang: 'zh' | 'ja' | 'ko', translated: string, glossary: Glossary): string {
  return glossary[en]?.[lang] ?? translated
}

async function loadCache(): Promise<Cache> {
  try {
    return JSON.parse(await fs.readFile(CACHE_PATH, 'utf8')) as Cache
  } catch {
    return {}
  }
}

async function saveCache(cache: Cache): Promise<void> {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function googleTranslateOne(text: string, target: string, sourceLang = 'en'): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return text
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(target)}&dt=t&q=` +
    encodeURIComponent(trimmed)
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ArtQuest-locale-script/1.0' } })
      if (res.status === 429 || res.status >= 500) {
        await sleep(400 * (attempt + 1))
        continue
      }
      if (!res.ok) throw new Error(`translate HTTP ${res.status}`)
      const data = (await res.json()) as [Array<[string]> | null, unknown]
      const seg = data?.[0]
      if (!seg) return trimmed
      return seg.map((p) => p[0]).join('')
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      await sleep(400 * (attempt + 1))
    }
  }
  throw lastErr ?? new Error('translate failed')
}

async function mapPool<T>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++
      await fn(items[i]!, i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
}

function cacheKey(text: string, sourceLang: string): string {
  return sourceLang === 'en' ? text : `${sourceLang}:${text}`
}

async function translateCached(
  cache: Cache,
  text: string,
  lang: Exclude<Language, 'en'>,
  sourceLang = 'en',
): Promise<string> {
  const key = cacheKey(text, sourceLang)
  if (!cache[key]) cache[key] = {}
  if (cache[key][lang]) return cache[key][lang]!
  const tl = TRANSLATE_TARGET[lang]
  const translated = await googleTranslateOne(text, tl, sourceLang)
  cache[key][lang] = translated ?? text
  await sleep(DELAY_MS)
  return cache[key][lang]!
}

async function translateCachedPool(
  cache: Cache,
  texts: string[],
  lang: Exclude<Language, 'en'>,
  onProgress?: (done: number, total: number) => void,
  sourceLang = 'en',
): Promise<void> {
  const pending = texts.filter((t) => t.trim() && !cache[cacheKey(t, sourceLang)]?.[lang])
  if (pending.length === 0) return
  let done = 0
  await mapPool(pending, POOL_SIZE, async (text) => {
    await translateCached(cache, text, lang, sourceLang)
    done++
    if (done % 100 === 0 || done === pending.length) onProgress?.(done, pending.length)
  })
}

function resolveCjk(
  cache: Cache,
  sourceText: string,
  enKey: string,
  lang: 'zh' | 'ja' | 'ko',
  glossary: Glossary,
  sourceLang: string,
  fallback: string,
): string {
  const key = cacheKey(sourceText, sourceLang)
  const translated = cache[key]?.[lang] ?? fallback
  return applyGlossary(enKey, lang, translated, glossary)
}

const MULTI_LANG_RECORD_RE =
  /\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*,\s*zh:\s*'((?:\\'|[^'])*)'\s*,\s*ja:\s*'((?:\\'|[^'])*)'\s*,\s*ko:\s*'((?:\\'|[^'])*)'\s*\}/g

function unescapeTsString(s: string): string {
  return s.replace(/\\'/g, "'")
}

function escapeTsString(s: string): string {
  return s.replace(/'/g, "\\'")
}

function needsCjkField(record: Record<string, string>, lang: Language, forceCjk: boolean): boolean {
  const en = record.en?.trim()
  if (!en || lang === 'en' || lang === 'ru') return false
  if (forceCjk) return true
  const current = record[lang]?.trim()
  return !current || current === en
}

async function processQuests(cache: Cache): Promise<void> {
  const langs: Exclude<Language, 'en'>[] = ['zh', 'ja', 'ko']
  const unique = new Set<string>()

  for (const file of QUEST_FILES) {
    const quests = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8')) as Array<{
      title: Record<string, string>
      description: Record<string, string>
      microChallenges?: Array<{ instruction: Record<string, string> }>
    }>
    for (const quest of quests) {
      const enTitle = quest.title.en?.trim()
      const enDesc = quest.description.en?.trim()
      if (enTitle) unique.add(enTitle)
      if (enDesc) unique.add(enDesc)
      for (const mc of quest.microChallenges ?? []) {
        const t = mc.instruction.en?.trim()
        if (t) unique.add(t)
      }
    }
  }

  const list = [...unique]
  console.log(`Translating ${list.length} unique quest strings × ${langs.length} languages (pool=${POOL_SIZE})...`)
  for (const lang of langs) {
    const missing = list.filter((t) => !cache[t]?.[lang])
    console.log(`  ${lang}: ${missing.length} pending`)
    await translateCachedPool(cache, missing, lang, (done, total) => {
      if (done % 200 === 0 || done === total) console.log(`    ${lang}: ${done}/${total}`)
    })
    await saveCache(cache)
  }

  for (const file of QUEST_FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Array<{
      title: Record<string, string>
      description: Record<string, string>
      microChallenges?: Array<{ instruction: Record<string, string> }>
    }>
    for (const quest of quests) {
      for (const record of [quest.title, quest.description, ...(quest.microChallenges ?? []).map((m) => m.instruction)]) {
        const en = record.en?.trim()
        if (!en) continue
        for (const lang of langs) {
          record[lang] = cache[en]?.[lang] ?? record[lang] ?? en
        }
      }
    }
    await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    console.log(`Wrote ${file}`)
  }
  console.log('Quest pass done')
}

async function processAchievements(
  cache: Cache,
  forceCjk: boolean,
  fromRu: boolean,
  glossary: Glossary,
  glossaryOnly: boolean,
): Promise<void> {
  const filePath = path.join(DATA_DIR, 'achievements.json')
  const items = JSON.parse(await fs.readFile(filePath, 'utf8')) as Array<{
    title: Record<string, string>
    description: Record<string, string>
  }>
  const sourceLang = fromRu ? 'ru' : 'en'
  const unique = new Map<string, string>()
  for (const item of items) {
    for (const field of [item.title, item.description]) {
      const en = field.en?.trim()
      if (!en) continue
      const source = (fromRu ? field.ru : field.en)?.trim()
      if (!source) continue
      if (!glossaryOnly && (forceCjk || QUEST_TARGET_LANGS.some((lang) => needsCjkField(field, lang, false)))) {
        unique.set(source, en)
      }
    }
  }
  const list = [...unique.keys()]
  if (!glossaryOnly) {
    console.log(
      `achievements: ${list.length} unique ${sourceLang.toUpperCase()} strings × ${QUEST_TARGET_LANGS.length} langs`,
    )
    for (const lang of QUEST_TARGET_LANGS) {
      await translateCachedPool(
        cache,
        list,
        lang,
        (done, total) => {
          if (done % 50 === 0 || done === total) console.log(`  achievements ${lang}: ${done}/${total}`)
        },
        sourceLang,
      )
      await saveCache(cache)
    }
  }
  for (const item of items) {
    for (const field of [item.title, item.description]) {
      const en = field.en?.trim()
      if (!en) continue
      const source = (fromRu ? field.ru : field.en)?.trim() ?? en
      for (const lang of QUEST_TARGET_LANGS) {
        if (glossaryOnly || needsCjkField(field, lang, forceCjk)) {
          field[lang] = resolveCjk(cache, source, en, lang, glossary, sourceLang, field[lang] ?? en)
        }
      }
    }
  }
  await fs.writeFile(filePath, JSON.stringify(items, null, 2) + '\n', 'utf8')
  console.log('Wrote achievements.json')
}

async function processSkillTree(
  cache: Cache,
  forceCjk: boolean,
  fromRu: boolean,
  glossary: Glossary,
  glossaryOnly: boolean,
): Promise<void> {
  const filePath = path.join(DATA_DIR, 'skillTree.ts')
  let source = await fs.readFile(filePath, 'utf8')
  const sourceLang = fromRu ? 'ru' : 'en'
  const unique = new Map<string, string>()
  const re = new RegExp(MULTI_LANG_RECORD_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const en = unescapeTsString(m[1])
    const ru = unescapeTsString(m[2])
    const zh = unescapeTsString(m[3])
    const sourceText = (fromRu ? ru : en).trim()
    if (!sourceText) continue
    if (!glossaryOnly && (forceCjk || zh === en)) unique.set(sourceText, en)
  }
  const list = [...unique.keys()]
  if (!glossaryOnly) {
    console.log(`skillTree: ${list.length} unique ${sourceLang.toUpperCase()} strings × ${QUEST_TARGET_LANGS.length} langs`)
    for (const lang of QUEST_TARGET_LANGS) {
      await translateCachedPool(
        cache,
        list,
        lang,
        (done, total) => {
          if (done % 40 === 0 || done === total) console.log(`  skillTree ${lang}: ${done}/${total}`)
        },
        sourceLang,
      )
      await saveCache(cache)
    }
  }
  source = source.replace(
    new RegExp(MULTI_LANG_RECORD_RE.source, 'g'),
    (_full, enRaw: string, ruRaw: string, zhRaw: string, jaRaw: string, koRaw: string) => {
      const en = unescapeTsString(enRaw)
      const ru = unescapeTsString(ruRaw)
      const sourceText = (fromRu ? ru : en).trim()
      const currentByLang = {
        zh: unescapeTsString(zhRaw),
        ja: unescapeTsString(jaRaw),
        ko: unescapeTsString(koRaw),
      }
      const parts = [`en: '${enRaw}'`, `ru: '${ruRaw}'`]
      for (const lang of QUEST_TARGET_LANGS) {
        const current = currentByLang[lang]
        if (!glossaryOnly && !forceCjk && current && current !== en) {
          parts.push(`${lang}: '${escapeTsString(applyGlossary(en, lang, current, glossary))}'`)
        } else {
          const tr = resolveCjk(cache, sourceText, en, lang, glossary, sourceLang, current ?? en)
          parts.push(`${lang}: '${escapeTsString(tr)}'`)
        }
      }
      return `{ ${parts.join(', ')} }`
    },
  )
  await fs.writeFile(filePath, source, 'utf8')
  console.log('Wrote skillTree.ts')
}

function patchRecordLiterals(source: string, langs: Exclude<Language, 'en'>[]): string {
  return source.replace(
    /\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*\}/g,
    (_m, en: string, ru: string) => {
      const parts = [`en: '${en}'`, `ru: '${ru}'`]
      for (const lang of langs) {
        if (lang === 'ru') continue
        const cached = `__CACHE__${en}__${lang}__`
        parts.push(`${lang}: '${cached}'`)
      }
      return `{ ${parts.join(', ')} }`
    },
  )
}

async function processTsFile(
  cache: Cache,
  relPath: string,
  langs: Exclude<Language, 'en'>[] = ['zh', 'ja', 'ko'],
): Promise<void> {
  const filePath = path.join(ROOT, relPath)
  let source = await fs.readFile(filePath, 'utf8')
  const enStrings = new Set<string>()
  const re = /\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    enStrings.add(m[1].replace(/\\'/g, "'"))
  }
  const replacements = new Map<string, string>()
  for (const en of enStrings) {
    for (const lang of langs) {
      const translated = await translateCached(cache, en, lang)
      replacements.set(`__CACHE__${en}__${lang}__`, translated.replace(/'/g, "\\'"))
    }
  }
  let patched = patchRecordLiterals(source, langs)
  for (const [token, value] of replacements) {
    patched = patched.split(token).join(value)
  }
  await fs.writeFile(filePath, patched, 'utf8')
  console.log(`Patched ${relPath}`)
}

async function processUi(cache: Cache): Promise<void> {
  const { translations } = await import('../src/renderer/i18n/translations.ts')
  const en = translations.en as Record<string, unknown>
  await fs.mkdir(path.join(ROOT, 'src/renderer/i18n/locales'), { recursive: true })

  const uiStrings = [...new Set(collectStrings(en))]
  console.log(`UI: ${uiStrings.length} unique strings`)
  for (const lang of ['zh', 'ja', 'ko'] as const) {
    await translateCachedPool(cache, uiStrings, lang, (done, total) => {
      if (done % 80 === 0 || done === total) console.log(`  UI ${lang}: ${done}/${total}`)
    })
    await saveCache(cache)
    const locale: Record<string, unknown> = {}
    for (const [section, val] of Object.entries(en)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        locale[section] = await walkSection(val as Record<string, unknown>, lang, cache)
      } else {
        locale[section] = val
      }
    }
    const outPath = path.join(ROOT, `src/renderer/i18n/locales/${lang}.ts`)
    const body = `import type { Translations } from '../translations'\n\nexport const ${lang} = ${JSON.stringify(locale, null, 2)} as Translations\n`
    await fs.writeFile(outPath, body, 'utf8')
    console.log(`Wrote locales/${lang}.ts`)
    await saveCache(cache)
  }
}

function collectStrings(obj: Record<string, unknown>, out: string[] = []): string[] {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string') out.push(val)
    else if (val && typeof val === 'object' && !Array.isArray(val)) collectStrings(val as Record<string, unknown>, out)
  }
  return out
}

async function walkSection(
  obj: Record<string, unknown>,
  lang: 'zh' | 'ja' | 'ko',
  cache: Cache,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      if (!cache[val]?.[lang]) await translateCached(cache, val, lang)
      out[key] = cache[val]?.[lang] ?? val
      continue
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = await walkSection(val as Record<string, unknown>, lang, cache)
      continue
    }
    out[key] = val
  }
  return out
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const args = new Set(argv)
  const all = args.has('--all') || (args.size === 0 && !argv.includes('--data'))
  const forceCjk = args.has('--force-cjk')
  const fromRu = args.has('--from-ru')
  const glossaryOnly = args.has('--glossary-only')
  const cache = await loadCache()
  const glossary = await loadGlossary()

  if (all || args.has('--quests')) await processQuests(cache)
  if (all || args.has('--data')) {
    await processAchievements(cache, forceCjk, fromRu, glossary, glossaryOnly)
    await processSkillTree(cache, forceCjk, fromRu, glossary, glossaryOnly)
    if (!glossaryOnly) {
      await processTsFile(cache, 'src/renderer/data/questReferences.ts')
      await processTsFile(cache, 'src/renderer/utils/contextualHints.ts')
    }
  }
  if (all || args.has('--ui')) await processUi(cache)

  await saveCache(cache)
  console.log('Cache entries:', Object.keys(cache).length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
