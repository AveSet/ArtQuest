import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '@/store/useUIStore'
import { useQuestStore } from '@/store/useQuestStore'
import { checkAndGenerateDailyQuests } from '@/utils/dailyQuestCoordinator'
import { refreshGallerySyncFromDisk } from '@/utils/refreshGallerySync'
import { useI18n } from '@/i18n'
import { LANGUAGES, LANGUAGE_LABELS } from '@/i18n/languages'
import { useThemeStore } from '@/store/useThemeStore'
import type { QuestCategory } from '@/data/skillTree'
import type { LearningProfile } from '@/utils/learningProfile'
import { getDefaultFavoriteCategories } from '@/utils/learningProfile'
import {
  applyExperienceTierToStores,
  type ExperienceTier,
} from '@/utils/experienceTier'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import { getSharedAudioContext, playUiClick } from '@/utils/sound'
import { usesCloudStorage, type StorageMode } from '../../shared/storageMode'
import ConfirmDialog from '@/components/ConfirmDialog'
import ProgressBackupSettings from '@/components/settings/ProgressBackupSettings'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsReferencesSection from '@/components/settings/SettingsReferencesSection'
import QuestSessionShortcutsSettings from '@/components/settings/QuestSessionShortcutsSettings'
import ArtAppsSettings from '@/components/settings/ArtAppsSettings'
import { syncAmbientLoop } from '@/utils/ambientSound'
import { getSessionRitual } from '@/i18n/sessionRitualCopy'
import { settingsChoiceClass, settingsChipClass, settingsOptionClass } from '@/utils/settingsUi'
import type { ReferenceSource } from '@/store/models'

const CATEGORY_ICONS: Record<QuestCategory, string> = {
  drawing: '🎨',
  anatomy: '🦴',
  animation: '🎬',
  effects: '✨',
  storytelling: '📖',
  character_design: '🎭',
  environment: '🏞️',
}

type SettingsTab = 'personal' | 'technical'

