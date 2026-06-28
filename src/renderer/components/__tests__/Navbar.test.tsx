import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import Navbar from '../Navbar'


const renderNavbar = () => {
  return render(
    <HashRouter>
      <I18nProvider>
        <Navbar />
      </I18nProvider>
    </HashRouter>
  )
}

describe('Navbar', () => {
  it('renders the brand name', () => {
    renderNavbar()
    expect(screen.getByText('Art')).toBeDefined()
    expect(screen.getByText('Quest')).toBeDefined()
  })

  it('renders all navigation links', () => {
    renderNavbar()
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Quests').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Gallery').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Skills').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Progress').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Resources').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
  })

  it('has correct navigation role', () => {
    renderNavbar()
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(1)
  })
})
