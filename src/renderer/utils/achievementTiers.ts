/** Long-term goals — surfaced in UI so they do not feel broken. */
export const ENDGAME_ACHIEVEMENT_IDS = new Set([
  'all_level_10',
  'all_level_15',
  'all_level_20',
  'sevenfifty_quests',
  'thousand_quests',
  'streak_200',
  'streak_365',
  'practice_year',
])

export function isEndgameAchievement(id: string): boolean {
  return ENDGAME_ACHIEVEMENT_IDS.has(id)
}
