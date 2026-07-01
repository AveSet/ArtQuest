import { refreshActivitySnapshot } from '../activityTracker'
import { appState } from '../app/appState'
import { broadcastActivitySnapshot } from './activityBroadcast'

export function startActivityTimer(): void {
  if (appState.activityTimer) return
  const broadcastCached = () => {
    broadcastActivitySnapshot()
  }
  appState.activityTimer = setInterval(broadcastCached, 1000)
  broadcastCached()

  const refreshPoll = () => {
    void refreshActivitySnapshot()
      .then(broadcastActivitySnapshot)
      .catch(() => broadcastActivitySnapshot())
  }
  appState.activityRefreshTimer = setInterval(refreshPoll, 3000)
  void refreshActivitySnapshot()
    .then(broadcastActivitySnapshot)
    .catch(() => broadcastActivitySnapshot())
}

export function stopActivityPolling(): void {
  if (appState.activityTimer) {
    clearInterval(appState.activityTimer)
    appState.activityTimer = null
  }
  if (appState.activityRefreshTimer) {
    clearInterval(appState.activityRefreshTimer)
    appState.activityRefreshTimer = null
  }
}
