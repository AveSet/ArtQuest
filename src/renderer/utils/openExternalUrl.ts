/** Opens https URLs in the system browser (Electron) or a new tab (web). */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return
  } catch {
    return
  }
  if (window.electronAPI?.shell?.openExternal) {
    await window.electronAPI.shell.openExternal(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
