import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { translations, type Translations, type Language, type LocalizedString } from './translations'

interface I18nContextType {
  t: Translations
  language: Language
  setLanguage: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

const translationCache = new Map<Language, Translations>()

export function createTranslationFallback(lang: Language): Translations {
  const cached = translationCache.get(lang)
  if (cached) return cached

  const current = translations[lang]
  const fallback = translations.en
  if (lang === 'en') {
    translationCache.set(lang, current)
    return current
  }

  const deepMerge = (obj: Record<string, unknown>, fallbackObj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...obj }
    for (const key of Object.keys(fallbackObj)) {
      const val = obj[key]
      const fallbackVal = fallbackObj[key]
      if (val === undefined || val === '') {
        result[key] = fallbackVal
      } else if (val != null && fallbackVal != null && typeof val === 'object' && typeof fallbackVal === 'object') {
        result[key] = deepMerge(val as Record<string, unknown>, fallbackVal as Record<string, unknown>)
      }
    }
    return result
  }
  const merged = deepMerge(current as unknown as Record<string, unknown>, fallback as unknown as Record<string, unknown>) as unknown as Translations
  translationCache.set(lang, merged)
  return merged
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useUIStore((state) => state.settings.language || 'en')
  const setSettings = useUIStore((state) => state.setSettings)
  const t = useMemo(() => createTranslationFallback(language), [language])

  const setLanguage = (lang: Language) => {
    setSettings({ language: lang })
  }

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

/** Read current language + merged translations outside React render. */
export function getI18nFromStore(): { language: Language; t: Translations } {
  const language = (useUIStore.getState().settings.language || 'en') as Language
  return { language, t: createTranslationFallback(language) }
}

export function getCategoryLabel(category: string, lang: Language): string {
  const merged = createTranslationFallback(lang)
  return merged.categories[category as keyof typeof merged.categories] || category
}

export function getDifficultyLabel(difficulty: string, lang: Language): string {
  const merged = createTranslationFallback(lang)
  return merged.difficulty[difficulty as keyof typeof merged.difficulty] || difficulty
}

export function getMediumLabel(medium: string, lang: Language): string {
  const map: Record<string, keyof Translations['quests']> = {
    traditional: 'mediumTraditional',
    digital: 'mediumDigital',
    both: 'mediumBoth',
  }
  const key = map[medium]
  if (!key) return medium
  return translations[lang].quests[key] || translations.en.quests[key] || medium
}

function resolveLocalizedField(record: LocalizedString, lang: Language): string {
  const direct = record[lang]?.trim()
  if (direct) return direct
  if (lang === 'zh-tw') return (record.zh?.trim() || record.en?.trim() || '')
  if (lang === 'zh') return (record['zh-tw']?.trim() || record.en?.trim() || '')
  return (record.en?.trim() || '')
}

export function getQuestTitle(title: LocalizedString, lang: Language): string {
  const raw = resolveLocalizedField(title, lang)
  if (!raw) return raw

  const stripTrailingMeta = (s: string): string => {
    return s.replace(
      /\s*[（(]\s*(?:\d+\s*[-–—~]\s*\d+\s*(?:сек|sec|秒|초|秒)|\d+\s*(?:сек|sec|秒|초)|\d+\s*(?:минут(?:а|ы)?|min|分钟|分|분)|\d+\s*(?:час(?:а|ов)?|hour|小时|時間|시간)s?|\d+\s*(?:голов|heads|头|頭)|\d+)\s*[)）]\s*$/i,
      '',
    )
  }

  const normalizeByPrefix = (s: string): string => {
    if (lang === 'ru') {
      const ruMap: Array<[RegExp, string]> = [
        [/^Композиция\s*[—-]\s*/i, 'Нарисовать миниатюры композиции: '],
        [/^Силуэты\s*[—-]\s*/i, 'Нарисовать силуэты: '],
        [/^План шота\s*[—-]\s*/i, 'Составить план шота: '],
        [/^Рил\s*[—-]\s*/i, 'Собрать рил: '],
        [/^Цифровой жест:\s*/i, 'Сделать цифровые жесты: '],
        [/^Сетка пропорций:\s*/i, 'Построить сетку пропорций: '],
      ]
      for (const [re, replacement] of ruMap) {
        if (re.test(s)) return s.replace(re, replacement).trim()
      }
      return s
    }

    const enMap: Array<[RegExp, string]> = [
      [/^Composition thumbnails\s*[—-]\s*/i, 'Draw composition thumbnails: '],
      [/^Silhouette lineup\s*[—-]\s*/i, 'Draw silhouettes: '],
      [/^Efficiency shot plan\s*[—-]\s*/i, 'Plan a shot: '],
      [/^Reel checklist\s*[—-]\s*/i, 'Assemble reel: '],
      [/^Digital gesture:\s*/i, 'Draw digital gestures: '],
      [/^Proportions grid:\s*/i, 'Build a proportions grid: '],
    ]
    for (const [re, replacement] of enMap) {
      if (re.test(s)) return s.replace(re, replacement).trim()
    }
    return s
  }

  return normalizeByPrefix(stripTrailingMeta(raw))
}

export function getQuestDescription(description: LocalizedString, lang: Language): string {
  return resolveLocalizedField(description, lang) || description.en
}

/** Skill tree node / achievement title with EN fallback. */
export function getLocalizedTitle(title: LocalizedString, lang: Language): string {
  return resolveLocalizedField(title, lang)
}

/** Skill tree node / achievement description with EN fallback. */
export function getLocalizedDescription(
  description: LocalizedString,
  lang: Language,
): string {
  return resolveLocalizedField(description, lang)
}
