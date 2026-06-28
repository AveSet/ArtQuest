export type QuestSessionCommand =
  | 'advancePhase'
  | 'toggleOverlay'
  | 'openReferences'
  | 'showMainWindow'
  | 'openQuestFinish'
  | 'cancelQuestSession'
  | 'finishPractice'
  | 'cancelPractice'

export const QUEST_SESSION_COMMANDS: readonly QuestSessionCommand[] = [
  'advancePhase',
  'toggleOverlay',
  'openReferences',
  'showMainWindow',
  'openQuestFinish',
  'cancelQuestSession',
  'finishPractice',
  'cancelPractice',
]

const COMMAND_SET = new Set<string>(QUEST_SESSION_COMMANDS)

export function parseQuestSessionCommand(raw: unknown): QuestSessionCommand | null {
  if (typeof raw !== 'string' || !COMMAND_SET.has(raw)) return null
  return raw as QuestSessionCommand
}

export const QUEST_SESSION_SHORTCUT_COMMANDS: readonly QuestSessionCommand[] = [
  'advancePhase',
  'toggleOverlay',
  'openReferences',
  'showMainWindow',
]

const SHORTCUT_COMMAND_SET = new Set<string>(QUEST_SESSION_SHORTCUT_COMMANDS)

export function parseQuestSessionShortcutBindings(
  raw: unknown,
): Array<[string, QuestSessionCommand]> | null {
  if (!Array.isArray(raw)) return null
  const bindings: Array<[string, QuestSessionCommand]> = []
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 2) continue
    const accelerator = row[0]
    const command = row[1]
    if (typeof accelerator !== 'string' || typeof command !== 'string') continue
    if (!SHORTCUT_COMMAND_SET.has(command)) continue
    bindings.push([accelerator, command as QuestSessionCommand])
  }
  return bindings.length > 0 ? bindings : null
}
