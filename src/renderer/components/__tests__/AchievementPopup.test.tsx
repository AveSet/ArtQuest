import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'

import AchievementPopup from '../AchievementPopup'
import XpRewardToast from '../XpRewardToast'
import AppToastLayer from '../AppToastLayer'
import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'

describe('AchievementPopup', () => {
  beforeEach(() => {
    useUIStore.setState({ achievementQueue: [] })
    useQuestStore.setState({ lastCompletionReward: null })
  })

  it('renders nothing when queue is empty', () => {
    const { container } = render(
      <I18nProvider>
        <AchievementPopup />
      </I18nProvider>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows achievement when queued', () => {
    useUIStore.setState({
      achievementQueue: [
        {
          id: 'test',
          title: { en: 'Test Ach', ru: 'Тест', zh: 'Test Ach', ja: 'Test Ach', ko: 'Test Ach' },
          description: { en: 'Test desc', ru: 'Описание', zh: 'Test desc', ja: 'Test desc', ko: 'Test desc' },
          icon: '🏆',
          unlocked: true,
        },
      ],
    })

    render(
      <I18nProvider>
        <AchievementPopup />
      </I18nProvider>,
    )

    expect(screen.getByText('Test Ach')).toBeDefined()
    expect(screen.getByText('Test desc')).toBeDefined()
  })

  it('shows achievement while quest reward toast is visible', () => {
    useUIStore.setState({
      achievementQueue: [
        {
          id: 'test',
          title: { en: 'Test Ach', ru: 'Тест', zh: 'Test Ach', ja: 'Test Ach', ko: 'Test Ach' },
          description: { en: 'Test desc', ru: 'Описание', zh: 'Test desc', ja: 'Test desc', ko: 'Test desc' },
          icon: '🏆',
          unlocked: true,
        },
      ],
    })
    useQuestStore.setState({
      lastCompletionReward: { questXp: 10, skillXp: 5, category: 'drawing' },
    })

    render(
      <HashRouter>
        <I18nProvider>
          <AppToastLayer>
            <XpRewardToast />
            <AchievementPopup />
          </AppToastLayer>
        </I18nProvider>
      </HashRouter>,
    )

    expect(screen.getByText('Test Ach')).toBeDefined()
    expect(screen.getByText('Rewards')).toBeDefined()
  })
})
