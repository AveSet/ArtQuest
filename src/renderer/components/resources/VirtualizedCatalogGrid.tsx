import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

const DEFAULT_ROW_HEIGHT = 268
const DEFAULT_GAP = 12
const DEFAULT_MIN_COL_WIDTH = 260
const OVERSCAN_ROWS = 2

export const CATALOG_VIRTUALIZE_THRESHOLD = 36

type Props<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  virtualizeThreshold?: number
  rowHeight?: number
  gap?: number
  minColumnWidth?: number
  className?: string
  'aria-label'?: string
}

export default function VirtualizedCatalogGrid<T>({
  items,
  getKey,
  renderItem,
  virtualizeThreshold = CATALOG_VIRTUALIZE_THRESHOLD,
  rowHeight = DEFAULT_ROW_HEIGHT,
  gap = DEFAULT_GAP,
  minColumnWidth = DEFAULT_MIN_COL_WIDTH,
  className = '',
  'aria-label': ariaLabel,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)
  const [columnCount, setColumnCount] = useState(1)

  const useVirtual = items.length > virtualizeThreshold

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    const cols = Math.max(1, Math.floor((w + gap) / (minColumnWidth + gap)))
    setColumnCount(cols)
    setViewportHeight(el.clientHeight)
  }, [gap, minColumnWidth])

  useEffect(() => {
    measure()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, useVirtual])

  const rows = useMemo(() => {
    const out: T[][] = []
    for (let i = 0; i < items.length; i += columnCount) {
      out.push(items.slice(i, i + columnCount))
    }
    return out
  }, [items, columnCount])

  const rowStride = rowHeight + gap
  const totalRows = rows.length
  const totalHeight = totalRows > 0 ? totalRows * rowStride - gap : 0

  const { startRow, endRow } = useMemo(() => {
    if (!useVirtual || totalRows === 0) {
      return { startRow: 0, endRow: totalRows }
    }
    const first = Math.max(0, Math.floor(scrollTop / rowStride) - OVERSCAN_ROWS)
    const visibleRows = Math.ceil(viewportHeight / rowStride) + OVERSCAN_ROWS * 2
    const last = Math.min(totalRows, first + visibleRows)
    return { startRow: first, endRow: last }
  }, [useVirtual, scrollTop, rowStride, viewportHeight, totalRows])

  const gridClass = `grid gap-3 ${className}`.trim()

  if (!useVirtual) {
    return (
      <ul className={`${gridClass} sm:grid-cols-2 xl:grid-cols-3 list-none p-0 m-0`} aria-label={ariaLabel}>
        {items.map((item) => (
          <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
        ))}
      </ul>
    )
  }

  return (
    <div
      ref={containerRef}
      className="resources-catalog-virtual-scroll"
      aria-label={ariaLabel}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="resources-catalog-virtual-spacer" style={{ height: totalHeight }}>
        <div
          className="resources-catalog-virtual-window"
          style={{ transform: `translateY(${startRow * rowStride}px)` }}
        >
          {rows.slice(startRow, endRow).map((rowItems, rowIndex) => (
            <ul
              key={`row-${startRow + rowIndex}`}
              className={`${gridClass} resources-catalog-virtual-row list-none p-0 m-0`}
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                marginBottom: rowIndex < endRow - startRow - 1 ? gap : 0,
              }}
            >
              {rowItems.map((item) => (
                <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
