import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import QuestSubmitReflection from '../QuestSubmitReflection'
import { translations } from '@/i18n/translations'

const en = translations.en as typeof translations.en

const baseProps = {
  mistakeTags: [] as string[],
  strengthRatings: {},
  language: 'en' as const,
  t: en,
  onDifficultyChange: vi.fn(),
  onMistakeTagToggle: vi.fn(),
  onStrengthRatingChange: vi.fn(),
}

function renderReflection(difficulty: 1 | 2 | 3 | 4 | 5) {
  return render(
    <I18nProvider>
      <QuestSubmitReflection {...baseProps} difficulty={difficulty} />
    </I18nProvider>,
  )
}

describe('QuestSubmitReflection', () => {
  it('always shows difficulty question', () => {
    renderReflection(2)
    expect(screen.getByText('How hard was it?')).toBeDefined()
  })

  it('shows quality block for difficulty 1-3', () => {
    renderReflection(2)
    expect(screen.getByText('Quality check')).toBeDefined()
    expect(screen.getByText('Line confidence')).toBeDefined()
    expect(screen.queryByText('Pick what did not work out. (up to 3)')).toBeNull()
  })

  it('shows mistake tags for difficulty 4-5', () => {
    renderReflection(5)
    expect(screen.getByText('Pick what did not work out. (up to 3)')).toBeDefined()
    expect(screen.getByText('Perspective')).toBeDefined()
    expect(screen.getByText(en.quests.submitMistakeTagsRequired!)).toBeDefined()
    expect(screen.queryByText('Quality check')).toBeNull()
  })

  it('shows hard hint only at difficulty 5', () => {
    const { rerender } = render(
      <I18nProvider>
        <QuestSubmitReflection {...baseProps} difficulty={4} />
      </I18nProvider>,
    )
    expect(screen.queryByText(en.quests.submitMistakeTagsHardHint!)).toBeNull()

    rerender(
      <I18nProvider>
        <QuestSubmitReflection {...baseProps} difficulty={5} />
      </I18nProvider>,
    )
    expect(screen.getByText(en.quests.submitMistakeTagsHardHint!)).toBeDefined()
  })
})
