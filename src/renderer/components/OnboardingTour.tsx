import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNavigate, useLocation } from 'react-router'
import { useI18n } from '@/i18n'
import type { Translations } from '@/i18n/translations'
import { useUIStore } from '@/store/useUIStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotkey } from '@/hooks/useHotkey'
import {
  computeOnboardingTooltipStyle,
  type Hole,
} from '@/utils/onboardingTooltipPlacement'
type Onb = Translations['onboarding']
type TourMode = 'quick' | 'full'

const PAD = 14
const RADIUS = 12

const FULL_STEP_SELECTORS: (string | null)[] = [
  null,
  '[data-onboarding="dashboard-skills"]',
  '[data-onboarding="dashboard-next-action"]',
  '[data-onboarding="dashboard-dailies"]',
  '[data-onboarding="dashboard-goals"]',
  '[data-onboarding="main-nav"]',
  '[data-onboarding="page-quests"]',
  '[data-onboarding="page-skills"]',
  '[data-onboarding="skills-node-panel"]',
  '[data-onboarding="page-gallery"]',
  '[data-onboarding="materials-engagement-chips"]',
  '[data-onboarding="page-statistics"]',
  '[data-onboarding="page-achievements"]',
  '[data-onboarding="full-tour-button"]',
]

const FULL_STEP_PATHS: (string | null)[] = [
  null,
  '/',
  '/',
  '/',
  '/',
  '/',
  '/quests',
  '/skills',
  '/skills',
  '/gallery',
  '/resources',
  '/progress/stats',
  '/progress/achievements',
  '/settings',
]

/** Quick start: welcome → skills → next action → dailies → reward stars → full tour (settings). */
const QUICK_STEP_SELECTORS: (string | null)[] = [
  null,
  '[data-onboarding="dashboard-skills"]',
  '[data-onboarding="dashboard-next-action"]',
  '[data-onboarding="dashboard-dailies"]',
  '[data-onboarding="dashboard-reward-stars"]',
  '[data-onboarding="full-tour-button"]',
]

const QUICK_STEP_PATHS: (string | null)[] = [null, '/', '/', '/', '/', '/settings']

const FULL_LAST_STEP = 13
const QUICK_LAST_STEP = 5

function queryVisibleOnboardingTarget(selector: string): HTMLElement | null {
  const matches = document.querySelectorAll<HTMLElement>(selector)
  for (const el of matches) {
    if (el.offsetWidth > 0 || el.offsetHeight > 0) {
      const style = window.getComputedStyle(el)
      if (style.display !== 'none' && style.visibility !== 'hidden') return el
    }
  }
  return matches[0] ?? null
}

function navigateTargetForStep(mode: TourMode, step: number): { pathname: string; search: string } | null {
  if (step <= 0) return null
  const paths = mode === 'full' ? FULL_STEP_PATHS : QUICK_STEP_PATHS
  const p = paths[step]
  if (!p) return null
  if (mode === 'full' && step === 8) return { pathname: p, search: '?onboarding=skill-detail' }
  return { pathname: p, search: '' }
}

