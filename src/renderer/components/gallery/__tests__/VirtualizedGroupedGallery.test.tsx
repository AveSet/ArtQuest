import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import VirtualizedGroupedGallery, {
  GROUPED_GALLERY_VIRTUALIZE_THRESHOLD,
} from '../VirtualizedGroupedGallery'
import type { GroupedGalleryMonth } from '../VirtualizedGroupedGallery'

vi.mock('@/components/GalleryCard', () => ({
  default: ({ group }: { group: { questTitle: string } }) => (
    <div data-testid="gallery-card">{group.questTitle}</div>
  ),
}))

function makeMonth(groupCount: number, monthKey = '2026-06'): GroupedGalleryMonth {
  return {
    monthKey,
    label: 'June 2026',
    groups: Array.from({ length: groupCount }, (_, i) => ({
      questId: i + 1,
      questTitle: `Quest ${i + 1}`,
      category: 'drawing' as const,
      works: [
        {
          imageUrl: 'blob:test',
          date: '2026-06-01T12:00:00.000Z',
        },
      ],
    })),
  }
}

describe('VirtualizedGroupedGallery', () => {
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

  it('exports threshold of 24', () => {
    expect(GROUPED_GALLERY_VIRTUALIZE_THRESHOLD).toBe(25 - 1)
  })

  it('renders all cards flat when at or below threshold', () => {
    render(
      <VirtualizedGroupedGallery
        monthGroups={[makeMonth(GROUPED_GALLERY_VIRTUALIZE_THRESHOLD)]}
        collapsedMonths={new Set()}
        onToggleMonth={() => {}}
        language="en"
      />,
    )
    expect(screen.getAllByTestId('gallery-card')).toHaveLength(GROUPED_GALLERY_VIRTUALIZE_THRESHOLD)
    expect(document.querySelector('.resources-catalog-virtual-scroll')).toBeNull()
  })

  it('uses virtual scroll when card count exceeds threshold', () => {
    render(
      <VirtualizedGroupedGallery
        monthGroups={[makeMonth(GROUPED_GALLERY_VIRTUALIZE_THRESHOLD + 1)]}
        collapsedMonths={new Set()}
        onToggleMonth={() => {}}
        language="en"
      />,
    )
    expect(document.querySelector('.resources-catalog-virtual-scroll')).not.toBeNull()
    expect(screen.getAllByTestId('gallery-card').length).toBeLessThan(
      GROUPED_GALLERY_VIRTUALIZE_THRESHOLD + 1,
    )
  })
})
