import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import VirtualizedCatalogGrid, { CATALOG_VIRTUALIZE_THRESHOLD } from '../VirtualizedCatalogGrid'

type Item = { id: string; label: string }

function renderGrid(count: number) {
  const items: Item[] = Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    label: `Card ${i}`,
  }))
  return render(
    <VirtualizedCatalogGrid
      items={items}
      getKey={(item) => item.id}
      renderItem={(item) => (
        <li key={item.id} data-testid="catalog-card">
          {item.label}
        </li>
      )}
      aria-label="Catalog"
    />,
  )
}

describe('VirtualizedCatalogGrid', () => {
  let roCallback: ResizeObserverCallback | null = null

  beforeEach(() => {
    roCallback = null
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          roCallback = cb
        }
        observe() {
          roCallback?.([], this as unknown as ResizeObserver)
        }
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports threshold of 36', () => {
    expect(CATALOG_VIRTUALIZE_THRESHOLD).toBe(36)
  })

  it('renders a flat list when at or below the threshold', () => {
    renderGrid(CATALOG_VIRTUALIZE_THRESHOLD)
    const cards = screen.getAllByTestId('catalog-card')
    expect(cards).toHaveLength(CATALOG_VIRTUALIZE_THRESHOLD)
    expect(document.querySelector('.resources-catalog-virtual-scroll')).toBeNull()
  })

  it('uses virtual scroll container above the threshold', () => {
    renderGrid(CATALOG_VIRTUALIZE_THRESHOLD + 1)
    expect(document.querySelector('.resources-catalog-virtual-scroll')).not.toBeNull()
    expect(screen.getAllByTestId('catalog-card').length).toBeLessThan(CATALOG_VIRTUALIZE_THRESHOLD + 1)
  })
})
