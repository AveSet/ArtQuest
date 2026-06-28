import { ipcMain } from 'electron'
import { parseQuestSessionCommand, type QuestSessionCommand } from './questSessionCommands'

export type QuestSessionCommandIpcDeps = {
  sendCommand: (command: QuestSessionCommand) => void
}

export function registerQuestSessionCommandIpcHandlers(deps: QuestSessionCommandIpcDeps): void {
  ipcMain.handle('artquest:v1:quest-session:dispatch-command', async (_, rawCommand: unknown) => {
    const command = parseQuestSessionCommand(rawCommand)
    if (!command) {
      return { success: false, error: 'invalid command' }
    }
    deps.sendCommand(command)
    return { success: true }
  })
}
