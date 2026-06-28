/**
 * Recalibrate catalog quest estimatedTime from completion logs (median + shrinkage).
 *
 * Usage:
 *   npx tsx scripts/recalculate-quest-times.ts --progress ./exports/progress.json --dry-run
 *   npx tsx scripts/recalculate-quest-times.ts --progress ./exports/progress.json --write
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  medianPracticeMinutesByQuest,
  shrinkEstimatedTime,
  rescaleMicroChallengeMinutes,
  QUEST_TIME_MIN_SAMPLES,
} from '../src/renderer/utils/questTimeCalibration.ts'

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

type MicroChallenge = {
  id: string
  estimatedTime: number
  [key: string]: unknown
}

type Quest = {
  id: number
  estimatedTime: number
  microChallenges?: MicroChallenge[]
  [key: string]: unknown
}

type ProgressPayload = {
  questCompletionLogs?: Array<{
    questId: number
    practiceMinutes?: number
    status?: 'completed' | 'timeout'
    isSpeedRun?: boolean
  }>
}

function parseArgs(argv: string[]): { progressPath: string | null; write: boolean } {
  let progressPath: string | null = null
  let write = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--progress' && argv[i + 1]) {
      progressPath = argv[++i]!
    } else if (arg === '--write') {
      write = true
    }
  }
  return { progressPath, write }
}

async function loadProgress(progressPath: string): Promise<ProgressPayload> {
  const raw = await fs.readFile(progressPath, 'utf8')
  const parsed = JSON.parse(raw) as ProgressPayload | { data?: ProgressPayload }
  if ('data' in parsed && parsed.data) return parsed.data
  return parsed as ProgressPayload
}

async function main(): Promise<void> {
  const { progressPath, write } = parseArgs(process.argv.slice(2))
  if (!progressPath) {
    console.error('Usage: npx tsx scripts/recalculate-quest-times.ts --progress <path> [--dry-run|--write]')
    process.exit(1)
  }

  const progress = await loadProgress(path.resolve(progressPath))
  const logs = progress.questCompletionLogs ?? []
  const medians = medianPracticeMinutesByQuest(logs)
  console.log(`Logs: ${logs.length}, quests with n>=${QUEST_TIME_MIN_SAMPLES}: ${medians.size}`)

  let updated = 0
  const changes: string[] = []

  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]
    for (const quest of quests) {
      const row = medians.get(quest.id)
      if (!row) continue
      const oldTime = quest.estimatedTime
      const newTime = shrinkEstimatedTime(oldTime, row.median)
      if (newTime === oldTime) continue
      quest.estimatedTime = newTime
      if (quest.microChallenges?.length) {
        quest.microChallenges = rescaleMicroChallengeMinutes(
          quest.microChallenges as MicroChallenge[],
          oldTime,
          newTime,
        )
      }
      updated++
      changes.push(`${quest.id}: ${oldTime} -> ${newTime} min (n=${row.count}, med=${row.median})`)
    }
    if (write) {
      await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    }
  }

  console.log(write ? `Updated ${updated} quests in catalog JSON.` : `[dry-run] Would update ${updated} quests.`)
  for (const line of changes.slice(0, 40)) console.log(line)
  if (changes.length > 40) console.log(`... and ${changes.length - 40} more`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
