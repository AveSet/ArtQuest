import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import ArtAppsSettings from '../ArtAppsSettings'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SETTINGS } from '@/store/models'

describe('ArtAppsSettings', () => {
  beforeEach(() => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, activityTrackingEnabled: true },
    })
    ;(window as unknown as { electronAPI?: Record<string, unknown> }).electronAPI = {
      activityTrackingNative: true,
      pickArtAppExecutable: vi.fn(() =>
        Promise.resolve({ success: true, path: 'C:\\Apps\\Krita\\krita.exe' }),
      ),
      syncDesktopSettings: vi.fn(() => Promise.resolve()),
    }
  })

  it('shows platform note when native tracking is unavailable', () => {
    ;(window as unknown as { electronAPI?: { activityTrackingNative: boolean } }).electronAPI = {
      activityTrackingNative: false,
    }

    render(
      <I18nProvider>
        <ArtAppsSettings />
      </I18nProvider>,
    )

    expect(screen.getByTestId('art-apps-platform-note')).toBeDefined()
    expect(screen.getByTestId('art-apps-platform-note').textContent).toMatch(/Windows/i)
  })

  it('hides platform note on Windows-native tracking', () => {
    render(
      <I18nProvider>
        <ArtAppsSettings />
      </I18nProvider>,
    )

    expect(screen.queryByTestId('art-apps-platform-note')).toBeNull()
  })

  it('lets user pick a custom exe via Other chip', async () => {
    render(
      <I18nProvider>
        <ArtAppsSettings />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByTestId('art-app-custom'))

    await waitFor(() => {
      expect(screen.getByTestId('art-app-custom-path').textContent).toContain('krita.exe')
    })

    const settings = useUIStore.getState().settings
    expect(settings.trackedArtApps).toContain('custom')
    expect(settings.customArtAppExecutablePath).toBe('C:\\Apps\\Krita\\krita.exe')
  })
})
