import { useUIStore } from '@/store/useUIStore'
import { getSharedAudioContext } from '@/utils/sound'

export type AmbientPreset = 'rain' | 'cafe' | 'fireplace'

const bufferCache = new Map<AmbientPreset, AudioBuffer | 'missing' | 'loading'>()

let ambientSource: AudioBufferSourceNode | null = null
let ambientGain: GainNode | null = null
let activePreset: AmbientPreset | null = null

function ambientVolume(): number {
  const { ambientEnabled, ambientVolume, soundEnabled } = useUIStore.getState().settings
  if (!soundEnabled || !ambientEnabled) return 0
  return Math.min(0.2, Math.max(0, ambientVolume ?? 0.08))
}

function normalizePreset(raw: string | undefined): AmbientPreset {
  if (raw === 'rain' || raw === 'cafe' || raw === 'fireplace') return raw
  if (raw === 'quiet') return 'rain'
  if (raw === 'studio') return 'cafe'
  if (raw === 'rpg') return 'fireplace'
  return 'rain'
}

function currentPreset(): AmbientPreset {
  return normalizePreset(useUIStore.getState().settings.ambientPreset)
}

function ambientAssetUrl(preset: AmbientPreset): string {
  const base = import.meta.env.BASE_URL ?? './'
  const normalized = base.endsWith('/') ? base : `${base}/`
  const rel = `${normalized}sounds/ambient/${preset}.wav`.replace(/([^:]\/)\/+/g, '$1')
  if (typeof window !== 'undefined' && window.location?.href) {
    try {
      return new URL(rel, window.location.href).href
    } catch {
      return rel
    }
  }
  return rel
}

async function loadAmbientBuffer(preset: AmbientPreset): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(preset)
  if (cached === 'missing') return null
  if (cached && cached !== 'loading') return cached

  const ctx = getSharedAudioContext()
  if (!ctx) return null

  bufferCache.set(preset, 'loading')
  try {
    const response = await fetch(ambientAssetUrl(preset))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(data.slice(0))
    bufferCache.set(preset, buffer)
    return buffer
  } catch {
    bufferCache.set(preset, 'missing')
    return null
  }
}

function stopSourceNodes(): void {
  if (!ambientSource) return
  try {
    ambientSource.stop()
    ambientSource.disconnect()
  } catch {
    // already stopped
  }
  ambientGain?.disconnect()
  ambientSource = null
  ambientGain = null
  activePreset = null
}

export function startAmbientLoop(): void {
  if (ambientSource) return
  const vol = ambientVolume()
  if (vol <= 0) return

  const preset = currentPreset()
  const ctx = getSharedAudioContext()
  if (!ctx) return

  void loadAmbientBuffer(preset).then(async (buffer) => {
    const resolvedBuffer = buffer ?? (preset !== 'cafe' ? await loadAmbientBuffer('cafe') : null)
    if (!resolvedBuffer || ambientSource) return
    const liveVol = ambientVolume()
    if (liveVol <= 0 || currentPreset() !== preset) return

    const gain = ctx.createGain()
    gain.gain.value = liveVol
    const source = ctx.createBufferSource()
    source.buffer = resolvedBuffer
    source.loop = true
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    ambientSource = source
    ambientGain = gain
    activePreset = preset
  })
}

export function stopAmbientLoop(): void {
  stopSourceNodes()
}

export function syncAmbientLoop(): void {
  const nextVolume = ambientVolume()
  const nextPreset = currentPreset()

  if (nextVolume <= 0) {
    stopAmbientLoop()
    return
  }

  if (ambientSource && ambientGain && activePreset === nextPreset) {
    ambientGain.gain.value = nextVolume
    return
  }

  stopAmbientLoop()
  startAmbientLoop()
}

/** Briefly lower ambient bed during reward stingers. */
export function duckAmbient(durationMs = 900, factor = 0.35): void {
  if (!ambientGain) return
  const base = ambientVolume()
  if (base <= 0) return
  const previous = ambientGain.gain.value
  ambientGain.gain.value = base * factor
  window.setTimeout(() => {
    if (ambientGain) ambientGain.gain.value = ambientVolume()
  }, durationMs)
}
