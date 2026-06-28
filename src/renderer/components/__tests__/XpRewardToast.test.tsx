import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import XpRewardToast from '../XpRewardToast'
import { useQuestStore } from '@/store/useQuestStore'


const renderToast = () => {
  return render(
    <HashRouter>
      <I18nProvider>
        <XpRewardToast />
      </I18nProvider>
    </HashRouter>
  )
}

describe('XpRewardToast', () => {
  beforeEach(() => {
    useQuestStore.setState({ lastCompletionReward: null })
  })

  it('renders nothing when no reward', () => {
    const { container } = renderToast()
    expect(container.innerHTML).toBe('')
  })

  it('displays skill XP reward', () => {
    useQuestStore.setState({
      lastCompletionReward: { questXp: 100, skillXp: 50, category: 'drawing' },
    })
    renderToast()
    expect(screen.getByText('+50')).toBeDefined()
    expect(screen.getByText('skill node')).toBeDefined()
  })

  it('displays reward title', () => {
    useQuestStore.setState({
      lastCompletionReward: { questXp: 50, skillXp: 0, category: '' },
    })
    renderToast()
    expect(screen.getByText('Rewards')).toBeDefined()
  })
})
