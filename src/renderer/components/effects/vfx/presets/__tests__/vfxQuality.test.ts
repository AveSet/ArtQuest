import { describe, it, expect } from 'vitest'
import { VFX_PRESETS, applyVfxQualityToPreset } from '../index'

describe('applyVfxQualityToPreset', () => {
  it('returns baseline preset for normal quality', () => {
    const base = VFX_PRESETS.questComplete
    expect(applyVfxQualityToPreset(base, 'normal')).toEqual(base)
  })

  it('scales particle count and duration for enhanced quality', () => {
    const base = VFX_PRESETS.levelUp
    const enhanced = applyVfxQualityToPreset(base, 'enhanced')
    expect(enhanced.particleCount).toBeGreaterThan(base.particleCount)
    expect(enhanced.durationMs).toBeGreaterThan(base.durationMs)
    expect(enhanced.spread).toBeGreaterThan(base.spread)
  })
})
