import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import CharacterPortrait from '@/components/portrait/CharacterPortrait'
import PortraitCropModal from '@/components/portrait/PortraitCropModal'
import PortraitQuestCelebration from '@/components/effects/PortraitQuestCelebration'
import { useCustomAvatarSrc } from '@/hooks/useCustomAvatarSrc'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import type { PortraitGender } from '@/store/models'
import { readFileAsDataURL } from '@/utils/fileHelpers'


type Props = {
  gender: PortraitGender
  idle?: boolean
}

export default function DashboardPortrait({ gender, idle = false }: Props) {
  const { t } = useI18n()
  const customAvatarSrc = useCustomAvatarSrc()
  const { setSettings, saveProgress, portraitCelebrateUntil } = useUIStore(
    useShallow((s) => ({
      setSettings: s.setSettings,
      saveProgress: s.saveProgress,
      portraitCelebrateUntil: s.portraitCelebrateUntil,
    })),
  )
  const [celebrateBeam, setCelebrateBeam] = useState(false)
  const [cropSource, setCropSource] = useState<string | null>(null)

  useEffect(() => {
    const remaining = portraitCelebrateUntil - Date.now()
    if (remaining <= 0) {
      setCelebrateBeam(false)
      return
    }
    setCelebrateBeam(true)
    const id = window.setTimeout(() => setCelebrateBeam(false), remaining)
    return () => window.clearTimeout(id)
  }, [portraitCelebrateUntil])
  const pickingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = useCallback(() => {
    if (pickingRef.current) return
    pickingRef.current = true

    if (window.electronAPI?.pickPortraitImage) {
      void window.electronAPI.pickPortraitImage().then((result) => {
        pickingRef.current = false
        if (result.success && result.dataUrl) setCropSource(result.dataUrl)
      })
      return
    }

    const input = fileInputRef.current
    if (!input) {
      pickingRef.current = false
      return
    }
    input.value = ''
    input.click()
    window.setTimeout(() => {
      pickingRef.current = false
    }, 500)
  }, [])

  const handlePortraitClick = useCallback(() => {
    openPicker()
  }, [openPicker])

  const handlePortraitKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openPicker()
      }
    },
    [openPicker],
  )

  const handleFileInputChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    pickingRef.current = false
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataURL(file)
      setCropSource(dataUrl)
    } catch {
      // ignore invalid reads
    }
  }, [])

  const handleConfirmCrop = useCallback(
    async (croppedDataUrl: string) => {
      if (window.electronAPI?.saveCustomAvatar) {
        const result = await window.electronAPI.saveCustomAvatar(croppedDataUrl)
        if (result.success && result.path) {
          setSettings({ customAvatarPath: result.path, customAvatarDataUrl: undefined })
          void saveProgress()
          setCropSource(null)
          return
        }
      }

      setSettings({ customAvatarDataUrl: croppedDataUrl, customAvatarPath: undefined })
      void saveProgress()
      setCropSource(null)
    },
    [saveProgress, setSettings],
  )

  return (
    <>
      <button
        type="button"
        className="dashboard-portrait-hitarea dashboard-hero__portrait-wrap dashboard-hero__portrait dashboard-hero__portrait-wrap--pickable"
        onClick={handlePortraitClick}
        onKeyDown={handlePortraitKeyDown}
        title={t.portrait.customAvatarClickHint ?? t.portrait.customAvatarDoubleClickHint}
        aria-label={t.portrait.customAvatarClickHint ?? t.portrait.customAvatarDoubleClickHint}
      >
        <CharacterPortrait
          gender={gender}
          size="md"
          idle={idle}
          customSrc={customAvatarSrc}
          className={celebrateBeam ? 'character-portrait--quest-complete' : ''}
        />
        <PortraitQuestCelebration active={celebrateBeam} />
        <span className="dashboard-portrait-hitarea__badge" aria-hidden>
          📷
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void handleFileInputChange(event)}
      />

      {cropSource ? (
        <PortraitCropModal
          open
          sourceDataUrl={cropSource}
          onConfirm={(cropped) => void handleConfirmCrop(cropped)}
          onCancel={() => setCropSource(null)}
        />
      ) : null}
    </>
  )
}
