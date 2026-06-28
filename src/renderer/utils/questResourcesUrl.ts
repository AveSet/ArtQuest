import type { Quest } from '@/store/models'
import { resolveQuestSkillNodeId } from '@/utils/resolveQuestSkillNode'
import type { MaterialVideoMode } from '@/utils/materialExternalCatalog'

export function buildQuestResourcesSearchParams(
  quest: Pick<Quest, 'category' | 'tags'>,
  mode?: MaterialVideoMode,
): string {
  const nodeId = resolveQuestSkillNodeId(quest)
  const p = new URLSearchParams()
  p.set('category', quest.category)
  p.set('node', nodeId)
  if (quest.tags.length > 0) p.set('tags', quest.tags.join(','))
  if (mode && mode !== 'long') p.set('mode', mode)
  return p.toString()
}

export function questResourcesPath(
  quest: Pick<Quest, 'category' | 'tags'>,
  mode?: MaterialVideoMode,
): string {
  return `/resources?${buildQuestResourcesSearchParams(quest, mode)}`
}
