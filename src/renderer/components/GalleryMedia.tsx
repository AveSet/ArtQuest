import { useState, useEffect, useRef } from 'react'
import { readSavedMediaCached } from '@/utils/readImageCache'
import { mediaKindFromWork } from '@/utils/mediaKind'

interface GalleryMediaProps {
  imageUrl: string
  savedPath?: string
  thumbnailPath?: string
  mediaType?: 'image' | 'video'
  alt: string
  className?: string
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  onLoad?: () => void
  onError?: () => void
}

/** Renders a gallery image or video, lazy-loading from disk when only savedPath is stored. */
export function GalleryMedia({
  imageUrl,
  savedPath,
  thumbnailPath,
  mediaType,
  alt,
  className = '',
  onClick,
  onContextMenu,
  onLoad,
  onError,
}: GalleryMediaProps) {
  const kind = mediaKindFromWork({ mediaType, imageUrl, savedPath })
  const shouldDeferDiskLoad = !imageUrl && Boolean(savedPath || thumbnailPath)
  const placeholderRef = useRef<HTMLSpanElement | null>(null)
  const [isVisible, setIsVisible] = useState(!shouldDeferDiskLoad)
  const [src, setSrc] = useState(imageUrl)
  const [loading, setLoading] = useState(!imageUrl && !!savedPath)

  useEffect(() => {
    if (!shouldDeferDiskLoad || isVisible) return
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const node = placeholderRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '320px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible, shouldDeferDiskLoad])

  useEffect(() => {
    let cancelled = false

    const finish = () => {
      if (!cancelled) setLoading(false)
    }

    if (imageUrl?.startsWith('data:')) {
      setSrc(imageUrl)
      finish()
      return
    }
    if (!savedPath && !thumbnailPath) {
      finish()
      return
    }
    if (!isVisible) return

    setLoading(true)
    const loadPath = async (filePath: string): Promise<string | null> =>
      readSavedMediaCached(filePath)

    void (async () => {
      const primary = savedPath ? await loadPath(savedPath) : null
      if (!cancelled && primary) {
        setSrc(primary)
        finish()
        return
      }
      if (thumbnailPath && thumbnailPath !== savedPath) {
        const thumb = await loadPath(thumbnailPath)
        if (!cancelled && thumb) {
          setSrc(thumb)
          finish()
          return
        }
      }
      if (!cancelled) onError?.()
      finish()
    })()

    return () => {
      cancelled = true
    }
  }, [imageUrl, savedPath, thumbnailPath, onError, isVisible])

  const placeholderClass = `w-full min-h-[12rem] max-h-[min(52vh,26rem)] rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center ${className}`

  if (loading) {
    return (
      <span ref={placeholderRef} className={`${placeholderClass} animate-pulse`}>
        <span className="text-[var(--text-muted)] text-sm">…</span>
      </span>
    )
  }

  if (!src) {
    return (
      <span ref={placeholderRef} className={placeholderClass}>
        <span className="text-3xl">{kind === 'video' ? '🎬' : '🖼️'}</span>
      </span>
    )
  }

  if (kind === 'video') {
    return (
      <video
        src={src}
        className={className}
        controls
        playsInline
        preload="metadata"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onLoadedData={onLoad}
        onError={onError}
      >
        <track kind="captions" />
      </video>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onLoad={onLoad}
      onError={onError}
      onDragStart={(e) => e.preventDefault()}
    />
  )
}
