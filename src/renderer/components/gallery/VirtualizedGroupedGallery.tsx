import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GalleryCard from '@/components/GalleryCard'
import type { Language } from '@/i18n/languages'
import type { QuestCategory } from '@/data/skillTree'

export const GROUPED_GALLERY_VIRTUALIZE_THRESHOLD = 24
const MONTH_HEADER_HEIGHT = 56
const CARD_ROW_HEIGHT = 420
const ROW_GAP = 16
const OVERSCAN_PX = 320

export type GroupedGalleryMonth = {
  monthKey: string
  label: string
  groups: {
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
  }[]
}

type VirtualRow =
  | { kind: 'header'; monthKey: string; label: string }
  | { kind: 'card'; group: GroupedGalleryMonth['groups'][number] }

type Props = {
  monthGroups: GroupedGalleryMonth[]
  collapsedMonths: Set<string>
  onToggleMonth: (monthKey: string) => void
  language: Language
  className?: string
}

function rowHeight(row: VirtualRow): number {
  return row.kind === 'header' ? MONTH_HEADER_HEIGHT : CARD_ROW_HEIGHT
}

function buildRows(monthGroups: GroupedGalleryMonth[], collapsedMonths: Set<string>): VirtualRow[] {
  const rows: VirtualRow[] = []
  for (const month of monthGroups) {
    rows.push({ kind: 'header', monthKey: month.monthKey, label: month.label })
    if (!collapsedMonths.has(month.monthKey)) {
      for (const group of month.groups) {
        rows.push({ kind: 'card', group })
      }
    }
  }
  return rows
}

function findRowIndex(offsets: number[], scrollTop: number): number {
  let lo = 0
  let hi = offsets.length - 2
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (offsets[mid + 1]! <= scrollTop) lo = mid + 1
    else hi = mid - 1
  }
  return lo
}

export default function VirtualizedGroupedGallery({
  monthGroups,
  collapsedMonths,
  onToggleMonth,
  language,
  className = '',
}: Props) {
  const rows = useMemo(
    () => buildRows(monthGroups, collapsedMonths),
    [monthGroups, collapsedMonths],
  )
  const cardCount = useMemo(
    () => rows.filter((r) => r.kind === 'card').length,
    [rows],
  )
  const hasDynamicCardHeights = useMemo(
    () => monthGroups.some((month) => month.groups.some((group) => group.works.length > 1)),
    [monthGroups],
  )
  const useVirtual = cardCount > GROUPED_GALLERY_VIRTUALIZE_THRESHOLD && !hasDynamicCardHeights

  const offsets = useMemo(() => {
    const out = [0]
    for (let i = 0; i < rows.length; i++) {
      const gap = i < rows.length - 1 ? ROW_GAP : 0
      out.push(out[i]! + rowHeight(rows[i]!) + gap)
    }
    return out
  }, [rows])

  const totalHeight = offsets[offsets.length - 1] ?? 0
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setViewportHeight(el.clientHeight)
  }, [])

  useEffect(() => {
    measure()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, useVirtual])

  const { startIndex, endIndex, windowOffset } = useMemo(() => {
    if (!useVirtual || rows.length === 0) {
      return { startIndex: 0, endIndex: rows.length, windowOffset: 0 }
    }
    const start = Math.max(0, findRowIndex(offsets, scrollTop - OVERSCAN_PX))
    let end = start
    const bottom = scrollTop + viewportHeight + OVERSCAN_PX
    while (end < rows.length && offsets[end]! < bottom) end++
    return { startIndex: start, endIndex: Math.min(rows.length, end + 1), windowOffset: offsets[start] ?? 0 }
  }, [useVirtual, rows.length, offsets, scrollTop, viewportHeight])

  const renderHeader = (row: Extract<VirtualRow, { kind: 'header' }>) => {
    const isCollapsed = collapsedMonths.has(row.monthKey)
    return (
      <div key={`header-${row.monthKey}`} className="card-fantasy p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => onToggleMonth(row.monthKey)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
          aria-expanded={!isCollapsed}
        >
          <h2 className="heading-2 text-lg">{row.label}</h2>
          <svg
            className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    )
  }

  const renderCard = (row: Extract<VirtualRow, { kind: 'card' }>, key: string) => (
    <div key={key}>
      <GalleryCard group={row.group} language={language} />
    </div>
  )

  if (!useVirtual) {
    return (
      <div className={`space-y-6 ${className}`.trim()}>
        {monthGroups.map(({ monthKey, label, groups }) => {
          const isCollapsed = collapsedMonths.has(monthKey)
          return (
            <div key={monthKey} className="card-fantasy p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleMonth(monthKey)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                aria-expanded={!isCollapsed}
              >
                <h2 className="heading-2 text-lg">{label}</h2>
                <svg
                  className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {!isCollapsed && (
                <div className="px-6 pb-6 space-y-4">
                  {groups.map((group) => (
                    <GalleryCard key={group.questId} group={group} language={language} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`resources-catalog-virtual-scroll gallery-grouped-virtual-scroll ${className}`.trim()}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="resources-catalog-virtual-spacer" style={{ height: totalHeight }}>
        <div
          className="resources-catalog-virtual-window space-y-4"
          style={{ transform: `translateY(${windowOffset}px)` }}
        >
          {rows.slice(startIndex, endIndex).map((row, i) =>
            row.kind === 'header'
              ? renderHeader(row)
              : renderCard(row, `v-${startIndex + i}-${row.group.questId}`),
          )}
        </div>
      </div>
    </div>
  )
}
