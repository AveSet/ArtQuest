import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/useUIStore'

export function useCustomAvatarSrc(): string | null {
  const customAvatarPath = useUIStore((s) => s.settings.customAvatarPath)
  const customAvatarDataUrl = useUIStore((s) => s.settings.customAvatarDataUrl)
  const [resolvedPathSrc, setResolvedPathSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!customAvatarPath) {
      setResolvedPathSrc(null)
      return
    }

    let cancelled = false
    void (async () => {
      if (window.electronAPI?.gallery?.getLocalMediaUrl) {
        const url = await window.electronAPI.gallery.getLocalMediaUrl(customAvatarPath)
        if (!cancelled) setResolvedPathSrc(url)
        return
      }
      if (window.electronAPI?.gallery?.readImage) {
        const dataUrl = await window.electronAPI.gallery.readImage(customAvatarPath)
        if (!cancelled) setResolvedPathSrc(dataUrl)
        return
      }
      if (!cancelled) setResolvedPathSrc(null)
    })()

    return () => {
      cancelled = true
    }
  }, [customAvatarPath])

  if (customAvatarDataUrl) return customAvatarDataUrl
  return resolvedPathSrc
}
