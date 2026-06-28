import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import MicroChallengePreview from '../MicroChallengePreview'
import type { MicroChallenge } from '@/store/models'


const challenges: MicroChallenge[] = [
  { id: 'mc-warmup', instruction: { en: 'Warm up with light lines', ru: 'Разомнись лёгкими линиями', zh: 'Warm up with light lines', ja: 'Warm up with light lines', ko: 'Warm up with light lines' }, estimatedTime: 5, xp: 5 },
  { id: 'mc-main', instruction: { en: 'Draw the main shapes', ru: 'Нарисуй основные формы', zh: 'Draw the main shapes', ja: 'Draw the main shapes', ko: 'Draw the main shapes' }, estimatedTime: 10, xp: 10, prerequisite: 'mc-warmup' },
  { id: 'mc-polish', instruction: { en: 'Polish the edges', ru: 'Отполируй края', zh: 'Polish the edges', ja: 'Polish the edges', ko: 'Polish the edges' }, estimatedTime: 15, xp: 15, prerequisite: 'mc-main' },
]

function renderPreview() {
  return render(
    <HashRouter>
      <I18nProvider>
        <MicroChallengePreview challenges={challenges} />
      </I18nProvider>
    </HashRouter>,
  )
}

describe('MicroChallengePreview', () => {
  it('renders challenges in prerequisite order with phase labels and no fake XP', () => {
    renderPreview()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]?.textContent).toContain('Warm up with light lines')
    expect(items[1]?.textContent).toContain('Draw the main shapes')
    expect(items[0]?.textContent).toContain('Warmup')
    expect(screen.getByText('Session plan')).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByText('+5 XP')).toBeNull()
  })
})
