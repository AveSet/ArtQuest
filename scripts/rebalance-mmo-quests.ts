/**
 * Rebalance MMO quest batch (ids 9701–10310): realistic durations, counts, contextual micro-steps.
 *
 * Usage: npx tsx scripts/rebalance-mmo-quests.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

const MMO_ID_MIN = 9701
const MMO_ID_MAX = 10310

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
  instruction: { en: string; ru: string }
  estimatedTime: number
  xp: number
  prerequisite?: string
}

interface Quest {
  id: number
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  difficulty: string
  estimatedTime: number
  xp: number
  microChallenges?: MicroChallenge[]
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28)
}

function parseCount(title: string): number | null {
  const m = title.match(/\b(\d{1,3})\b/)
  if (!m) return null
  const n = parseInt(m[1]!, 10)
  return n >= 3 ? n : null
}

function minutesForCount(count: number, category: string, difficulty: string): number {
  let perItem = 0.55
  if (category === 'animation' || category === 'effects') perItem = 0.85
  if (count >= 40) perItem = Math.min(perItem, 0.45)
  if (count >= 80) perItem = 0.35
  const base = Math.round(count * perItem)
  const floor = difficulty === 'novice' ? 12 : difficulty === 'intermediate' ? 18 : 25
  const cap = difficulty === 'master' ? 120 : 90
  return Math.min(cap, Math.max(floor, base))
}

function minutesSingle(difficulty: string, category: string): number {
  const table: Record<string, number> = {
    novice: 15,
    intermediate: 28,
    advanced: 45,
    master: 75,
    expert: 90,
  }
  let m = table[difficulty] ?? 25
  if (category === 'animation' || category === 'effects') m += 8
  return m
}

function xpForTime(minutes: number, difficulty: string): number {
  const mult: Record<string, number> = {
    novice: 1.1,
    intermediate: 1.35,
    advanced: 1.6,
    master: 2.2,
    expert: 2.5,
  }
  return Math.round(minutes * (mult[difficulty] ?? 1.3))
}

function buildMicro(quest: Quest, count: number | null): MicroChallenge[] {
  const base = slugify(quest.title.en)
  const isRu = false
  const topic = quest.title.en.split(':')[0]?.trim() ?? quest.title.en

  if (count && count >= 5) {
    const warmupN = Math.max(3, Math.min(8, Math.round(count * 0.1)))
    const coreN = count
    return [
      {
        id: `mc-${base}-warmup`,
        instruction: {
          en: `Warm up: ${warmupN} loose quick studies — same subject, no erasing`,
          ru: `Разминка: ${warmupN} быстрых набросков по теме — без ластика`,
        },
        estimatedTime: Math.max(5, Math.round(warmupN * 0.4)),
        xp: 6,
      },
      {
        id: `mc-${base}-core`,
        instruction: {
          en: `Main set: complete all ${coreN} as described in the quest`,
          ru: `Основной блок: выполните все ${coreN} по описанию квеста`,
        },
        estimatedTime: Math.max(10, Math.round(count * 0.45)),
        xp: 12,
        prerequisite: `mc-${base}-warmup`,
      },
      {
        id: `mc-${base}-polish`,
        instruction: {
          en: `Pick your 3 strongest pieces and add one refinement pass each`,
          ru: `Выберите 3 лучших работы и сделайте по одному проходу доработки`,
        },
        estimatedTime: 10,
        xp: 15,
        prerequisite: `mc-${base}-core`,
      },
    ]
  }

  const isMotion = /animat|cycle|frame|collision|bounce|loop/i.test(quest.title.en)
  if (isMotion) {
    return [
      {
        id: `mc-${base}-warmup`,
        instruction: {
          en: 'Thumbnail 4 key poses or timing beats on one strip',
          ru: '4 ключевых позы или метки тайминга на одной полосе',
        },
        estimatedTime: 8,
        xp: 6,
      },
      {
        id: `mc-${base}-core`,
        instruction: {
          en: 'Block the full motion with clear spacing between keys',
          ru: 'Заблокируйте всё движение с ясным spacing между ключами',
        },
        estimatedTime: 15,
        xp: 12,
        prerequisite: `mc-${base}-warmup`,
      },
      {
        id: `mc-${base}-polish`,
        instruction: {
          en: 'Add breakdowns or cleanup on the impact / settle frames',
          ru: 'Добавьте breakdown или чистку на кадрах удара / остановки',
        },
        estimatedTime: 12,
        xp: 15,
        prerequisite: `mc-${base}-core`,
      },
    ]
  }

  return [
    {
      id: `mc-${base}-warmup`,
      instruction: {
        en: `3 quick exploratory sketches for: ${topic}`,
        ru: `3 быстрых разведывательных наброска: ${quest.title.ru.split(':')[0]?.trim() ?? topic}`,
      },
      estimatedTime: 6,
      xp: 5,
    },
    {
      id: `mc-${base}-core`,
      instruction: {
        en: 'Complete the main exercise from the quest description',
        ru: 'Выполните основное задание из описания квеста',
      },
      estimatedTime: Math.max(12, Math.round(quest.estimatedTime * 0.5)),
      xp: 10,
      prerequisite: `mc-${base}-warmup`,
    },
    {
      id: `mc-${base}-polish`,
      instruction: {
        en: 'One focused refinement pass on the best result',
        ru: 'Один целевой проход доработки лучшего результата',
      },
      estimatedTime: 10,
      xp: 14,
      prerequisite: `mc-${base}-core`,
    },
  ]
}

function patchDescription(quest: Quest, count: number | null): { en: string; ru: string } {
  if (!count) return quest.description
  const en = quest.description.en
  const ru = quest.description.ru
  if (/\b\d+\b/.test(en)) return { en, ru }
  return {
    en: `${en} Target: ${count} studies total. Pace yourself — quality over speed.`,
    ru: `${ru} Цель: ${count} этюдов. Работайте в своём темпе — качество важнее скорости.`,
  }
}

async function main(): Promise<void> {
  let patched = 0
  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]
    for (const q of quests) {
      if (q.id < MMO_ID_MIN || q.id > MMO_ID_MAX) continue
      const category = file.replace('quests_', '').replace('.json', '')
      const count = parseCount(q.title.en)
      const minutes = count ? minutesForCount(count, category, q.difficulty) : minutesSingle(q.difficulty, category)
      q.estimatedTime = minutes
      q.xp = xpForTime(minutes, q.difficulty)
      const desc = patchDescription(q, count)
      q.description = desc
      if (q.difficulty === 'novice' || q.difficulty === 'intermediate') {
        q.microChallenges = buildMicro(q, count)
      }
      patched++
    }
    await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    console.log(`${file}: rebalanced MMO quests`)
  }
  console.log(`Rebalanced ${patched} MMO quests`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
