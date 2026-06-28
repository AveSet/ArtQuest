/**
 * Assign quest prerequisites per category and add novice entry quests
 * for character_design + environment.
 *
 * Usage: npx tsx scripts/generate-quest-prerequisites.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'master' | 'expert'
type Category =
  | 'drawing'
  | 'anatomy'
  | 'animation'
  | 'effects'
  | 'storytelling'
  | 'character_design'
  | 'environment'

interface Quest {
  id: number
  code: string
  title: { en: string; ru: string }
  category: Category
  difficulty: Difficulty
  description: { en: string; ru: string }
  xp: number
  estimatedTime: number
  source: string
  icon: string
  color: string
  min_level: number
  tags: string[]
  prerequisites: number[]
  medium: 'traditional' | 'digital' | 'both'
  is_repeatable: boolean
  review_after_days: number
  streak_bonus: number
}

const DIFF_RANK: Record<Difficulty, number> = {
  novice: 0,
  intermediate: 1,
  advanced: 2,
  master: 3,
  expert: 4,
}

const QUEST_FILES: Record<Category, string> = {
  drawing: 'quests_drawing.json',
  anatomy: 'quests_anatomy.json',
  animation: 'quests_animation.json',
  effects: 'quests_effects.json',
  storytelling: 'quests_storytelling.json',
  character_design: 'quests_character_design.json',
  environment: 'quests_environment.json',
}

function tagOverlap(a: string[], b: string[]): number {
  const setB = new Set(b)
  return a.filter((t) => setB.has(t)).length
}

function assignPrerequisites(quests: Quest[]): void {
  const byCategory = new Map<Category, Quest[]>()
  for (const q of quests) {
    const list = byCategory.get(q.category) ?? []
    list.push(q)
    byCategory.set(q.category, list)
  }

  for (const [, catQuests] of byCategory) {
    catQuests.sort((a, b) => {
      const dr = DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]
      if (dr !== 0) return dr
      return a.id - b.id
    })

    for (const quest of catQuests) {
      if (DIFF_RANK[quest.difficulty] === 0) {
        quest.prerequisites = []
        continue
      }

      const candidates = catQuests.filter(
        (c) =>
          c.id !== quest.id &&
          DIFF_RANK[c.difficulty] < DIFF_RANK[quest.difficulty],
      )

      if (candidates.length === 0) {
        quest.prerequisites = []
        continue
      }

      const scored = candidates
        .map((c) => ({
          id: c.id,
          score: tagOverlap(quest.tags, c.tags) * 10 + (10 - Math.abs(c.min_level - quest.min_level)),
        }))
        .sort((a, b) => b.score - a.score)

      const picked = new Set<number>()
      for (const s of scored) {
        if (picked.size >= 2) break
        picked.add(s.id)
      }
      if (picked.size === 0 && scored[0]) picked.add(scored[0].id)

      quest.prerequisites = [...picked]
    }
  }
}

function buildNoviceCharacterDesign(): Quest[] {
  const topics = [
    { en: 'Simple circle character', ru: 'Персонаж из круга', tag: 'shapes' },
    { en: 'Square vs round personality', ru: 'Квадрат и круг: характер', tag: 'shape_language' },
    { en: 'Triangle villain sketch', ru: 'Злодей из треугольников', tag: 'silhouette' },
    { en: 'Stick figure proportions', ru: 'Пропорции палочки', tag: 'proportions' },
    { en: 'Friendly face basics', ru: 'Основы дружелюбного лица', tag: 'face' },
    { en: 'Exaggerated eyes study', ru: 'Утрированные глаза', tag: 'expression' },
    { en: 'Simple hair shapes', ru: 'Простые формы волос', tag: 'hair' },
    { en: 'Costume silhouette A', ru: 'Силуэт костюма A', tag: 'silhouette' },
    { en: 'Costume silhouette B', ru: 'Силуэт костюма B', tag: 'silhouette' },
    { en: 'Color block character', ru: 'Персонаж цветовыми блоками', tag: 'color' },
    { en: 'Turnaround: front view', ru: 'Разворот: фронт', tag: 'turnaround' },
    { en: 'Turnaround: side view', ru: 'Разворот: профиль', tag: 'turnaround' },
    { en: 'Accessory design: hat', ru: 'Аксессуар: шляпа', tag: 'accessory' },
    { en: 'Accessory design: bag', ru: 'Аксессуар: сумка', tag: 'accessory' },
    { en: 'Character mood board', ru: 'Мудборд персонажа', tag: 'reference' },
  ]

  return topics.map((t, i) => ({
    id: 1951 + i,
    code: `CDN-019${String(51 + i).padStart(2, '0')}`,
    title: { en: t.en, ru: t.ru },
    category: 'character_design' as const,
    difficulty: 'novice' as const,
    description: {
      en: `Entry-level character design exercise: ${t.en.toLowerCase()}. Focus on clear readable shapes.`,
      ru: `Базовое упражнение по дизайну персонажа: ${t.ru.toLowerCase()}. Читаемые формы.`,
    },
    xp: 45 + i * 2,
    estimatedTime: 20 + (i % 5) * 3,
    source: 'ArtQuest Fundamentals',
    icon: '🎭',
    color: '#f97316',
    min_level: 1,
    tags: ['novice', 'character_design', t.tag],
    prerequisites: [],
    medium: 'both' as const,
    is_repeatable: true,
    review_after_days: 7,
    streak_bonus: 1,
  }))
}

function buildNoviceEnvironment(): Quest[] {
  const topics = [
    { en: 'Horizon line practice', ru: 'Линия горизонта', tag: 'horizon' },
    { en: 'Simple ground plane', ru: 'Простая земля', tag: 'ground' },
    { en: 'One-point box row', ru: 'Ряд кубов в 1PP', tag: 'perspective' },
    { en: 'Two-point corner box', ru: 'Угол куба в 2PP', tag: 'perspective' },
    { en: 'Tree silhouette study', ru: 'Силуэт дерева', tag: 'nature' },
    { en: 'Rock cluster shapes', ru: 'Формы камней', tag: 'rocks' },
    { en: 'Cloud shape study', ru: 'Формы облаков', tag: 'sky' },
    { en: 'Simple house block-in', ru: 'Дом блокингом', tag: 'architecture' },
    { en: 'Path into distance', ru: 'Дорога вдаль', tag: 'composition' },
    { en: 'Value thumbnail: forest', ru: 'Тоновый эскиз: лес', tag: 'value' },
    { en: 'Value thumbnail: city', ru: 'Тоновый эскиз: город', tag: 'value' },
    { en: 'Atmospheric fade study', ru: 'Воздушная перспектива', tag: 'atmosphere' },
    { en: 'Prop scatter: crates', ru: 'Реквизит: ящики', tag: 'props' },
    { en: 'Prop scatter: barrels', ru: 'Реквизит: бочки', tag: 'props' },
    { en: 'Mini environment mood', ru: 'Мини-окружение', tag: 'mood' },
  ]

  return topics.map((t, i) => ({
    id: 1971 + i,
    code: `ENV-019${String(71 + i).padStart(2, '0')}`,
    title: { en: t.en, ru: t.ru },
    category: 'environment' as const,
    difficulty: 'novice' as const,
    description: {
      en: `Entry-level environment exercise: ${t.en.toLowerCase()}. Keep shapes simple and readable.`,
      ru: `Базовое упражнение по окружению: ${t.ru.toLowerCase()}. Простые читаемые формы.`,
    },
    xp: 45 + i * 2,
    estimatedTime: 22 + (i % 5) * 3,
    source: 'ArtQuest Fundamentals',
    icon: '🏞️',
    color: '#22c55e',
    min_level: 1,
    tags: ['novice', 'environment', t.tag],
    prerequisites: [],
    medium: 'both' as const,
    is_repeatable: true,
    review_after_days: 7,
    streak_bonus: 1,
  }))
}

async function main(): Promise<void> {
  const allQuests: Quest[] = []

  for (const [category, file] of Object.entries(QUEST_FILES) as [Category, string][]) {
    const filePath = path.join(DATA_DIR, file)
    let quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]

    if (category === 'character_design') {
      quests = quests.filter((q) => q.source !== 'ArtQuest Fundamentals' || q.category !== 'character_design')
      const existingIds = new Set(quests.map((q) => q.id))
      const novice = buildNoviceCharacterDesign().filter((q) => !existingIds.has(q.id))
      quests = [...novice, ...quests]
    }
    if (category === 'environment') {
      quests = quests.filter((q) => q.source !== 'ArtQuest Fundamentals' || q.category !== 'environment')
      const existingIds = new Set(quests.map((q) => q.id))
      const novice = buildNoviceEnvironment().filter((q) => !existingIds.has(q.id))
      quests = [...novice, ...quests]
    }

    assignPrerequisites(quests)
    await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    allQuests.push(...quests)
    console.log(`Updated ${file}: ${quests.length} quests`)
  }

  const idSet = new Set(allQuests.map((q) => q.id))
  let badRefs = 0
  for (const q of allQuests) {
    for (const pid of q.prerequisites) {
      if (!idSet.has(pid)) badRefs++
    }
  }
  console.log(`Total quests: ${allQuests.length}, bad prereq refs: ${badRefs}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
