import { describe, expect, it } from 'vitest'
import {
  isTrackedArtProcess,
  normalizeCustomArtAppExecutablePath,
  normalizeTrackedArtApps,
  processMatchesCustomArtApp,
  processNameFromExecutablePath,
} from '../artApps'

describe('artApps custom executable', () => {
  it('derives process name from exe path', () => {
    expect(processNameFromExecutablePath('C:\\Apps\\Krita\\krita.exe')).toBe('krita')
    expect(processNameFromExecutablePath('/usr/bin/krita')).toBe('krita')
  })

  it('normalizes custom exe paths', () => {
    expect(normalizeCustomArtAppExecutablePath('  C:\\Apps\\Krita\\krita.exe  ')).toBe(
      'C:\\Apps\\Krita\\krita.exe',
    )
    expect(normalizeCustomArtAppExecutablePath('not-an-exe')).toBeUndefined()
    expect(normalizeCustomArtAppExecutablePath('')).toBeUndefined()
  })

  it('accepts custom in tracked apps list', () => {
    expect(normalizeTrackedArtApps(['photoshop', 'custom'])).toEqual(['photoshop', 'custom'])
  })

  it('matches custom process name', () => {
    expect(processMatchesCustomArtApp('krita', 'krita')).toBe(true)
    expect(processMatchesCustomArtApp('Krita', 'krita')).toBe(true)
    expect(processMatchesCustomArtApp('photoshop', 'krita')).toBe(false)
  })

  it('tracks custom app when selected', () => {
    expect(isTrackedArtProcess('krita', ['custom'], 'krita')).toBe(true)
    expect(isTrackedArtProcess('clipstudio', ['custom'], 'krita')).toBe(false)
    expect(isTrackedArtProcess('krita', ['photoshop', 'custom'], 'krita')).toBe(true)
  })
})
