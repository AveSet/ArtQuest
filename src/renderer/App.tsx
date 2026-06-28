import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router'
import { lazy, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import Navbar from './components/Navbar'
import AchievementPopup from './components/AchievementPopup'
import XpRewardToast from './components/XpRewardToast'
import XPFloat from './components/XPFloat'
import SaveErrorBanner from './components/SaveErrorBanner'
import LoadProgressErrorBanner from './components/LoadProgressErrorBanner'
import ErrorBoundary from './components/ErrorBoundary'
import type { ReactNode } from 'react'
import { useUIStore } from './store/useUIStore'
import { useThemeStore } from './store/useThemeStore'
import { useQuestStore } from './store/useQuestStore'
import { I18nProvider, useI18n } from './i18n'
import { initAutoSave } from './utils/autoSave'
import { checkAndGenerateDailyQuests, initializeDailyQuests } from './utils/dailyQuestCoordinator'
import { ensureAudioContext, preloadSounds } from './utils/sound'
import { stopAmbientLoop, syncAmbientLoop } from './utils/ambientSound'
import { devInfo } from './utils/devLog'
import { warmGalleryImageCache } from './utils/hydrateGallery'
import { pushDesktopIntegrationSync } from './utils/desktopIntegration'
import OnboardingTour from './components/OnboardingTour'
import LearningProfileModal from './components/LearningProfileModal'
import LevelUpToast from './components/LevelUpToast'
import LevelUpCelebration from './components/effects/LevelUpCelebration'
import QuestScreenCelebration from './components/effects/QuestScreenCelebration'
import ReferenceBonusToast from './components/ReferenceBonusToast'
import StreakRecoveryHint from './components/StreakRecoveryHint'
import SoftRestartModal from './components/SoftRestartModal'
import ContextualHintToast from './components/ContextualHintToast'
import ReferencePanelToggle from './components/Quest/ReferencePanelToggle'
import AppToastLayer from './components/AppToastLayer'
import QuestSessionCommandBridge from './components/QuestSessionCommandBridge'
import ActivityBridge, { NavigateBridge, SessionTickBridge } from './components/ActivityBridge'
import WindowBoundsBridge, { applySavedWindowBounds } from './components/WindowBoundsBridge'
import BreakReminderToast from './components/BreakReminderToast'
import { initViewportHeightSync } from './utils/viewportHeight'
import AnimatedRouteOutlet from './components/ui/AnimatedRouteOutlet'
import PhaseTransitionCard from './components/PhaseTransitionCard'
import { PageSkeleton, skeletonVariantForPath } from './components/ui/PageSkeleton'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Quests = lazy(() => import('./pages/Quests'))
const QuestDetail = lazy(() => import('./pages/QuestDetail'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Skills = lazy(() => import('./pages/Skills'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Settings = lazy(() => import('./pages/Settings'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Resources = lazy(() => import('./pages/Resources'))
const ProgressLayout = lazy(() => import('./pages/ProgressLayout'))
const ProgressGoals = lazy(() => import('./pages/ProgressGoals'))
const Fundamentals = lazy(() => import('./pages/Fundamentals'))
import QuestOverlay from './pages/QuestOverlay'
const ReferenceMaterialsWindow = lazy(() => import('./pages/ReferenceMaterialsWindow'))

function BootstrapLoadingScreen({ theme }: { theme: string }) {
  const { t } = useI18n()
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-[var(--bg-deep)] ${theme === 'rpg' ? 'rpg-loading' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse" aria-hidden>
          🎨
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{t.common.appLoading}</p>
        <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded mx-auto animate-pulse mb-2 mt-3" aria-hidden />
        <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded mx-auto animate-pulse" aria-hidden />
      </div>
    </div>
  )
}

function RouteLoading() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const variant = skeletonVariantForPath(pathname)

  return (
    <div
      className="min-h-[50vh] py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t.common.loadingRoute}
    >
      <p className="sr-only">{t.common.loadingRoute}</p>
      <PageSkeleton variant={variant} />
    </div>
  )
}

function DesktopAccessibilityEffects() {
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
    if (!isLoaded || !window.electronAPI?.syncDesktopSettings) return
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

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}

function AppRoutes({
  softRestartOpen,
  setSoftRestartOpen,
}: {
  softRestartOpen: boolean
  setSoftRestartOpen: (open: boolean) => void
}) {
  return (
    <HashRouter>
      <AppShell softRestartOpen={softRestartOpen} setSoftRestartOpen={setSoftRestartOpen} />
    </HashRouter>
  )
}

function AppShell({
  softRestartOpen,
  setSoftRestartOpen,
}: {
  softRestartOpen: boolean
  setSoftRestartOpen: (open: boolean) => void
}) {
  const { t } = useI18n()
  const location = useLocation()
  const { profileSetupComplete, showQuickOnboarding, fullOnboardingRequested } = useUIStore(
    useShallow((s) => ({
      profileSetupComplete: s.settings.profileSetupComplete,
      showQuickOnboarding: !s.settings.hasSeenOnboarding,
      fullOnboardingRequested: s.fullOnboardingRequested,
    })),
  )
  const showOnboarding = profileSetupComplete && (showQuickOnboarding || fullOnboardingRequested)
  const onboardingMode = fullOnboardingRequested ? 'full' : 'quick'
  if (location.pathname === '/overlay') {
    return (
      <>
        <QuestOverlay />
        <ActivityBridge />
      </>
    )
  }

  if (location.pathname === '/reference-materials') {
    return (
      <AnimatedRouteOutlet fallback={<RouteLoading />}>
        <ReferenceMaterialsWindow />
      </AnimatedRouteOutlet>
    )
  }

  return (
      <div className="min-h-screen">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[300] focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-white">
          {(t.a11y as { skipToMain?: string }).skipToMain ?? 'Skip to main content'}
        </a>
        <Navbar />
        <PhaseTransitionCard />
        <QuestSessionCommandBridge />
        <ActivityBridge />
        <SessionTickBridge />
        <WindowBoundsBridge />
        <NavigateBridge />
        <ScrollToTopOnRouteChange />
        <DesktopAccessibilityEffects />
        <SaveErrorBanner />
        <LoadProgressErrorBanner />
        <main id="main-content" className="app-main">
          <AnimatedRouteOutlet fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/quests/:id" element={<QuestDetail />} />
              <Route path="/fundamentals" element={<Fundamentals />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/progress" element={<ProgressLayout />}>
                <Route index element={<Navigate to="stats" replace />} />
                <Route path="stats" element={<Statistics />} />
                <Route path="timeline" element={<Navigate to="/progress/stats" replace />} />
                <Route path="goals" element={<ProgressGoals />} />
                <Route path="achievements" element={<Achievements />} />
              </Route>
              <Route path="/statistics" element={<Navigate to="/progress/stats" replace />} />
              <Route path="/achievements" element={<Navigate to="/progress/achievements" replace />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatedRouteOutlet>
        </main>
        <AppToastLayer>
          <XPFloat />
          <XpRewardToast />
          <AchievementPopup />
          <ReferenceBonusToast />
          <LevelUpToast />
          <StreakRecoveryHint />
          <ContextualHintToast />
          <BreakReminderToast />
        </AppToastLayer>
        <QuestScreenCelebration />
        <LevelUpCelebration />
        <SoftRestartModal open={softRestartOpen} onClose={() => setSoftRestartOpen(false)} />
        <LearningProfileModal open={!profileSetupComplete} />
        {showOnboarding && <OnboardingTour mode={onboardingMode} />}
        <ReferenceToggleWithRoute />
      </div>
  )
}

function ReferenceToggleWithRoute() {
  const location = useLocation()
  if (!location.pathname.includes('/quests/')) return null
  return <ReferencePanelToggle />
}

function ErrorBoundaryWithI18n({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <ErrorBoundary
      messages={{
        title: t.errors.boundaryTitle ?? 'Something went wrong',
        recoverTitle: t.errors.boundaryRecover ?? 'Unable to recover',
        exhausted: t.errors.boundaryExhausted ?? 'The application is unable to recover automatically.',
        tryAgain: t.errors.boundaryTryAgain ?? 'Try Again',
        reload: t.errors.boundaryReload ?? 'Reload App',
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function App() {
  devInfo('[App] electronAPI', !!window.electronAPI)

  useEffect(() => {
    const cleanup = initViewportHeightSync()
    return cleanup
  }, [])

  const isLoaded = useUIStore((state) => state.isLoaded)
  const theme = useThemeStore((state) => state.theme)
  const loadProgress = useUIStore((state) => state.loadProgress)
  const loadQuests = useQuestStore((state) => state.loadQuests)
  const autoSaveInitRef = useRef(false)

  const autoCleanupRef = useRef<(() => void) | null | undefined>(null)
  const [_softRestartOpen, _setSoftRestartOpen] = useState(false)

  useEffect(() => {
    Promise.all([loadQuests(), loadProgress()])
      .then(() => {
        initializeDailyQuests()
        useQuestStore.getState().ensureWeeklyChallenge()
        void useUIStore.getState().saveProgress()
        if (!autoSaveInitRef.current) {
          autoCleanupRef.current = initAutoSave()
          autoSaveInitRef.current = true
        }
        void import('./utils/e2eTestHooks').then(({ installE2eTestHooks }) => installE2eTestHooks())
        const runWarm = () => void warmGalleryImageCache()
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(runWarm, { timeout: 8000 })
        } else {
          window.setTimeout(runWarm, 2000)
        }

        const streakState = useUIStore.getState().streakState
        if (streakState.lastActiveDate) {
          const daysSince = Math.floor(
            (Date.now() - new Date(streakState.lastActiveDate + 'T00:00:00').getTime()) / 86400000,
          )
          if (daysSince >= 14) _setSoftRestartOpen(true)
        }
      })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && useUIStore.getState().isLoaded) {
        const questStore = useQuestStore.getState()
        checkAndGenerateDailyQuests()
        questStore.ensureWeeklyChallenge()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const resumeAudio = () => {
      ensureAudioContext()
      preloadSounds()
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
    }
    document.addEventListener('pointerdown', resumeAudio, { once: true })
    document.addEventListener('keydown', resumeAudio, { once: true })

    syncAmbientLoop()
    const unsubAmbient = useUIStore.subscribe((state, prev) => {
      const a = state.settings
      const b = prev.settings
      if (
        a.ambientEnabled !== b.ambientEnabled ||
        a.ambientVolume !== b.ambientVolume ||
        a.soundEnabled !== b.soundEnabled ||
        a.reduceMotion !== b.reduceMotion
      ) {
        syncAmbientLoop()
      }
    })

    return () => {
      unsubAmbient()
      stopAmbientLoop()
      autoCleanupRef.current?.()
      autoCleanupRef.current = null
      autoSaveInitRef.current = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
    }
  }, [loadQuests, loadProgress])

  if (!isLoaded) {
    return (
      <I18nProvider>
        <BootstrapLoadingScreen theme={theme} />
      </I18nProvider>
    )
  }

  return (
    <I18nProvider>
      <ErrorBoundaryWithI18n>
        <AppRoutes softRestartOpen={_softRestartOpen} setSoftRestartOpen={_setSoftRestartOpen} />
      </ErrorBoundaryWithI18n>
    </I18nProvider>
  )
}

export default App
