import { create } from 'zustand'
import type { Language, LocalizedString } from '@/i18n/languages'
import { getLocalizedTitle } from '@/i18n'
import type { SkillNode, Skill, Achievement, Quest, QuestCompletionLog, CompletedWork } from './models'
import { MAX_PRESTIGE } from './models'
import { SKILL_TREE_NODES } from '@/data/skillTree'
import { applyPrerequisiteUnlocks } from '@/utils/skillUnlocks'
import { NODE_MAX_LEVEL, NODE_XP_MULT, computeInitialNodeMaxXp } from '@/utils/progressionBalance'
import achievementsData from '@/data/achievements.json'
import { pushAchievements } from '@/store/achievementQueue'
import { notifyLevelUp } from '@/store/levelUpNotification'
import { playSound } from '@/utils/sound'
import { evaluateVisibleAchievementUnlocks } from '@/utils/achievementEvaluator'
import {
  evaluateHiddenAchievementUnlocks,
  type HiddenAchievementContext,
} from '@/utils/hiddenAchievementChecks'

const LEGACY_SKILL_BASE_XP = 300
const LEGACY_XP_MULT = 1.5

const initialSkills: Skill[] = [
  { name: 'Drawing', category: 'drawing', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#6366f1', icon: '🎨' },
  { name: 'Anatomy', category: 'anatomy', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#ec4899', icon: '🦴' },
  { name: 'Animation', category: 'animation', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#10b981', icon: '🎬' },
  { name: 'Effects', category: 'effects', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#f59e0b', icon: '✨' },
  { name: 'Storytelling', category: 'storytelling', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#8b5cf6', icon: '📖' },
  { name: 'Character Design', category: 'character_design', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#f97316', icon: '🎭' },
  { name: 'Environment', category: 'environment', level: 0, xp: 0, maxXp: LEGACY_SKILL_BASE_XP, color: '#0891b2', icon: '🏞️' },
]

export const getDefaultSkills = () => initialSkills.map(s => ({ ...s }))

export const createInitialSkillNodes = (): SkillNode[] => {
  const base = SKILL_TREE_NODES.map((node) => ({
    ...node,
    level: 0,
    xp: 0,
    maxXp: computeInitialNodeMaxXp(node.order),
    lastReviewDate: null,
    isUnlocked: false,
    prestige: 0,
  }))
  return applyPrerequisiteUnlocks(base)
}

export interface SkillState {
  legacySkills: Skill[]
  skillNodes: SkillNode[]
  achievements: Achievement[]
  addNodeXP: (nodeId: string, xp: number) => void
  addLegacyCategoryXp: (category: string, xp: number) => void
  addXPByCategory: (category: string, xp: number, tags?: string[]) => void
  checkAchievements: (opts: {
    completedQuests: Quest[]
    completedWorks: CompletedWork[]
    streak: number
    questCompletionLogs: QuestCompletionLog[]
    materialEngagement?: Record<string, 'viewed' | 'helpful' | 'applied'>
  }) => Achievement[]
  checkHiddenAchievements: (
    ctx: Pick<HiddenAchievementContext, 'quests' | 'questCompletionLogs'> & { streakCurrent: number },
  ) => void
  markSkillNodesReviewed: (category: string, tags: string[]) => void
  markAchievementSeen: (achievementId: string) => void
  markAllNewAchievementsSeen: () => void
}

export const useSkillStore = create<SkillState>((set, get) => ({
  legacySkills: initialSkills,
  skillNodes: createInitialSkillNodes(),
  achievements: (achievementsData as Achievement[]).map(a => ({ ...a, unlocked: false })),

  markSkillNodesReviewed: (category, tags) => {
    const today = new Date().toISOString().slice(0, 10)
    set((state) => ({
      skillNodes: state.skillNodes.map((node) => {
        if (node.category !== category || node.reviewIntervalDays <= 0) return node
        const matchesTag = tags.length === 0 || tags.some((t) => node.tags.includes(t))
        if (!matchesTag) return node
        if (!node.lastReviewDate) return { ...node, lastReviewDate: today }
        const lastReview = new Date(node.lastReviewDate + 'T00:00:00')
        const diffMs = new Date(today + 'T00:00:00').getTime() - lastReview.getTime()
        const diffDays = Math.round(diffMs / 86400000)
        if (diffDays >= node.reviewIntervalDays) {
          return { ...node, lastReviewDate: today }
        }
        return node
      }),
    }))
  },

  addNodeXP: (nodeId, xp) => {
    if (xp <= 0) return
    const before = get().skillNodes.find((n) => n.id === nodeId)
    let didPrestige = false
    let didLevelUp = false
    let levelUpTitle: LocalizedString = { en: '', ru: '' }
    let levelUpLevel = 0
    let prestCount = 0
    let prestNode: SkillNode | null = null

    set((state) => {
      const target = state.skillNodes.find((n) => n.id === nodeId)
      if (!target || !target.isUnlocked) return state

      const updated = state.skillNodes.map((node) => {
        if (node.id !== nodeId) return node
        let newXp = node.xp + xp
        let newLevel = node.level
        let newPrestige = node.prestige
        let newMaxXp = Math.max(node.maxXp, computeInitialNodeMaxXp(node.order))

        while (newXp >= newMaxXp) {
          if (newLevel < NODE_MAX_LEVEL) {
            newXp -= newMaxXp
            newLevel++
            newMaxXp = Math.round(newMaxXp * NODE_XP_MULT)
          } else if (newPrestige < MAX_PRESTIGE) {
            newXp = 0
            newLevel = 0
            newPrestige++
            newMaxXp = computeInitialNodeMaxXp(node.order)
          } else {
            break
          }
        }

        if (newLevel > node.level && newPrestige === node.prestige) {
          didLevelUp = true
          levelUpTitle = node.title
          levelUpLevel = newLevel
        }

        if (newPrestige > node.prestige) {
          didPrestige = true
          prestCount = newPrestige
          prestNode = node
        }

        return { ...node, xp: newXp, level: newLevel, maxXp: newMaxXp, prestige: newPrestige }
      })

      return { skillNodes: applyPrerequisiteUnlocks(updated) }
    })

    if (didLevelUp && !didPrestige && before) {
      playSound('levelup', before.category)
      notifyLevelUp({
        nodeTitle: levelUpTitle,
        category: before.category,
        newLevel: levelUpLevel,
      })
    }

    if (didPrestige && prestNode) {
      playSound('levelup', before?.category)
      const prestigeTitle = (lang: Language): string => {
        const name = getLocalizedTitle(prestNode!.title, lang)
        if (lang === 'ru') return `${name} — престиж ${prestCount}`
        if (lang === 'zh' || lang === 'zh-tw') return `${name} · 声望 ${prestCount}`
        if (lang === 'ja') return `${name} · プレステージ ${prestCount}`
        if (lang === 'ko') return `${name} · 프레스티지 ${prestCount}`
        return `${name} Prestige ${prestCount}`
      }
      const prestigeDescription = (lang: Language): string => {
        const name = getLocalizedTitle(prestNode!.title, lang)
        if (lang === 'ru') return `${name} достиг престижа ${prestCount}! Продолжай практику!`
        if (lang === 'zh') return `${name}达到声望 ${prestCount}！继续练习！`
        if (lang === 'zh-tw') return `${name}達到聲望 ${prestCount}！繼續練習！`
        if (lang === 'ja') return `${name}がプレステージ ${prestCount} に到達！この調子で続けよう！`
        if (lang === 'ko') return `${name} 프레스티지 ${prestCount} 달성! 계속 연습하세요!`
        return `${name} reached prestige ${prestCount}! Keep going!`
      }
      const langs = ['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko'] as const
      const prestAch: Achievement = {
        id: `prestige_${nodeId}_${prestCount}`,
        title: Object.fromEntries(langs.map((l) => [l, prestigeTitle(l)])) as LocalizedString,
        description: Object.fromEntries(langs.map((l) => [l, prestigeDescription(l)])) as LocalizedString,
        icon: prestCount >= 10 ? '👑' : prestCount >= 7 ? '💎' : prestCount >= 5 ? '🌟' : prestCount >= 3 ? '⭐' : '✨',
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      }
      pushAchievements([prestAch])
      set((state) => ({
        achievements: [
          ...state.achievements.filter((a) => a.id !== prestAch.id),
          prestAch,
        ],
      }))
    }
  },

  addLegacyCategoryXp: (category, xp) => {
    if (xp <= 0) return
    let didLevelUp = false
    let levelUpLevel = 0
    let levelUpName = ''
    set((state) => ({
      legacySkills: state.legacySkills.map((skill) => {
        if (skill.category !== category) return skill
        let newXp = skill.xp + xp
        let newLevel = skill.level
        let newMaxXp = skill.maxXp
        while (newXp >= newMaxXp) {
          newXp -= newMaxXp
          newLevel++
          newMaxXp = Math.round(newMaxXp * LEGACY_XP_MULT)
        }
        if (newLevel > skill.level) {
          didLevelUp = true
          levelUpLevel = newLevel
          levelUpName = skill.name
        }
        return { ...skill, xp: newXp, level: newLevel, maxXp: newMaxXp }
      }),
    }))
    if (didLevelUp) {
      playSound('levelup', category)
      notifyLevelUp({
        nodeTitle: { en: levelUpName, ru: levelUpName, zh: levelUpName, ja: levelUpName, ko: levelUpName },
        category,
        newLevel: levelUpLevel,
      })
    }
  },

  addXPByCategory: (category, xp, tags) => {
    const { skillNodes } = get()
    const categoryNodes = skillNodes.filter((n) => n.category === category && n.isUnlocked)
    if (categoryNodes.length > 0) {
      const target =
        tags && tags.length > 0
          ? categoryNodes.reduce((best, n) => {
              const score = tags.filter((t) => n.tags.includes(t)).length
              const bestScore = tags.filter((t) => best.tags.includes(t)).length
              return score > bestScore ? n : best
            })
          : categoryNodes[0]
      if (target) get().addNodeXP(target.id, xp)
    } else {
      get().addLegacyCategoryXp(category, xp)
    }
  },

  checkAchievements: (opts) => {
    const state = get()
    const materialEngagement = opts.materialEngagement ?? {}
    const newUnlocks = evaluateVisibleAchievementUnlocks(
      { ...opts, materialEngagement },
      {
        skillNodes: state.skillNodes,
        legacySkills: state.legacySkills,
        achievements: state.achievements,
      },
    )

    if (newUnlocks.length > 0) {
      const unlockedIds = new Set(newUnlocks.map((a) => a.id))
      const unlockMeta = new Map(newUnlocks.map((a) => [a.id, a]))
      set((current) => ({
        achievements: current.achievements.map((a) => {
          if (!unlockedIds.has(a.id)) return a
          const fresh = unlockMeta.get(a.id)!
          return { ...a, unlocked: true, unlockedAt: a.unlockedAt ?? fresh.unlockedAt }
        }),
      }))
      return newUnlocks
    }
    return []
  },

  markAchievementSeen: (achievementId) => {
    const now = new Date().toISOString()
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === achievementId && a.unlocked && !a.seenAt ? { ...a, seenAt: now } : a,
      ),
    }))
  },

  markAllNewAchievementsSeen: () => {
    const now = new Date().toISOString()
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.unlocked && a.unlockedAt && !a.seenAt ? { ...a, seenAt: now } : a,
      ),
    }))
  },

  checkHiddenAchievements: (ctx) => {
    const state = get()
    const newlyUnlocked = evaluateHiddenAchievementUnlocks({
      quests: ctx.quests,
      questCompletionLogs: ctx.questCompletionLogs,
      streakCurrent: ctx.streakCurrent,
      unlockedAchievementIds: new Set(state.achievements.map((a) => a.id)),
    })
    if (newlyUnlocked.length === 0) return
    set((s) => ({ achievements: [...s.achievements, ...newlyUnlocked] }))
    pushAchievements(newlyUnlocked)
  },
}))
