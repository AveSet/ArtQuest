import type { useSkillStore } from '@/store/useSkillStore'

type SkillState = ReturnType<typeof useSkillStore.getState>

/** Shallow fingerprint — skip auto-save when skill store tick noise did not change persistable data. */
export function skillStoreSaveFingerprint(state: SkillState): string {
  const lastNode = state.skillNodes[state.skillNodes.length - 1]
  const lastLegacy = state.legacySkills[state.legacySkills.length - 1]
  const unlockedCount = state.achievements.filter((a) => a.unlocked).length
  const lastUnlocked = [...state.achievements].reverse().find((a) => a.unlocked)

  return [
    state.skillNodes.length,
    lastNode?.id ?? '',
    lastNode?.level ?? '',
    lastNode?.xp ?? '',
    state.legacySkills.length,
    lastLegacy?.name ?? '',
    lastLegacy?.level ?? '',
    lastLegacy?.xp ?? '',
    state.achievements.length,
    unlockedCount,
    lastUnlocked?.id ?? '',
  ].join('|')
}
