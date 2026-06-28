import { translations } from '../src/renderer/i18n/translations'
import type { Language } from '../src/renderer/i18n/languages'

// Re-implement fallback locally to avoid importing React store
function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return out
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out[path] = v
    else if (v && typeof v === 'object') Object.assign(out, flatten(v, path))
  }
  return out
}

function deepMerge(
  obj: Record<string, unknown>,
  fallbackObj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj }
  for (const key of Object.keys(fallbackObj)) {
    const val = obj[key]
    const fallbackVal = fallbackObj[key]
    if (val === undefined || val === '') {
      result[key] = fallbackVal
    } else if (
      val != null &&
      fallbackVal != null &&
      typeof val === 'object' &&
      typeof fallbackVal === 'object'
    ) {
      result[key] = deepMerge(
        val as Record<string, unknown>,
        fallbackVal as Record<string, unknown>,
      )
    }
  }
  return result
}

function mergedTranslations(lang: Language) {
  if (lang === 'en') return translations.en
  return deepMerge(
    translations[lang] as Record<string, unknown>,
    translations.en as Record<string, unknown>,
  )
}

const langs: Language[] = ['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko']
const en = flatten(translations.en)
const enKeys = Object.keys(en).sort()

console.log('=== Raw locale files (before runtime EN fallback) ===\n')
for (const lang of langs) {
  const flat = flatten(translations[lang])
  const missing = enKeys.filter((k) => flat[k] === undefined)
  const empty = enKeys.filter((k) => flat[k] === '')
  console.log(`${lang}: ${Object.keys(flat).length} keys, missing ${missing.length}, empty ${empty.length}`)
  if (missing.length > 0) {
    console.log('  missing:', missing.join(', '))
  }
  if (empty.length > 0) {
    console.log('  empty:', empty.join(', '))
  }
}

console.log('\n=== After runtime fallback merge (what UI actually shows) ===\n')
for (const lang of langs) {
  const flat = flatten(mergedTranslations(lang))
  const missing = enKeys.filter((k) => flat[k] === undefined || flat[k] === '')
  console.log(`${lang}: complete=${missing.length === 0}, gaps=${missing.length}`)
  if (missing.length > 0) console.log('  gaps:', missing.join(', '))
}

console.log('\n=== Keys identical to English (likely untranslated in locale file) ===\n')
for (const lang of ['ru', 'zh', 'zh-tw', 'ja', 'ko'] as Language[]) {
  const flat = flatten(translations[lang])
  const sameAsEn = enKeys.filter((k) => flat[k] === en[k] && en[k].length > 1)
  console.log(`\n${lang} (${sameAsEn.length} keys same as EN):`)
  for (const k of sameAsEn) {
    console.log(`  ${k}: "${en[k]}"`)
  }
}
