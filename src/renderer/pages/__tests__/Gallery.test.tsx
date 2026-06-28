import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import Gallery from '../Gallery'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SETTINGS, type Quest } from '@/store/models'

const mockQuest: Quest = {
  id: 7,
  code: 'GAL-7',
  title: { en: 'Gesture Study', ru: 'Жесты', zh: 'Gesture Study', ja: 'Gesture Study', ko: 'Gesture Study' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'Quick poses', ru: 'Быстрые позы', zh: 'Quick poses', ja: 'Quick poses', ko: 'Quick poses' },
  xp: 40,
  estimatedTime: 15,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: ['gesture'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
}

beforeEach(() => {
  ;(window as unknown as { electronAPI?: unknown }).electronAPI = undefined
  useQuestStore.setState({
    quests: [mockQuest],
    completedQuests: [7],
    completedToday: [],
    questCompletionLogs: [],
    questTitleOverrides: {},
    completedWorks: [
      {
        id: 'work-1',
        questId: 7,
        imageUrl: 'blob:test',
        mediaType: 'image',
        date: '2026-06-20T10:00:00.000Z',
        notes: 'Line confidence improved',
        improvementNotes: 'Push silhouettes next round',
        tags: ['gesture'],
        favorite: false,
        workIndex: 0,
      },
    ],
  } as never)
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    isLoaded: true,
    settings: { ...DEFAULT_SETTINGS, hasSeenOnboarding: true },
    streakState: { current: 2, longest: 2, lastActiveDate: '2026-06-20' },
    adaptiveWeights: { default: 1 },
    feedbackStats: {},
  })
})

describe('Gallery page smoke', () => {
  it('renders gallery summary and saved work', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <Gallery />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getAllByText(/Gesture Study|Жесты/i).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-onboarding="page-gallery"]')).toBeTruthy()
    expect(screen.getByText(/Growth wall/i)).toBeDefined()
  })
})
