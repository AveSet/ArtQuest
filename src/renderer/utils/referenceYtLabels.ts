import { translations, type Language } from '@/i18n/translations'

/** Compact YouTube reference buttons (overlay, quest detail, materials). */
export function getReferenceYoutubeButtonLabels(lang: Language): { long: string; short: string } {
  const quests = translations[lang]?.quests ?? translations.en.quests
  const prefix = 'YT'
  return {
    long: `${prefix} ${quests.referenceYoutubeLong ?? 'Long'}`,
    short: `${prefix} ${quests.referenceYoutubeShort ?? 'Short'}`,
  }
}

/** @deprecated Use getReferenceYoutubeButtonLabels(language).long */
export const REFERENCE_YT_LONG_LABEL = getReferenceYoutubeButtonLabels('ru').long

/** @deprecated Use getReferenceYoutubeButtonLabels(language).short */
export const REFERENCE_YT_SHORT_LABEL = getReferenceYoutubeButtonLabels('ru').short
