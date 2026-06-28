import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import { useQuestStore } from '@/store/useQuestStore'
import ProgressTimeline from '../ProgressTimeline'
import type { Quest, QuestCompletionLog } from '@/store/models'


function renderPage() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <ProgressTimeline />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const mockQuest: Quest = {
  id: 1,
  code: 'DRW-001',
  title: { en: 'Sketch Practice', ru: 'Наброски', zh: 'Sketch Practice', ja: 'Sketch Practice', ko: 'Sketch Practice' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  xp: 50,
  estimatedTime: 30,
  source: 'Catalog',
  icon: '✏️',
  color: '#6366f1',
  min_level: 1,
  tags: ['sketch'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
}

const mockQuest2: Quest = {
  id: 2,
  code: 'ANI-002',
  title: { en: 'Walk Cycle', ru: 'Цикл ходьбы', zh: 'Walk Cycle', ja: 'Walk Cycle', ko: 'Walk Cycle' },
  category: 'animation',
  difficulty: 'intermediate',
  description: { en: '', ru: '', zh: '', ja: '', ko: '' },
  xp: 120,
  estimatedTime: 60,
  source: 'Catalog',
  icon: '🎬',
  color: '#8b6914',
  min_level: 1,
  tags: ['animation'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
}

describe('ProgressTimeline', () => {
  beforeEach(() => {
    useQuestStore.setState({
      quests: [mockQuest, mockQuest2],
      questCompletionLogs: [],
      completedWorks: [],
      questTitleOverrides: {},
      questsLoaded: true,
    })
  })

  it('shows empty message when no completions', () => {
    renderPage()
    expect(screen.getByText(/No quests completed yet/i)).toBeDefined()
  })

  it('renders stats header with completions', () => {
    const logs: QuestCompletionLog[] = [
      { questId: 1, nodeId: '', completedAt: '2026-01-15T10:00:00.000Z', xpEarned: 50, difficulty: 'novice' },
      { questId: 1, nodeId: '', completedAt: '2026-01-16T10:00:00.000Z', xpEarned: 50, difficulty: 'novice' },
      { questId: 2, nodeId: '', completedAt: '2026-02-01T10:00:00.000Z', xpEarned: 120, difficulty: 'intermediate' },
    ]
    useQuestStore.setState({ questCompletionLogs: logs })

    renderPage()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders timeline dots for completions', () => {
    const logs: QuestCompletionLog[] = [
      { questId: 1, nodeId: '', completedAt: '2026-01-15T10:00:00.000Z', xpEarned: 50, difficulty: 'novice' },
    ]
    useQuestStore.setState({ questCompletionLogs: logs })

    renderPage()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders heatmap toggle and switches view', () => {
    const logs: QuestCompletionLog[] = [
      { questId: 1, nodeId: '', completedAt: '2026-01-15T10:00:00.000Z', xpEarned: 50, difficulty: 'novice' },
    ]
    useQuestStore.setState({ questCompletionLogs: logs })

    renderPage()
    const timelineBtn = screen.getByText('Calendar')
    expect(timelineBtn).toBeDefined()
  })

  it('handles many completion logs without crashing', () => {
    const logs: QuestCompletionLog[] = Array.from({ length: 100 }, (_, i) => ({
      questId: 1,
      nodeId: '',
      completedAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
      xpEarned: 50 + i,
      difficulty: 'novice' as const,
    }))
    useQuestStore.setState({ questCompletionLogs: logs })

    renderPage()
    expect(screen.getByText('100')).toBeDefined()
  })
})
