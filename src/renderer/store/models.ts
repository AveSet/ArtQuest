// Centralized data model interfaces for ArtQuest
// These were originally defined in the monolithic useStore.ts file.

import type { Language, LocalizedString } from '@/i18n/translations'
import type { QuestSessionShortcuts } from '../../shared/questSessionShortcuts'
import type { ArtAppId } from '../../shared/artApps'
import type { QuestCategory } from '@/data/skillTree'
import type { LearningProfile } from '@/utils/learningProfile'

export type { LearningProfile }

export type PortraitGender = 'male' | 'female'

export type ReferenceSource =
  | 'pinterest'
  | 'youtube'
  | 'youtube_short'
  | 'sketchfab'
  | 'clipTips'
  | 'google'

export interface PortraitProgress {
  dailyChestStreak: number
  lastDailyChestProgressDate: string
  streakShieldUsedMonth?: string
  lastShieldUsedOnDate?: string
}

/** User-defined practice goal shown on the dashboard. */
export type ActiveGoal = {
  text: string
  createdAt: string
}

/** Completed goal archived in progress history. */
export type CompletedGoal = {
  id: string
  text: string
  createdAt: string
  completedAt: string
}

/** User-pinned reference image saved on disk for a quest. */
export type QuestSavedReference = {
  id: string
  path: string
  addedAt: string
}

/** Per-phase help image/GIF saved for a quest session step. */
export type QuestPhaseMediaEntry = {
  id?: string
  path?: string
  dataUrl?: string
  mimeType: string
  addedAt: string
}

/** Per-quest title overrides saved in progress (grammar / translation fixes). */
export type QuestTitleOverrides = Record<number, Partial<Record<Language, string>>>

export interface MicroChallenge {
  id: string
  instruction: LocalizedString
  estimatedTime: number
  xp: number
  prerequisite?: string
}

export interface Quest {
  id: number
  code: string
  title: LocalizedString
  category: QuestCategory
  difficulty: 'novice' | 'intermediate' | 'advanced' | 'master' | 'expert'
  description: LocalizedString
  xp: number
  estimatedTime: number
  source: string
  icon: string
  color: string
  min_level: number
  tags: string[]
  /** Explicit English query for external reference search; display titles stay user-facing. */
  referenceQuery?: string
  /** Optional per-source search overrides for reference window. */
  referenceQueries?: Partial<Record<ReferenceSource, string>>
  prerequisites: number[]
  medium: 'traditional' | 'digital' | 'both'
  is_repeatable: boolean
  review_after_days: number
  streak_bonus: number
  completed?: boolean
  microChallenges?: MicroChallenge[]
}

export interface CompletedWork {
  id?: string
  questId: number
  imageUrl: string
  savedPath?: string
  date: string
  notes?: string
  /** What to improve on the next attempt (gallery self-review). */
  improvementNotes?: string
  /** When set, work is video (e.g. mp4) rather than a still image. */
  mediaType?: 'image' | 'video'
  storageMode?: 'local' | 'local_and_cloud' | 'cloud_only' | 'google_drive'
  thumbnailPath?: string
  cloudProvider?: 'google'
  remoteFileId?: string
  remotePath?: string
  syncStatus?: string
  syncError?: string
  lastSyncAt?: string
  tags?: string[]
  favorite?: boolean
}

export interface Achievement {
  id: string
  title: LocalizedString
  description: LocalizedString
  icon: string
  unlocked?: boolean
  hidden?: boolean
  /** ISO timestamp when first unlocked (for "new" badge on achievements page). */
  unlockedAt?: string
  /** ISO timestamp when user dismissed popup or viewed achievements page. */
  seenAt?: string
}

export interface Skill {
  name: string
  category: QuestCategory
  level: number
  xp: number
  maxXp: number
  color: string
  icon: string
}

export interface SkillNode {
  id: string
  parentId: string | null
  category: QuestCategory
  title: LocalizedString
  description: LocalizedString
  level: number
  xp: number
  maxXp: number
  prerequisites: string[]
  tags: string[]
  reviewIntervalDays: number
  lastReviewDate: string | null
  isUnlocked: boolean
  order: number
  prestige: number
}

