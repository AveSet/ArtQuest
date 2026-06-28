import { create } from 'zustand'
import { useUIStore } from '@/store/useUIStore'

type Theme = 'modern' | 'light' | 'rpg' | 'studio'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  syncFromSettings: (theme: Theme) => void
}

const STORAGE_KEY = 'artquest-theme'

export function applyThemeToDocument(theme: Theme) {
  if (theme === 'studio') {
    document.documentElement.setAttribute('data-theme', 'modern')
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark', 'studio-theme')
    return
  }
  document.documentElement.classList.remove('studio-theme')
  document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme)
  document.documentElement.classList.toggle('light', theme === 'light')
  document.documentElement.classList.toggle('dark', theme === 'modern' || theme === 'rpg')
}

const loadTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'modern' || stored === 'light' || stored === 'rpg' || stored === 'studio') return stored
  } catch {}
  return 'light'
}

const initial = loadTheme()
applyThemeToDocument(initial)

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
    applyThemeToDocument(theme)
    set({ theme })
    const ui = useUIStore.getState()
    if (ui.settings.theme !== theme) {
      ui.setSettings({ theme })
    }
  },
  syncFromSettings: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
    applyThemeToDocument(theme)
    set({ theme })
  },
}))
