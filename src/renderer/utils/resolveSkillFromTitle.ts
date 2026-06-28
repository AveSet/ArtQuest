import { SKILL_TREE_NODES, type QuestCategory } from '@/data/skillTree'
import { tokenizeTitleForTags } from '@/utils/tokenizeTitleForTags'
import { resolveQuestSkillNodeId } from '@/utils/resolveQuestSkillNode'

const CATEGORY_KEYWORDS: Record<QuestCategory, { re: RegExp; nodeId: string; weight: number }[]> = {
  drawing: [
    { re: /\b(перспектив|perspective|куб|cube|cylinder|цилиндр|линии|lines|композици|composition)\b/i, nodeId: 'drawing_perspective', weight: 4 },
    { re: /\b(скетч|sketch|жест|gesture|быстр|quick)\b/i, nodeId: 'drawing_quick_sketch', weight: 3 },
    { re: /\b(контур|contour)\b/i, nodeId: 'drawing_contour', weight: 3 },
    { re: /\b(тон|value|свет|light|затенен|shade)\b/i, nodeId: 'drawing_value', weight: 3 },
    { re: /\b(цвет|color|залив|fill)\b/i, nodeId: 'drawing_color', weight: 3 },
    { re: /\b(цифр|digital|планшет|tablet|photoshop|krita)\b/i, nodeId: 'drawing_digital', weight: 2 },
  ],
  anatomy: [
    { re: /\b(рук|hand|кист)\b/i, nodeId: 'anatomy_hands', weight: 4 },
    { re: /\b(ног|foot|feet|стоп)\b/i, nodeId: 'anatomy_feet', weight: 4 },
    { re: /\b(лиц|face|голова|head)\b/i, nodeId: 'anatomy_head', weight: 4 },
    { re: /\b(мышц|muscle|скелет|skeleton)\b/i, nodeId: 'anatomy_muscles', weight: 3 },
    { re: /\b(пропорц|proportion)\b/i, nodeId: 'anatomy_proportions', weight: 3 },
  ],
  animation: [
    { re: /\b(танец|танц|dance|хореограф)\b/i, nodeId: 'animation_transitions', weight: 5 },
    { re: /\b(двух|двое|пара|couple|многоперсонаж|multi)\b/i, nodeId: 'animation_complex', weight: 5 },
    { re: /\b(ходьб|walk)\b/i, nodeId: 'animation_walk', weight: 4 },
    { re: /\b(бег|run)\b/i, nodeId: 'animation_run', weight: 4 },
    { re: /\b(тайминг|timing|спейсинг|spacing)\b/i, nodeId: 'animation_timing', weight: 3 },
    { re: /\b(лиц|face|мимик|expression|диалог|dialogue)\b/i, nodeId: 'animation_expressions', weight: 3 },
  ],
  effects: [
    { re: /\b(частиц|particle)\b/i, nodeId: 'effects_particles', weight: 4 },
    { re: /\b(маг|magic|заклин|spell)\b/i, nodeId: 'effects_magic', weight: 3 },
    { re: /\b(огн|fire|пламя|flame|лав|lava)\b/i, nodeId: 'effects_elements', weight: 3 },
    { re: /\b(взрыв|explosion|удар|impact|боев|combat)\b/i, nodeId: 'effects_combat', weight: 3 },
    { re: /\b(погод|weather|дожд|rain|снег|snow)\b/i, nodeId: 'effects_weather', weight: 3 },
  ],
  storytelling: [
    { re: /\b(раскадров|storyboard|панел|panel)\b/i, nodeId: 'storytelling_panels', weight: 4 },
    { re: /\b(комикс|comic)\b/i, nodeId: 'storytelling_panels', weight: 3 },
    { re: /\b(аниматик|animatic)\b/i, nodeId: 'storytelling_pacing', weight: 3 },
    { re: /\b(эмоци|emotion)\b/i, nodeId: 'storytelling_emotion', weight: 3 },
  ],
  character_design: [
    { re: /\b(силуэт|silhouette)\b/i, nodeId: 'character_silhouette', weight: 4 },
    { re: /\b(разворот|turnaround)\b/i, nodeId: 'character_turnaround', weight: 4 },
    { re: /\b(костюм|costume|одежд|outfit)\b/i, nodeId: 'character_costume', weight: 3 },
  ],
  environment: [
    { re: /\b(пейзаж|landscape|горизонт|horizon)\b/i, nodeId: 'environment_nature', weight: 4 },
    { re: /\b(архитект|architecture|здан|building)\b/i, nodeId: 'environment_architecture', weight: 4 },
    { re: /\b(интерьер|interior)\b/i, nodeId: 'environment_interior', weight: 3 },
  ],
}

/** Pick the best skill-tree node for a user-authored quest title. */
export function resolveSkillNodeIdFromTitle(title: string, category: QuestCategory): string {
  const tokens = tokenizeTitleForTags(title, 12)
  const tagScores = new Map<string, number>()

  for (const token of tokens) {
    const candidates = SKILL_TREE_NODES.filter((n) => n.category === category)
    for (const node of candidates) {
      for (const tag of node.tags) {
        const lower = tag.toLowerCase()
        if (token === lower || token.includes(lower) || lower.includes(token)) {
          tagScores.set(node.id, (tagScores.get(node.id) ?? 0) + 2)
        }
      }
    }
  }

  const hints = CATEGORY_KEYWORDS[category] ?? []
  for (const { re, nodeId, weight } of hints) {
    if (re.test(title)) tagScores.set(nodeId, (tagScores.get(nodeId) ?? 0) + weight)
  }

  let bestId = ''
  let bestScore = -1
  for (const [id, score] of tagScores) {
    if (score > bestScore) {
      bestScore = score
      bestId = id
    }
  }

  if (bestScore > 0 && SKILL_TREE_NODES.some((n) => n.id === bestId)) {
    return bestId
  }

  return resolveQuestSkillNodeId({ category, tags: tokens })
}
