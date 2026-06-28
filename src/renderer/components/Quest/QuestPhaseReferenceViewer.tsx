import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore } from '@/store/useQuestStore'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'
import { readSavedMediaCached } from '@/utils/readImageCache'
import type { QuestPhaseMediaEntry } from '@/store/models'

type Props = {
  questId: number
  phaseKey: string
}

const EMPTY_ENTRIES: QuestPhaseMediaEntry[] = []

function PhaseMediaSlide({ entry, compact = false }: { entry: QuestPhaseMediaEntry; compact?: boolean }) {
  const [src, setSrc] = useState<string | null>(entry.dataUrl ?? null)

  useEffect(() => {
    if (entry.dataUrl) {
      setSrc(entry.dataUrl)
      return
    }
    if (!entry.path) return
    let cancelled = false
    void readSavedMediaCached(entry.path).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [entry.dataUrl, entry.path])

  if (!src) {
    return (
      <div className="quest-phase-reference__placeholder" aria-hidden>
        …
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={compact ? 'quest-phase-reference__thumb-img' : 'fundamentals-book-hero__img'}
      draggable={false}
    />
  )
}

export default function QuestPhaseReferenceViewer({ questId, phaseKey }: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const { entries, appendPhaseMedia, removePhaseMediaEntry } = useQuestStore(
    useShallow((s) => ({
      entries: s.questPhaseMedia[String(questId)]?.[phaseKey] ?? EMPTY_ENTRIES,
      appendPhaseMedia: s.appendPhaseMediaFromFile,
      removePhaseMediaEntry: s.removePhaseMediaEntry,
    })),
  )

  useEffect(() => {
    setHeroIndex(0)
  }, [phaseKey, entries.length])

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const picked = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (picked.length === 0) return
      playUiClick()
      let added = 0
      for (const file of picked) {
        const ok = await appendPhaseMedia(questId, phaseKey, file)
        if (ok) added += 1
      }
      if (added > 0) {
        setHeroIndex(entries.length + added - 1)
      }
    },
    [appendPhaseMedia, entries.length, phaseKey, questId],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) void addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  useEffect(() => {
    const el = frameRef.current
    if (!el || entries.length <= 1) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setHeroIndex((idx) => {
        if (e.deltaY > 0) return Math.min(entries.length - 1, idx + 1)
        return Math.max(0, idx - 1)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [entries.length])

  const hint =
    t.quests.phaseMediaHint ??
    'Add reference images or GIFs for this phase — scroll to switch, they stay saved for next time.'
  const addLabel = t.quests.phaseMediaAdd ?? '🖼 Add reference'
  const dropLabel = t.quests.phaseMediaDrop ?? 'Drop image or GIF here, or click to choose'

  if (entries.length === 0) {
    return (
      <div className="fundamentals-book-hero quest-phase-reference">
        <div
          ref={frameRef}
          className={`quest-phase-reference__drop${dragOver ? ' quest-phase-reference__drop--active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="quest-phase-reference__drop-label">{dropLabel}</p>
          <p className="quest-phase-reference__drop-hint text-[10px] text-[var(--text-muted)] mt-1">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  const current = entries[heroIndex] ?? entries[0]!

  return (
    <div className="fundamentals-book-hero quest-phase-reference">
      <div
        ref={frameRef}
        className={`fundamentals-book-hero__frame quest-phase-reference__frame${dragOver ? ' quest-phase-reference__frame--active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <PhaseMediaSlide entry={current} />
        {entries.length > 1 ? (
          <span className="quest-phase-reference__counter" aria-live="polite">
            {heroIndex + 1} / {entries.length}
          </span>
        ) : null}
        <button
          type="button"
          className="quest-phase-reference__remove"
          onClick={() => {
            playUiClick()
            void removePhaseMediaEntry(questId, phaseKey, heroIndex)
          }}
          aria-label={t.common.removeUpload ?? 'Remove'}
        >
          ×
        </button>
      </div>
      {entries.length > 1 ? (
        <div className="fundamentals-book-scroll flex gap-2 overflow-x-auto pb-1 mt-2 snap-x snap-mandatory">
          {entries.map((entry, index) => (
            <button
              key={entry.id ?? `${entry.addedAt}-${index}`}
              type="button"
              className={`quest-phase-reference__thumb snap-start shrink-0 rounded-lg border overflow-hidden ${
                index === heroIndex
                  ? 'border-[var(--accent)]'
                  : 'border-[var(--border-secondary)]'
              }`}
              onClick={() => setHeroIndex(index)}
            >
              <PhaseMediaSlide entry={entry} compact />
            </button>
          ))}
        </div>
      ) : null}
      <div className="quest-phase-reference__actions">
        <button
          type="button"
          className="btn-secondary text-xs py-1 px-2"
          onClick={() => inputRef.current?.click()}
        >
          {addLabel}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
