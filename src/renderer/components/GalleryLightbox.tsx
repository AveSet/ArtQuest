import { useCallback, useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotkey } from '@/hooks/useHotkey'
import { GalleryLightboxNavArrow } from '@/components/GalleryLightboxNavArrow'
import { GalleryLightboxZoomMedia } from '@/components/GalleryLightboxZoomMedia'

export interface GalleryLightboxProps {
  open: boolean
  ariaLabel: string
  onClose: () => void
  /** 0-based index when multiple items; omit counter when total <= 1 */
  total?: number
  onPrev?: () => void
  onNext?: () => void
  closeLabel: string
  prevLabel?: string
  nextLabel?: string
  counterLabel?: string
  /** Extra controls in the top toolbar (e.g. quest session timer). */
  toolbarExtra?: ReactNode
  /** Changes reset zoom/pan (e.g. lightbox index) */
  mediaKey?: string | number
  children?: ReactNode
  /** Media block — wrapped for hit-zone geometry */
  media: ReactNode
}

export function GalleryLightbox({
  open,
  ariaLabel,
  onClose,
  total = 1,
  onPrev,
  onNext,
  closeLabel: _closeLabel,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  counterLabel,
  toolbarExtra,
  mediaKey = 0,
  children,
  media,
}: GalleryLightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mediaFrameRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, rootRef)
  useHotkey('Escape', onClose, { enabled: open })

  const canNavigate = total > 1 && onPrev != null && onNext != null

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !canNavigate) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, canNavigate, onPrev, onNext])

  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, textarea, select, video')) return
      if (target !== e.currentTarget) return
      onClose()
    },
    [onClose],
  )

  if (!open) return null

  return createPortal(
    <div
      ref={rootRef}
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={handleOverlayClick}
    >
      <div className="gallery-lightbox-inner">
        {(canNavigate && counterLabel != null) || toolbarExtra != null ? (
          <div className="gallery-lightbox-toolbar">
            {canNavigate && counterLabel != null && (
              <span className="gallery-lightbox-counter" aria-live="polite">
                {counterLabel}
              </span>
            )}
            {toolbarExtra != null && (
              <div className="gallery-lightbox-toolbar-extra">{toolbarExtra}</div>
            )}
          </div>
        ) : null}
        <div className="gallery-lightbox-stage">
          {canNavigate && onPrev && (
            <GalleryLightboxNavArrow direction="prev" label={prevLabel} onClick={onPrev} />
          )}
          <div ref={mediaFrameRef} className="gallery-lightbox-media">
            <GalleryLightboxZoomMedia resetKey={mediaKey}>{media}</GalleryLightboxZoomMedia>
          </div>
          {canNavigate && onNext && (
            <GalleryLightboxNavArrow direction="next" label={nextLabel} onClick={onNext} />
          )}
        </div>
        {children != null && (
          <div className="gallery-lightbox-meta">{children}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
