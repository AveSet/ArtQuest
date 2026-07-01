import { sampleActivity } from '../activityTracker'
import { appState } from '../app/appState'

export function broadcastActivitySnapshot(snapshot = sampleActivity()): void {
  const payload = {
    processName: snapshot.processName,
    idleSec: snapshot.idleSec,
    artAppActive: snapshot.artAppActive,
    userActive: snapshot.userActive,
    shouldCountTime: snapshot.shouldCountTime,
  }
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.webContents.send('artquest:v1:activity:update', payload)
  }
  if (appState.overlayWindow && !appState.overlayWindow.isDestroyed()) {
    appState.overlayWindow.webContents.send('artquest:v1:activity:update', payload)
  }
}
