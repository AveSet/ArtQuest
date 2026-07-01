import { session } from 'electron'

export function applyNonElectronUserAgent(): void {
  try {
    const s = session.defaultSession
    const raw = s.getUserAgent()
    const cleaned = raw.replace(/\sElectron\/[\d.]+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
    s.setUserAgent(cleaned.length > 0 ? cleaned : raw)
  } catch (e) {
    console.warn('[session] User-Agent adjust failed:', e)
  }
}

/** YouTube embed requires Referer when parent is file:// */
export function applyYoutubeReferrerForEmbeds(): void {
  const ytReferrer = 'https://www.youtube.com/'
  const filter = {
    urls: [
      '*://*.youtube.com/*',
      '*://youtube.com/*',
      '*://*.youtube-nocookie.com/*',
      '*://youtube-nocookie.com/*',
      '*://*.googlevideo.com/*',
      '*://*.ytimg.com/*',
    ],
  }
  try {
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      const requestHeaders = { ...(details.requestHeaders ?? {}) }
      const existing = String(requestHeaders.Referer ?? requestHeaders.referer ?? '')
      if (!existing || existing.startsWith('file:') || !existing.startsWith('http')) {
        requestHeaders.Referer = ytReferrer
      }
      callback({ requestHeaders })
    })
  } catch (e) {
    console.warn('[session] YouTube Referer hook failed:', e)
  }
}
