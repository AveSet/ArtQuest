import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { isWebGL2Available, ParticleEngine } from './particleEngine'
import { VFX_PRESETS, applyVfxQualityToPreset, getCategoryAccentColors, type VfxPresetId } from './presets'
import { trackTelemetry } from '@/telemetry/telemetryClient'

type VfxWebglLayerProps = {
  preset: VfxPresetId | null
  category?: string
  onDone?: () => void
}

export default function VfxWebglLayer({ preset, category, onDone }: VfxWebglLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<ParticleEngine | null>(null)
  const vfxQuality = useUIStore((s) => s.settings.vfxQuality ?? 'normal')
  const reduceMotion = useUIStore((s) => s.settings.reduceMotion)

  useEffect(() => {
    if (!preset || reduceMotion || vfxQuality === 'off') return
    if (!isWebGL2Available() && vfxQuality === 'enhanced') {
      trackTelemetry('vfx_webgl_unavailable', { preset })
      onDone?.()
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      engineRef.current ??= new ParticleEngine(canvas)
      const config = applyVfxQualityToPreset({ ...VFX_PRESETS[preset] }, vfxQuality)
      if (category) {
        config.colors = getCategoryAccentColors(category)
      }
      const rect = canvas.getBoundingClientRect()
      engineRef.current.burst(config, rect.width || window.innerWidth, rect.height || window.innerHeight)
      trackTelemetry('vfx_play', { preset, quality: vfxQuality })
      const timer = window.setTimeout(() => onDone?.(), config.durationMs + 100)
      return () => {
        window.clearTimeout(timer)
        engineRef.current?.stop()
      }
    } catch (err) {
      trackTelemetry('vfx_init_fail', { preset, error: String(err) })
      onDone?.()
    }
  }, [preset, category, reduceMotion, vfxQuality, onDone])

  if (!preset || reduceMotion || vfxQuality === 'off') return null

  return (
    <canvas
      ref={canvasRef}
      className="vfx-webgl-layer pointer-events-none fixed inset-0 z-[9998]"
      aria-hidden
    />
  )
}
