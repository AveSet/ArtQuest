import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider, getCategoryLabel, getDifficultyLabel, getQuestTitle, getQuestDescription } from '../'

describe('i18n', () => {
  describe('getCategoryLabel', () => {
    it('returns label for known category', () => {
      expect(getCategoryLabel('drawing', 'en')).toBe('Drawing')
      expect(getCategoryLabel('drawing', 'ru')).toBe('Рисование')
    })

    it('returns the key itself for unknown category', () => {
      expect(getCategoryLabel('unknown_cat', 'en')).toBe('unknown_cat')
    })
  })

  describe('getDifficultyLabel', () => {
    it('returns label for known difficulty', () => {
      expect(getDifficultyLabel('novice', 'en')).toBe('Novice')
      expect(getDifficultyLabel('novice', 'ru')).toBe('Новичок')
    })
  })

  describe('getQuestTitle', () => {
    it('returns title in requested language', () => {
      const title = { en: 'Test Quest', ru: 'Тестовый квест', zh: 'Test Quest', ja: 'Test Quest', ko: 'Test Quest' }
      expect(getQuestTitle(title, 'ru')).toBe('Тестовый квест')
    })

    it('falls back to English', () => {
      const title = { en: 'Test Quest', ru: 'Тестовый квест', zh: 'Test Quest', ja: 'Test Quest', ko: 'Test Quest' }
      expect(getQuestTitle(title, 'fr' as any)).toBe('Test Quest')
    })
  })

  describe('getQuestDescription', () => {
    it('returns description in requested language', () => {
      const desc = { en: 'Test desc', ru: 'Тестовое описание', zh: 'Test desc', ja: 'Test desc', ko: 'Test desc' }
      expect(getQuestDescription(desc, 'ru')).toBe('Тестовое описание')
    })
  })

  describe('I18nProvider', () => {
    it('renders children', () => {
      render(
        <I18nProvider>
          <div>Hello</div>
        </I18nProvider>
      )
      expect(screen.getByText('Hello')).toBeDefined()
    })
  })
})
