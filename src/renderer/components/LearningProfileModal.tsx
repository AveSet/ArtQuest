import { useState, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { checkAndGenerateDailyQuests } from '@/utils/dailyQuestCoordinator'
import type { LearningProfile } from '@/utils/learningProfile'
import { getDefaultFavoriteCategories } from '@/utils/learningProfile'
import type { PortraitGender } from '@/store/models'
import CharacterPortrait from '@/components/portrait/CharacterPortrait'
import { AnimatedModal } from '@/components/ui/AnimatedOverlay'
import ArtAppPicker from '@/components/settings/ArtAppPicker'
import { DEFAULT_TRACKED_ART_APPS, type ArtAppId } from '../../shared/artApps'
import { pushDesktopIntegrationSync } from '@/utils/desktopIntegration'
import {
  applyExperienceTierToStores,
  type ExperienceTier,
} from '@/utils/experienceTier'

type Props = {
  open: boolean
}

type SetupStep = 'profile' | 'experience' | 'artApps' | 'avatar'

const EXPERIENCE_TIERS: ExperienceTier[] = ['beginner', 'intermediate', 'advanced']

export default function LearningProfileModal({ open }: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const { settings, setSettings, saveProgress } = useUIStore(
    useShallow((s) => ({
      settings: s.settings,
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
    })),
  )
  const [step, setStep] = useState<SetupStep>('profile')
  useFocusTrap(open, panelRef)
  const [pendingProfile, setPendingProfile] = useState<LearningProfile>('drawing')
  const [previewProfile, setPreviewProfile] = useState<LearningProfile>('drawing')
  const [pendingExperienceTier, setPendingExperienceTier] = useState<ExperienceTier>('beginner')
  const [previewGender, setPreviewGender] = useState<PortraitGender>('male')
  const [trackedApps, setTrackedApps] = useState<Set<ArtAppId>>(
    () => new Set(settings.trackedArtApps ?? DEFAULT_TRACKED_ART_APPS),
  )

  const chooseProfile = (profile: LearningProfile) => {
    setPendingProfile(profile)
    setPreviewProfile(profile)
    setStep('experience')
  }

  const experienceLabels: Record<
    ExperienceTier,
    { title: string; hint: string }
  > = {
    beginner: {
      title: t.profile.experienceBeginner ?? 'Beginner',
      hint:
        t.profile.experienceBeginnerFundamentalsHint ??
        t.profile.experienceBeginnerHint ??
        'Start from the basics',
    },
    intermediate: {
      title: t.profile.experienceIntermediate ?? 'Continuing artist',
      hint: t.profile.experienceIntermediateHint ?? 'Skip the easiest drills',
    },
    advanced: {
      title: t.profile.experienceAdvanced ?? 'Experienced',
      hint: t.profile.experienceAdvancedHint ?? 'Focus on harder quests',
    },
  }

  const finishSetup = (gender: PortraitGender) => {
    const trackedArtApps = [...trackedApps]
    const nextSettings = {
      learningProfile: pendingProfile,
      portraitGender: gender,
      profileSetupComplete: true,
      experienceTier: pendingExperienceTier,
      favoriteCategories: getDefaultFavoriteCategories(pendingProfile),
      trackedArtApps,
      activityTrackingEnabled: settings.activityTrackingEnabled !== false,
    }
    applyExperienceTierToStores(pendingExperienceTier)
    setSettings(nextSettings)
    pushDesktopIntegrationSync({ ...settings, ...nextSettings })
    checkAndGenerateDailyQuests()
    void saveProgress()
  }

  return (
    <AnimatedModal
      open={open}
      zClassName="z-[200]"
      overlayClassName="!bg-black/70"
      panelRef={panelRef}
      aria-labelledby="learning-profile-title"
      panelClassName="max-w-lg w-full p-4 text-center max-h-[min(92vh,640px)] overflow-y-auto"
    >
      <div key={step} className="motion-tab-panel-enter">
        {step === 'profile' ? (
          <>
            <h2 id="learning-profile-title" className="heading-2 mb-2">
              {t.profile.welcomeTitle}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">{t.profile.welcomeIntro}</p>
            <div className="profile-setup-picker">
              <button
                type="button"
                onClick={() => chooseProfile('drawing')}
                onMouseEnter={() => setPreviewProfile('drawing')}
                onFocus={() => setPreviewProfile('drawing')}
                className={`profile-setup-picker__side${previewProfile === 'drawing' ? ' profile-setup-picker__side--active' : ''}`}
              >
                <span className="profile-setup-picker__side-label">{t.profile.chooseDrawing}</span>
              </button>
              <div className="profile-setup-picker__preview" aria-hidden>
                <span className="profile-setup-picker__preview-icon">
                  {previewProfile === 'drawing' ? '🎨' : '🎬'}
                </span>
                <p className="profile-setup-picker__preview-caption">
                  {previewProfile === 'drawing' ? t.profile.drawingFocus : t.profile.animationFocus}
                </p>
              </div>
              <button
                type="button"
                onClick={() => chooseProfile('animation')}
                onMouseEnter={() => setPreviewProfile('animation')}
                onFocus={() => setPreviewProfile('animation')}
                className={`profile-setup-picker__side${previewProfile === 'animation' ? ' profile-setup-picker__side--active' : ''}`}
              >
                <span className="profile-setup-picker__side-label">{t.profile.chooseAnimation}</span>
              </button>
            </div>
          </>
        ) : step === 'experience' ? (
          <>
            <h2 id="learning-profile-title" className="heading-2 mb-2">
              {t.profile.experienceTitle ?? 'How would you rate your level?'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {t.profile.experienceIntro ??
                'We will skip very basic exercises if you already have fundamentals.'}
            </p>
            <div className="flex flex-col gap-1.5 text-left">
              {EXPERIENCE_TIERS.map((tier) => {
                const selected = pendingExperienceTier === tier
                const { title, hint } = experienceLabels[tier]
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setPendingExperienceTier(tier)}
                    aria-pressed={selected}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border-secondary)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className="font-semibold text-[var(--text-heading)]">{title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className="btn-secondary text-xs" onClick={() => setStep('profile')}>
                {t.common.back ?? '←'}
              </button>
              <button
                type="button"
                className="btn-primary text-sm px-5"
                onClick={() => setStep('artApps')}
              >
                {t.common.continue}
              </button>
            </div>
          </>
        ) : step === 'artApps' ? (
          <>
            <h2 id="learning-profile-title" className="heading-2 mb-2">
              {t.profile.artAppsTitle ?? 'Which art programs do you use?'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {t.profile.artAppsIntro ??
                'We only count practice time when one of these apps is active.'}
            </p>
            <ArtAppPicker
              tracked={trackedApps}
              onChange={(ids) => setTrackedApps(new Set(ids))}
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className="btn-secondary text-xs" onClick={() => setStep('experience')}>
                {t.common.back ?? '←'}
              </button>
              <button
                type="button"
                className="btn-primary text-sm px-5"
                disabled={trackedApps.size === 0}
                onClick={() => setStep('avatar')}
              >
                {t.common.continue}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="learning-profile-title" className="heading-2 mb-2">
              {t.profile.avatarTitle ?? t.portrait.settingsTitle}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t.profile.avatarIntro ?? t.portrait.settingsHint}
            </p>
            <div className="profile-setup-picker">
              <button
                type="button"
                onClick={() => finishSetup('male')}
                onMouseEnter={() => setPreviewGender('male')}
                onFocus={() => setPreviewGender('male')}
                className={`profile-setup-picker__side${previewGender === 'male' ? ' profile-setup-picker__side--active' : ''}`}
              >
                <span className="profile-setup-picker__side-label">{t.portrait.genderMale}</span>
              </button>
              <div className="profile-setup-picker__preview profile-setup-picker__preview--portrait">
                <CharacterPortrait gender={previewGender} size="md" className="profile-setup-picker__portrait" />
              </div>
              <button
                type="button"
                onClick={() => finishSetup('female')}
                onMouseEnter={() => setPreviewGender('female')}
                onFocus={() => setPreviewGender('female')}
                className={`profile-setup-picker__side${previewGender === 'female' ? ' profile-setup-picker__side--active' : ''}`}
              >
                <span className="profile-setup-picker__side-label">{t.portrait.genderFemale}</span>
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary text-xs mt-4"
              onClick={() => setStep('artApps')}
            >
              {t.common.back ?? '←'}
            </button>
          </>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-4">{t.profile.changeLaterHint}</p>
      </div>
    </AnimatedModal>
  )
}
