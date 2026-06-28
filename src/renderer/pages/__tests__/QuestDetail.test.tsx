import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { I18nProvider } from '@/i18n'
import QuestDetail from '../QuestDetail'
import { useQuestStore } from '@/store/useQuestStore'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'
import { useSessionRitualStore } from '@/store/useSessionRitualStore'
import type { Quest } from '@/store/models'
import { WARMUP_QUESTS } from '@/data/warmupQuests'
import { FUNDAMENTALS_TRACK_NOVICE_ID } from '@/data/fundamentalsExercises'
import { buildQuestDetailNavState } from '@/utils/resolveQuestById'

const mockQuest: Quest = {
  id: 42,
  code: 'DRW-00042',
  title: { en: 'Smoke Test Quest', ru: 'Тест', zh: 'Smoke Test Quest', ja: 'Smoke Test Quest', ko: 'Smoke Test Quest' },
  category: 'drawing',
  difficulty: 'novice',
  description: { en: 'Draw something', ru: 'Нарисуй', zh: 'Draw something', ja: 'Draw something', ko: 'Draw something' },
  xp: 55,
  estimatedTime: 25,
  source: 'Test',
  icon: '🎨',
  color: '#6366f1',
  min_level: 1,
  tags: ['smoke'],
  prerequisites: [],
  medium: 'digital',
  is_repeatable: true,
  review_after_days: 0,
  streak_bonus: 1,
}

const submitQuestMock = vi.fn()

vi.mock('@/utils/useQuestSubmit', () => ({
  useQuestSubmit: () => ({
    submitQuest: submitQuestMock,
    isSubmitting: false,
    submitError: null,
    clearSubmitError: vi.fn(),
  }),
}))

vi.mock('@/utils/sound', () => ({
  playSound: vi.fn(),
  playSessionSound: vi.fn(),
  playUiClick: vi.fn(),
}))


function renderDetail(initialEntry = '/quests/42', state?: Record<string, unknown>) {
  return render(
    <I18nProvider>
      <MemoryRouter
        initialEntries={[{ pathname: initialEntry, state }]}
      >
        <Routes>
          <Route path="/quests/:id" element={<QuestDetail />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('QuestDetail page smoke', () => {
  beforeEach(() => {
    submitQuestMock.mockReset()
    useQuestSessionStore.setState({ session: null, referenceToastVisible: false })
    useSessionRitualStore.getState().reset()
    useQuestStore.setState({
      quests: [mockQuest],
      completedQuests: [],
      questsLoaded: true,
    })
  })

  it('renders quest title on detail route', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: 'Smoke Test Quest' })).toBeDefined()
    expect(screen.getByText('Draw something')).toBeDefined()
  })

  it('does not auto-start warmup when opened via details only', async () => {
    const warmup = WARMUP_QUESTS[0]!
    renderDetail(`/quests/${warmup.id}`)
    expect(screen.getByRole('button', { name: /Start quest/i })).toBeDefined()
    expect(useQuestSessionStore.getState().session).toBeNull()
  })

  it('auto-starts fundamentals track with phased session', async () => {
    const navState = buildQuestDetailNavState(FUNDAMENTALS_TRACK_NOVICE_ID, { autoStart: true })
    renderDetail(`/quests/${FUNDAMENTALS_TRACK_NOVICE_ID}`, navState)

    await waitFor(() => {
      const session = useQuestSessionStore.getState().session
      expect(session?.questId).toBe(FUNDAMENTALS_TRACK_NOVICE_ID)
      expect(session?.phases.length).toBeGreaterThan(1)
      expect(session?.phases[0]?.kind).toBe('fundamentals')
    })

    expect(screen.getByRole('button', { name: /Next phase|Следующая фаза/i })).toBeDefined()
  })

  it('starts session and submits with attachment', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: /Start quest/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeDefined()
    })

    await user.click(screen.getByRole('button', { name: /Submit/i }))

    const fileInputs = document.querySelectorAll('input[type="file"]')
    const uploadInput = fileInputs[fileInputs.length - 1] as HTMLInputElement
    const file = new File(['pixels'], 'work.png', { type: 'image/png' })
    await user.upload(uploadInput, file)

    await user.click(screen.getByRole('button', { name: /Submit Work/i }))

    await waitFor(() => {
      expect(submitQuestMock).toHaveBeenCalled()
    })
    expect(submitQuestMock.mock.calls[0]?.[0]).toBe(42)
  })
})
