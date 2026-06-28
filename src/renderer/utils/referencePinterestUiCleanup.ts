import type { ReferenceWebviewEl } from '@/utils/referenceGoogleLogin'

/** Injected into Pinterest guest pages to dismiss the logged-out login sheet. */
export const PINTEREST_UI_CLEANUP_SCRIPT = `
(() => {
  const STYLE_ID = 'artquest-pinterest-cleanup';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = \`
      [data-test-id="login-modal"],
      [data-test-id="simple-unauth-header"],
      [data-test-id="unauth-banner"],
      [data-test-id="floating-footer"],
      div[data-test-id="floating-footer-container"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    \`;
    (document.head || document.documentElement).appendChild(style);
  }

  const loginHint =
    /logged out|log in to|sign in|continue with email|continue with google|вышли из системы|войдите|вход с|продолжить с помощью/i;

  const dismiss = () => {
    for (const btn of document.querySelectorAll(
      '[aria-label="Close"], [data-test-id="close-button"], button[aria-label*="Close"], button[aria-label*="Закрыть"]',
    )) {
      const host = btn.closest('[role="dialog"], [data-test-id="login-modal"], [style*="fixed"]');
      if (host instanceof HTMLElement && loginHint.test(host.textContent || '')) {
        if (btn instanceof HTMLElement) btn.click();
        host.style.setProperty('display', 'none', 'important');
      }
    }

    for (const node of document.querySelectorAll('[role="dialog"], [data-test-id="login-modal"]')) {
      if (!(node instanceof HTMLElement)) continue;
      if (!loginHint.test(node.textContent || '')) continue;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('aria-hidden', 'true');
    }

    for (const node of document.querySelectorAll('div[style*="fixed"]')) {
      if (!(node instanceof HTMLElement)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 200 || rect.height < 120) continue;
      if (!loginHint.test(node.textContent || '')) continue;
      node.style.setProperty('display', 'none', 'important');
    }
  };

  dismiss();
  if (!window.__artquestPinterestCleanupObserver) {
    window.__artquestPinterestCleanupObserver = new MutationObserver(dismiss);
    window.__artquestPinterestCleanupObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})()
`

export function runReferencePinterestUiCleanup(
  webview: ReferenceWebviewEl | null | undefined,
): void {
  if (!webview) return
  void webview.executeJavaScript(PINTEREST_UI_CLEANUP_SCRIPT).catch(() => {})
}

/** Hide Pinterest logged-out login sheet on each navigation. */
export function bindReferencePinterestUiCleanupOnDomReady(
  webview: ReferenceWebviewEl | null | undefined,
  source: string,
): () => void {
  if (!webview || source !== 'pinterest') return () => {}

  const onDomReady = () => {
    window.setTimeout(() => runReferencePinterestUiCleanup(webview), 300)
    window.setTimeout(() => runReferencePinterestUiCleanup(webview), 1200)
  }

  webview.addEventListener('dom-ready', onDomReady)
  return () => webview.removeEventListener('dom-ready', onDomReady)
}
