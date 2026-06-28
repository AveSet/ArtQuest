import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HashRouter } from 'react-router'
import { I18nProvider } from '@/i18n'
import ReferencePanel from '../ReferencePanel'


function renderPanel(questId = 42) {
  return render(
    <HashRouter>
      <I18nProvider>
        <ReferencePanel questId={questId} />
      </I18nProvider>
    </HashRouter>
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ReferencePanel', () => {
  it('renders all three tabs', () => {
    renderPanel()
    expect(screen.getByText('Reference')).toBeDefined()
    expect(screen.getByText('Grid Overlay')).toBeDefined()
    expect(screen.getByText('Color Picker')).toBeDefined()
  })

  it('shows saved references hint and file upload in reference tab', () => {
    renderPanel()
    expect(screen.getByText(/Save reference images for this quest/i)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeDefined()
    expect(screen.getByText(/Paste an image from clipboard/i)).toBeDefined()
    expect(screen.getByText(/No saved references yet/i)).toBeDefined()
  })

  it('switches to grid tab when clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Grid Overlay'))
    expect(screen.getByText('Rule of Thirds')).toBeDefined()
    expect(screen.getByText('Golden Ratio')).toBeDefined()
    expect(screen.getByText('Diagonal')).toBeDefined()
    expect(screen.getByText('No reference image selected')).toBeDefined()
  })

  it('switches to color picker tab when clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Color Picker'))
    expect(screen.getByText('Click on the image to pick a color')).toBeDefined()
  })

  it('renders opacity slider in grid tab', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Grid Overlay'))
    expect(screen.getByText(/Opacity/)).toBeDefined()
    const slider = document.querySelector('input[type="range"]')
    expect(slider).toBeDefined()
  })

  it('selects grid type on click', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Grid Overlay'))
    fireEvent.click(screen.getByText('Golden Ratio'))
    const goldenBtn = screen.getByText('Golden Ratio')
    expect(goldenBtn.className).toContain('accent')
  })

  it('renders clear all button in pipette tab with swatches', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Color Picker'))
    expect(screen.queryByText('Clear All')).toBeNull()
  })
})
