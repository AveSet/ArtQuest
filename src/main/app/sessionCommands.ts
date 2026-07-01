import type { QuestSessionCommand } from '../ipc/questSessionCommands'
import { appState } from './appState'
import { showMainWindow } from '../windows/mainWindow'
import {
  hideOverlayForSessionExpand,
  toggleOverlayWindow,
} from '../windows/overlayWindow'

export function sendQuestSessionCommand(command: QuestSessionCommand): void {
  if (command === 'toggleOverlay') {
    toggleOverlayWindow()
    return
  }
  if (command === 'showMainWindow' || command === 'openQuestFinish') {
    hideOverlayForSessionExpand()
    showMainWindow()
    if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
      appState.mainWindow.webContents.send('artquest:v1:quest-session:command', command)
    }
    return
  }
  if (
    command === 'cancelQuestSession' ||
    command === 'cancelPractice' ||
    command === 'finishPractice'
  ) {
    hideOverlayForSessionExpand()
    showMainWindow()
    if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
      appState.mainWindow.webContents.send('artquest:v1:quest-session:command', command)
    }
    return
  }
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.webContents.send('artquest:v1:quest-session:command', command)
  }
}

export function expandSessionFromOverlay(): void {
  sendQuestSessionCommand('showMainWindow')
}
