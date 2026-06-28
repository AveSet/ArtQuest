import { z } from 'zod'
import { QUEST_SESSION_SHORTCUT_COMMANDS } from './questSessionShortcuts'

/** Bump when saved shape changes; migrateProgressPayload handles older versions. */
export const CURRENT_PROGRESS_SCHEMA_VERSION = 22

const questCategorySchema = z.enum([
  'drawing',
  'anatomy',
  'animation',
  'effects',
  'storytelling',
  'character_design',
  'environment',
])

const languageRecordSchema = z.partialRecord(z.enum(['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko']), z.string())

const skillNodeSchema = z.strictObject({
    id: z.string().min(1).max(80),
    parentId: z.string().max(80).nullable(),
    category: questCategorySchema,
    title: languageRecordSchema,
    description: languageRecordSchema,
    level: z.int().min(0).max(100),
    xp: z.number().min(0),
    maxXp: z.number().min(1),
    prerequisites: z.array(z.string()),
    tags: z.array(z.string()),
    reviewIntervalDays: z.int().min(0),
    lastReviewDate: z.string().nullable(),
    isUnlocked: z.boolean(),
    order: z.int(),
    prestige: z.int().min(0).max(10).optional().default(0),
  })

const legacySkillSchema = z.strictObject({
    name: z.string(),
    category: questCategorySchema,
    level: z.int().min(0),
    xp: z.number().min(0),
    maxXp: z.number().min(1),
    color: z.string(),
    icon: z.string(),
  })

const achievementSchema = z.looseObject({
    id: z.string(),
    title: languageRecordSchema,
    description: languageRecordSchema,
    icon: z.string(),
    unlocked: z.boolean().optional(),
    hidden: z.boolean().optional(),
  })

const completedWorkSchema = z.strictObject({
    id: z.string().optional(),
    questId: z.int(),
    imageUrl: z.string(),
    savedPath: z.string().optional(),
    date: z.string(),
    notes: z.string().optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    thumbnailPath: z.string().optional(),
    storageMode: z.enum(['local', 'local_and_cloud', 'cloud_only', 'google_drive']).optional(),
    cloudProvider: z.enum(['google']).optional(),
    remoteFileId: z.string().optional(),
    remotePath: z.string().optional(),
    syncStatus: z.string().optional(),
    lastSyncAt: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    favorite: z.boolean().optional().default(false),
    improvementNotes: z.string().max(2000).optional(),
  })

const questDifficultySchema = z.enum(['novice', 'intermediate', 'advanced', 'master', 'expert'])

const questTitleOverrideEntrySchema = z.strictObject({
    en: z.string().optional(),
    ru: z.string().optional(),
    zh: z.string().optional(),
    'zh-tw': z.string().optional(),
    ja: z.string().optional(),
    ko: z.string().optional(),
  })

const questTitleOverridesSchema = z.record(z.string(), questTitleOverrideEntrySchema)

const userQuestSchema = z.strictObject({
    id: z.int().min(1_000_000),
    code: z.string(),
    title: languageRecordSchema,
    category: questCategorySchema,
    difficulty: questDifficultySchema,
    description: languageRecordSchema,
    xp: z.int().min(1),
    estimatedTime: z.int().min(1),
    source: z.string(),
    icon: z.string(),
    color: z.string(),
    min_level: z.int().min(1),
    tags: z.array(z.string()),
    referenceQuery: z.string().max(200).optional(),
    prerequisites: z.array(z.int()),
    medium: z.enum(['traditional', 'digital', 'both']),
    is_repeatable: z.boolean(),
    review_after_days: z.int().min(0),
    streak_bonus: z.number(),
  })

const questCompletionLogSchema = z.strictObject({
    questId: z.int(),
    nodeId: z.string(),
    completedAt: z.string(),
    xpEarned: z.number(),
    difficulty: questDifficultySchema,
    imageUrl: z.string().optional(),
    practiceMinutes: z.number().optional(),
    isSpeedRun: z.boolean().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    feedback: z.any().optional(),
    status: z.enum(['completed', 'timeout']).optional(),
  })

