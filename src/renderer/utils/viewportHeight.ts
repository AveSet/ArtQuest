/** CSS custom property for the visible window height (avoids 100vh > client area in Electron). */
export const APP_VH_VAR = '--app-vh'

export function applyViewportHeight(): void {
  if (typeof window === 'undefined') return
  document.documentElement.style.setProperty(APP_VH_VAR, `${window.innerHeight}px`)
}

/** Keep --app-vh aligned with window.innerHeight (resize, zoom, display changes). */
export function initViewportHeightSync(): () => void {
  applyViewportHeight()
  const onResize = () => applyViewportHeight()
  window.addEventListener('resize', onResize)
  const vv = window.visualViewport
  vv?.addEventListener('resize', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
    vv?.removeEventListener('resize', onResize)
  }
}
