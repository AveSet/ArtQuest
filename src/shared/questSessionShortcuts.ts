export type QuestSessionShortcutCommand =
  | 'advancePhase'
  | 'toggleOverlay'
  | 'openReferences'
  | 'showMainWindow'

export const QUEST_SESSION_SHORTCUT_COMMANDS: QuestSessionShortcutCommand[] = [
  'advancePhase',
  'toggleOverlay',
  'openReferences',
  'showMainWindow',
]

export type QuestSessionShortcuts = Record<QuestSessionShortcutCommand, string>

export const DEFAULT_QUEST_SESSION_SHORTCUTS: QuestSessionShortcuts = {
  advancePhase: 'CommandOrControl+Alt+Right',
  toggleOverlay: 'CommandOrControl+Alt+O',
  openReferences: 'CommandOrControl+Alt+R',
  showMainWindow: 'CommandOrControl+Alt+M',
}

const ACCELERATOR_RE = /^[A-Za-z0-9+]+$/

const MODIFIER_PARTS = new Set([
  'CommandOrControl',
  'Command',
  'Control',
  'Alt',
  'Option',
  'Shift',
  'Super',
  'Meta',
])

const KEY_PARTS = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...'0123456789'.split(''),
  'Left',
  'Right',
  'Up',
  'Down',
  'Space',
  'Tab',
  'Enter',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Plus',
  'Minus',
  ...Array.from({ length: 24 }, (_, i) => `F${i + 1}`),
])

export function isValidQuestSessionAccelerator(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 80) return false
  if (!ACCELERATOR_RE.test(trimmed)) return false
  const parts = trimmed.split('+').filter(Boolean)
  if (parts.length === 0) return false
  const key = parts[parts.length - 1]!
  if (!KEY_PARTS.has(key)) return false
  if (parts.length === 1) return true
  return parts.slice(0, -1).every((part) => MODIFIER_PARTS.has(part))
}

export function normalizeQuestSessionShortcuts(
  partial?: Partial<QuestSessionShortcuts> | null,
): QuestSessionShortcuts {
  const out = { ...DEFAULT_QUEST_SESSION_SHORTCUTS }
  if (!partial) return out
  for (const cmd of QUEST_SESSION_SHORTCUT_COMMANDS) {
    const raw = partial[cmd]
    if (typeof raw === 'string' && isValidQuestSessionAccelerator(raw)) {
      out[cmd] = raw.trim()
    }
  }
  return out
}

export function questSessionShortcutBindings(
  shortcuts: QuestSessionShortcuts,
): Array<[string, QuestSessionShortcutCommand]> {
  return QUEST_SESSION_SHORTCUT_COMMANDS.map((cmd) => [shortcuts[cmd], cmd])
}
