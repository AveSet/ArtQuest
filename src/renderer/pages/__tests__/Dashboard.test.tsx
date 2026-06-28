import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import Dashboard from '../Dashboard'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore, getDefaultSkills, createInitialSkillNodes } from '@/store/useSkillStore'
import { usePortraitStore } from '@/store/usePortraitStore'
import { DEFAULT_SETTINGS, type Quest } from '@/store/models'
import { buildDailyPrefsKey } from '@/utils/dailyQuestGenerator'
import { getLocalDateStr } from '@/utils/dailyQuests'
import * as dailyQuestCoordinator from '@/utils/dailyQuestCoordinator'

const mockQuest = (id: number, title: string): Quest => ({
  id,
  code: `Q-${id}`,
  title: { en: title, ru: title, zh: title, ja: title, ko: title },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'd', ru: 'd', zh: 'd', ja: 'd', ko: 'd' },
  xp: 40,
  estimatedTime: 20,
  source: 'test',
  icon: '🎨',
  color: '#000',
  min_level: 1,
  tags: [],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 1,
})

const prefsKey = buildDailyPrefsKey({
  favoriteCategories: DEFAULT_SETTINGS.favoriteCategories,
  useRandomCategories: DEFAULT_SETTINGS.useRandomCategories,
  learningProfile: DEFAULT_SETTINGS.learningProfile,
})

beforeEach(() => {
  ;(window as unknown as { electronAPI?: unknown }).electronAPI = undefined

  useQuestStore.setState({
    quests: [mockQuest(1, 'Perspective Basics'), mockQuest(2, 'Line Practice')],
    catalogQuests: [mockQuest(1, 'Perspective Basics'), mockQuest(2, 'Line Practice')],
    userQuests: [],
    deletedQuestIds: [],
    completedQuests: [],
    questCompletionLogs: [],
    dailyQuestsIds: [1, 2],
    completedToday: [],
    lastDailyQuestDate: '2026-06-07',
    lastFavCategories: prefsKey,
    questsLoaded: true,
  })
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    isLoaded: true,
    settings: {
      ...DEFAULT_SETTINGS,
      hasSeenOnboarding: true,
      profileSetupComplete: true,
      experienceTier: 'intermediate',
    },
    streakState: { current: 5, longest: 5, lastActiveDate: '2026-06-07' },
    questReviewSchedule: {},
    adaptiveWeights: { default: 1 },
    feedbackStats: {},
  })
  usePortraitStore.setState({
    dailyChestStreak: 2,
    lastDailyChestProgressDate: '2026-06-07',
  })

  vi.spyOn(dailyQuestCoordinator, 'checkAndGenerateDailyQuests').mockImplementation(function mockDaily() {
    return useQuestStore
      .getState()
      .quests.filter((q) => useQuestStore.getState().dailyQuestsIds.includes(q.id))
  })
  vi.spyOn(useUIStore.getState(), 'saveProgressSync').mockImplementation(() => {})
})

describe('Dashboard page smoke', () => {
  it('renders daily quests section and streak block', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(document.querySelector('[data-onboarding="dashboard-dailies"]')).toBeTruthy()
    expect(document.querySelector('[data-onboarding="dashboard-quests-panel"]')).toBeTruthy()
    expect(document.querySelector('[data-onboarding="dashboard-skills"]')).toBeTruthy()
    expect(document.querySelector('[data-onboarding="dashboard-next-action"]')).toBeTruthy()
    expect(screen.getAllByText('Perspective Basics').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Line Practice').length).toBeGreaterThan(0)
  })

  it('shows next best action while dailies are still in progress', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Best for today/i)).toBeDefined()
    expect(document.querySelector('[data-onboarding="dashboard-dailies"]')).toBeTruthy()
  })

  it('keeps next best action visible after warmup when dailies remain', () => {
    useQuestStore.setState({ lastWarmupCompletedDate: getLocalDateStr() })

    render(
      <MemoryRouter>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(document.querySelector('[data-onboarding="dashboard-next-action"]')).toBeTruthy()
    expect(screen.getByText('Daily quest')).toBeDefined()
    expect(screen.getAllByText('Perspective Basics').length).toBeGreaterThan(0)
  })

  it('shows next best action after all dailies are completed', () => {
    useQuestStore.setState({ completedToday: [1, 2], lastWarmupCompletedDate: '2026-06-07' })

    render(
      <MemoryRouter>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Best for today/i)).toBeDefined()
  })

  it('shows legacy track XP on dashboard even when skill nodes exist', () => {
    useSkillStore.setState({
      legacySkills: getDefaultSkills().map((s) =>
        s.category === 'drawing' ? { ...s, xp: 69, level: 1, maxXp: 300 } : s,
      ),
      skillNodes: createInitialSkillNodes().map((n) =>
        n.id === 'drawing_fundamentals' ? { ...n, isUnlocked: true, xp: 19, level: 0 } : n,
      ),
      achievements: [],
    })

    render(
      <MemoryRouter>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('69 / 300 XP').length).toBeGreaterThan(0)
  })
})
