import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent,
} from 'react'

type Props = {
  children: ReactNode
  resetKey: string | number
}

const MIN_SCALE = 1
const MAX_SCALE = 4

export function GalleryLightboxZoomMedia({ children, resetKey }: Props) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const didPanRef = useRef(false)

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setIsDragging(false)
    dragRef.current = null
    didPanRef.current = false
  }, [resetKey])

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.12 : 0.12
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta * Math.max(1, s)))
      if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (scale <= 1 || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      didPanRef.current = false
      setIsDragging(true)
      dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
      if (typeof e.currentTarget.setPointerCapture === 'function') {
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    },
    [offset.x, offset.y, scale],
  )

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    e.preventDefault()
    e.stopPropagation()
    didPanRef.current = true
    setOffset({
      x: drag.ox + (e.clientX - drag.x),
      y: drag.oy + (e.clientY - drag.y),
    })
  }, [])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }
  }, [])

  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!didPanRef.current) return
    e.stopPropagation()
    didPanRef.current = false
  }, [])

  return (
    <div
      className={`gallery-lightbox-zoom ${scale > 1 ? 'gallery-lightbox-zoom--panning' : ''} ${isDragging ? 'gallery-lightbox-zoom--dragging' : ''}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className="gallery-lightbox-zoom__stage"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
