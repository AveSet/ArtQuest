import type { ReferenceSource } from '@/store/models'

export const PINTEREST_LOGIN_URL = 'https://www.pinterest.com/login/'

type ReferenceWebviewEl = HTMLElement & {
  executeJavaScript: (code: string, userGesture?: boolean) => Promise<unknown>
  loadURL?: (url: string) => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

export type { ReferenceWebviewEl }

const GOOGLE_LOGIN_CLICK_SCRIPT = `
(() => {
  const selectors = [
    'button[data-test-id="google-login-button"]',
    'button[aria-label*="Google"]',
    'div[data-test-id="google-login-button"]',
    'a[href*="google"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) {
      el.click();
      return true;
    }
  }
  const buttons = [...document.querySelectorAll('button, a, div[role="button"]')];
  const googleBtn = buttons.find((node) => {
    const text = (node.textContent || '').toLowerCase();
    return text.includes('google') || text.includes('continue with google');
  });
  if (googleBtn instanceof HTMLElement) {
    googleBtn.click();
    return true;
  }
  return false;
})()
`

/** Navigate Pinterest login and trigger Google SSO when enabled. */
export function triggerReferenceGoogleLogin(
  webview: ReferenceWebviewEl | null | undefined,
  source: ReferenceSource,
  enabled: boolean,
): void {
  if (!webview || !enabled || source !== 'pinterest') return

  const run = async () => {
    try {
      const clicked = await webview.executeJavaScript(GOOGLE_LOGIN_CLICK_SCRIPT)
      if (!clicked && webview.loadURL) {
        webview.loadURL(PINTEREST_LOGIN_URL)
        window.setTimeout(() => {
          void webview.executeJavaScript(GOOGLE_LOGIN_CLICK_SCRIPT).catch(() => {})
        }, 1200)
      }
    } catch {
      if (webview.loadURL) webview.loadURL(PINTEREST_LOGIN_URL)
    }
  }

  void run()
}

/** Attach dom-ready handler to attempt Google SSO once per navigation. */
export function bindReferenceGoogleLoginOnDomReady(
  webview: ReferenceWebviewEl | null | undefined,
  source: ReferenceSource,
  enabled: boolean,
): () => void {
  if (!webview || !enabled || source !== 'pinterest') return () => {}

  let attempted = false
  const onDomReady = () => {
    if (attempted) return
    attempted = true
    window.setTimeout(() => triggerReferenceGoogleLogin(webview, source, enabled), 400)
  }

  webview.addEventListener('dom-ready', onDomReady)
  return () => webview.removeEventListener('dom-ready', onDomReady)
}