const materialCustomLinkSchema = z.strictObject({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    youtubeId: z.string().optional(),
    addedAt: z.string(),
    skillNodeId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    channelName: z.string().optional(),
    titleRu: z.string().optional(),
  })

const themeSchema = z.enum(['modern', 'light', 'rpg', 'studio'])
const referenceSourceSchema = z.enum(['pinterest', 'youtube', 'artstation', 'google'])

const sessionPhaseSchema = z.discriminatedUnion('kind', [
  z.strictObject({
          kind: z.literal('exercise'),
          challengeId: z.string(),
          durationSec: z.int().min(0),
          xp: z.number(),
        }),
  z.strictObject({
          kind: z.literal('reference'),
          durationSec: z.int().min(0),
        }),
  z.strictObject({
        kind: z.literal('fundamentals'),
        trackKind: z.enum(['novice', 'medium']),
        phaseIndex: z.int().min(0),
        durationSec: z.int().min(0),
        xp: z.number(),
      }),
])

const persistedQuestSessionSchema = z.strictObject({
    questId: z.int(),
    mainMinutes: z.number(),
    referenceMinutes: z.number(),
    remainingSec: z.int().min(0),
    isRunning: z.boolean(),
    isExpired: z.boolean(),
    startedAtMs: z.number(),
    savedAtMs: z.number(),
    phases: z.array(sessionPhaseSchema).optional().default([]),
    currentPhaseIndex: z.int().min(0).optional().default(0),
    phaseRemainingSec: z.int().min(0).optional().default(0),
    phasesComplete: z.boolean().optional().default(false),
    referenceAtEnd: z.boolean().optional().default(false),
    activeElapsedSec: z.int().min(0).optional().default(0),
    overtimeElapsedSec: z.int().min(0).optional().default(0),
    graceRemainingSec: z.int().min(0).optional().default(0),
    graceExpired: z.boolean().optional().default(false),
    currentPhaseEnteredAtMs: z.number().optional(),
  })

const persistedSkillPracticeSessionSchema = z.strictObject({
    nodeId: z.string().min(1).max(80),
    category: questCategorySchema,
    startedAtMs: z.number(),
    activeElapsedSec: z.int().min(0).optional().default(0),
  })

const settingsSchema = z.object({
    soundEnabled: z.boolean(),
    soundVolume: z.number().min(0).max(1),
    ambientEnabled: z.boolean().optional().default(false),
    ambientVolume: z.number().min(0).max(0.2).optional().default(0.08),
    language: z.enum(['en', 'ru', 'zh', 'zh-tw', 'ja', 'ko']),
    favoriteCategories: z.array(questCategorySchema),
    useRandomCategories: z.boolean(),
    minimizeToTray: z.boolean(),
    sessionWidgetMode: z.boolean().optional().default(true),
    openAtLogin: z.boolean(),
    remindersEnabled: z.boolean(),
    reminderHour: z.int().min(0).max(23),
    reminderMinute: z.int().min(0).max(59),
    fontScale: z.enum(['small', 'medium', 'large']),
    contrastBoost: z.boolean(),
    reduceMotion: z.boolean(),
    hasSeenOnboarding: z.boolean(),
    materialFavoriteIds: z.array(z.string()),
    materialEngagement: z
      .record(z.string(), z.enum(['viewed', 'helpful', 'applied']))
      .optional()
      .default({}),
    materialCustomLinks: z.array(materialCustomLinkSchema),
    learningProfile: z.enum(['drawing', 'animation']).optional().default('animation'),
    portraitGender: z.enum(['male', 'female']).optional().default('male'),
    customAvatarPath: z.string().max(500).optional(),
    customAvatarDataUrl: z.string().optional(),
    profileSetupComplete: z.boolean().optional().default(false),
    theme: themeSchema.optional().default('modern'),
    questSessionShortcuts: z
      .object(
        Object.fromEntries(
          QUEST_SESSION_SHORTCUT_COMMANDS.map((cmd) => [cmd, z.string().max(80)]),
        ) as Record<(typeof QUEST_SESSION_SHORTCUT_COMMANDS)[number], z.ZodString>,
      )
      .partial()
      .optional(),
    activityTrackingEnabled: z.boolean().optional(),
    trackedArtApps: z
      .array(z.enum(['photoshop', 'clipstudio', 'sai', 'tvpaint', 'toonboom']))
      .optional(),
    artIdleTimeoutSec: z.int().min(10).max(600).optional(),
    experienceTier: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
    preferredReferenceSource: referenceSourceSchema.optional().default('pinterest'),
    /** When true and Google Drive is connected, reference webviews use Google SSO with that account. */
    useGoogleForReferenceLogin: z.boolean().optional().default(false),
  })

