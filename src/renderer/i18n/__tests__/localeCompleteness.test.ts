import { describe, expect, it } from 'vitest'
import { translations } from '../translations'
import { LANGUAGES } from '../languages'

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

const enKeys = Object.keys(flatten(translations.en)).sort()

/** Keys intentionally empty in every locale (icon-only dismiss). */
const ALLOWED_EMPTY = new Set(['rewards.dismiss'])

describe('locale completeness', () => {
  for (const lang of LANGUAGES) {
    it(`${lang} has every UI key from English`, () => {
      const flat = flatten(translations[lang])
      const missing = enKeys.filter((k) => flat[k] === undefined)
      expect(missing, `missing keys in ${lang}`).toEqual([])
    })

    it(`${lang} has no unexpected empty strings`, () => {
      const flat = flatten(translations[lang])
      const empty = enKeys.filter((k) => flat[k] === '' && !ALLOWED_EMPTY.has(k))
      expect(empty, `empty keys in ${lang}`).toEqual([])
    })
  }
})