export const MAX_PRESTIGE = 10

export interface QuestFeedbackCriterion {
  label: 'line_confidence' | 'proportion' | 'value_range' | 'composition' | 'timing' | 'pose'
  rating: 1 | 2 | 3 | 4 | 5
}

export interface QuestFeedback {
  difficultyRating: 1 | 2 | 3 | 4 | 5
  criteria: QuestFeedbackCriterion[]
  notes?: string
  mistakeTags?: string[]
}

export interface QuestCompletionLog {
  questId: number
  nodeId: string
  completedAt: string
  xpEarned: number
  difficulty: Quest['difficulty']
  imageUrl?: string
  practiceMinutes?: number
  isSpeedRun?: boolean
  category?: string
  notes?: string
  /** Self-reported difficulty / quality rating after quest completion */
  feedback?: QuestFeedback
  /** Set when a quest session expires without full completion */
  status?: 'completed' | 'timeout'
}

export interface StreakCategoryEntry {
  date: string
  category: string
}

export interface StreakState {
  current: number
  longest: number
  lastActiveDate: string
  /** If equals today's YYYY-MM-DD, user must complete 4 daily quests to keep streak after one skipped day */
  streakRecoveryDueDate?: string
  /** Last calendar day the day-complete ritual was shown */
  lastDailyRitualDate?: string
  /** Last calendar day the missed-day shield hint was shown */
  streakRecoveryHintShownDate?: string
  /** First calendar day back after 7+ inactive days (vacation freeze). */
  longAbsenceReturnDate?: string
}

export interface FlowMetrics {
  completionRate: number
  averageTimeRatio: number
  averageDifficultyRating: number
  recentTrend: 'improving' | 'declining' | 'stable'
  /** Number of recent logs used for adaptive metrics (≤ WINDOW_SIZE). */
  observationCount: number
}

export interface AdaptiveWeights {
  [tag: string]: number
  default: number
}

export interface HiddenAchievement {
  id: string
  condition: string
  reward: {
    title: LocalizedString
    description: LocalizedString
    icon: string
  }
}

export type FontScale = 'small' | 'medium' | 'large'

/** User-added bookmark on the Materials (Resources) page */
export interface MaterialCustomLink {
  id: string
  url: string
  title: string
  /** Present when the URL is recognized as a YouTube watch/embed/shorts link */
  youtubeId?: string
  addedAt: string
  /**
   * Skill tree node this entry is tied to — required for catalog merge (filter by node/category).
   * Older saves may omit this (legacy row).
   */
  skillNodeId?: string
  /** Tags shown in Materials (node tags + title keywords + markers), persisted after add */
  tags?: string[]
  /** From YouTube oEmbed `author_name` */
  channelName?: string
  /** Optional Russian title override; defaults to `title` in UI */
  titleRu?: string
}

