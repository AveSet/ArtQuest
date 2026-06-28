/**
 * Add 3-step micro-challenges to every catalog quest missing them.
 * Uses quest-specific copy (not generic placeholders).
 *
 * Usage: npx tsx scripts/generate-micro-challenges.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildQuestMicroChallenges } from './quest-micro-challenge-copy.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

interface Quest {
  id: number
  code?: string
  difficulty: string
  title: { en: string; ru: string; [k: string]: string | undefined }
  description: { en: string; ru: string; [k: string]: string | undefined }
  category: string
  estimatedTime: number
  tags: string[]
  microChallenges?: ReturnType<typeof buildQuestMicroChallenges>
}

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
  let added = 0
  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]
    for (const q of quests) {
      if (q.microChallenges && q.microChallenges.length > 0) continue
      q.microChallenges = buildQuestMicroChallenges(q)
      const sum = q.microChallenges.reduce((s, mc) => s + mc.estimatedTime, 0)
      if (sum > 0) q.estimatedTime = sum
      added++
    }
    await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    console.log(`${file}: added micro-challenges where missing`)
  }
  console.log(`Added micro-challenges to ${added} quests`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
