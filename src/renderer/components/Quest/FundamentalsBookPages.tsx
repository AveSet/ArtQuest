import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import {
  getFundamentalsBookPageNumbers,
  getFundamentalsBookPageUrl,
  type FundamentalsExercise,
} from '@/data/fundamentalsExercises'
import { GalleryLightbox } from '@/components/GalleryLightbox'
import QuestSplitTimer from '@/components/QuestSplitTimer'
import QuestSessionPhaseTimer from '@/components/Quest/QuestSessionPhaseTimer'
import {
  sessionHasPhases,
  useQuestSessionStore,
} from '@/store/useQuestSessionStore'

type Props = {
  exercise: Pick<FundamentalsExercise, 'bookPages' | 'trackPhases'>
  compact?: boolean
  hero?: boolean
  phaseIndex?: number
  questId?: number
}

function FundamentalsBookLightboxTimer({ questId }: { questId: number }) {
  const session = useQuestSessionStore((s) =>
    s.session?.questId === questId ? s.session : null,
  )
  if (!session) return null

  if (sessionHasPhases(session)) {
    return (
      <QuestSessionPhaseTimer
        session={session}
        size="sm"
        layout="horizontal"
        showPhaseMeta={false}
      />
    )
  }

  return <QuestSplitTimer session={session} size="sm" />
}