function stepTooltip(
  mode: TourMode,
  step: number,
  o: Onb,
): { title: string; body: string } | null {
  if (mode === 'quick') {
    switch (step) {
      case 1:
        return { title: o.skillsTitle, body: o.quickSkillsBody ?? o.skillsBody }
      case 2:
        return { title: o.quickNextActionTitle ?? o.dailiesTitle, body: o.quickNextActionBody ?? o.quickDailiesBody }
      case 3:
        return { title: o.dailiesTitle, body: o.quickDailiesBody }
      case 4:
        return { title: o.portraitStarsTitle ?? o.dailiesTitle, body: o.portraitStarsBody ?? o.quickDailiesBody }
      case 5:
        return { title: o.quickFullTourTitle, body: o.quickFullTourBody }
      default:
        return null
    }
  }
  switch (step) {
    case 1:
      return { title: o.skillsTitle, body: o.skillsBody }
    case 2:
      return { title: o.quickNextActionTitle ?? o.dailiesTitle, body: o.quickNextActionBody ?? o.dailiesBody }
    case 3:
      return { title: o.dailiesTitle, body: o.dailiesBody }
    case 4:
      return { title: o.goalsTitle ?? o.skillsTitle, body: o.goalsBody ?? o.skillsBody }
    case 5:
      return { title: o.navTitle, body: o.navBody }
    case 6:
      return { title: o.questsTitle, body: o.questsBody }
    case 7:
      return { title: o.skillsPageTitle, body: o.skillsPageBody }
    case 8:
      return { title: o.skillsNodeDemoTitle, body: o.skillsNodeDemoBody }
    case 9:
      return { title: o.galleryTitle, body: o.galleryBody }
    case 10:
      return { title: o.resourcesTitle, body: o.materialsEngagementBody ?? o.resourcesBody }
    case 11:
      return { title: o.statisticsTitle, body: o.statisticsBody }
    case 12:
      return { title: o.achievementsTitle, body: o.achievementsBody }
    case 13:
      return { title: o.settingsTitle, body: o.settingsBody }
    default:
      return null
  }
}

type Props = {
  mode: TourMode
}

