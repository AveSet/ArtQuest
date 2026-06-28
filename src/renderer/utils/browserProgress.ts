const STORAGE_KEY = 'artquest-progress'
const MAX_BYTES = 4 * 1024 * 1024

export function saveProgressToBrowser(data: Record<string, unknown>): boolean {
  try {
    const json = JSON.stringify(data)
    if (json.length > MAX_BYTES) {
      console.error('[browserProgress] progress too large for localStorage:', json.length)
      return false
    }
    localStorage.setItem(STORAGE_KEY, json)
    return true
  } catch (err) {
    console.error('[browserProgress] save failed:', err)
    return false
  }
}

export function loadProgressFromBrowser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch (err) {
    console.error('[browserProgress] load failed:', err)
    return null
  }
}

export function clearProgressFromBrowser(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error('[browserProgress] clear failed:', err)
    return false
  }
}
