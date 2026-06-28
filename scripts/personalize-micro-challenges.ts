/**
 * Replace generic micro-challenge copy with quest-specific 3-step phases.
 *
 * Usage: npx tsx scripts/personalize-micro-challenges.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildQuestPhaseTriple,
  questMicroChallengesNeedPersonalize,
  type QuestMicroInput,
} from './quest-micro-challenge-copy.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

const FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

interface MicroChallenge {
  id: string
  instruction: Record<string, string>
  estimatedTime: number
  xp: number
  prerequisite?: string
}

type Quest = QuestMicroInput & { microChallenges?: MicroChallenge[] }

function splitTimes(total: number, existing: number[]): [number, number, number] {
  if (existing.length === 3 && existing.reduce((a, b) => a + b, 0) === total) {
    return existing as [number, number, number]
  }
  const warmup = Math.max(4, Math.min(8, Math.round(total * 0.18)))
  const polish = Math.max(8, Math.min(14, Math.round(total * 0.32)))
  const core = Math.max(5, total - warmup - polish)
  return [warmup, core, polish]
}

function applyPhases(quest: Quest): boolean {
  const mcs = quest.microChallenges
  if (!mcs?.length || mcs.length !== 3 || !questMicroChallengesNeedPersonalize(mcs)) return false

  const phases = buildQuestPhaseTriple(quest)
  const times = splitTimes(
    quest.estimatedTime,
    mcs.map((mc) => mc.estimatedTime),
  )
  const xp = mcs.map((mc) => mc.xp) as [number, number, number]

  quest.microChallenges = phases.map((phase, i) => {
    const prev = mcs[i]!
    const next: MicroChallenge = {
      id: prev.id,
      instruction: { ...prev.instruction, en: phase.en, ru: phase.ru },
      estimatedTime: times[i]!,
      xp: xp[i]!,
    }
    if (i > 0) next.prerequisite = mcs[i - 1]!.id
    return next
  })

  const sum = quest.microChallenges.reduce((s, mc) => s + mc.estimatedTime, 0)
  if (sum !== quest.estimatedTime) quest.estimatedTime = sum

  return true
}

async function main(): Promise<void> {
  let updated = 0
  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]
    let fileUpdates = 0
    for (const q of quests) {
      if (applyPhases(q)) {
        updated++
        fileUpdates++
      }
    }
    if (fileUpdates > 0) {
      await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    }
    console.log(`${file}: updated ${fileUpdates} quest phase sets`)
  }
  console.log(`Personalized micro-challenges on ${updated} quests total`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
