import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import QuestCard from '../QuestCard'

import type { Quest } from '@/store/models'

const mockQuest: Quest = {
  id: 1,
  code: 'DRW-00001',
  title: { en: 'Perspective Basics', ru: 'Основы перспективы', zh: 'Perspective Basics', ja: 'Perspective Basics', ko: 'Perspective Basics' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'Draw basic perspective', ru: 'Нарисуйте базовую перспективу', zh: 'Draw basic perspective', ja: 'Draw basic perspective', ko: 'Draw basic perspective' },
  xp: 50,
  estimatedTime: 30,
  source: 'Drawabox',
  icon: '🎨',
  color: '#6366f1',
  min_level: 1,
  tags: ['perspective', 'lines'],
  prerequisites: [],
  medium: 'both',
  is_repeatable: true,
  review_after_days: 5,
  streak_bonus: 1.0,
}

const renderCard = (overrides: Partial<Parameters<typeof QuestCard>[0]> = {}) => {
  return render(
    <HashRouter>
      <I18nProvider>
        <QuestCard
          quest={mockQuest}
          language="en"
          onStart={vi.fn()}
          {...overrides}
        />
      </I18nProvider>
    </HashRouter>
  )
}

describe('QuestCard', () => {
  it('renders quest title and description', () => {
    renderCard()
    expect(screen.getByText('Perspective Basics')).toBeDefined()
    expect(screen.getByText('Draw basic perspective')).toBeDefined()
  })

  it('renders difficulty badge', () => {
    renderCard()
    expect(screen.getByText('Novice')).toBeDefined()
  })

  it('renders XP', () => {
    renderCard()
    expect(screen.getByText('50 XP')).toBeDefined()
  })

  it('renders estimated time', () => {
    renderCard()
    expect(screen.getAllByText(/30 min/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders compact quest tags below description', () => {
    renderCard()
    expect(screen.getByText('perspective')).toBeDefined()
    expect(screen.getByText('lines')).toBeDefined()
  })

  it('shows start quest button when onStart is provided', () => {
    const onStart = vi.fn()
    renderCard({ onStart })
    const btn = screen.getByText('Take Quest')
    expect(btn).toBeDefined()
    fireEvent.click(btn)
    expect(onStart).toHaveBeenCalledWith(1, 30)
  })

  it('shows completed status for non-repeatable quests', () => {
    renderCard({ completed: true, quest: { ...mockQuest, is_repeatable: false } })
    expect(screen.getByText('Completed')).toBeDefined()
  })

  it('keeps start button for repeatable quests marked completed', () => {
    renderCard({ completed: true })
    expect(screen.getByText('Take Quest')).toBeDefined()
    expect(screen.queryByText('Completed')).toBeNull()
  })
})
