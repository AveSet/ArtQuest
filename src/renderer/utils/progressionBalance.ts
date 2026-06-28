/**
 * Long-form progression (~3+ years of daily play).
 * Quest face-value XP fills the category track (legacy skill bar); only a share
 * goes to the active skill node so free practice stays important.
 * Free practice uses separate rules.
 */

/** Share of quest XP applied to the matching skill node (rest is category track only). */
export const QUEST_NODE_XP_RATIO = 0.2

/** Minimum share of track XP when practice time is short vs estimated time. */
export const PRACTICE_RATIO_FLOOR = 0.25

/** Track XP multiplier when the player finishes after the main session timer ends. */
export const OVERTIME_TRACK_XP_MULTIPLIER = 0.75

export const NODE_MAX_LEVEL = 10

/** Starting XP threshold for the current node level tier (before first level-up at this node). */
export const NODE_XP_BASE = 290

/** Multiplier applied to maxXp after each level-up within the same node. */
export const NODE_XP_MULT = 1.33

/** Free practice mode on Skills page — slightly lower than quests to keep quests meaningful. */
export const PRACTICE_MODE_XP_PER_MINUTE = 1.5

/** Max minutes worth of XP from a single free practice session (cap ~45m ≈ 68 XP). */
export const PRACTICE_MAX_CAPPED_MINUTES = 45

export const MIN_SKILL_XP_QUEST = 0

export type QuestXpBalanceOpts = {
  practiceMinutes?: number
  estimatedTime?: number
  isSpeedRun?: boolean
  /** Main timer reached zero before the player submitted. */
  isOvertime?: boolean
}

function normalizeBalanceOpts(
  practiceMinutesOrOpts?: number | QuestXpBalanceOpts,
): QuestXpBalanceOpts {
  if (typeof practiceMinutesOrOpts === 'object' && practiceMinutesOrOpts !== null) {
    return practiceMinutesOrOpts
  }
  if (practiceMinutesOrOpts == null) return {}
  return { practiceMinutes: practiceMinutesOrOpts }
}

/** Ratio of face track XP earned from actual practice time vs quest estimate. */
export function computePracticeRatio(practiceMinutes: number, estimatedTime: number): number {
  if (!Number.isFinite(practiceMinutes) || !Number.isFinite(estimatedTime)) return 1
  if (estimatedTime <= 0) return 1
  const ratio = practiceMinutes / estimatedTime
  return Math.max(PRACTICE_RATIO_FLOOR, Math.min(1, ratio))
}

/** Category track XP — full face value on completion; overtime applies a track-only penalty. */
export function computeQuestTrackXp(
  questXp: number,
  opts?: QuestXpBalanceOpts,
): number {
  if (!Number.isFinite(questXp)) return 0
  const base = Math.max(0, Math.round(questXp))
  if (opts?.isOvertime) {
    return Math.max(0, Math.round(base * OVERTIME_TRACK_XP_MULTIPLIER))
  }
  return base
}

/** Share of quest XP to the skill node (20% ratio). */
export function computeQuestNodeShareXp(questXp: number): number {
  if (!Number.isFinite(questXp) || questXp <= 0) return MIN_SKILL_XP_QUEST
  return Math.max(MIN_SKILL_XP_QUEST, Math.round(questXp * QUEST_NODE_XP_RATIO))
}

export function computePracticeOnlyXp(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0
  const capped = Math.min(minutes, PRACTICE_MAX_CAPPED_MINUTES)
  return Math.max(5, Math.round(capped * PRACTICE_MODE_XP_PER_MINUTE))
}

/** Practice-time node bonus with optional speed-run penalty. */
export function computePracticeBonusXp(
  minutes: number,
  opts?: { isSpeedRun?: boolean },
): number {
  if (minutes <= 0) return 0
  const full = computePracticeOnlyXp(minutes)
  if (!opts?.isSpeedRun) return full
  const penalized = Math.round(full * 0.5)
  const floor = Math.max(5, Math.round(full * 0.2))
  return Math.max(floor, penalized)
}

/** Node XP from a quest: 20% of face value plus practice time (same formula as free practice). */
export function computeQuestNodeXp(
  questXp: number,
  practiceMinutesOrOpts?: number | QuestXpBalanceOpts,
): number {
  const opts = normalizeBalanceOpts(practiceMinutesOrOpts)
  const fromQuest = computeQuestNodeShareXp(questXp)
  const minutes = opts.practiceMinutes
  if (minutes == null || minutes <= 0) return fromQuest
  return fromQuest + computePracticeBonusXp(minutes, { isSpeedRun: opts.isSpeedRun })
}

/** @deprecated Use computeQuestNodeXp — kept for call sites that mean node XP. */
export function computeSkillXpFromQuest(
  questXp: number,
  practiceMinutes?: number,
): number {
  return computeQuestNodeXp(questXp, practiceMinutes)
}

/** Slight curve by tree depth so late nodes cost more than fundamentals. */
export function computeInitialNodeMaxXp(treeOrder: number): number {
  const band = Math.min(4, Math.floor(treeOrder / 3))
  return Math.round(NODE_XP_BASE * (0.88 + band * 0.06))
}

export function expectedMaxXpAtNodeLevel(level: number): number {
  let m = NODE_XP_BASE
  for (let i = 0; i < level; i++) {
    m = Math.round(m * NODE_XP_MULT)
  }
  return m
}
