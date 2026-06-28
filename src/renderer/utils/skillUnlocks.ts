import type { SkillNode } from '@/store/models'
import { NODE_MAX_LEVEL } from '@/utils/progressionBalance'

/** Row position of each node (0 = fundamentals, 3 = top tier). */
export const NODE_ROWS: Record<string, number> = {
  drawing_fundamentals: 0,
  drawing_perspective: 1,
  drawing_shapes: 1,
  drawing_composition: 1,
  drawing_practice: 2,
  drawing_quick_sketch: 2,
  drawing_contour: 2,
  drawing_value: 2,
  drawing_advanced: 3,
  drawing_digital: 3,
  drawing_color: 3,
  anatomy_fundamentals: 0,
  anatomy_skeleton: 1,
  anatomy_muscles: 1,
  anatomy_proportions: 1,
  anatomy_body: 2,
  anatomy_hands: 2,
  anatomy_feet: 2,
  anatomy_head: 2,
  anatomy_advanced: 3,
  anatomy_dynamics: 3,
  anatomy_foreshortening: 3,
  animation_fundamentals: 0,
  animation_timing: 1,
  animation_spacing: 1,
  animation_arcs: 1,
  animation_walk: 2,
  animation_run: 2,
  animation_idle: 2,
  animation_transitions: 3,
  animation_expressions: 3,
  animation_complex: 3,
  effects_fundamentals: 0,
  effects_particles: 1,
  effects_energy: 1,
  effects_weather: 1,
  effects_combat: 2,
  effects_magic: 2,
  effects_elements: 2,
  effects_advanced: 3,
  effects_particle_advanced: 3,
  effects_post_process: 3,
  storytelling_fundamentals: 0,
  storytelling_visual: 1,
  storytelling_pacing: 1,
  storytelling_emotion: 1,
  storytelling_panels: 2,
  storytelling_sequential: 2,
  storytelling_character_arc: 2,
  storytelling_advanced: 3,
  storytelling_world: 3,
  storytelling_thematic: 3,
  // Drawing extensions
  drawing_gesture: 1,
  drawing_line_quality: 1,
  drawing_construction: 1,
  drawing_simplification: 2,
  drawing_texture: 2,
  drawing_rendering: 3,
  drawing_speedpaint: 3,
  drawing_studies: 3,
  // Anatomy extensions
  anatomy_facial_features: 2,
  anatomy_eyes: 2,
  anatomy_hair: 2,
  anatomy_drapery: 2,
  anatomy_clothing: 2,
  // Animation extensions
  animation_squash_stretch: 1,
  animation_anticipation: 1,
  animation_secondary: 2,
  animation_follow_through: 2,
  animation_solid_drawing: 1,
  animation_staging: 2,
  // Storytelling extensions
  storytelling_camera: 1,
  storytelling_shots: 1,
  storytelling_visual_dev: 2,
  storytelling_storyboard: 2,
  storytelling_animatics: 2,
  storytelling_continuity: 3,
  // Effects extensions
  effects_smoke: 1,
  effects_fire: 3,
  effects_water: 3,
  // Character Design
  character_design_fundamentals: 0,
  character_silhouette: 1,
  character_shape_language: 1,
  character_proportions: 1,
  character_personality: 2,
  character_variety: 2,
  character_costume: 2,
  character_expressions: 2,
  character_turnaround: 3,
  character_sheet: 3,
  character_creatures: 3,
  character_mechanical: 3,
  // Environment Design
  environment_fundamentals: 0,
  environment_perspective: 1,
  environment_composition: 1,
  environment_architecture: 1,
  environment_nature: 2,
  environment_interior: 2,
  environment_props: 2,
  environment_lighting: 2,
  environment_mood: 3,
  environment_matte: 3,
}

/** Required prerequisite level based on the node's row depth. */
function requiredPrereqLevel(nodeId: string): number {
  const row = NODE_ROWS[nodeId] ?? 0
  if (row <= 1) return 1
  if (row === 2) return 5
  return 10
}

/** Effective level accounting for prestige (each prestige = NODE_MAX_LEVEL additional levels). */
export function effectiveNodeLevel(node: SkillNode): number {
  return node.level + node.prestige * NODE_MAX_LEVEL
}

function effectiveLevel(node: SkillNode): number {
  return effectiveNodeLevel(node)
}

/** Unlock nodes when their prerequisites reach the required level for their tier. */
export function applyPrerequisiteUnlocks(nodes: SkillNode[]): SkillNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  return nodes.map((node) => {
    const needLevel = requiredPrereqLevel(node.id)
    const isUnlocked = node.prerequisites.every((pid) => {
      const p = byId.get(pid)
      return p != null && effectiveLevel(p) >= needLevel
    })
    return { ...node, isUnlocked }
  })
}
