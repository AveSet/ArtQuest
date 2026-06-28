import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import Skills from '../Skills'
import { useSkillStore } from '@/store/useSkillStore'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SETTINGS } from '@/store/models'

beforeEach(() => {
  ;(window as unknown as { electronAPI?: unknown }).electronAPI = undefined
  useSkillStore.setState({
    skillNodes: [],
    legacySkills: [],
    achievements: [],
  })
  useUIStore.setState({
    isLoaded: true,
    settings: { ...DEFAULT_SETTINGS, hasSeenOnboarding: true },
    streakState: { current: 1, longest: 1, lastActiveDate: '2026-06-07' },
    questReviewSchedule: {},
    adaptiveWeights: { default: 1 },
    feedbackStats: {},
  })
})

describe('Skills page smoke', () => {
  it('renders skill tree canvas without branch summary card', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <Skills />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(document.querySelector('.skills-tree-canvas')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Skill branch summary' })).toBeNull()
  })
})
