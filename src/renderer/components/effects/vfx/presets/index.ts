export type VfxPresetId = 'questComplete' | 'streak' | 'levelUp' | 'chestReveal'

export type VfxPresetConfig = {
  id: VfxPresetId
  particleCount: number
  durationMs: number
  spread: number
  speed: number
  colors: string[]
}

export const VFX_PRESETS: Record<VfxPresetId, VfxPresetConfig> = {
  questComplete: {
    id: 'questComplete',
    particleCount: 48,
    durationMs: 1400,
    spread: 1.2,
    speed: 0.35,
    colors: ['#fbbf24', '#f472b6', '#38bdf8'],
  },
  streak: {
    id: 'streak',
    particleCount: 36,
    durationMs: 1200,
    spread: 0.9,
    speed: 0.28,
    colors: ['#fb923c', '#facc15'],
  },
  levelUp: {
    id: 'levelUp',
    particleCount: 64,
    durationMs: 1800,
    spread: 1.4,
    speed: 0.42,
    colors: ['#a78bfa', '#22d3ee', '#fbbf24'],
  },
  chestReveal: {
    id: 'chestReveal',
    particleCount: 40,
    durationMs: 1600,
    spread: 1,
    speed: 0.3,
    colors: ['#eab308', '#f97316'],
  },
}

export function getCategoryAccentColors(category?: string): string[] {
  switch (category) {
    case 'drawing':
      return ['#60a5fa', '#93c5fd']
    case 'anatomy':
      return ['#f87171', '#fca5a5']
    case 'animation':
      return ['#34d399', '#6ee7b7']
    case 'effects':
      return ['#c084fc', '#e879f9']
    default:
      return VFX_PRESETS.questComplete.colors
  }
}

export type VfxQualityTier = 'off' | 'normal' | 'enhanced'

/** Scale preset intensity by user quality tier (normal = baseline). */
export function applyVfxQualityToPreset(
  config: VfxPresetConfig,
  quality: VfxQualityTier,
): VfxPresetConfig {
  if (quality !== 'enhanced') return config
  return {
    ...config,
    particleCount: Math.round(config.particleCount * 1.45),
    durationMs: Math.round(config.durationMs * 1.12),
    spread: config.spread * 1.08,
    speed: config.speed * 1.06,
  }
}
