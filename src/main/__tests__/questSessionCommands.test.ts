import { describe, expect, it } from 'vitest'
import {
  parseQuestSessionCommand,
  parseQuestSessionShortcutBindings,
  QUEST_SESSION_COMMANDS,
} from '../ipc/questSessionCommands'

describe('questSessionCommands', () => {
  it('accepts known session commands', () => {
    for (const command of QUEST_SESSION_COMMANDS) {
      expect(parseQuestSessionCommand(command)).toBe(command)
    }
  })

  it('rejects unknown commands', () => {
    expect(parseQuestSessionCommand('deleteSave')).toBeNull()
    expect(parseQuestSessionCommand(42)).toBeNull()
  })

  it('parses shortcut bindings and ignores invalid rows', () => {
    const bindings = parseQuestSessionShortcutBindings([
      ['Ctrl+1', 'advancePhase'],
      ['bad', 'not-a-command'],
      ['Ctrl+2', 'toggleOverlay'],
    ])
    expect(bindings).toEqual([
      ['Ctrl+1', 'advancePhase'],
      ['Ctrl+2', 'toggleOverlay'],
    ])
  })

  it('returns null for empty shortcut arrays', () => {
    expect(parseQuestSessionShortcutBindings([])).toBeNull()
    expect(parseQuestSessionShortcutBindings([['Ctrl+1', 'invalid']])).toBeNull()
  })
})