const Settings = () => {
  const { theme, setTheme } = useThemeStore(
    useShallow((s) => ({ theme: s.theme, setTheme: s.setTheme })),
  )
  const { settings, setSettings, resetProgress, saveProgress } =
    useUIStore(
      useShallow((s) => ({
        settings: s.settings,
        setSettings: s.setSettings,
        resetProgress: s.resetProgress,
        saveProgress: s.saveProgress,
      })),
    )
  const { t, language, setLanguage } = useI18n()
  const ritual = getSessionRitual(t)
  const visibleCategories = useVisibleCategories()
  const [devMsg, setDevMsg] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [storageMode, setStorageModeState] = useState<StorageMode | null>(null)
  const [storageModeLoaded, setStorageModeLoaded] = useState(false)
  const [googleAccount, setGoogleAccount] = useState<{
    connected: boolean
    accountEmail: string | null
    remoteRootPath: string
  }>({ connected: false, accountEmail: null, remoteRootPath: '/ArtQuest/Gallery' })
  const [cloudMsg, setCloudMsg] = useState('')
  const [cloudMsgKind, setCloudMsgKind] = useState<'error' | 'info'>('info')
  const [needsScopeReconnect, setNeedsScopeReconnect] = useState(false)
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal')

  useEffect(() => {
    if (!window.electronAPI) return
    let cancelled = false
    Promise.all([
      window.electronAPI.getStorageMode?.(),
      window.electronAPI.getGoogleDriveStatus?.(),
    ]).then(([modeResult, statusResult]) => {
      if (cancelled) return
      if (modeResult?.success && modeResult.mode) {
        setStorageModeState(modeResult.mode as StorageMode)
      }
      setStorageModeLoaded(true)
      if (statusResult?.success && statusResult.account) {
        setGoogleAccount({
          connected: statusResult.account.connected,
          accountEmail: statusResult.account.accountEmail,
          remoteRootPath: statusResult.account.remoteRootPath,
        })
        setNeedsScopeReconnect(Boolean(statusResult.needsScopeReconnect))
        setDriveFolderUrl(statusResult.folderWebUrl ?? null)
        if (statusResult.needsScopeReconnect) {
          setCloudMsgKind('error')
          setCloudMsg(t.settings.googleDriveReconnectRequired ?? statusResult.lastUploadError ?? '')
        } else if (statusResult.lastUploadError) {
          setCloudMsgKind('error')
          setCloudMsg(statusResult.lastUploadError)
        }
      }
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [t.settings.googleDriveReconnectRequired])

  const updateStorageMode = async (mode: StorageMode) => {
    playUiClick()
    setStorageModeState(mode)
    const result = await window.electronAPI?.setStorageMode?.(mode)
    if (result && !result.success) {
      setCloudMsgKind('error')
      setCloudMsg(String(result.error ?? t.settings.storageUpdateFailed!))
    }
  }

  const connectGoogle = async () => {
    playUiClick()
    setCloudMsg('')
    setCloudMsgKind('info')
    const result = await window.electronAPI?.connectGoogleDrive?.()
    if (result?.success && result.account) {
      setGoogleAccount({
        connected: result.account.connected,
        accountEmail: result.account.accountEmail,
        remoteRootPath: result.account.remoteRootPath,
      })
      setNeedsScopeReconnect(false)
      const status = await window.electronAPI?.getGoogleDriveStatus?.()
      setDriveFolderUrl(status?.folderWebUrl ?? null)
    } else if (result?.error) {
      setCloudMsgKind('error')
      setCloudMsg(result.error)
    }
  }

  const disconnectGoogle = async () => {
    playUiClick()
    setCloudMsg('')
    setCloudMsgKind('info')
    const result = await window.electronAPI?.disconnectGoogleDrive?.()
    if (result?.success && result.account) {
      setGoogleAccount({
        connected: result.account.connected,
        accountEmail: result.account.accountEmail,
        remoteRootPath: result.account.remoteRootPath,
      })
      setNeedsScopeReconnect(false)
      setDriveFolderUrl(null)
    } else if (result?.error) {
      setCloudMsgKind('error')
      setCloudMsg(result.error)
    }
  }

  const updateGooglePath = async (remoteRootPath: string) => {
    setGoogleAccount(prev => ({ ...prev, remoteRootPath }))
    const result = await window.electronAPI?.setGoogleDrivePath?.(remoteRootPath)
    if (result?.success && result.account) {
      setGoogleAccount({
        connected: result.account.connected,
        accountEmail: result.account.accountEmail,
        remoteRootPath: result.account.remoteRootPath,
      })
    } else if (result?.error) {
      setCloudMsgKind('error')
      setCloudMsg(result.error)
    }
  }

  const syncCloudGallery = async () => {
    playUiClick()
    setCloudMsg('')
    const result = await window.electronAPI?.syncGallery?.()
    if (!result?.success) {
      setCloudMsgKind('error')
      setCloudMsg(result?.error ?? t.settings.syncFailed!)
      return
    }
    await refreshGallerySyncFromDisk()
    const status = await window.electronAPI?.getGoogleDriveStatus?.()
    setDriveFolderUrl(status?.folderWebUrl ?? null)
    if (result.needsScopeReconnect) {
      setNeedsScopeReconnect(true)
      setCloudMsgKind('error')
      setCloudMsg(t.settings.googleDriveReconnectRequired ?? result.lastError ?? '')
      return
    }
    if ((result.failed ?? 0) > 0) {
      setCloudMsgKind('error')
      setCloudMsg(result.lastError ?? t.gallery.cloudFailed)
      return
    }
    setNeedsScopeReconnect(false)
    setCloudMsgKind('info')
    const downloaded = result.downloaded ?? 0
    const uploaded = result.uploaded ?? 0
    const linked = result.linked ?? 0
    const template =
      t.settings.cloudSyncDone ??
      'Sync complete. Downloaded {downloaded}, uploaded {uploaded}, linked {linked}.'
    setCloudMsg(
      template
        .replace('{downloaded}', String(downloaded))
        .replace('{uploaded}', String(uploaded))
        .replace('{linked}', String(linked)),
    )
    void saveProgress()
  }

  const openDriveFolder = async () => {
    playUiClick()
    const url = driveFolderUrl ?? (await window.electronAPI?.getGoogleDriveStatus?.())?.folderWebUrl
    if (url) {
      await window.electronAPI?.openExternal?.(url)
    } else {
      setCloudMsgKind('info')
      setCloudMsg(t.settings.googleDriveFolderPending ?? 'Run Sync first to create the Google Drive folder.')
    }
  }

  const setLearningProfile = (profile: LearningProfile) => {
    setSettings({
      learningProfile: profile,
      favoriteCategories: getDefaultFavoriteCategories(profile),
    })
    checkAndGenerateDailyQuests()
    void saveProgress()
  }

  const setExperienceTier = (tier: ExperienceTier) => {
    if ((settings.experienceTier ?? 'beginner') === tier) return
    playUiClick()
    applyExperienceTierToStores(tier)
    setSettings({ experienceTier: tier })
    checkAndGenerateDailyQuests()
    void saveProgress()
  }

  const experienceTierOptions: { tier: ExperienceTier; label: string }[] = [
    { tier: 'beginner', label: t.profile.experienceBeginner ?? 'Beginner' },
    { tier: 'intermediate', label: t.profile.experienceIntermediate ?? 'Continuing artist' },
    { tier: 'advanced', label: t.profile.experienceAdvanced ?? 'Experienced' },
  ]

  const setPortraitGender = (gender: 'male' | 'female') => {
    setSettings({ portraitGender: gender })
    void saveProgress()
  }

  const toggleFavoriteCategory = (cat: QuestCategory) => {
    const current = settings.favoriteCategories || []
    let next: QuestCategory[]
    if (current.includes(cat)) {
      next = current.filter(c => c !== cat)
    } else if (current.length < 3) {
      next = [...current, cat]
    } else {
      return
    }
    setSettings({ favoriteCategories: next })
    checkAndGenerateDailyQuests()
    void saveProgress()
  }

  const testSound = () => {
    if (!settings.soundEnabled) return
    try {
      const ctx = getSharedAudioContext()
      if (!ctx) return
      const vol = settings.soundVolume
      const playTone = (freq: number, dur: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = type
        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)
        osc.start()
        osc.stop(ctx.currentTime + dur)
      }
      playTone(523.25, 0.08, 'triangle')
      setTimeout(() => playTone(659.25, 0.08, 'sine'), 90)
      setTimeout(() => playTone(783.99, 0.12, 'triangle'), 180)
    } catch(e) { console.error('Sound test failed:', e) }
  }

  const storageModeLabels: Record<StorageMode, string> = {
    local: t.settings.storageLocal ?? 'Local only',
    local_and_cloud: t.settings.storageLocalAndCloud ?? 'Local + cloud',
    cloud_only: t.settings.storageCloudOnly ?? 'Cloud only',
  }
  const referenceSourceLabels: Record<ReferenceSource, string> = {
    pinterest: t.resources.referenceSourcePinterest ?? 'Pinterest',
    youtube: t.resources.referenceSourceYoutube ?? 'YouTube Long',
    artstation: t.resources.referenceSourceArtstation ?? 'ArtStation',
    google: t.resources.referenceSourceGoogle ?? 'Google Images',
  }

  return (
    <div className="container-fantasy settings-page" data-onboarding="page-settings">
      <div className="settings-tabs" role="tablist" aria-label={t.settings.title}>
        {([
          { id: 'personal' as const, label: t.settings.personalizationSection ?? 'Personalization' },
          { id: 'technical' as const, label: t.settings.technicalSection ?? 'Technical' },
        ]).map(({ id, label }) => {
          const selected = activeTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`settings-tab-btn${selected ? ' settings-tab-btn--active' : ''}`}
              onClick={() => {
                playUiClick()
                setActiveTab(id)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="settings-grid">
        {activeTab === 'personal' ? (
        <div className="settings-block">
          <SettingsSection title={`👤 ${t.profile.settingsTitle}`} testId="learning-profile-settings">
            <p className="text-xs text-[var(--text-muted)]">{t.profile.settingsHint}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {(['drawing', 'animation'] as const).map((profile) => {
                const selected = (settings.learningProfile ?? 'animation') === profile
                return (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => {
                      playUiClick()
                      setLearningProfile(profile)
                    }}
                    aria-pressed={selected}
                    className={settingsChoiceClass(selected)}
                  >
                    {profile === 'drawing' ? `🎨 ${t.profile.chooseDrawing}` : `🎬 ${t.profile.chooseAnimation}`}
                  </button>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection
            title={`📊 ${t.profile.experienceSettingsTitle ?? 'Skill level'} · ${t.sessionRitual?.energyModeLabel ?? 'Session length'}`}
          >
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {(t.profile.experienceSettingsHint ??
                'Affects daily quest difficulty and recommendations.')}{' '}
              {t.profile.experienceChangeWarning ?? "Changing level recalculates today's daily quests."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {experienceTierOptions.map(({ tier, label }) => {
                const selected = (settings.experienceTier ?? 'beginner') === tier
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setExperienceTier(tier)}
                    aria-pressed={selected}
                    className={settingsChoiceClass(selected, true)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 mb-1.5">
              {t.sessionRitual?.energyModeHint ?? 'Shorter sessions prioritize quick quests in recommendations.'}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { mode: 'short' as const, label: t.sessionRitual?.energyShort ?? 'Short (≤15 min)' },
                { mode: 'medium' as const, label: t.sessionRitual?.energyMedium ?? 'Medium (≤30 min)' },
                { mode: 'long' as const, label: t.sessionRitual?.energyLong ?? 'Long (≤60 min)' },
              ]).map(({ mode, label }) => {
                const selected = (settings.energyMode ?? 'medium') === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      playUiClick()
                      setSettings({ energyMode: mode })
                      void saveProgress()
                    }}
                    aria-pressed={selected}
                    className={settingsChoiceClass(selected, true)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection title={`🎯 ${t.settings.favoriteCategories}`} defaultOpen={false}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--text-muted)]">{t.settings.selectUpToThree}</p>
              <button
                id="random-categories"
                type="button"
                role="switch"
                aria-checked={settings.useRandomCategories}
                aria-label={t.settings.randomCategories}
                title={t.settings.randomCategoriesHint}
                onClick={() => {
                  playUiClick()
                  setSettings({ useRandomCategories: !settings.useRandomCategories })
                  checkAndGenerateDailyQuests()
                  void saveProgress()
                }}
                className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer shrink-0"
              >
                <span>{t.settings.randomCategories}</span>
                <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${settings.useRandomCategories ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.useRandomCategories ? 'translate-x-4' : 'translate-x-0'}`} />
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleCategories.map((key) => {
                const icon = CATEGORY_ICONS[key] ?? '⭐'
                const isSelected = (settings.favoriteCategories || []).includes(key)
                const disabled = !isSelected && (settings.favoriteCategories || []).length >= 3
                return (
                  <button key={key} type="button" onClick={() => {
                    if (disabled) return
                    playUiClick()
                    toggleFavoriteCategory(key)
                  }}
                    className={settingsChipClass(isSelected, disabled)}
                  >
                    {icon} {t.categories[key]}
                  </button>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection title={`🌐 ${t.settings.language}`} defaultOpen={false}>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map(lang => {
                const meta = LANGUAGE_LABELS[lang]
                return (
                  <label key={lang} className={`${settingsOptionClass(language === lang)} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)]`}>
                    <input type="radio" name="language" value={lang} checked={language === lang} onChange={() => { playUiClick(); setLanguage(lang) }} className="sr-only" />
                    <span>{meta.flag} {meta.native}</span>
                  </label>
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection title={`🖼️ ${t.portrait.settingsTitle} · ${t.settings.theme}`} defaultOpen={false}>
            <p className="text-xs text-[var(--text-muted)] mb-2">{t.portrait.settingsHint}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="grid grid-cols-2 gap-1.5">
                {(['male', 'female'] as const).map((gender) => {
                  const selected = (settings.portraitGender ?? 'male') === gender
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => {
                        playUiClick()
                        setPortraitGender(gender)
                      }}
                      aria-pressed={selected}
                      className={settingsChoiceClass(selected, true)}
                    >
                      {gender === 'male' ? `👨 ${t.portrait.genderMale}` : `👩 ${t.portrait.genderFemale}`}
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['modern', 'light', 'rpg', 'studio'] as const).map(themeKey => (
                  <label key={themeKey} className={`${settingsOptionClass(theme === themeKey)} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)]`}>
                    <input type="radio" name="theme" value={themeKey} checked={theme === themeKey} onChange={() => { playUiClick(); setTheme(themeKey) }} className="sr-only" />
                    <span>
                      {themeKey === 'modern' ? '🌙' : themeKey === 'light' ? '☀️' : themeKey === 'rpg' ? '🐉' : '🖊️'}{' '}
                      {themeKey === 'modern' ? t.settings.themeModern : themeKey === 'light' ? t.settings.themeLight : themeKey === 'rpg' ? t.settings.themeRpg : (t.settings.themeStudio ?? ritual.studioThemeLabel)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </SettingsSection>

          <SettingsReferencesSection
            settings={settings}
            setSettings={setSettings}
            saveProgress={saveProgress}
            t={t}
            googleConnected={googleAccount.connected}
            googleAccountEmail={googleAccount.accountEmail}
            referenceSourceLabels={referenceSourceLabels}
          />
        </div>
        ) : (
        <div className="settings-block">
          <ProgressBackupSettings />
          {typeof window !== 'undefined' && window.electronAPI && (
            <SettingsSection title={`💾 ${t.settings.storageSection}`} defaultOpen={false}>
              <p className="text-xs text-[var(--text-muted)]">{t.settings.storageLocalHint}</p>
              {!storageModeLoaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['local', 'local_and_cloud', 'cloud_only'] as const).map((mode) => (
                    <div key={mode} className="h-9 rounded-xl bg-[var(--bg-secondary)] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['local', 'local_and_cloud', 'cloud_only'] as const).map((mode) => {
                    const selected = storageMode === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => void updateStorageMode(mode)}
                        className={settingsChoiceClass(selected, true)}
                      >
                        {storageModeLabels[mode]}
                      </button>
                    )
                  })}
                </div>
              )}

              {storageModeLoaded && storageMode && usesCloudStorage(storageMode) && (
                <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.settings.googleDrive}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {googleAccount.connected ? t.settings.connected : t.settings.notConnected}
                        {googleAccount.accountEmail ? ` · ${googleAccount.accountEmail}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={googleAccount.connected ? 'btn-secondary text-xs px-3 py-1.5' : 'btn-primary text-xs px-3 py-1.5'}
                      onClick={() => void (googleAccount.connected ? disconnectGoogle() : connectGoogle())}
                    >
                      {googleAccount.connected ? t.settings.disconnectGoogle : t.settings.connectGoogle}
                    </button>
                  </div>

                  {googleAccount.connected && (
                    <div>
                      <label htmlFor="google-drive-path" className="block text-xs text-[var(--text-muted)] mb-1">
                        {t.settings.googleDrivePath}
                      </label>
                      <input
                        id="google-drive-path"
                        type="text"
                        className="w-full rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={googleAccount.remoteRootPath}
                        onChange={(e) => setGoogleAccount(prev => ({ ...prev, remoteRootPath: e.target.value }))}
                        onBlur={(e) => void updateGooglePath(e.target.value)}
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1">{t.settings.googleDrivePathHint}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{t.settings.googleDriveCloudHint}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3 py-1.5"
                          onClick={() => void syncCloudGallery()}
                        >
                          {t.settings.cloudSync ?? t.settings.retryCloudUpload ?? 'Synchronize'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3 py-1.5"
                          onClick={() => void openDriveFolder()}
                        >
                          {t.settings.googleDriveOpenFolder ?? 'Open Google Drive folder'}
                        </button>
                      </div>
                    </div>
                  )}

                  {needsScopeReconnect && googleAccount.connected && (
                    <p className="text-xs text-[var(--status-danger-text)]">
                      {t.settings.googleDriveReconnectRequired}
                    </p>
                  )}

                  <p className="text-xs text-[var(--text-muted)]">{t.settings.cloudSecurityHint}</p>
                  {cloudMsg && (
                    <p
                      className={
                        cloudMsgKind === 'error'
                          ? 'text-xs text-[var(--status-danger-text)]'
                          : 'text-xs text-[var(--text-muted)]'
                      }
                    >
                      {cloudMsg}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-[var(--text-muted)]">{t.settings.privacyLocalOnly}</p>
            </SettingsSection>
          )}

          <SettingsSection title={`🔊 ${t.settings.sound}`} collapsible={false} defaultOpen={false}>
              <div className="settings-toggle-row">
                <label htmlFor="sound-enabled" className="settings-row-label">{t.settings.enableSounds}</label>
                <button
                  id="sound-enabled"
                  type="button"
                  role="switch"
                  aria-checked={settings.soundEnabled}
                  aria-label={t.settings.enableSounds}
                  onClick={() => {
                    playUiClick()
                    setSettings({ soundEnabled: !settings.soundEnabled })
                    void saveProgress()
                  }}
                  className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.soundEnabled ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label={t.settings.sound}
                  value={Math.round(settings.soundVolume * 100)}
                  onChange={(e) => { setSettings({ soundVolume: parseInt(e.target.value) / 100 }) }}
                  className="flex-1 h-1.5 accent-[var(--gold-primary)]"
                />
                <span className="text-gold font-mono text-xs w-10 text-right">{Math.round(settings.soundVolume * 100)}%</span>
                <button type="button" onClick={() => { playUiClick(); testSound() }} className="btn-primary text-xs px-2 py-1" aria-label={t.settings.testSound}>🔔</button>
              </div>
              <div className="settings-toggle-row pt-1">
                <label htmlFor="ambient-enabled" className="settings-row-label">
                  {t.settings.ambientEnabled ?? 'Ambient practice'}
                </label>
                <button
                  id="ambient-enabled"
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.ambientEnabled)}
                  onClick={() => {
                    playUiClick()
                    setSettings({ ambientEnabled: !settings.ambientEnabled })
                    syncAmbientLoop()
                    void saveProgress()
                  }}
                  className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.ambientEnabled ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.ambientEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              {settings.ambientEnabled && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{t.settings.ambientVolume ?? 'Ambient'}</span>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    aria-label={t.settings.ambientVolume ?? 'Ambient volume'}
                    value={Math.round((settings.ambientVolume ?? 0.08) * 100)}
                    onChange={(e) => {
                      setSettings({ ambientVolume: parseInt(e.target.value, 10) / 100 })
                      syncAmbientLoop()
                    }}
                    className="flex-1 h-1.5 accent-[var(--gold-primary)]"
                  />
                </div>
              )}
              {settings.ambientEnabled && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-[var(--text-muted)] w-full">{ritual.ambientPresetLabel}</span>
                  {(['rain', 'cafe', 'fireplace'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={settingsChipClass(
                        (settings.ambientPreset === preset) ||
                          (preset === 'rain' && (settings.ambientPreset === 'quiet' || !settings.ambientPreset)) ||
                          (preset === 'cafe' && settings.ambientPreset === 'studio') ||
                          (preset === 'fireplace' && settings.ambientPreset === 'rpg'),
                      )}
                      onClick={() => {
                        playUiClick()
                        setSettings({ ambientPreset: preset })
                        syncAmbientLoop()
                      }}
                    >
                      {preset === 'rain' ? ritual.ambientRain : preset === 'cafe' ? ritual.ambientCafe : ritual.ambientFireplace}
                    </button>
                  ))}
                </div>
              )}
            </SettingsSection>

          <SettingsSection
            title={`🧭 ${t.settings.fullAppTour ?? t.settings.showWelcomeTipsAgain}`}
            collapsible={false}
            defaultOpen={false}
          >
              <p className="text-xs text-[var(--text-muted)]">{t.settings.showWelcomeTipsAgain}</p>
              <button
                type="button"
                data-onboarding="full-tour-button"
                className="btn-secondary text-xs px-3 py-1.5 w-full sm:w-auto"
                onClick={() => {
                  playUiClick()
                  useUIStore.getState().requestFullOnboarding()
                }}
              >
                {t.settings.fullAppTour ?? t.settings.showWelcomeTipsAgain}
              </button>
          </SettingsSection>

          {typeof window !== 'undefined' && window.electronAPI && (
            <SettingsSection title={`🖥 ${t.settings.desktopSection}`} defaultOpen={false}>
              <div className="settings-toggle-row">
                <label htmlFor="minimize-tray" className="settings-row-label">{t.settings.minimizeToTray}</label>
                <button
                  id="minimize-tray"
                  type="button"
                  role="switch"
                  aria-checked={settings.minimizeToTray}
                  aria-label={t.settings.minimizeToTray}
                  onClick={() => {
                    playUiClick()
                    setSettings({ minimizeToTray: !settings.minimizeToTray })
                    void saveProgress()
                  }}
                  className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.minimizeToTray ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.minimizeToTray ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="settings-toggle-row">
                <label htmlFor="login-start" className="settings-row-label">{t.settings.openAtLogin}</label>
                <button
                  id="login-start"
                  type="button"
                  role="switch"
                  aria-checked={settings.openAtLogin}
                  aria-label={t.settings.openAtLogin}
                  onClick={() => {
                    playUiClick()
                    setSettings({ openAtLogin: !settings.openAtLogin })
                    void saveProgress()
                  }}
                  className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.openAtLogin ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.openAtLogin ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="flex-1 min-w-0">
                  <div id="reminder-toggle-label" className="settings-row-label">{t.settings.reminders}</div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t.settings.remindersHint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-labelledby="reminder-toggle-label"
                  aria-checked={settings.remindersEnabled}
                  onClick={() => {
                    playUiClick()
                    setSettings({ remindersEnabled: !settings.remindersEnabled })
                    void saveProgress()
                  }}
                  className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.remindersEnabled ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.remindersEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div>
                <label htmlFor="reminder-time" className="block text-xs text-[var(--text-muted)] mb-1">{t.settings.reminderTime}</label>
                <input
                  id="reminder-time"
                  type="time"
                  className="w-full max-w-[12rem] rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={`${String(settings.reminderHour).padStart(2, '0')}:${String(settings.reminderMinute).padStart(2, '0')}`}
                  disabled={!settings.remindersEnabled}
                  onChange={e => {
                    const parts = e.target.value.split(':')
                    const hh = Number(parts[0] ?? '0')
                    const mm = Number(parts[1] ?? '0')
                    setSettings({
                      reminderHour: Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 0,
                      reminderMinute: Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0,
                    })
                    void saveProgress()
                  }}
                />
              </div>

              <button
                type="button"
                disabled={!settings.remindersEnabled}
                onClick={async () => {
                  playUiClick()
                  await window.electronAPI!.showTestNotification!({
                    title: t.desktop.reminderTitle,
                    body: t.desktop.reminderBody,
                  })
                }}
                className="btn-secondary text-xs px-3 py-1.5 w-full disabled:opacity-40"
              >
                {t.settings.testNotification}
              </button>
            </SettingsSection>
          )}

          <ArtAppsSettings />
          <QuestSessionShortcutsSettings />

          <SettingsSection title={`♿ ${t.settings.accessibilitySection}`} defaultOpen={false}>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">{t.settings.fontScale}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.settings.fontScale}>
                {(['small', 'medium', 'large'] as const).map(scale => (
                  <button
                    key={scale}
                    type="button"
                    aria-pressed={settings.fontScale === scale}
                    onClick={() => {
                      playUiClick()
                      setSettings({ fontScale: scale })
                      void saveProgress()
                    }}
                    className={settingsChipClass(settings.fontScale === scale)}
                  >
                    {scale === 'small' ? t.settings.fontSmall : scale === 'medium' ? t.settings.fontMedium : t.settings.fontLarge}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-toggle-row">
              <label htmlFor="high-contrast" className="settings-row-label">{t.settings.highContrast}</label>
              <button
                id="high-contrast"
                type="button"
                role="switch"
                aria-checked={settings.contrastBoost}
                aria-label={t.settings.highContrast}
                onClick={() => {
                  playUiClick()
                  setSettings({ contrastBoost: !settings.contrastBoost })
                  void saveProgress()
                }}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.contrastBoost ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.contrastBoost ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="settings-toggle-row">
              <label htmlFor="reduce-motion" className="settings-row-label">{t.settings.reduceMotion}</label>
              <button
                id="reduce-motion"
                type="button"
                role="switch"
                aria-checked={settings.reduceMotion}
                aria-label={t.settings.reduceMotion}
                onClick={() => {
                  playUiClick()
                  setSettings({ reduceMotion: !settings.reduceMotion })
                  void saveProgress()
                }}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.reduceMotion ? 'bg-[var(--gold-primary)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform ${settings.reduceMotion ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </SettingsSection>

          <div className="card-fantasy border-red-900/40 flex items-center justify-between py-2 px-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--status-danger-text)' }}>⚠️ {t.common.resetProgress}</span>
            <button
              type="button"
              onClick={() => {
                playUiClick()
                setShowResetConfirm(true)
              }}
              className="btn-primary btn-danger text-xs px-3 py-1.5"
              aria-label={t.common.resetProgress}
            >
              🗑️
            </button>
          </div>

          {import.meta.env.DEV && (
            <details className="card-fantasy border-yellow-700/40 opacity-60 hover:opacity-100 transition-opacity">
              <summary className="text-xs text-yellow-400 font-semibold cursor-pointer select-none">🧪 {t.settings.devToolsTitle}</summary>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-400">{t.settings.devAdvanceDayHint}</p>
                {devMsg && <p className="text-xs text-status-success">{devMsg}</p>}
                <button onClick={() => {
                  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
                  const y = tomorrow.getFullYear(); const m = String(tomorrow.getMonth() + 1).padStart(2, '0'); const d = String(tomorrow.getDate()).padStart(2, '0')
                  const dateStr = `${y}-${m}-${d}`
                  useQuestStore.getState().setDailyQuestsDate(dateStr)
                  checkAndGenerateDailyQuests(dateStr)
                  saveProgress()
                  setDevMsg((t.settings.devDateShifted ?? '').replace('{date}', dateStr))
                }} className="btn-primary text-xs px-3 py-1.5 bg-yellow-700/60 hover:bg-yellow-600/80 border-yellow-600">📅 {t.settings.devDayPlusOne}</button>
              </div>
            </details>
          )}
        </div>
        )}
      </div>
      <ConfirmDialog
        open={showResetConfirm}
        title={t.common.resetProgress}
        message={t.common.resetConfirm}
        variant="danger"
        confirmLabel={t.common.confirm}
        onConfirm={() => {
          setShowResetConfirm(false)
          void resetProgress()
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  )
}

export default Settings
