import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { pushDesktopIntegrationSync } from '@/utils/desktopIntegration'
import { applySavedWindowBounds } from '@/components/WindowBoundsBridge'

/** Syncs font scale, contrast, motion, desktop integration, and saved window bounds. */
export default function DesktopAccessibilityEffects() {
  const { isLoaded, settings } = useUIStore(
    useShallow((state) => ({ isLoaded: state.isLoaded, settings: state.settings })),
  )
  const { t, language } = useI18n()

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', settings.fontScale ?? 'medium')
    document.documentElement.setAttribute('data-contrast', settings.contrastBoost ? 'boost' : 'normal')
    document.documentElement.setAttribute('data-motion', settings.reduceMotion ? 'reduce' : 'normal')
  }, [settings.fontScale, settings.contrastBoost, settings.reduceMotion])

  useEffect(() => {
    if (!isLoaded || !window.electronAPI?.desktop?.syncSettings) return
    pushDesktopIntegrationSync(settings, {
      reminderTitle: t.desktop.reminderTitle,
      reminderBody: t.desktop.reminderBody,
    })
  }, [isLoaded, language, settings, t.desktop.reminderTitle, t.desktop.reminderBody])

  const windowBoundsAppliedRef = useRef(false)
  useEffect(() => {
    if (!isLoaded || windowBoundsAppliedRef.current) return
    windowBoundsAppliedRef.current = true
    applySavedWindowBounds(useUIStore.getState().settings.windowBounds)
  }, [isLoaded])

  return null
}
