import type { QuestCategory } from '@/data/skillTree'
import { CATEGORY_INFO } from '@/data/skillTree'

const NODE_EMOJI: Record<string, string> = {
  drawing_fundamentals: '🎨',
  drawing_perspective: '📐',
  drawing_shapes: '🔷',
  drawing_composition: '🖼️',
  drawing_practice: '✏️',
  drawing_quick_sketch: '⚡',
  drawing_contour: '〰️',
  drawing_value: '🌓',
  drawing_advanced: '🎭',
  drawing_digital: '💻',
  drawing_color: '🌈',
  anatomy_fundamentals: '🦴',
  anatomy_skeleton: '💀',
  anatomy_muscles: '💪',
  anatomy_proportions: '📏',
  anatomy_body: '🧍',
  anatomy_hands: '🖐️',
  anatomy_feet: '🦶',
  anatomy_head: '🗣️',
  anatomy_advanced: '🔬',
  anatomy_dynamics: '🏃',
  anatomy_foreshortening: '📽️',
  animation_fundamentals: '🎬',
  animation_timing: '⏱️',
  animation_spacing: '↔️',
  animation_arcs: '〰️',
  animation_walk: '🚶',
  animation_run: '🏃',
  animation_idle: '😴',
  animation_transitions: '🔄',
  animation_expressions: '😊',
  animation_complex: '🎭',
  effects_fundamentals: '✨',
  effects_particles: '💫',
  effects_energy: '⚡',
  effects_weather: '🌧️',
  effects_combat: '💥',
  effects_magic: '🔮',
  effects_elements: '🔥',
  effects_advanced: '🌟',
  effects_particle_advanced: '✨',
  effects_post_process: '📸',
  storytelling_fundamentals: '📖',
  storytelling_visual: '🖼️',
  storytelling_pacing: '📊',
  storytelling_emotion: '💕',
  storytelling_panels: '🗂️',
  storytelling_sequential: '📚',
  storytelling_character_arc: '📈',
  storytelling_advanced: '🎯',
  storytelling_world: '🌍',
  storytelling_thematic: '🔍',
  drawing_gesture: '🤸',
  drawing_line_quality: '✒️',
  drawing_construction: '🏗️',
  drawing_simplification: '🧩',
  drawing_texture: '🧶',
  drawing_rendering: '🖌️',
  drawing_speedpaint: '⏩',
  drawing_studies: '📝',
  anatomy_facial_features: '👃',
  anatomy_eyes: '👁️',
  anatomy_hair: '💇',
  anatomy_drapery: '👘',
  anatomy_clothing: '👕',
  animation_squash_stretch: '🔄',
  animation_anticipation: '⏪',
  animation_secondary: '🎭',
  animation_follow_through: '➡️',
  animation_solid_drawing: '🧊',
  animation_staging: '🎪',
  storytelling_camera: '🎥',
  storytelling_shots: '📷',
  storytelling_visual_dev: '🎨',
  storytelling_storyboard: '📋',
  storytelling_animatics: '🎞️',
  storytelling_continuity: '🔗',
  effects_smoke: '💨',
  effects_fire: '🔥',
  effects_water: '💧',
  character_design_fundamentals: '🎭',
  character_silhouette: '◼️',
  character_shape_language: '🔺',
  character_proportions: '📐',
  character_personality: '💭',
  character_variety: '👥',
  character_costume: '👗',
  character_expressions: '😊',
  character_turnaround: '🔄',
  character_sheet: '📄',
  character_creatures: '🐉',
  character_mechanical: '🤖',
  environment_fundamentals: '🏞️',
  environment_perspective: '🏔️',
  environment_composition: '🖼️',
  environment_architecture: '🏛️',
  environment_nature: '🌿',
  environment_interior: '🏠',
  environment_props: '🪑',
  environment_lighting: '💡',
  environment_mood: '🌆',
  environment_matte: '🎨',
}

type SkillNodeIconProps = {
  nodeId: string
  category: QuestCategory
  className?: string
  size?: 'tree' | 'panel' | 'inline'
}

const SIZE_CLASS = {
  tree: 'skill-node-emoji--tree',
  panel: 'skill-node-emoji--panel',
  inline: 'skill-node-emoji--inline',
} as const

/** Same emoji icons as modern/light; RPG theme tints via category color CSS variables. */
export function SkillNodeIcon({ nodeId, category, className, size = 'tree' }: SkillNodeIconProps) {
  const accent = CATEGORY_INFO[category]?.color ?? 'var(--accent)'
  return (
    <span
      className={['skill-node-emoji', SIZE_CLASS[size], className].filter(Boolean).join(' ')}
      style={{ ['--skill-node-accent' as string]: accent }}
      aria-hidden
    >
      {NODE_EMOJI[nodeId] ?? '⭐'}
    </span>
  )
}
