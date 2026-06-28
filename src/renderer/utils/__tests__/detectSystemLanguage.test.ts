import { describe, expect, it } from 'vitest'
import { detectSystemLanguage } from '@/utils/detectSystemLanguage'

describe('detectSystemLanguage', () => {
  it('maps Russian locales to ru', () => {
    expect(detectSystemLanguage('ru-RU')).toBe('ru')
    expect(detectSystemLanguage(['ru-RU', 'en-US'])).toBe('ru')
  })

  it('maps CJK locales', () => {
    expect(detectSystemLanguage('zh-CN')).toBe('zh')
    expect(detectSystemLanguage('zh-TW')).toBe('zh-tw')
    expect(detectSystemLanguage('zh-Hant-HK')).toBe('zh-tw')
    expect(detectSystemLanguage('ja-JP')).toBe('ja')
    expect(detectSystemLanguage('ko-KR')).toBe('ko')
  })

  it('defaults to en for other locales', () => {
    expect(detectSystemLanguage('de-DE')).toBe('en')
    expect(detectSystemLanguage('en-GB')).toBe('en')
  })
})
