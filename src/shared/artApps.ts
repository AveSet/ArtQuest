export type ArtAppId = 'photoshop' | 'clipstudio' | 'sai' | 'tvpaint' | 'toonboom'

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

export function normalizeTrackedArtApps(raw: unknown): ArtAppId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_TRACKED_ART_APPS]
  const allowed = new Set(ART_APP_DEFINITIONS.map((a) => a.id))
  const out: ArtAppId[] = []
  for (const item of raw) {
    if (typeof item === 'string' && allowed.has(item as ArtAppId) && !out.includes(item as ArtAppId)) {
      out.push(item as ArtAppId)
    }
  }
  return out.length > 0 ? out : [...DEFAULT_TRACKED_ART_APPS]
}

export function processMatchesArtApp(processName: string, appId: ArtAppId): boolean {
  const def = ART_APP_DEFINITIONS.find((a) => a.id === appId)
  if (!def) return false
  const norm = processName.toLowerCase().replace(/\.exe$/i, '')
  return def.processNames.some((n) => norm.includes(n.toLowerCase().replace(/\.exe$/i, '')))
}

export function isTrackedArtProcess(processName: string, trackedApps: ArtAppId[]): boolean {
  if (!processName.trim()) return false
  return trackedApps.some((id) => processMatchesArtApp(processName, id))
}
