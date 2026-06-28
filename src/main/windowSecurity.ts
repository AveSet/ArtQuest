import { app, shell, type Session, type WebContents } from 'electron'
import { validateReferenceNavigationUrl } from '../shared/referenceUrlPolicy'
import { getCloudAccount } from './localDb'

function isDevSession(): boolean {
  return !app.isPackaged
}

/** Content Security Policy for app document shells (main, overlay, reference list UI). */
export function buildAppDocumentCsp(): string {
  const isDev = isDevSession()
  const devHost = isDev ? 'http://localhost:5173' : ''
  if (isDev) {
    return `default-src 'self' ${devHost}; script-src 'self' ${devHost} 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: file: https://i.ytimg.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ${devHost} ws://localhost:5173; media-src 'self' data: blob: file:; frame-src https://www.youtube.com https://www.youtube-nocookie.com`
  }
  return "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: file: https://i.ytimg.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; media-src 'self' data: blob: file:; frame-src https://www.youtube.com https://www.youtube-nocookie.com"
}

export function applyAppDocumentCsp(targetSession: Session): void {
  const csp = buildAppDocumentCsp()
  const isDev = isDevSession()
  const devHost = isDev ? 'http://localhost:5173' : ''

  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const isAppDocument =
      details.url.startsWith('file://') || (isDev && devHost && details.url.startsWith(devHost))
    if (!isAppDocument) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })
}

/** Harden guest webviews attached from the reference materials window. */
export function hardenReferenceWebviewContents(parentContents: WebContents): void {
  parentContents.on('will-attach-webview', (_event, webPreferences) => {
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    webPreferences.sandbox = true
    delete webPreferences.preload
  })

  parentContents.on('did-attach-webview', (_event, guest) => {
    guest.setWindowOpenHandler(({ url }) => {
      const checked = validateReferenceNavigationUrl(url)
      if (checked.ok) {
        void shell.openExternal(checked.url)
      }
      return { action: 'deny' }
    })

    guest.on('will-navigate', (event, url) => {
      let targetUrl = url
      try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase()
        if (host === 'accounts.google.com' || host.endsWith('.accounts.google.com')) {
          const account = getCloudAccount('google')
          if (account?.connected && account.accountEmail && !parsed.searchParams.has('login_hint')) {
            parsed.searchParams.set('login_hint', account.accountEmail)
            targetUrl = parsed.toString()
            event.preventDefault()
            void guest.loadURL(targetUrl)
            return
          }
        }
      } catch {
        /* ignore malformed url */
      }

      const checked = validateReferenceNavigationUrl(targetUrl)
      if (!checked.ok) {
        event.preventDefault()
      }
    })
  })
}
