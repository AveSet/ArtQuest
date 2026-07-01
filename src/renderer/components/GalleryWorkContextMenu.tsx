import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n'
import { isElectronDesktop, showItemInFolder } from '@/utils/electronBridge'

const CONTEXT_MENU_W = 180
const CONTEXT_MENU_H = 88

export function useGalleryWorkContextMenu() {
  const { t } = useI18n()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; savedPath?: string } | null>(null)

  const openContextMenu = useCallback((e: ReactMouseEvent, savedPath?: string) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - CONTEXT_MENU_W - 8)
    const y = Math.min(e.clientY, window.innerHeight - CONTEXT_MENU_H - 8)
    setContextMenu({ x: Math.max(8, x), y: Math.max(8, y), savedPath })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const openFileLocation = useCallback(async (savedPath?: string) => {
    const path = savedPath ?? contextMenu?.savedPath
    setContextMenu(null)
    if (!path) return
    await showItemInFolder(path)
  }, [contextMenu?.savedPath])

  useEffect(() => {
    if (!contextMenu) return
    const close = (e: globalThis.MouseEvent) => {
      if (e.button === 2) return
      const target = e.target as HTMLElement
      if (target.closest('.gallery-context-menu')) return
      setContextMenu(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [contextMenu])

  const canShowInFolder = Boolean(contextMenu?.savedPath && isElectronDesktop())

  const menuPortal =
    contextMenu &&
    createPortal(
      <div
        className="gallery-context-menu fixed bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg shadow-xl py-1 min-w-[180px]"
        style={{ zIndex: 'var(--z-context-menu)', left: contextMenu.x, top: contextMenu.y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          type="button"
          disabled={!canShowInFolder}
          title={!canShowInFolder ? (t.gallery.showInFolderDisabled ?? 'File not saved locally') : undefined}
          className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => void openFileLocation()}
        >
          {t.gallery.showInFolder}
        </button>
      </div>,
      document.body,
    )

  return { openContextMenu, closeContextMenu, menuPortal, canShowInFolder, openFileLocation }
}
