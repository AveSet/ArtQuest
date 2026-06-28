/**
 * Sync quest.estimatedTime to the sum of micro-challenge minutes.
 * Light XP touch-up when time shrinks a lot (keeps rewards proportional to practice).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../src/renderer/data')

const DIFFICULTY_BASE_XP = {
  novice: 40,
  intermediate: 70,
  advanced: 110,
  master: 150,
  expert: 190,
}

function questFiles() {
  return fs.readdirSync(dataDir).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))
}

let timeUpdates = 0
let xpUpdates = 0

for (const file of questFiles()) {
  const filePath = path.join(dataDir, file)
  const quests = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let changed = false

  for (const quest of quests) {
    const mcs = quest.microChallenges
    if (!mcs?.length) continue

    const sumMinutes = mcs.reduce((s, mc) => s + (mc.estimatedTime || 0), 0)
    if (sumMinutes > 0 && quest.estimatedTime !== sumMinutes) {
      quest.estimatedTime = sumMinutes
      timeUpdates++
      changed = true
    }

    const mcXp = mcs.reduce((s, mc) => s + (mc.xp || 0), 0)
    const floorXp = (DIFFICULTY_BASE_XP[quest.difficulty] ?? 50) + mcXp
    if (quest.xp < floorXp) {
      quest.xp = floorXp
      xpUpdates++
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
  }
}

console.log(`Updated estimatedTime on ${timeUpdates} quests, xp floor on ${xpUpdates} quests.`)
