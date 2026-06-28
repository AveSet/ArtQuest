import { useState, useEffect } from 'react'
import { readSavedMediaCached } from '@/utils/readImageCache'

interface GalleryImageProps {
  imageUrl: string
  savedPath?: string
  alt: string
  className?: string
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  onLoad?: () => void
  onError?: () => void
}

/** Renders a gallery image, lazy-loading from disk when only savedPath is stored. */
export function GalleryImage({
  imageUrl,
  savedPath,
  alt,
  className = '',
  onClick,
  onContextMenu,
  onLoad,
  onError,
}: GalleryImageProps) {
  const [src, setSrc] = useState(imageUrl)
  const [loading, setLoading] = useState(!imageUrl && !!savedPath)

  useEffect(() => {
    if (imageUrl?.startsWith('data:')) {
      setSrc(imageUrl)
      setLoading(false)
      return
    }
    if (!savedPath) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    readSavedMediaCached(savedPath)
      .then((url) => {
        if (!cancelled && url) setSrc(url)
      })
      .catch(() => {
        if (!cancelled) onError?.()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [imageUrl, savedPath, onError])

  const placeholderClass = `w-full min-h-[12rem] max-h-[min(52vh,26rem)] rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center ${className}`

  if (loading) {
    return (
      <span className={`${placeholderClass} animate-pulse`}>
        <span className="text-[var(--text-muted)] text-sm">…</span>
      </span>
    )
  }

  if (!src) {
    return (
      <span className={placeholderClass}>
        <span className="text-3xl">🖼️</span>
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