const streakStateSchema = z.strictObject({
    current: z.int().min(0),
    longest: z.int().min(0),
    lastActiveDate: z.string(),
    streakRecoveryDueDate: z.string().optional(),
    lastDailyRitualDate: z.string().optional(),
    streakRecoveryHintShownDate: z.string().optional(),
  })

const adaptiveWeightsSchema = z
  .object({
    default: z.number(),
  })
  .catchall(z.number())

const portraitProgressSchema = z.object({
    dailyChestStreak: z.int().min(0).optional().default(0),
    lastDailyChestProgressDate: z.string().optional().default(''),
    streakShieldUsedMonth: z.string().optional().default(''),
    lastShieldUsedOnDate: z.string().optional().default(''),
  })

const questReviewScheduleEntrySchema = z.strictObject({
    nextReviewAt: z.string(),
    intervalDays: z.int().min(1),
    easeFactor: z.number().min(1),
  })

const feedbackStatsEntrySchema = z.strictObject({
    count: z.int().min(0),
    avgDifficulty: z.number(),
    weakCriteria: z.array(z.string()),
  })

const questSavedReferenceSchema = z.strictObject({
    id: z.string(),
    path: z.string(),
    addedAt: z.string(),
  })

const questPhaseMediaEntrySchema = z.strictObject({
    id: z.string().optional(),
    path: z.string().optional(),
    dataUrl: z.string().optional(),
    mimeType: z.string(),
    addedAt: z.string(),
  })

const questPhaseMediaPhaseSchema = z.union([
  questPhaseMediaEntrySchema,
  z.array(questPhaseMediaEntrySchema),
])

const activeGoalSchema = z.strictObject({
    text: z.string().min(1).max(500),
    createdAt: z.string(),
  })

const completedGoalSchema = z.strictObject({
    id: z.string().min(1).max(80),
    text: z.string().min(1).max(500),
    createdAt: z.string(),
    completedAt: z.string(),
  })

const fundamentalsProgressSchema = z.strictObject({
    completedIds: z.array(z.int()).optional().default([]),
    trackPhaseDone: z
      .object({
        novice: z.int().min(0).optional(),
        medium: z.int().min(0).optional(),
      })
      .optional()
      .default({}),
    lastCompletedDate: z.string().optional().default(''),
  })

export const progressPayloadSchema = z.object({
    schemaVersion: z.literal(CURRENT_PROGRESS_SCHEMA_VERSION),
    skillNodes: z.array(skillNodeSchema),
    legacySkills: z.array(legacySkillSchema),
    achievements: z.array(achievementSchema),
    userQuests: z.array(userQuestSchema),
    deletedQuestIds: z.array(z.int()).optional().default([]),
    questTitleOverrides: questTitleOverridesSchema,
    completedQuests: z.array(z.int()),
    completedWorks: z.array(completedWorkSchema),
    questCompletionLogs: z.array(questCompletionLogSchema),
    settings: settingsSchema,
    streakState: streakStateSchema,
    adaptiveWeights: adaptiveWeightsSchema,
    lastRefreshDate: z.string(),
    dailyQuestsIds: z.array(z.int()),
    completedToday: z.array(z.int()),
    lastDailyQuestDate: z.string(),
    lastFavCategories: z.string(),
    dailyBonusGrantedDate: z.string(),
    weeklyChallengeWeek: z.string(),
    weeklyChallengeQuestId: z.int().min(0),
    weeklyChallengeCompletedWeek: z.string(),
    activeQuestSession: persistedQuestSessionSchema.nullable().optional().default(null),
    activeSkillPracticeSession: persistedSkillPracticeSessionSchema.nullable().optional().default(null),
    portraitProgress: portraitProgressSchema.optional(),
    microChallengesCompleted: z.record(z.string(), z.array(z.string())).optional().default({}),
    questSavedReferences: z.record(z.string(), z.array(questSavedReferenceSchema)).optional().default({}),
    questPhaseMedia: z
      .record(z.string(), z.record(z.string(), questPhaseMediaPhaseSchema))
      .optional()
      .default({}),
    questReviewSchedule: z.record(z.string(), questReviewScheduleEntrySchema).optional().default({}),
    feedbackStats: z.record(z.string(), feedbackStatsEntrySchema).optional().default({}),
    lastExportAt: z.string().optional(),
    lastWarmupCompletedDate: z.string().optional().default(''),
    fundamentalsProgress: fundamentalsProgressSchema.optional().default({
      completedIds: [],
      trackPhaseDone: {},
      lastCompletedDate: '',
    }),
    activeGoal: activeGoalSchema.nullable().optional().default(null),
    completedGoals: z.array(completedGoalSchema).optional().default([]),
  })

