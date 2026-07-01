import type { QuestCategory } from '@/data/skillTree'
import { CATEGORY_INFO } from '@/data/skillTree'
import { RpgSkillNodeIcon } from '@/components/rpg/RpgSkillIcons'

type SkillNodeIconProps = {
  nodeId: string
  category: QuestCategory
  className?: string
  size?: 'tree' | 'panel' | 'inline'
}

const SIZE_CLASS = {
  tree: 'skill-node-icon--tree',
  panel: 'skill-node-icon--panel',
  inline: 'skill-node-icon--inline',
} as const

/** SVG skill icons (see docs/ART_BIBLE.md). */
export function SkillNodeIcon({ nodeId, category, className, size = 'tree' }: SkillNodeIconProps) {
  const accent = CATEGORY_INFO[category]?.color ?? 'var(--accent)'
  return (
    <RpgSkillNodeIcon
      nodeId={nodeId}
      category={category}
      className={['skill-node-icon', SIZE_CLASS[size], className].filter(Boolean).join(' ')}
      style={{ ['--skill-node-accent' as string]: accent }}
      width={size === 'tree' ? 24 : size === 'panel' ? 32 : 16}
      height={size === 'tree' ? 24 : size === 'panel' ? 32 : 16}
    />
  )
}
