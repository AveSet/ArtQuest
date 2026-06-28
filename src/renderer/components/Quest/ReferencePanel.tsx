import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useImageColorPicker } from '@/hooks/useImageColorPicker'
import { useQuestStore } from '@/store/useQuestStore'
import type { QuestSavedReference } from '@/store/models'
import { readSavedMediaCached } from '@/utils/readImageCache'

type GridType = 'thirds' | 'golden' | 'diagonal'

interface Swatch {
  hex: string
  rgb: string
  hsl: string
}

function GridOverlay({ type, opacity }: { type: GridType; opacity: number }) {
  const scale = (x: number) => `${x * 100}%`
  switch (type) {
    case 'thirds':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
          <line x1={scale(1 / 3)} y1="0" x2={scale(1 / 3)} y2="100%" stroke="red" strokeWidth="1" />
          <line x1={scale(2 / 3)} y1="0" x2={scale(2 / 3)} y2="100%" stroke="red" strokeWidth="1" />
          <line y1={scale(1 / 3)} x1="0" y2={scale(1 / 3)} x2="100%" stroke="red" strokeWidth="1" />
          <line y1={scale(2 / 3)} x1="0" y2={scale(2 / 3)} x2="100%" stroke="red" strokeWidth="1" />
        </svg>
      )
    case 'golden': {
      const w = 100
      const h = w / 1.618
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${w} ${w}`} preserveAspectRatio="none" style={{ opacity }}>
          <rect x="0" y="0" width={w} height={w} fill="none" stroke="rgba(255,0,0,0.5)" strokeWidth="0.5" />
          <line x1={w - h} y1="0" x2={w - h} y2={w} stroke="red" strokeWidth="0.5" />
          <line x1="0" y1={w - h} x2={w} y2={w - h} stroke="red" strokeWidth="0.5" />
        </svg>
      )
    }
    case 'diagonal':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="red" strokeWidth="1" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="red" strokeWidth="1" />
        </svg>
      )
  }
}

function SavedReferenceThumb({
  refItem,
  selected,
  onSelect,
  onRemove,
  removeLabel,
}: {
  refItem: QuestSavedReference
  selected: boolean
  onSelect: () => void
  onRemove: () => void
  removeLabel: string
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void readSavedMediaCached(refItem.path).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [refItem.path])

  return (
    <div className={`reference-saved-thumb${selected ? ' reference-saved-thumb--selected' : ''}`}>
      <button type="button" className="reference-saved-thumb__btn" onClick={onSelect}>
        {src ? (
          <img src={src} alt="" className="reference-saved-thumb__img" loading="lazy" />
        ) : (
          <span className="reference-saved-thumb__placeholder" aria-hidden />
        )}
      </button>
      <button
        type="button"
        className="reference-saved-thumb__remove"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        ×
      </button>
    </div>
  )
}

type ReferencePanelProps = {
  questId: number
  onClose?: () => void
}

const EMPTY_SAVED_REFS: QuestSavedReference[] = []

export default function ReferencePanel({ questId, onClose }: ReferencePanelProps) {
  const { t } = useI18n()
  const { savedRefs, addQuestReferenceFromFile, removeQuestReference } = useQuestStore(
    useShallow((s) => ({
      savedRefs: s.questSavedReferences[String(questId)] ?? EMPTY_SAVED_REFS,
      addQuestReferenceFromFile: s.addQuestReferenceFromFile,
      removeQuestReference: s.removeQuestReference,
    })),
  )

  const [activeTab, setActiveTab] = useState<'reference' | 'grid' | 'pipette'>('reference')
  const [panelWidth, setPanelWidth] = useState(320)
  const resizingRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useFocusTrap(true, panelRef)

  const [selectedRefId, setSelectedRefId] = useState<string | null>(null)
  const selectedRef = useMemo(
    () => savedRefs.find((r) => r.id === selectedRefId) ?? savedRefs[savedRefs.length - 1] ?? null,
    [savedRefs, selectedRefId],
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!selectedRef) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    void readSavedMediaCached(selectedRef.path).then((url) => {
      if (!cancelled) setPreviewUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [selectedRef])

  useEffect(() => {
    if (savedRefs.length === 0) {
      setSelectedRefId(null)
      return
    }
    if (!selectedRefId || !savedRefs.some((r) => r.id === selectedRefId)) {
      setSelectedRefId(savedRefs[savedRefs.length - 1]!.id)
    }
  }, [savedRefs, selectedRefId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const ingestFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setAdding(true)
      const ok = await addQuestReferenceFromFile(questId, file)
      setAdding(false)
      if (ok) {
        const latest = useQuestStore.getState().questSavedReferences[String(questId)] ?? []
        const last = latest[latest.length - 1]
        if (last) setSelectedRefId(last.id)
      }
    },
    [addQuestReferenceFromFile, questId],
  )

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            void ingestFile(file)
            break
          }
        }
      }
    },
    [ingestFile],
  )

  useEffect(() => {
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onPaste])

  const [gridType, setGridType] = useState<GridType>('thirds')
  const [gridOpacity, setGridOpacity] = useState(0.4)

  const { loadImage, pickColor } = useImageColorPicker()
  const colorImgRef = useRef<HTMLImageElement | null>(null)
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string; hsl: string } | null>(null)
  const [swatches, setSwatches] = useState<Swatch[]>([])
  const [pipetteImage, setPipetteImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => () => {
    resizingRef.current = false
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    resizingRef.current = true
    e.preventDefault()
    let rafId = 0
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        const newWidth = Math.max(240, Math.min(600, window.innerWidth - ev.clientX))
        setPanelWidth(newWidth)
      })
    }
    const onUp = () => {
      resizingRef.current = false
      if (rafId) window.cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const handleColorPick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      if (!colorImgRef.current) {
        const imgEl = new Image()
        if (!img.src.startsWith('blob:') && !img.src.startsWith('data:')) {
          imgEl.crossOrigin = 'anonymous'
        }
        imgEl.onload = () => {
          colorImgRef.current = imgEl
          loadImage(imgEl)
          const rect = img.getBoundingClientRect()
          const x = Math.round((e.clientX - rect.left) * (imgEl.naturalWidth / rect.width))
          const y = Math.round((e.clientY - rect.top) * (imgEl.naturalHeight / rect.height))
          const color = pickColor(x, y)
          if (color) {
            setPickedColor({
              hex: color.hex,
              rgb: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`,
              hsl: `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`,
            })
          }
        }
        imgEl.src = img.src
      } else {
        const imgEl = colorImgRef.current
        const rect = img.getBoundingClientRect()
        const x = Math.round((e.clientX - rect.left) * (imgEl.naturalWidth / rect.width))
        const y = Math.round((e.clientY - rect.top) * (imgEl.naturalHeight / rect.height))
        const color = pickColor(x, y)
        if (color) {
          setPickedColor({
            hex: color.hex,
            rgb: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`,
            hsl: `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`,
          })
        }
      }
    },
    [loadImage, pickColor],
  )

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (copied) {
      const timeoutId = window.setTimeout(() => setCopied(false), 1500)
      return () => window.clearTimeout(timeoutId)
    }
  }, [copied])

  const addSwatch = useCallback(() => {
    if (!pickedColor) return
    if (swatches.length >= 10) return
    setSwatches((prev) => [...prev, pickedColor])
  }, [pickedColor, swatches.length])

  const clearSwatches = useCallback(() => setSwatches([]), [])

  const handlePipetteFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPipetteImage(url)
    colorImgRef.current = null
    setPickedColor(null)
  }, [])

  useEffect(() => {
    return () => {
      if (pipetteImage?.startsWith('blob:')) {
        URL.revokeObjectURL(pipetteImage)
      }
    }
  }, [pipetteImage])

  const gridImageSrc = activeTab === 'pipette' ? pipetteImage : previewUrl

  const tabs = [
    { key: 'reference', label: t.reference.title },
    { key: 'grid', label: t.reference.grid },
    { key: 'pipette', label: t.reference.pipette },
  ] as const

  return (
    <div
      ref={panelRef}
      className="reference-panel fixed top-0 right-0 h-full bg-[var(--bg-secondary)] border-l border-[var(--border-secondary)] shadow-xl flex flex-col"
      style={{ zIndex: 'var(--z-reference)', width: panelWidth }}
      role="dialog"
      aria-modal="true"
      aria-label={t.reference.title}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)] active:bg-[var(--accent-hover)]"
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label={t.reference.title}
        tabIndex={0}
      />

      <div className="flex border-b border-[var(--border-secondary)] shrink-0 items-center">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-3 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label={t.common.close}
          >
            ×
          </button>
        )}
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'reference' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t.reference.savedHint}</p>

            <div className="reference-paste-zone">
              <button
                type="button"
                className="btn-secondary w-full text-sm py-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={adding}
              >
                {t.reference.addFromFile}
              </button>
              <p className="text-[10px] text-center text-[var(--text-muted)] mt-1">{t.reference.pasteHint}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void ingestFile(file)
                  e.target.value = ''
                }}
              />
            </div>

            {previewUrl && selectedRef && (
              <div className="rounded-lg overflow-hidden border border-[var(--border-secondary)]">
                <img src={previewUrl} alt="" className="w-full max-h-56 object-contain bg-[var(--bg-tertiary)]" />
              </div>
            )}

            {savedRefs.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">{t.reference.savedEmpty}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {savedRefs.map((refItem) => (
                  <SavedReferenceThumb
                    key={refItem.id}
                    refItem={refItem}
                    selected={refItem.id === selectedRef?.id}
                    onSelect={() => setSelectedRefId(refItem.id)}
                    onRemove={() => void removeQuestReference(questId, refItem.id)}
                    removeLabel={t.common.removeUpload}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="space-y-4">
            <div className="space-y-1">
              {(['thirds', 'golden', 'diagonal'] as GridType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGridType(type)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    gridType === type
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
                  }`}
                >
                  {type === 'thirds' && t.reference.ruleOfThirds}
                  {type === 'golden' && t.reference.goldenRatio}
                  {type === 'diagonal' && t.reference.diagonal}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t.reference.opacity}: {Math.round(gridOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gridOpacity}
                onChange={(e) => setGridOpacity(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="relative rounded-lg overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] aspect-[4/3] flex items-center justify-center">
              {gridImageSrc ? (
                <>
                  <img src={gridImageSrc} alt="" className="w-full h-full object-contain" />
                  <GridOverlay type={gridType} opacity={gridOpacity} />
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)] px-3 text-center">{t.reference.noImage}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pipette' && (
          <div className="space-y-3">
            {!pipetteImage && (
              <label className="block">
                <div className="flex items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-[var(--border-secondary)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                  <span className="text-xs text-[var(--text-muted)]">{t.upload.dropZoneLabel}</span>
                </div>
                <input type="file" accept="image/*" onChange={handlePipetteFile} className="hidden" />
              </label>
            )}

            {pipetteImage && (
              <div className="relative rounded-lg overflow-hidden border border-[var(--border-secondary)]">
                <img
                  src={pipetteImage}
                  alt=""
                  className="w-full h-48 object-contain cursor-crosshair"
                  onClick={handleColorPick}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pipetteImage?.startsWith('blob:')) URL.revokeObjectURL(pipetteImage)
                    setPipetteImage(null)
                    colorImgRef.current = null
                    setPickedColor(null)
                  }}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)]">{t.reference.pickColor}</p>

            {pickedColor && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-[var(--border-secondary)] shrink-0"
                    style={{ backgroundColor: pickedColor.hex }}
                  />
                  <div className="flex-1 space-y-0.5 text-xs">
                    <button type="button" onClick={() => copyToClipboard(pickedColor.hex)} className="block hover:text-[var(--accent)]">
                      {t.reference.hex}: {pickedColor.hex}
                    </button>
                    <button type="button" onClick={() => copyToClipboard(pickedColor.rgb)} className="block hover:text-[var(--accent)]">
                      {t.reference.rgb}: {pickedColor.rgb}
                    </button>
                    <button type="button" onClick={() => copyToClipboard(pickedColor.hsl)} className="block hover:text-[var(--accent)]">
                      {t.reference.hsl}: {pickedColor.hsl}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addSwatch}
                    disabled={swatches.length >= 10}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--btn-on-accent-text)] disabled:opacity-40"
                  >
                    {t.common.save} ({swatches.length}/10)
                  </button>
                  {copied && <span className="text-xs text-[var(--accent)]">{t.reference.copied}</span>}
                </div>
              </div>
            )}

            {swatches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{t.reference.swatches}</span>
                  <button
                    type="button"
                    onClick={clearSwatches}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--status-danger-text)]"
                  >
                    {t.reference.clearSwatches}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {swatches.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => copyToClipboard(s.hex)}
                      className="w-full aspect-square rounded border border-[var(--border-secondary)] cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: s.hex }}
                      title={`${s.hex}\n${s.rgb}\n${s.hsl}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
