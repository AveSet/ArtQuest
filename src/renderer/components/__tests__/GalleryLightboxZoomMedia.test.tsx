import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { GalleryLightboxZoomMedia } from '../GalleryLightboxZoomMedia'

describe('GalleryLightboxZoomMedia', () => {
  it('pans the stage after zooming in and dragging', () => {
    const { container } = render(
      <GalleryLightboxZoomMedia resetKey={0}>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test" />
      </GalleryLightboxZoomMedia>,
    )

    const zoom = container.querySelector('.gallery-lightbox-zoom') as HTMLDivElement
    const stage = container.querySelector('.gallery-lightbox-zoom__stage') as HTMLDivElement

    fireEvent.wheel(zoom, { deltaY: -120 })

    fireEvent.pointerDown(zoom, { button: 0, clientX: 40, clientY: 40, pointerId: 1 })
    fireEvent.pointerMove(zoom, { clientX: 90, clientY: 70, pointerId: 1 })
    fireEvent.pointerUp(zoom, { pointerId: 1 })

    expect(stage.style.transform).toMatch(/translate\(50px, 30px\)/)
  })

  it('resets zoom and pan when resetKey changes', () => {
    const { container, rerender } = render(
      <GalleryLightboxZoomMedia resetKey={0}>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test" />
      </GalleryLightboxZoomMedia>,
    )

    const zoom = container.querySelector('.gallery-lightbox-zoom') as HTMLDivElement
    const stage = container.querySelector('.gallery-lightbox-zoom__stage') as HTMLDivElement

    fireEvent.wheel(zoom, { deltaY: -120 })
    fireEvent.pointerDown(zoom, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(zoom, { clientX: 40, clientY: 40, pointerId: 1 })

    rerender(
      <GalleryLightboxZoomMedia resetKey={1}>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test" />
      </GalleryLightboxZoomMedia>,
    )

    expect(stage.style.transform).toBe('translate(0px, 0px) scale(1)')
  })
})
