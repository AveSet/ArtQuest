import { useState, useRef, useEffect, memo, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { useI18n, getCategoryLabel } from '@/i18n'
import type { Language } from '@/i18n/languages'
import type { QuestCategory } from '@/data/skillTree'
import { usesCloudStorage } from '../../shared/storageMode'
import { GalleryMedia } from './GalleryMedia'
import { GalleryLightbox } from './GalleryLightbox'
import { formatLocalizedDate } from '@/utils/dateLocale'
import GalleryWorkReview from '@/components/GalleryWorkReview'
import { useQuestStore } from '@/store/useQuestStore'

const CONTEXT_MENU_W = 180
const CONTEXT_MENU_H = 88
/** Max thumbnails rendered per quest group before "show more" (grouped gallery perf). */
export const GALLERY_GROUP_PREVIEW_MAX = 8

interface GalleryCardProps {
  group: {
    questId: number
    works: {
      id?: string
      imageUrl: string
      savedPath?: string
      mediaType?: 'image' | 'video'
      date: string
      notes?: string
      improvementNotes?: string
      tags?: string[]
      favorite?: boolean
      syncStatus?: string
      syncError?: string
      remoteFileId?: string
      storageMode?: 'local' | 'local_and_cloud' | 'cloud_only' | 'google_drive'
      thumbnailPath?: string
    }[]
    questTitle: string
    category: QuestCategory
  }
  language: Language
}

const GalleryCard = memo(function GalleryCard({ group, language }: GalleryCardProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toggleWorkFavorite = useQuestStore((s) => s.toggleWorkFavorite)
  const containerRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(true)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [erroredImages, setErroredImages] = useState<Set<number>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; workIdx: number } | null>(null)
  const [showAllWorks, setShowAllWorks] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  const sortedWorks = useMemo(() => (
    [...group.works].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  ), [group.works])

  const openFileLocation = useCallback(async (workIdx: number) => {
    setContextMenu(null)
    const work = sortedWorks[workIdx]
    if (!work?.savedPath || !window.electronAPI?.showItemInFolder) return
    await window.electronAPI.showItemInFolder(work.savedPath)
  }, [sortedWorks])

  useEffect(() => {
    if (!contextMenu) return
    const close = (e: globalThis.MouseEvent) => {
      if (e.button === 2) return
      const target = e.target as HTMLElement
      if (target.closest('.gallery-context-menu')) return
      setContextMenu(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [contextMenu])

  const onContextMenu = useCallback((e: ReactMouseEvent, idx: number) => {
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - CONTEXT_MENU_W - 8)
    const y = Math.min(e.clientY, window.innerHeight - CONTEXT_MENU_H - 8)
    setContextMenu({ x: Math.max(8, x), y: Math.max(8, y), workIdx: idx })
  }, [])

  const onImageLoad = useCallback((idx: number) => {
    setLoadedImages(prev => new Set(prev).add(idx))
  }, [])

  const onImageError = useCallback((idx: number) => {
    setLoadedImages(prev => new Set(prev).add(idx))
    setErroredImages(prev => new Set(prev).add(idx))
  }, [])

  const latestWork = sortedWorks[sortedWorks.length - 1]
  if (!latestWork) return null
  const firstWork = sortedWorks[0]
  const hasMultiple = sortedWorks.length > 1
  const hiddenCount = Math.max(0, sortedWorks.length - GALLERY_GROUP_PREVIEW_MAX)
  const visibleWorks =
    showAllWorks || hiddenCount === 0
      ? sortedWorks
      : sortedWorks.slice(-GALLERY_GROUP_PREVIEW_MAX)
  const selectedWork = selectedImage != null ? sortedWorks[selectedImage] : null

  const formatDate = (dateStr: string) =>
    formatLocalizedDate(dateStr, language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div ref={containerRef} className="card-fantasy">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm text-[var(--text-muted)]">
            {formatDate(latestWork.date)}
          </div>
          <span className="gallery-category-pill mt-1 inline-block">
            {t.gallery.categoryBadge}: {getCategoryLabel(group.category, language)}
          </span>
          <h3 className="quest-card-title text-lg mt-1">{group.questTitle}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/quests/${group.questId}`)}
            className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
          >
            {t.gallery.redoQuest}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors p-1"
            title={expanded ? t.gallery.collapse : t.gallery.expand}
            aria-expanded={expanded}
            aria-label={expanded ? t.gallery.collapse : t.gallery.expand}
          >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        </div>
      </div>

      {expanded && (
        <div className="relative bg-[var(--bg-secondary)] rounded-lg overflow-hidden p-2 sm:p-3">
          <div className="gallery-work-strip">
            {visibleWorks.map((work) => {
              const idx = sortedWorks.indexOf(work)
              return (
              <div key={`${work.date}-${idx}`} className="relative flex justify-center group/gthumb">
                <button
                  type="button"
                  className={`absolute top-2 right-2 z-10 rounded-full px-2 py-0.5 text-sm leading-none transition-opacity ${
                    work.favorite
                      ? 'bg-[var(--gold-primary)]/90 text-[var(--bg-primary)] opacity-100'
                      : 'bg-black/55 text-white opacity-0 group-hover/gthumb:opacity-100 focus:opacity-100'
                  }`}
                  aria-label={work.favorite ? (t.gallery.favoriteOn ?? 'Favorite') : (t.gallery.favoriteOff ?? 'Add favorite')}
                  aria-pressed={!!work.favorite}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWorkFavorite({ id: work.id, questId: group.questId, date: work.date })
                  }}
                >
                  {work.favorite ? '★' : '☆'}
                </button>
                {!loadedImages.has(idx) && !erroredImages.has(idx) && (
                  <div className="w-full min-h-[12rem] max-h-[min(52vh,26rem)] rounded-lg bg-[var(--bg-tertiary)] animate-pulse flex items-center justify-center">
                    <span className="text-[var(--text-muted)] text-sm">{t.gallery.loading}</span>
                  </div>
                )}
                <GalleryMedia
                  imageUrl={work.imageUrl}
                  savedPath={work.savedPath}
                  thumbnailPath={work.thumbnailPath}
                  mediaType={work.mediaType}
                  alt={`${group.questTitle} ${idx + 1}`}
                  className="gallery-thumb w-full max-h-[min(52vh,26rem)] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-[var(--bg-tertiary)]"
                  onClick={() => setSelectedImage(idx)}
                  onContextMenu={(e) => onContextMenu(e, idx)}
                  onLoad={() => onImageLoad(idx)}
                  onError={() => onImageError(idx)}
                />
                {sortedWorks.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                    {idx === 0 ? t.gallery.before : idx === sortedWorks.length - 1 ? t.gallery.after : t.gallery.stepLabel.replace('{n}', String(idx + 1))}
                  </div>
                )}
                {usesCloudStorage(work.storageMode) && work.syncStatus && (
                  <div
                    className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white max-w-[70%] truncate"
                    title={work.syncStatus === 'failed' && work.syncError ? work.syncError : undefined}
                  >
                    {work.syncStatus === 'uploaded' && work.remoteFileId
                      ? t.gallery.cloudUploaded
                      : work.syncStatus === 'failed'
                        ? t.gallery.cloudFailed
                        : t.gallery.cloudPending}
                  </div>
                )}
              </div>
            )})}
          </div>

          {hiddenCount > 0 && !showAllWorks && (
            <button
              type="button"
              className="mt-2 w-full text-xs py-2 rounded-lg border border-[var(--border-secondary)] text-[var(--accent)] hover:border-[var(--gold-dark)]"
              onClick={() => setShowAllWorks(true)}
            >
              +{hiddenCount} {t.gallery.expand}
            </button>
          )}

          {hasMultiple && (
            <>
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                {sortedWorks.length} {t.gallery.versions}
              </div>
              <button
                type="button"
                className="mt-2 w-full text-xs py-2 rounded-lg border border-[var(--border-secondary)] text-[var(--accent-hover)]"
                onClick={() => setCompareMode((v) => !v)}
                aria-pressed={compareMode}
              >
                {compareMode ? t.gallery.showAll : t.gallery.compareVersions ?? t.gallery.selectTwo}
              </button>
              {compareMode && sortedWorks.length >= 2 && firstWork && latestWork && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-semibold mb-1 text-[var(--text-muted)]">{t.gallery.before}</div>
                    <GalleryMedia
                      imageUrl={firstWork.imageUrl}
                      savedPath={firstWork.savedPath}
                      thumbnailPath={firstWork.thumbnailPath}
                      mediaType={firstWork.mediaType}
                      alt={`${group.questTitle} before`}
                      className="gallery-thumb w-full max-h-40 object-contain rounded-lg bg-[var(--bg-tertiary)]"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold mb-1 text-[var(--text-muted)]">{t.gallery.after}</div>
                    <GalleryMedia
                      imageUrl={latestWork.imageUrl}
                      savedPath={latestWork.savedPath}
                      thumbnailPath={latestWork.thumbnailPath}
                      mediaType={latestWork.mediaType}
                      alt={`${group.questTitle} after`}
                      className="gallery-thumb w-full max-h-40 object-contain rounded-lg bg-[var(--bg-tertiary)]"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {contextMenu &&
        createPortal(
          <div
            className="gallery-context-menu fixed bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{ zIndex: 'var(--z-context-menu)', left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              type="button"
              disabled={!sortedWorks[contextMenu.workIdx]?.savedPath || !window.electronAPI?.showItemInFolder}
              className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => openFileLocation(contextMenu.workIdx)}
            >
              {t.gallery.showInFolder}
            </button>
          </div>,
          document.body,
        )}

      {selectedImage !== null && selectedWork && (
        <GalleryLightbox
          open
          ariaLabel={group.questTitle}
          onClose={() => setSelectedImage(null)}
          total={sortedWorks.length}
          closeLabel={t.common.close}
          prevLabel={t.gallery.lightboxPrev}
          nextLabel={t.gallery.lightboxNext}
          mediaKey={selectedImage}
          counterLabel={
            sortedWorks.length > 1
              ? `${selectedImage + 1} / ${sortedWorks.length}`
              : undefined
          }
          onPrev={
            sortedWorks.length > 1
              ? () => setSelectedImage((i) => (i == null ? null : Math.max(0, i - 1)))
              : undefined
          }
          onNext={
            sortedWorks.length > 1
              ? () =>
                  setSelectedImage((i) =>
                    i == null ? null : Math.min(sortedWorks.length - 1, i + 1),
                  )
              : undefined
          }
          media={
            <GalleryMedia
              imageUrl={selectedWork.imageUrl}
              savedPath={selectedWork.savedPath}
              thumbnailPath={selectedWork.thumbnailPath}
              mediaType={selectedWork.mediaType}
              alt={group.questTitle}
              className=""
            />
          }
        >
          <div>{formatDate(selectedWork.date)}</div>
          <button
            type="button"
            className="mt-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold"
            onClick={() =>
              toggleWorkFavorite({
                id: selectedWork.id,
                questId: group.questId,
                date: selectedWork.date,
              })
            }
          >
            {selectedWork.favorite
              ? (t.gallery.favoriteOn ?? '★ Favorite')
              : (t.gallery.favoriteOff ?? '☆ Add favorite')}
          </button>
          <div className="mt-2 max-w-lg mx-auto text-left">
            <GalleryWorkReview
              variant="lightbox"
              compact
              workKey={{
                questId: group.questId,
                date: selectedWork.date,
              }}
              notes={selectedWork.notes}
              improvementNotes={selectedWork.improvementNotes}
              tags={selectedWork.tags}
            />
          </div>
        </GalleryLightbox>
      )}
    </div>
  )
})

export default GalleryCard