export interface Settings {
  soundEnabled: boolean
  soundVolume: number
  ambientEnabled?: boolean
  ambientVolume?: number
  language: Language
  favoriteCategories: QuestCategory[]
  useRandomCategories: boolean
  minimizeToTray: boolean
  /** Legacy preference; widget collapse is manual during sessions (Electron only). */
  sessionWidgetMode: boolean
  openAtLogin: boolean
  remindersEnabled: boolean
  reminderHour: number
  reminderMinute: number
  fontScale: FontScale
  contrastBoost: boolean
  reduceMotion: boolean
  /** Accessibility: pause session countdown timers for all quests/practice. */
  disableSessionTimers?: boolean
  /** When false, shows first-run welcome modal until dismissed */
  hasSeenOnboarding: boolean
  /** Curated `VideoResource.id` values starred on Materials — listed first in the catalog */
  materialFavoriteIds: string[]
  /** Per-video learning engagement: viewed / helpful / applied in practice */
  materialEngagement?: Record<string, 'viewed' | 'helpful' | 'applied'>
  /** Personal YouTube / links — with skill node + tags merged into the Materials catalog */
  materialCustomLinks: MaterialCustomLink[]
  /** Drawing focus hides animation content; animation keeps all tracks open */
  learningProfile: LearningProfile
  /** Base portrait gender for dashboard avatar */
  portraitGender: PortraitGender
  /** Local file path for custom dashboard avatar (Electron) */
  customAvatarPath?: string
  /** Inline cropped avatar for web-only fallback */
  customAvatarDataUrl?: string
  /** First-run profile picker completed */
  profileSetupComplete: boolean
  /** Visual theme — persisted in progress (mirrored to localStorage for pre-load flash) */
  theme: 'modern' | 'light' | 'rpg' | 'studio'
  /** Global quest-session hotkeys (Electron); synced to main process */
  questSessionShortcuts?: QuestSessionShortcuts
  /** Count practice/quest time only when tracked art apps are focused */
  activityTrackingEnabled?: boolean
  trackedArtApps?: ArtAppId[]
  /** Path to a custom .exe for activity tracking when `custom` is in trackedArtApps. */
  customArtAppExecutablePath?: string
  /** Pause counting after this many seconds without input (default 60) */
  artIdleTimeoutSec?: number
  /** Self-assessed skill level — seeds fundamentals and quest difficulty */
  experienceTier?: 'beginner' | 'intermediate' | 'advanced'
  /** Preferred session length for recommendations */
  energyMode?: 'short' | 'medium' | 'long'
  /** Default source for the dedicated quest reference window. */
  preferredReferenceSource?: ReferenceSource
  /** Use connected Google account for Google SSO on reference sites (Pinterest, etc.). */
  useGoogleForReferenceLogin?: boolean
  /** Last known overlay / reference window positions (Electron). */
  windowBounds?: {
    main?: { x: number; y: number; width: number; height: number }
    overlay?: { x: number; y: number }
    reference?: { x: number; y: number; width: number; height: number }
  }
  /** Ambient loop character */
  ambientPreset?: 'rain' | 'cafe' | 'fireplace' | 'studio' | 'quiet' | 'rpg'
  /** Solo chapter progress (personal arc) */
  soloChapterProgress?: {
    activeChapterId: string | null
    completedChapterIds: string[]
    completedQuestIdsInChapter: Record<string, number[]>
  }
  /** Personal weekly practice minutes goal */
  weeklyMinutesGoal?: number
  /** Last date chest reveal modal was shown (YYYY-MM-DD) */
  lastChestRevealDate?: string
  /** Opt-in local telemetry ring buffer + SQLite event_log export. */
  telemetryEnabled?: boolean
  /** GPU particle tier; CSS celebration remains fallback when off. */
  vfxQuality?: 'off' | 'normal' | 'enhanced'
  /** Separate gain for micro-SFX (defaults to soundVolume). */
  sfxVolume?: number
  /** Optional music loop gain (v1.1). */
  musicVolume?: number
}