export default function FundamentalsBookPages({
  exercise,
  compact = false,
  hero = false,
  phaseIndex,
  questId,
}: Props) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(!compact)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroFrameRef = useRef<HTMLDivElement>(null)
  const pages = getFundamentalsBookPageNumbers(exercise, phaseIndex)
  const pagesKey = pages.join(',')

  useEffect(() => {
    setHeroIndex(0)
  }, [phaseIndex, pagesKey])

  useEffect(() => {
    if (!hero || pages.length <= 1) return
    const el = heroFrameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setHeroIndex((idx) => {
        if (e.deltaY > 0) return Math.min(pages.length - 1, idx + 1)
        return Math.max(0, idx - 1)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [hero, pages.length])

  const openLightbox = useCallback((page: number) => {
    const idx = pages.indexOf(page)
    setLightboxIndex(idx >= 0 ? idx : 0)
  }, [pages])

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((idx) => (idx == null || idx <= 0 ? idx : idx - 1))
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((idx) =>
      idx == null || idx >= pages.length - 1 ? idx : idx + 1,
    )
  }, [pages.length])

  const lightboxPage = lightboxIndex != null ? pages[lightboxIndex] : null

  const timerSlot = useMemo(
    () => (questId != null ? <FundamentalsBookLightboxTimer questId={questId} /> : null),
    [questId],
  )

  if (pages.length === 0) return null

  const heroImageClass = hero
    ? 'fundamentals-book-hero__img'
    : 'w-full max-h-32 object-cover object-top rounded-lg border border-[var(--border-secondary)]'

  if (hero) {
    const url = getFundamentalsBookPageUrl(pages[heroIndex] ?? pages[0]!)

    return (
      <div className="fundamentals-book-hero">
        <div ref={heroFrameRef} className="fundamentals-book-hero__frame">
          <button
            type="button"
            className="block w-full"
            onClick={() => openLightbox(pages[heroIndex] ?? pages[0]!)}
            aria-label={t.fundamentals?.bookPagesShow ?? 'Reference image'}
          >
            <img src={url} alt="" loading="eager" className={heroImageClass} draggable={false} />
          </button>
          {pages.length > 1 ? (
            <span className="quest-phase-reference__counter" aria-live="polite">
              {heroIndex + 1} / {pages.length}
            </span>
          ) : null}
        </div>
        {pages.length > 1 && (
          <div className="fundamentals-book-scroll flex gap-2 overflow-x-auto pb-1 mt-2 snap-x snap-mandatory">
            {pages.map((page, pageIdx) => (
              <button
                key={page}
                type="button"
                className={`snap-start shrink-0 rounded-lg border overflow-hidden bg-[var(--bg-tertiary)] hover:border-[var(--accent)] ${
                  pageIdx === heroIndex
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--border-secondary)]'
                }`}
                onClick={() => {
                  setHeroIndex(pageIdx)
                  openLightbox(page)
                }}
              >
                <img
                  src={getFundamentalsBookPageUrl(page)}
                  alt=""
                  loading="lazy"
                  className="h-16 w-auto max-w-[120px] object-contain"
                />
              </button>
            ))}
          </div>
        )}
        {lightboxPage != null && lightboxIndex != null && (
          <GalleryLightbox
            open
            ariaLabel={t.fundamentals?.bookPagesShow ?? 'Reference'}
            onClose={closeLightbox}
            total={pages.length}
            closeLabel={t.common?.close ?? 'Close'}
            prevLabel={t.gallery?.lightboxPrev ?? 'Previous'}
            nextLabel={t.gallery?.lightboxNext ?? 'Next'}
            mediaKey={lightboxPage}
            counterLabel={
              pages.length > 1 ? `${lightboxIndex + 1} / ${pages.length}` : undefined
            }
            toolbarExtra={timerSlot ?? undefined}
            onPrev={pages.length > 1 ? goPrev : undefined}
            onNext={pages.length > 1 ? goNext : undefined}
            media={
              <img
                src={getFundamentalsBookPageUrl(lightboxPage)}
                alt=""
                className="max-h-[min(85vh,960px)] max-w-full object-contain"
                draggable={false}
              />
            }
          />
        )}
      </div>
    )
  }

  if (compact && !expanded) {
    const firstUrl = getFundamentalsBookPageUrl(pages[0]!)
    return (
      <div className="mt-2">
        <button
          type="button"
          className="text-xs text-[var(--accent-hover)] font-medium"
          onClick={() => setExpanded(true)}
        >
          {t.fundamentals?.bookPagesShow ?? 'Show reference'}
        </button>
        <button
          type="button"
          className="mt-2 block w-full"
          onClick={() => openLightbox(pages[0]!)}
          aria-label={t.fundamentals?.bookPagesShow ?? 'Reference'}
        >
          <img
            src={firstUrl}
            alt=""
            loading="lazy"
            className="w-full max-h-32 object-cover object-top rounded-lg border border-[var(--border-secondary)] opacity-80"
          />
        </button>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-3 py-2">
      {compact && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            className="text-xs text-[var(--text-muted)]"
            onClick={() => setExpanded(false)}
          >
            {t.fundamentals?.bookPagesHide ?? 'Hide'}
          </button>
        </div>
      )}
      <div className="fundamentals-book-scroll flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
        {pages.map((page) => {
          const url = getFundamentalsBookPageUrl(page)
          return (
            <button
              key={page}
              type="button"
              className="snap-start shrink-0 rounded-lg border border-[var(--border-secondary)] overflow-hidden bg-[var(--bg-tertiary)] hover:border-[var(--accent)] transition-colors"
              onClick={() => openLightbox(page)}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-40 min-w-[100px] w-auto max-w-[min(280px,70vw)] object-contain"
              />
            </button>
          )
        })}
      </div>

      {lightboxPage != null && lightboxIndex != null && (
        <GalleryLightbox
          open
          ariaLabel={t.fundamentals?.bookPagesShow ?? 'Reference'}
          onClose={closeLightbox}
          total={pages.length}
          closeLabel={t.common?.close ?? 'Close'}
          prevLabel={t.gallery?.lightboxPrev ?? 'Previous'}
          nextLabel={t.gallery?.lightboxNext ?? 'Next'}
          mediaKey={lightboxPage}
          counterLabel={
            pages.length > 1 ? `${lightboxIndex + 1} / ${pages.length}` : undefined
          }
          toolbarExtra={timerSlot ?? undefined}
          onPrev={pages.length > 1 ? goPrev : undefined}
          onNext={pages.length > 1 ? goNext : undefined}
          media={
            <img
              src={getFundamentalsBookPageUrl(lightboxPage)}
              alt=""
              className="max-h-[min(78vh,900px)] max-w-full object-contain"
              draggable={false}
            />
          }
        />
      )}
    </div>
  )
}
