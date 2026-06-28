import { describe, it, expect } from 'vitest'
import { normalizeTrackedArtApps } from '../../shared/artApps'

describe('googleDrive helpers', () => {
  it('normalizes tracked art app ids for activity config', () => {
    const apps = normalizeTrackedArtApps(['clipstudio', 'unknown-app', 'photoshop'])
    expect(apps).toContain('clipstudio')
    expect(apps).toContain('photoshop')
    expect(apps).not.toContain('unknown-app')
  })
})