export interface ProgressData {
  schemaVersion: number
  skillNodes: SkillNode[]
  legacySkills: Skill[]
  /** User-created quests (ids >= USER_QUEST_ID_MIN). */
  userQuests?: Quest[]
  questTitleOverrides?: QuestTitleOverrides
  completedQuests: number[]
  completedWorks: CompletedWork[]
  questCompletionLogs: QuestCompletionLog[]
  achievements: Achievement[]
  settings: Settings
  streakState: StreakState
  adaptiveWeights: AdaptiveWeights
  lastRefreshDate: string
  dailyQuestsIds: number[]
  completedToday: number[]
  lastDailyQuestDate: string
  lastFavCategories: string
  dailyBonusGrantedDate: string
  portraitProgress?: PortraitProgress
  microChallengesCompleted?: Record<string, string[]>
  questSavedReferences?: Record<string, QuestSavedReference[]>
  /** questId → phaseKey → saved help media */
  questPhaseMedia?: Record<string, Record<string, QuestPhaseMediaEntry[]>>
  questReviewSchedule?: Record<string, { nextReviewAt: string; intervalDays: number; easeFactor: number }>
  feedbackStats?: Record<string, { count: number; avgDifficulty: number; weakCriteria: string[] }>
  lastExportAt?: string
  /** YYYY-MM-DD when the daily 5-minute warmup was last completed */
  lastWarmupCompletedDate?: string
  fundamentalsProgress?: {
    completedIds: number[]
    lastCompletedDate: string
  }
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  soundVolume: 0.3,
  ambientEnabled: false,
  ambientVolume: 0.08,
  language: 'en',
  favoriteCategories: ['drawing', 'anatomy', 'animation'],
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
  disableSessionTimers: false,
  hasSeenOnboarding: false,
  materialFavoriteIds: [],
  materialEngagement: {},
  materialCustomLinks: [],
  portraitGender: 'male',
  learningProfile: 'animation',
  profileSetupComplete: false,
  theme: 'light',
  questSessionShortcuts: undefined,
  activityTrackingEnabled: true,
  trackedArtApps: ['photoshop', 'clipstudio', 'sai', 'tvpaint', 'toonboom'],
  artIdleTimeoutSec: 60,
  experienceTier: 'beginner',
  energyMode: 'medium',
  preferredReferenceSource: 'pinterest',
  useGoogleForReferenceLogin: false,
  ambientPreset: 'rain',
  weeklyMinutesGoal: 120,
}

export const DEFAULT_ADAPTIVE_WEIGHTS: AdaptiveWeights = {
  perspective: 1.0,
  proportion: 1.0,
  proportions: 1.0,
  value: 1.0,
  composition: 1.0,
  gesture: 1.0,
  line: 1.0,
  clean_lines: 1.0,
  color: 1.0,
  lighting: 1.0,
  light: 1.0,
  timing: 1.0,
  default: 1.0,
}

function hiddenLoc(en: string, ru: string): LocalizedString {
  return { en, ru, zh: en, 'zh-tw': en, ja: en, ko: en }
}

export const HIDDEN_ACHIEVEMENTS: HiddenAchievement[] = [
  { id: 'cube_master', condition: 'complete_quest_tag:perspective count>=50', reward: { title: hiddenLoc('Cube Master', 'Кубомастер'), description: hiddenLoc('Complete 50 perspective quests', 'Выполните 50 квестов на перспективу'), icon: '🎲' } },
  { id: 'night_owl_hidden', condition: 'complete_quest hour>=23 count>=5', reward: { title: hiddenLoc('Deep Night Owl', 'Глубокая ночь'), description: hiddenLoc('Complete 5 quests after 11 PM', 'Выполните 5 квестов после 23:00'), icon: '🌙' } },
  { id: 'early_bird_hidden', condition: 'complete_quest hour<6 count>=5', reward: { title: hiddenLoc('Early Bird', 'Ранняя птичка'), description: hiddenLoc('Complete 5 quests before 6 AM', 'Выполните 5 квестов до 6:00'), icon: '🌅' } },
  { id: 'century', condition: 'streak_current>=100', reward: { title: hiddenLoc('Century', 'Столетие'), description: hiddenLoc('Reach 100 day streak', 'Достигните стрика в 100 дней'), icon: '💯' } },
  { id: 'practice_addict', condition: 'complete_quest_tag:practice count>=30', reward: { title: hiddenLoc('Practice Addict', 'Практик'), description: hiddenLoc('Complete 30 practice quests', 'Выполните 30 практических квестов'), icon: '✏️' } },
  { id: 'speed_demon', condition: 'complete_quest hour<3 count>=3', reward: { title: hiddenLoc('Speed Demon', 'Скоростной демон'), description: hiddenLoc('Complete 3 quests between midnight and 3 AM', 'Выполните 3 квеста между полуночью и 3 утра'), icon: '👻' } },
  { id: 'true_master', condition: 'streak_current>=365', reward: { title: hiddenLoc('True Master', 'Истинный мастер'), description: hiddenLoc('Reach a 365-day streak', 'Достигните стрика в 365 дней'), icon: '🏅' } },
]
