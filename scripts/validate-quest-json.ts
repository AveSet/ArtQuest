/**
 * CI validation for quest JSON files.
 *
 * Usage: npx tsx scripts/validate-quest-json.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { LATIN_ALLOW, unexpectedLatin, type QuestLocale } from './quest-l10n-shared.ts'
import { isGenericMicroInstruction } from './quest-micro-challenge-copy.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

const questSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  title: z.record(z.string()),
  category: z.string(),
  difficulty: z.enum(['novice', 'intermediate', 'advanced', 'master', 'expert']),
  description: z.record(z.string()),
  xp: z.number(),
  estimatedTime: z.number(),
  source: z.string(),
  icon: z.string(),
  color: z.string(),
  min_level: z.number(),
  tags: z.array(z.string()),
  prerequisites: z.array(z.number()),
  medium: z.enum(['traditional', 'digital', 'both']),
  is_repeatable: z.boolean(),
  review_after_days: z.number(),
  streak_bonus: z.number(),
  microChallenges: z.array(z.object({
    id: z.string(),
    instruction: z.record(z.string()),
    estimatedTime: z.number(),
    xp: z.number(),
    prerequisite: z.string().optional(),
  })).optional(),
})

const FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

async function main(): Promise<void> {
  const allIds = new Set<number>()
  const allQuests: { id: number; prerequisites: number[]; category: string; difficulty: string }[] = []
  let total = 0
  const noviceByCategory = new Map<string, number>()

  for (const file of FILES) {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'))
    if (!Array.isArray(raw)) throw new Error(`${file} must be an array`)
    for (const item of raw) {
      const parsed = questSchema.safeParse(item)
      if (!parsed.success) {
        console.error(`Invalid quest in ${file}:`, parsed.error.flatten())
        process.exit(1)
      }
      if (allIds.has(parsed.data.id)) {
        console.error(`Duplicate quest id ${parsed.data.id} in ${file}`)
        process.exit(1)
      }
      allIds.add(parsed.data.id)
      allQuests.push({
        id: parsed.data.id,
        prerequisites: parsed.data.prerequisites,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
      })
      if (parsed.data.difficulty === 'novice') {
        noviceByCategory.set(parsed.data.category, (noviceByCategory.get(parsed.data.category) ?? 0) + 1)
      }
      total++
    }
  }

  let missingMc = 0
  for (const file of FILES) {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8')) as z.infer<typeof questSchema>[]
    for (const item of raw) {
      if (!item.microChallenges?.length) {
        missingMc++
        if (missingMc <= 5) {
          console.error(`Quest ${item.id} in ${file} has no micro-challenges`)
        }
        continue
      }
      const mcSum = item.microChallenges.reduce((s, mc) => s + mc.estimatedTime, 0)
      if (mcSum !== item.estimatedTime) {
        console.error(
          `Quest ${item.id} in ${file}: estimatedTime ${item.estimatedTime} != micro-challenge sum ${mcSum}`,
        )
        process.exit(1)
      }
    }
  }
  if (missingMc > 0) {
    console.error(`${missingMc} quests missing micro-challenges — run generate-micro-challenges.ts`)
    process.exit(1)
  }

  for (const q of allQuests) {
    for (const pid of q.prerequisites) {
      if (!allIds.has(pid)) {
        console.error(`Quest ${q.id} references missing prerequisite ${pid}`)
        process.exit(1)
      }
    }
  }

  for (const cat of ['drawing', 'anatomy', 'animation', 'effects', 'storytelling', 'character_design', 'environment']) {
    const count = noviceByCategory.get(cat) ?? 0
    if (count < 1) {
      console.error(`Category ${cat} has no novice quests (${count})`)
      process.exit(1)
    }
  }

  const l10nLocales: QuestLocale[] = ['ru', 'zh', 'ja', 'ko']
  let l10nIssues = 0
  for (const file of FILES) {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8')) as z.infer<typeof questSchema>[]
    for (const item of raw) {
      for (const locale of l10nLocales) {
        for (const field of ['title', 'description'] as const) {
          const text = (item[field] as Record<string, string>)[locale] ?? ''
          const leaks = unexpectedLatin(text)
          if (leaks.length > 0) {
            l10nIssues++
            if (l10nIssues <= 10) {
              console.warn(`[l10n:${locale}] ${file} #${item.id} ${field}: ${leaks.join(', ')}`)
            }
          }
        }
      }
    }
  }
  if (l10nIssues > 10) console.warn(`[l10n] …and ${l10nIssues - 10} more`)
  if (l10nIssues > 0) {
    console.warn(`[l10n] ${l10nIssues} localized quest fields still contain unexpected Latin tokens`)
    console.warn(`[l10n] allowed tokens include: ${[...LATIN_ALLOW].slice(0, 12).join(', ')}…`)
  }

  let genericMc = 0
  for (const file of FILES) {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8')) as z.infer<typeof questSchema>[]
    for (const item of raw) {
      for (const mc of item.microChallenges ?? []) {
        if (isGenericMicroInstruction(mc.instruction.en ?? '')) {
          genericMc++
          if (genericMc <= 5) {
            console.error(`Generic micro-challenge in ${file} quest ${item.id}: ${mc.instruction.en}`)
          }
        }
      }
    }
  }
  if (genericMc > 0) {
    console.error(`${genericMc} generic micro-challenge instructions remain — run personalize-micro-challenges.ts`)
    process.exit(1)
  }

  console.log(`Validated ${total} quests across ${FILES.length} files`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
