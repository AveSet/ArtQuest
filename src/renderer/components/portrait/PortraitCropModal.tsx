import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'
import { AnimatedModal } from '@/components/ui/AnimatedOverlay'
import {
  PORTRAIT_CROP_MAX_SCALE,
  PORTRAIT_CROP_MIN_SCALE,
  PORTRAIT_CROP_VIEWPORT_SIZE,
  clampPortraitCropTransform,
  cropPortraitImage,
  getPortraitDrawRect,
  type PortraitCropTransform,
} from '@/utils/portraitCrop'

type Props = {
  open: boolean
  sourceDataUrl: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}

export default function PortraitCropModal({ open, sourceDataUrl, onConfirm, onCancel }: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(
    null,
  )
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [transform, setTransform] = useState<PortraitCropTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [saving, setSaving] = useState(false)

  useFocusTrap(open, panelRef)

  useEffect(() => {
    if (!open) return
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setTransform({ scale: 1, offsetX: 0, offsetY: 0 })
    }
    img.src = sourceDataUrl
  }, [open, sourceDataUrl])

  const applyTransform = useCallback((next: PortraitCropTransform) => {
    if (!image) {
      setTransform(next)
      return
    }
    setTransform(
      clampPortraitCropTransform(image.naturalWidth, image.naturalHeight, PORTRAIT_CROP_VIEWPORT_SIZE, next),
    )
  }, [image])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!image) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    applyTransform({
      ...transform,
      offsetX: drag.offsetX + (event.clientX - drag.startX),
      offsetY: drag.offsetY + (event.clientY - drag.startY),
    })
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!image) return
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.08 : 0.08
    applyTransform({
      ...transform,
      scale: Math.min(PORTRAIT_CROP_MAX_SCALE, Math.max(PORTRAIT_CROP_MIN_SCALE, transform.scale + delta)),
    })
  }

  const handleConfirm = async () => {
    if (!image) return
    setSaving(true)
    try {
      const cropped = cropPortraitImage(image, transform)
      onConfirm(cropped)
    } finally {
      setSaving(false)
    }
  }

  const draw = image
    ? getPortraitDrawRect(image.naturalWidth, image.naturalHeight, PORTRAIT_CROP_VIEWPORT_SIZE, transform)
    : null

  return (
    <AnimatedModal
      open={open}
      zClassName="z-[220]"
      overlayClassName="!bg-black/75"
      panelRef={panelRef}
      aria-labelledby="portrait-crop-title"
      panelClassName="portrait-crop-modal max-w-md w-full p-4"
    >
      <h2 id="portrait-crop-title" className="heading-2 mb-1 text-center">
        {t.portrait.customAvatarCropTitle}
      </h2>
      <p className="text-xs text-[var(--text-muted)] text-center mb-3">{t.portrait.customAvatarCropHint}</p>

      <div
        ref={viewportRef}
        className="portrait-crop-modal__viewport"
        style={{ width: PORTRAIT_CROP_VIEWPORT_SIZE, height: PORTRAIT_CROP_VIEWPORT_SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {draw && image ? (
          <img
            src={sourceDataUrl}
            alt=""
            draggable={false}
            className="portrait-crop-modal__image"
            style={{
              width: draw.width,
              height: draw.height,
              transform: `translate(${draw.x}px, ${draw.y}px)`,
            }}
          />
        ) : null}
        <div className="portrait-crop-modal__frame" aria-hidden />
      </div>

      <div className="portrait-crop-modal__zoom mt-3">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => applyTransform({ ...transform, scale: transform.scale - 0.15 })}
          aria-label={t.portrait.customAvatarZoomOut}
        >
          −
        </button>
        <span className="text-sm text-[var(--text-muted)] tabular-nums">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => applyTransform({ ...transform, scale: transform.scale + 0.15 })}
          aria-label={t.portrait.customAvatarZoomIn}
        >
          +
        </button>
      </div>

      <div className="flex gap-3 justify-end mt-5">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          {t.common.cancel}
        </button>
        <button type="button" className="btn-primary" onClick={() => void handleConfirm()} disabled={!image || saving}>
          {t.portrait.customAvatarConfirm}
        </button>
      </div>
    </AnimatedModal>
  )
}
