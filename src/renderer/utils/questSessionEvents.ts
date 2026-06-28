/** Fired when quest session grace period ends (main window should show timeout UI). */
export const QUEST_SESSION_GRACE_EXPIRED_EVENT = 'artquest:quest-session-grace-expired'

/** Open submit flow on the active quest detail page. */
export const QUEST_OPEN_FINISH_FLOW_EVENT = 'artquest:quest-open-finish-flow'

export function dispatchQuestSessionGraceExpired(questId: number): void {
  window.dispatchEvent(
    new CustomEvent(QUEST_SESSION_GRACE_EXPIRED_EVENT, { detail: { questId } }),
  )
}

export function dispatchQuestOpenFinishFlow(): void {
  window.dispatchEvent(new CustomEvent(QUEST_OPEN_FINISH_FLOW_EVENT))
}
