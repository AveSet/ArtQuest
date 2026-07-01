import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router'
import { lazy, useEffect } from 'react'
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
import { I18nProvider, useI18n } from './i18n'
import { devInfo } from './utils/devLog'
import DesktopAccessibilityEffects from './components/app/DesktopAccessibilityEffects'
import { useAppBootstrap } from './hooks/useAppBootstrap'
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
import WindowBoundsBridge from './components/WindowBoundsBridge'
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
  const { softRestartOpen, setSoftRestartOpen } = useAppBootstrap()

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
        <AppRoutes softRestartOpen={softRestartOpen} setSoftRestartOpen={setSoftRestartOpen} />
      </ErrorBoundaryWithI18n>
    </I18nProvider>
  )
}

export default App
