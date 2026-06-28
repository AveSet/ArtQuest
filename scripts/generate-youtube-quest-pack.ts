/**
 * Append YouTube-inspired quest pack (ids 11001+) to category JSON files.
 * Idempotent per quest id: adds only missing quest ids.
 *
 * Usage: npx tsx scripts/generate-youtube-quest-pack.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { QuestDraft } from './youtube-quest-helpers.ts'
import { PACK_A } from './youtube-quest-drafts-pack-a.ts'
import { PACK_B } from './youtube-quest-drafts-pack-b.ts'
import { PACK_C, PACK_D, PACK_E } from './youtube-quest-drafts-pack-cde.ts'
import { PACK_F } from './youtube-quest-drafts-pack-f.ts'
import { PACK_G } from './youtube-quest-drafts-pack-g.ts'
import { PACK_H } from './youtube-quest-drafts-pack-h.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')
const DRAFTS: QuestDraft[] = [...PACK_A, ...PACK_B, ...PACK_C, ...PACK_D, ...PACK_E, ...PACK_F, ...PACK_G, ...PACK_H]

const CAT_META: Record<
  QuestDraft['category'],
  { code: string; icon: string; color: string; file: string }
> = {
  drawing: { code: 'DRW', icon: '🎨', color: '#6366f1', file: 'quests_drawing.json' },
  anatomy: { code: 'ANA', icon: '🦴', color: '#ec4899', file: 'quests_anatomy.json' },
  animation: { code: 'ANM', icon: '🎬', color: '#10b981', file: 'quests_animation.json' },
  effects: { code: 'VFX', icon: '✨', color: '#f59e0b', file: 'quests_effects.json' },
  storytelling: { code: 'STY', icon: '📖', color: '#8b5cf6', file: 'quests_storytelling.json' },
  character_design: { code: 'CDN', icon: '🎭', color: '#06b6d4', file: 'quests_character_design.json' },
  environment: { code: 'ENV', icon: '🏞️', color: '#84cc16', file: 'quests_environment.json' },
}

function buildQuest(draft: QuestDraft) {
  const meta = CAT_META[draft.category]
  const code = `${meta.code}-${String(draft.id).padStart(5, '0')}`
  const tags = [...new Set([...draft.tags, draft.category, draft.difficulty])]
  return {
    id: draft.id,
    code,
    title: draft.title,
    category: draft.category,
    difficulty: draft.difficulty,
    description: draft.description,
    xp: draft.xp,
    estimatedTime: draft.estimatedTime,
    source: draft.source,
    icon: meta.icon,
    color: meta.color,
    min_level: draft.min_level,
    tags,
    prerequisites: draft.prerequisites ?? [],
    medium: draft.medium,
    is_repeatable: draft.is_repeatable,
    review_after_days: draft.review_after_days,
    streak_bonus: 1,
    microChallenges: draft.microChallenges,
  }
}

async function main(): Promise<void> {
  const byFile = new Map<string, ReturnType<typeof buildQuest>[]>()
  for (const draft of DRAFTS) {
    const meta = CAT_META[draft.category]
    const list = byFile.get(meta.file) ?? []
    list.push(buildQuest(draft))
    byFile.set(meta.file, list)
  }

  let added = 0
  for (const [file, newQuests] of byFile) {
    const filePath = path.join(DATA_DIR, file)
    const existing = JSON.parse(await fs.readFile(filePath, 'utf8')) as { id: number }[]
    const existingIds = new Set(existing.map((q) => q.id))

    const toAdd: typeof newQuests = []
    for (const q of newQuests) {
      if (!existingIds.has(q.id)) toAdd.push(q)
    }

    if (toAdd.length === 0) continue

    const merged = [...existing, ...toAdd].sort((a, b) => a.id - b.id)
    await fs.writeFile(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8')
    added += toAdd.length
    console.log(`${file}: +${toAdd.length} YouTube-inspired quests`)
  }

  console.log(`Added ${added} quests (${DRAFTS.length} defined, inspiredBy in draft sources)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
