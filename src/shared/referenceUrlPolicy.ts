/** Host suffixes allowed inside the reference materials webview. */
export const REFERENCE_ALLOWED_HOST_SUFFIXES = [
  'youtube.com',
  'youtube-nocookie.com',
  'ytimg.com',
  'pinterest.com',
  'artstation.com',
  'google.com',
  'googleusercontent.com',
  'sketchfab.com',
  'clip-studio.com',
] as const

export type ReferenceUrlValidation =
  | { ok: true; url: string }
  | { ok: false; reason: string }

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '')
}

export function isAllowedReferenceHost(hostname: string): boolean {
  const host = normalizeHost(hostname)
  return REFERENCE_ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )
}

/** Validate a URL for in-app reference webview navigation (HTTPS only). */
export function validateReferenceNavigationUrl(raw: string): ReferenceUrlValidation {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'empty url' }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, reason: 'invalid url' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'disallowed protocol' }
  }

  if (!isAllowedReferenceHost(parsed.hostname)) {
    return { ok: false, reason: 'disallowed host' }
  }

  return { ok: true, url: parsed.toString() }
}

/** Validate URLs opened in the system browser (HTTPS only, same host policy). */
export function validateExternalOpenUrl(raw: string): ReferenceUrlValidation {
  return validateReferenceNavigationUrl(raw)
}
