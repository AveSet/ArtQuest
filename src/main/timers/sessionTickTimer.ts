import { appState } from '../app/appState'

export function pulseSessionTick(): void {
  if (appState.mainWindow && !appState.mainWindow.isDestroyed()) {
    appState.mainWindow.webContents.send('artquest:v1:session:tick')
  }
}

export function stopSessionTickTimer(): void {
  if (appState.sessionTickTimer) {
    clearInterval(appState.sessionTickTimer)
    appState.sessionTickTimer = null
  }
}

export function startSessionTickTimer(): void {
  if (appState.sessionTickTimer) return
  appState.sessionTickTimer = setInterval(pulseSessionTick, 1000)
  pulseSessionTick()
}