export type ProgressPayload = z.infer<typeof progressPayloadSchema>

const DEFAULT_SETTINGS: z.infer<typeof settingsSchema> = {
  soundEnabled: true,
  soundVolume: 0.3,
  ambientEnabled: false,
  ambientVolume: 0.08,
  language: 'en',
  favoriteCategories: ['drawing', 'animation', 'anatomy'],
  useRandomCategories: false,
  minimizeToTray: false,
  sessionWidgetMode: true,
  openAtLogin: false,
  remindersEnabled: false,
  reminderHour: 18,
  reminderMinute: 0,
  fontScale: 'medium',
  contrastBoost: false,
  reduceMotion: false,
  hasSeenOnboarding: false,
  materialFavoriteIds: [],
  materialEngagement: {},
  materialCustomLinks: [],
  portraitGender: 'male',
  learningProfile: 'animation',
  profileSetupComplete: false,
  theme: 'light',
  experienceTier: 'beginner',
  preferredReferenceSource: 'pinterest',
  useGoogleForReferenceLogin: false,
}

const DEFAULT_STREAK: z.infer<typeof streakStateSchema> = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
}

const DEFAULT_ADAPTIVE_WEIGHTS: z.infer<typeof adaptiveWeightsSchema> = {
  default: 1,
  perspective: 1,
  proportions: 1,
  lighting: 1,
  clean_lines: 1,
  timing: 1,
  composition: 1,
}