export default function OnboardingTour({ mode }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const maskId = useId().replace(/:/g, '')
  const { reduceMotion, setSettings, saveProgress, clearFullOnboarding } = useUIStore(
    useShallow((s) => ({
      reduceMotion: s.settings.reduceMotion,
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
      clearFullOnboarding: s.clearFullOnboarding,
    })),
  )

  const lastStep = mode === 'full' ? FULL_LAST_STEP : QUICK_LAST_STEP
  const stepSelectors = mode === 'full' ? FULL_STEP_SELECTORS : QUICK_STEP_SELECTORS

  const [step, setStep] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const targetSelector = useMemo(() => stepSelectors[step] ?? null, [step, stepSelectors])
  const [hole, setHole] = useState<Hole | null>(null)
  const highlightedRef = useRef<HTMLElement | null>(null)

  const updateHole = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.removeAttribute('data-onboarding-active')
      highlightedRef.current = null
    }
    if (!targetSelector) {
      setHole(null)
      return
    }
    const el = queryVisibleOnboardingTarget(targetSelector)
    if (!el) {
      setHole(null)
      return
    }
    el.setAttribute('data-onboarding-active', 'true')
    highlightedRef.current = el
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
    const r = el.getBoundingClientRect()
    setHole({
      x: Math.max(0, r.left - PAD),
      y: Math.max(0, r.top - PAD),
      w: r.width + PAD * 2,
      h: r.height + PAD * 2,
    })
  }, [targetSelector])

  useEffect(() => {
    return () => {
      if (highlightedRef.current) {
        highlightedRef.current.removeAttribute('data-onboarding-active')
        highlightedRef.current = null
      }
    }
  }, [])

  useLayoutEffect(() => {
    updateHole()
  }, [updateHole, step, location.pathname, location.search])

  useEffect(() => {
    if (step > 0) {
      document.documentElement.setAttribute('data-onboarding-tour-nav-elevate', '1')
    } else {
      document.documentElement.removeAttribute('data-onboarding-tour-nav-elevate')
    }
    return () => document.documentElement.removeAttribute('data-onboarding-tour-nav-elevate')
  }, [step])

  useEffect(() => {
    const onResize = () => updateHole()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [updateHole])

  useEffect(() => {
    if (step < 1 || step > lastStep) return
    let n = 0
    const id = window.setInterval(() => {
      updateHole()
      n += 1
      if (n > 40) window.clearInterval(id)
    }, 120)
    return () => window.clearInterval(id)
  }, [step, updateHole, lastStep])

  useEffect(() => {
    if (step === 0) return
    const target = navigateTargetForStep(mode, step)
    if (!target) return
    const current = `${location.pathname}${location.search}`
    const desired = `${target.pathname}${target.search}`
    if (current !== desired) navigate(`${target.pathname}${target.search}`, { replace: true })
  }, [step, location.pathname, location.search, navigate, mode])

  const finish = useCallback(() => {
    if (mode === 'quick') {
      setSettings({ hasSeenOnboarding: true })
      void saveProgress()
      navigate('/', { replace: true })
    } else {
      clearFullOnboarding()
    }
  }, [mode, setSettings, saveProgress, clearFullOnboarding, navigate])

  const advance = useCallback(() => {
    if (step < lastStep) {
      setStep((s) => s + 1)
      return
    }
    finish()
  }, [step, lastStep, finish])

  useHotkey('Escape', finish)
  useFocusTrap(true, rootRef)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const main = document.querySelector('main.app-main')
    const allowInteraction = mode === 'quick' && step === QUICK_LAST_STEP
    if (main && !allowInteraction) main.setAttribute('inert', '')
    return () => {
      document.body.style.overflow = prevOverflow
      main?.removeAttribute('inert')
    }
  }, [mode, step])

  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const tooltip = step > 0 ? stepTooltip(mode, step, t.onboarding) : null
  const tooltipStyle = computeOnboardingTooltipStyle(hole, vw, vh)

  const overlayPointer = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    advance()
  }

  const stepLabel =
    step > 0
      ? t.onboarding.stepProgress
          .replace('{current}', String(step))
          .replace('{total}', String(lastStep))
      : null

  const welcomeIntro = mode === 'quick' ? t.onboarding.quickWelcomeIntro : t.onboarding.welcomeIntro

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[320] onboarding-tour-root${reduceMotion ? ' onboarding-tour-root--reduce' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t.onboarding.welcomeTitle}
    >
      <div className="absolute top-3 right-3 z-[330] flex items-center gap-2">
        {stepLabel && (
          <span className="text-xs text-white/80 font-medium px-2 py-1 rounded-md bg-black/40 pointer-events-none">
            {stepLabel}
          </span>
        )}
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1.5 bg-[var(--bg-secondary)]/95"
          onClick={(e) => {
            e.stopPropagation()
            finish()
          }}
        >
          {t.onboarding.skipTour}
        </button>
      </div>
      {step === 0 ? (
        <button
          type="button"
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/68 px-6 py-10 text-center cursor-default border-0 onboarding-welcome-backdrop${reduceMotion ? '' : ' backdrop-blur-[2px]'}`}
          onClick={overlayPointer}
        >
          <div className="max-w-lg card-fantasy p-6 border border-[var(--border-primary)] shadow-2xl pointer-events-none">
            <h2 className="heading-2 mb-3">{t.onboarding.welcomeTitle}</h2>
            <p className="text-fantasy text-[var(--text-secondary)] leading-relaxed">{welcomeIntro}</p>
            <p className="text-sm text-[var(--accent-hover)] mt-6 font-medium">{t.onboarding.clickToContinue}</p>
          </div>
        </button>
      ) : (
        <>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                {hole && (
                  <rect
                    x={hole.x}
                    y={hole.y}
                    width={hole.w}
                    height={hole.h}
                    rx={RADIUS}
                    ry={RADIUS}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask={`url(#${maskId})`} />
          </svg>

          <button
            type="button"
            className="absolute inset-0 cursor-default border-0 bg-transparent"
            aria-label={t.onboarding.clickToContinue}
            onClick={overlayPointer}
          />

          {tooltip && (
            <div className="absolute pointer-events-none px-2" style={tooltipStyle}>
              <div className="card-fantasy p-4 border border-[var(--gold-dark)] shadow-xl">
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-2">{tooltip.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-snug">{tooltip.body}</p>
                <p className="text-xs text-[var(--text-muted)] mt-3">{t.onboarding.clickToContinue}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
