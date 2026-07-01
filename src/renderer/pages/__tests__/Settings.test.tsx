import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '@/i18n'
import Settings from '../Settings'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'
import { useSkillStore } from '@/store/useSkillStore'
import { DEFAULT_SETTINGS } from '@/store/models'

beforeEach(() => {
  // These smoke tests validate the web fallback path; disable electron-only async effects
  // to avoid React act() warnings from background Promise-based state updates.
  ;(window as unknown as { electronAPI?: unknown }).electronAPI = undefined

  useQuestStore.setState({
    quests: [],
    completedQuests: [99],
    questCompletionLogs: [{ questId: 99, nodeId: 'n', completedAt: '2026-01-01', xpEarned: 10, difficulty: 'novice' }],
  })
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    settings: { ...DEFAULT_SETTINGS, hasSeenOnboarding: true },
    streakState: { current: 10, longest: 10, lastActiveDate: '2026-05-01' },
    saveError: null,
  })
})

describe('Settings page smoke', () => {
  it('shows learning profile picker', async () => {
    render(
      <I18nProvider>
        <Settings />
      </I18nProvider>,
    )

    const profileSection = await screen.findByTestId('learning-profile-settings')
    expect(profileSection).toBeDefined()
    expect(profileSection.textContent).toMatch(/Drawing|Рисование/)
    expect(profileSection.textContent).toMatch(/Animation|Анимация/)
  })

  it('renders settings sections with text labels, not emoji icons', async () => {
    render(
      <I18nProvider>
        <Settings />
      </I18nProvider>,
    )

    const profileSection = await screen.findByTestId('learning-profile-settings')
    expect(profileSection.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(await screen.findByRole('heading', { name: /Learning profile|Профиль обучения/i })).toBeDefined()
  })

  it('confirms reset progress after trash button', async () => {
    const resetSpy = vi.spyOn(useUIStore.getState(), 'resetProgress').mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <Settings />
      </I18nProvider>,
    )

    await user.click(await screen.findByRole('tab', { name: /Technical/i }))
    await user.click(await screen.findByRole('button', { name: /Reset Progress/i }))

    expect(await screen.findByRole('alertdialog')).toBeDefined()
    expect(await screen.findByText(/reset all progress\?/i)).toBeDefined()

    const confirmButtons = screen.getAllByRole('button', { name: 'Confirm' })
    await user.click(confirmButtons[confirmButtons.length - 1]!)

    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(useQuestStore.getState().completedQuests).toEqual([99])
  })
})