export const PROGRESS_FIELD_KEYS = [
  'skillNodes',
  'legacySkills',
  'achievements',
  'userQuests',
  'deletedQuestIds',
  'questTitleOverrides',
  'completedQuests',
  'completedWorks',
  'questCompletionLogs',
  'settings',
  'streakState',
  'adaptiveWeights',
  'lastRefreshDate',
  'dailyQuestsIds',
  'completedToday',
  'lastDailyQuestDate',
  'lastFavCategories',
  'dailyBonusGrantedDate',
  'weeklyChallengeWeek',
  'weeklyChallengeQuestId',
  'weeklyChallengeCompletedWeek',
  'activeQuestSession',
  'activeSkillPracticeSession',
  'portraitProgress',
  'microChallengesCompleted',
  'questSavedReferences',
  'questPhaseMedia',
  'questReviewSchedule',
  'feedbackStats',
  'lastExportAt',
  'lastWarmupCompletedDate',
  'fundamentalsProgress',
  'activeGoal',
  'completedGoals',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function parseArrayItems<T extends z.ZodType>(value: unknown, schema: T): z.infer<T>[] {
  if (!Array.isArray(value)) return []
  const out: z.infer<T>[] = []
  for (const item of value) {
    const parsed = schema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

function parseRecordItems<T extends z.ZodType>(
  value: unknown,
  valueSchema: T,
): Record<string, z.infer<T>> {
  if (!isRecord(value) || Array.isArray(value)) return {}
  const out: Record<string, z.infer<T>> = {}
  for (const [key, entry] of Object.entries(value)) {
    const parsed = valueSchema.safeParse(entry)
    if (parsed.success) out[key] = parsed.data
  }
  return out
}

function parseNestedReferenceRecord(
  value: unknown,
): Record<string, z.infer<typeof questSavedReferenceSchema>[]> {
  if (!isRecord(value) || Array.isArray(value)) return {}
  const out: Record<string, z.infer<typeof questSavedReferenceSchema>[]> = {}
  for (const [key, entries] of Object.entries(value)) {
    const parsed = parseArrayItems(entries, questSavedReferenceSchema)
    if (parsed.length > 0) out[key] = parsed
  }
  return out
}

function parseNestedPhaseMediaRecord(
  value: unknown,
): Record<string, Record<string, z.infer<typeof questPhaseMediaEntrySchema>[]>> {
  if (!isRecord(value) || Array.isArray(value)) return {}
  const out: Record<string, Record<string, z.infer<typeof questPhaseMediaEntrySchema>[]>> = {}
  for (const [questKey, phases] of Object.entries(value)) {
    if (!isRecord(phases) || Array.isArray(phases)) continue
    const phaseMap: Record<string, z.infer<typeof questPhaseMediaEntrySchema>[]> = {}
    for (const [phaseKey, rawPhase] of Object.entries(phases)) {
      const list = Array.isArray(rawPhase) ? rawPhase : [rawPhase]
      const parsed = parseArrayItems(list, questPhaseMediaEntrySchema)
      if (parsed.length > 0) phaseMap[phaseKey] = parsed
    }
    if (Object.keys(phaseMap).length > 0) out[questKey] = phaseMap
  }
  return out
}

function coerceCompletionLogStatuses(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((entry) => {
    if (!isRecord(entry)) return entry
    if (entry.status === 'timeout' || entry.status === 'completed') return entry
    if (
      entry.xpEarned === 0 &&
      typeof entry.practiceMinutes === 'number' &&
      entry.practiceMinutes > 0
    ) {
      return { ...entry, status: 'timeout' }
    }
    return entry
  })
}

function parseMicroChallengesCompleted(value: unknown): Record<string, string[]> {
  if (!isRecord(value) || Array.isArray(value)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, entries] of Object.entries(value)) {
    if (!Array.isArray(entries)) continue
    const strings = entries.filter((entry): entry is string => typeof entry === 'string')
    if (strings.length > 0) out[key] = strings
  }
  return out
}

/** Legacy saves (no schemaVersion) → current shape with defaults. */
export function migrateProgressPayload(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) {
    throw new Error('Progress payload must be an object')
  }

  const out: Record<string, unknown> = {}
  for (const key of PROGRESS_FIELD_KEYS) {
    if (key in raw) out[key] = raw[key]
  }

  out.schemaVersion = CURRENT_PROGRESS_SCHEMA_VERSION
  out.completedQuests = coerceIntArray(raw.completedQuests)
  out.deletedQuestIds = coerceIntArray(raw.deletedQuestIds)
  out.dailyQuestsIds = coerceIntArray(raw.dailyQuestsIds)
  out.completedToday = coerceIntArray(raw.completedToday)
  out.lastDailyQuestDate = coerceString(raw.lastDailyQuestDate)
  out.lastFavCategories = coerceString(raw.lastFavCategories)
  out.dailyBonusGrantedDate = coerceString(raw.dailyBonusGrantedDate)
  out.weeklyChallengeWeek = coerceString(raw.weeklyChallengeWeek)
  out.weeklyChallengeQuestId =
    typeof raw.weeklyChallengeQuestId === 'number' && Number.isFinite(raw.weeklyChallengeQuestId)
      ? raw.weeklyChallengeQuestId
      : 0
  out.weeklyChallengeCompletedWeek = coerceString(raw.weeklyChallengeCompletedWeek)
  out.lastRefreshDate = coerceString(raw.lastRefreshDate)
  out.lastWarmupCompletedDate = coerceString(raw.lastWarmupCompletedDate)

  const rawFundamentals = isRecord(raw.fundamentalsProgress) ? raw.fundamentalsProgress : {}
  const rawTrackPhaseDone = isRecord(rawFundamentals.trackPhaseDone) ? rawFundamentals.trackPhaseDone : {}
  out.fundamentalsProgress = {
    completedIds: coerceIntArray(rawFundamentals.completedIds),
    trackPhaseDone: {
      novice:
        typeof rawTrackPhaseDone.novice === 'number' && Number.isFinite(rawTrackPhaseDone.novice)
          ? rawTrackPhaseDone.novice
          : undefined,
      medium:
        typeof rawTrackPhaseDone.medium === 'number' && Number.isFinite(rawTrackPhaseDone.medium)
          ? rawTrackPhaseDone.medium
          : undefined,
    },
    lastCompletedDate: coerceString(rawFundamentals.lastCompletedDate),
  }

  const partialSettings = isRecord(raw.settings) ? raw.settings : {}
  if (partialSettings.portraitGender !== 'male' && partialSettings.portraitGender !== 'female') {
    partialSettings.portraitGender = DEFAULT_SETTINGS.portraitGender
  }
  delete partialSettings.portraitAnimation
  delete partialSettings.selectedLearningPathId
  delete partialSettings.campaignModeEnabled
  delete partialSettings.campaignMode
  delete partialSettings.learningPath
  if (partialSettings.learningProfile !== 'drawing' && partialSettings.learningProfile !== 'animation') {
    partialSettings.learningProfile = 'animation'
  }
  if (typeof partialSettings.profileSetupComplete !== 'boolean') {
    partialSettings.profileSetupComplete = true
  }
  if (
    partialSettings.theme !== 'modern' &&
    partialSettings.theme !== 'light' &&
    partialSettings.theme !== 'rpg' &&
    partialSettings.theme !== 'studio'
  ) {
    partialSettings.theme = DEFAULT_SETTINGS.theme
  }
  if (!referenceSourceSchema.safeParse(partialSettings.preferredReferenceSource).success) {
    partialSettings.preferredReferenceSource = DEFAULT_SETTINGS.preferredReferenceSource
  }
  if (typeof partialSettings.useGoogleForReferenceLogin !== 'boolean') {
    partialSettings.useGoogleForReferenceLogin = DEFAULT_SETTINGS.useGoogleForReferenceLogin
  }

  out.activeQuestSession =
    raw.activeQuestSession === null || raw.activeQuestSession === undefined
      ? null
      : persistedQuestSessionSchema.safeParse(raw.activeQuestSession).success
        ? persistedQuestSessionSchema.parse(raw.activeQuestSession)
        : null
  out.activeSkillPracticeSession =
    raw.activeSkillPracticeSession === null || raw.activeSkillPracticeSession === undefined
      ? null
      : persistedSkillPracticeSessionSchema.safeParse(raw.activeSkillPracticeSession).success
        ? persistedSkillPracticeSessionSchema.parse(raw.activeSkillPracticeSession)
        : null

  out.settings = { ...DEFAULT_SETTINGS, ...partialSettings }

  out.skillNodes = parseArrayItems(raw.skillNodes, skillNodeSchema)
  out.legacySkills = parseArrayItems(raw.legacySkills, legacySkillSchema)
  out.achievements = parseArrayItems(raw.achievements, achievementSchema)
  out.userQuests = parseArrayItems(raw.userQuests, userQuestSchema)
  out.questTitleOverrides = parseRecordItems(raw.questTitleOverrides, questTitleOverrideEntrySchema)
  out.completedWorks = parseArrayItems(raw.completedWorks, completedWorkSchema)
  out.questCompletionLogs = parseArrayItems(
    coerceCompletionLogStatuses(raw.questCompletionLogs),
    questCompletionLogSchema,
  )
  out.microChallengesCompleted = parseMicroChallengesCompleted(raw.microChallengesCompleted)
  out.questSavedReferences = parseNestedReferenceRecord(raw.questSavedReferences)
  out.questPhaseMedia = parseNestedPhaseMediaRecord(raw.questPhaseMedia)
  out.questReviewSchedule = parseRecordItems(raw.questReviewSchedule, questReviewScheduleEntrySchema)
  out.feedbackStats = parseRecordItems(raw.feedbackStats, feedbackStatsEntrySchema)
  out.lastExportAt = typeof raw.lastExportAt === 'string' ? raw.lastExportAt : undefined

  const parsedActiveGoal = activeGoalSchema.safeParse(raw.activeGoal)
  out.activeGoal = parsedActiveGoal.success ? parsedActiveGoal.data : null
  out.completedGoals = parseArrayItems(raw.completedGoals, completedGoalSchema)

  const partialStreak = isRecord(raw.streakState) ? raw.streakState : {}
  out.streakState = {
    ...DEFAULT_STREAK,
    ...partialStreak,
    current: typeof partialStreak.current === 'number' ? partialStreak.current : 0,
    longest: typeof partialStreak.longest === 'number' ? partialStreak.longest : 0,
    lastActiveDate: coerceString(partialStreak.lastActiveDate),
    ...(typeof partialStreak.streakRecoveryDueDate === 'string'
      ? { streakRecoveryDueDate: partialStreak.streakRecoveryDueDate }
      : {}),
    ...(typeof partialStreak.lastDailyRitualDate === 'string'
      ? { lastDailyRitualDate: partialStreak.lastDailyRitualDate }
      : {}),
    ...(typeof partialStreak.streakRecoveryHintShownDate === 'string'
      ? { streakRecoveryHintShownDate: partialStreak.streakRecoveryHintShownDate }
      : {}),
  }

  if (!isRecord(raw.adaptiveWeights)) {
    out.adaptiveWeights = { ...DEFAULT_ADAPTIVE_WEIGHTS }
  } else {
    const w: Record<string, number> = { ...DEFAULT_ADAPTIVE_WEIGHTS }
    for (const [k, v] of Object.entries(raw.adaptiveWeights)) {
      if (typeof v === 'number' && Number.isFinite(v)) w[k] = v
    }
    out.adaptiveWeights = w
  }

  return out
}

export function parseProgressPayload(data: unknown) {
  const migrated = migrateProgressPayload(data)
  return progressPayloadSchema.safeParse(migrated)
}

/** Validate only newly appended completion logs (fast path for large histories). */
export function validateQuestCompletionLogsAppend(
  existing: unknown[],
  incoming: unknown[],
): boolean {
  if (!Array.isArray(incoming) || incoming.length < existing.length) return false
  for (let i = 0; i < existing.length; i++) {
    if (JSON.stringify(existing[i]) !== JSON.stringify(incoming[i])) return false
  }
  const tail = incoming.slice(existing.length)
  return tail.every((log) => questCompletionLogSchema.safeParse(log).success)
}

export type ProgressNormalizeFailureReason = 'invalid_input' | 'schema_failed'

export type ProgressNormalizeResult =
  | { ok: true; data: ProgressPayload }
  | {
      ok: false
      reason: ProgressNormalizeFailureReason
      hadRawData: boolean
      errorMessage?: string
    }

export function normalizeProgressPayloadResult(data: unknown): ProgressNormalizeResult {
  if (!isRecord(data)) {
    return { ok: false, reason: 'invalid_input', hadRawData: data != null && data !== undefined }
  }
  const parsed = parseProgressPayload(data)
  if (parsed.success) {
    return { ok: true, data: parsed.data }
  }
  return {
    ok: false,
    reason: 'schema_failed',
    hadRawData: true,
    errorMessage: parsed.error.message,
  }
}

export function normalizeProgressPayload(data: unknown): ProgressPayload | null {
  const result = normalizeProgressPayloadResult(data)
  return result.ok ? result.data : null
}

/** Fields passed to renderer after load (includes schemaVersion). */
export const LOADED_PROGRESS_FIELDS = ['schemaVersion', ...PROGRESS_FIELD_KEYS] as const

export function pickLoadedProgressFields(parsed: ProgressPayload): Record<string, unknown> {
  const filtered: Record<string, unknown> = { schemaVersion: parsed.schemaVersion }
  for (const field of PROGRESS_FIELD_KEYS) {
    filtered[field] = parsed[field]
  }
  return filtered
}
