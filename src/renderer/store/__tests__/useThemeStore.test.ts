import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('light', 'dark')
  })

  it('defaults to modern theme', () => {
    const theme = useThemeStore.getState().theme
    expect(['modern', 'light', 'rpg']).toContain(theme)
  })

  it('setTheme changes theme and persists to localStorage', () => {
    useThemeStore.getState().setTheme('rpg')
    expect(useThemeStore.getState().theme).toBe('rpg')
    expect(localStorage.getItem('artquest-theme')).toBe('rpg')
  })

  it('setTheme applies data-theme attribute', () => {
    useThemeStore.getState().setTheme('rpg')
    expect(document.documentElement.getAttribute('data-theme')).toBe('rpg')
  })

  it('setTheme to light clears data-theme and adds light class', () => {
    useThemeStore.getState().setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme toggles between all three themes', () => {
    useThemeStore.getState().setTheme('modern')
    expect(document.documentElement.getAttribute('data-theme')).toBe('modern')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useThemeStore.getState().setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('')
    expect(document.documentElement.classList.contains('light')).toBe(true)

    useThemeStore.getState().setTheme('rpg')
    expect(document.documentElement.getAttribute('data-theme')).toBe('rpg')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
