import { app, globalShortcut } from 'electron'
import type { QuestSessionCommand } from '../ipc/questSessionCommands'
import { appState } from '../app/appState'

export const DEFAULT_QUEST_SHORTCUT_BINDINGS: Array<[string, QuestSessionCommand]> = [
  ['CommandOrControl+Alt+Right', 'advancePhase'],
  ['CommandOrControl+Alt+O', 'toggleOverlay'],
  ['CommandOrControl+Alt+R', 'openReferences'],
  ['CommandOrControl+Alt+M', 'showMainWindow'],
]

let registeredQuestAccelerators: string[] = []
let pendingQuestShortcutBindings: Array<[string, QuestSessionCommand]> | null = null

export function unregisterQuestGlobalShortcuts(): void {
  const previous = registeredQuestAccelerators
  registeredQuestAccelerators = []
  if (!app.isReady()) return
  for (const accelerator of previous) {
    try {
      globalShortcut.unregister(accelerator)
    } catch {
      /* ignore */
    }
  }
}

export function registerQuestGlobalShortcuts(
  bindings: Array<[string, QuestSessionCommand]>,
  sendCommand: (command: QuestSessionCommand) => void,
): void {
  if (!app.isReady()) {
    pendingQuestShortcutBindings = bindings
    return
  }
  unregisterQuestGlobalShortcuts()
  const next: string[] = []
  for (const [accelerator, command] of bindings) {
    if (!accelerator || typeof accelerator !== 'string') continue
    try {
      const ok = globalShortcut.register(accelerator, () => sendCommand(command))
      if (!ok) {
        console.warn('[shortcuts] Could not register', accelerator)
        continue
      }
      next.push(accelerator)
    } catch (e) {
      console.warn('[shortcuts] Failed to register', accelerator, e)
    }
  }
  registeredQuestAccelerators = next
}

export function applyInitialQuestGlobalShortcuts(sendCommand: (command: QuestSessionCommand) => void): void {
  const bindings = pendingQuestShortcutBindings ?? DEFAULT_QUEST_SHORTCUT_BINDINGS
  pendingQuestShortcutBindings = null
  registerQuestGlobalShortcuts(bindings, sendCommand)
}
