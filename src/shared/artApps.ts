export type ArtAppId = 'photoshop' | 'clipstudio' | 'sai' | 'tvpaint' | 'toonboom' | 'custom'

export type ArtAppDefinition = {
  id: ArtAppId
  labelEn: string
  labelRu: string
  /** Windows process names (without .exe), matched case-insensitively */
  processNames: string[]
}

export const ART_APP_DEFINITIONS: ArtAppDefinition[] = [
  {
    id: 'photoshop',
    labelEn: 'Adobe Photoshop',
    labelRu: 'Adobe Photoshop',
    processNames: ['Photoshop', 'photoshop'],
  },
  {
    id: 'clipstudio',
    labelEn: 'Clip Studio Paint',
    labelRu: 'Clip Studio Paint',
    processNames: ['CLIPStudioPaint', 'ClipStudioPaint', 'clipstudio'],
  },
  {
    id: 'sai',
    labelEn: 'PaintTool SAI',
    labelRu: 'PaintTool SAI',
    processNames: ['sai', 'PaintToolSAI', 'paint tool sai'],
  },
  {
    id: 'tvpaint',
    labelEn: 'TVPaint',
    labelRu: 'TVPaint',
    processNames: ['TVPaint', 'tvpaint'],
  },
  {
    id: 'toonboom',
    labelEn: 'Toon Boom Harmony',
    labelRu: 'Toon Boom Harmony',
    processNames: ['Toon Boom Harmony', 'Harmony', 'ToonBoomStoryboard'],
  },
]

export const DEFAULT_TRACKED_ART_APPS: ArtAppId[] = ART_APP_DEFINITIONS.map((a) => a.id)

const ALL_ART_APP_IDS = new Set<ArtAppId>([...ART_APP_DEFINITIONS.map((a) => a.id), 'custom'])

/** Process name (no .exe) from a Windows executable path. */
export function processNameFromExecutablePath(exePath: string): string {
  const base = exePath.replace(/\\/g, '/').split('/').pop() ?? ''
  return base.replace(/\.exe$/i, '').trim()
}

export function normalizeCustomArtAppExecutablePath(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 500) return undefined
  if (!/\.exe$/i.test(trimmed)) return undefined
  const name = processNameFromExecutablePath(trimmed)
  if (!name) return undefined
  return trimmed
}

export function normalizeTrackedArtApps(raw: unknown): ArtAppId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_TRACKED_ART_APPS]
  const out: ArtAppId[] = []
  for (const item of raw) {
    if (typeof item === 'string' && ALL_ART_APP_IDS.has(item as ArtAppId) && !out.includes(item as ArtAppId)) {
      out.push(item as ArtAppId)
    }
  }
  return out.length > 0 ? out : [...DEFAULT_TRACKED_ART_APPS]
}

export function processMatchesArtApp(processName: string, appId: ArtAppId): boolean {
  if (appId === 'custom') return false
  const def = ART_APP_DEFINITIONS.find((a) => a.id === appId)
  if (!def) return false
  const norm = processName.toLowerCase().replace(/\.exe$/i, '')
  return def.processNames.some((n) => norm.includes(n.toLowerCase().replace(/\.exe$/i, '')))
}

export function processMatchesCustomArtApp(processName: string, customProcessName: string | undefined): boolean {
  if (!customProcessName?.trim()) return false
  const norm = processName.toLowerCase().replace(/\.exe$/i, '')
  const target = customProcessName.toLowerCase().replace(/\.exe$/i, '')
  return norm === target || norm.includes(target)
}

export function isTrackedArtProcess(
  processName: string,
  trackedApps: ArtAppId[],
  customProcessName?: string,
): boolean {
  if (!processName.trim()) return false
  return trackedApps.some((id) => {
    if (id === 'custom') {
      return processMatchesCustomArtApp(processName, customProcessName)
    }
    return processMatchesArtApp(processName, id)
  })
}
