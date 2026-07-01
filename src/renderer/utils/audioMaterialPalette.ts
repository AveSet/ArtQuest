import type { QuestCategory } from '@/data/skillTree'

export type MaterialAudioCharacter = 'graphite' | 'charcoal' | 'marker' | 'ink'

const CATEGORY_MATERIAL: Record<QuestCategory, MaterialAudioCharacter> = {
  drawing: 'graphite',
  anatomy: 'charcoal',
  animation: 'marker',
  effects: 'ink',
  storytelling: 'charcoal',
  character_design: 'marker',
  environment: 'graphite',
}

export function getMaterialAudioCharacter(category: QuestCategory): MaterialAudioCharacter {
  return CATEGORY_MATERIAL[category] ?? 'graphite'
}

export function materialPitchShift(category: QuestCategory): number {
  switch (getMaterialAudioCharacter(category)) {
    case 'graphite':
      return 1
    case 'charcoal':
      return 0.92
    case 'marker':
      return 1.08
    case 'ink':
      return 0.85
    default:
      return 1
  }
}
