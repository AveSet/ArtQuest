import type { Language } from '@/i18n/translations'

type TitledVideo = {
  titleEn: string
  titleRu: string
  titleZh?: string
  titleJa?: string
  titleKo?: string
}

/** Localized video title with EN fallback for missing CJK fields. */
export function getVideoResourceTitle(resource: TitledVideo, language: Language): string {
  switch (language) {
    case 'ru':
      return resource.titleRu || resource.titleEn
    case 'zh':
      return resource.titleZh || resource.titleEn
    case 'ja':
      return resource.titleJa || resource.titleEn
    case 'ko':
      return resource.titleKo || resource.titleEn
    default:
      return resource.titleEn
  }
}
