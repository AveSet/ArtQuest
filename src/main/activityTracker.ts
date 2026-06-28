import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  DEFAULT_TRACKED_ART_APPS,
  isTrackedArtProcess,
  normalizeTrackedArtApps,
  normalizeCustomArtAppExecutablePath,
  processNameFromExecutablePath,
  type ArtAppId,
} from '../shared/artApps'

const execFileAsync = promisify(execFile)

export type ActivityTrackerConfig = {
  enabled: boolean
  trackedArtApps: ArtAppId[]
  idleTimeoutSec: number
  /** Process name derived from user-selected .exe (when custom app is tracked). */
  customArtAppProcessName?: string
}

export type ActivitySnapshot = {
  processName: string
  idleSec: number
  artAppActive: boolean
  userActive: boolean
  shouldCountTime: boolean
}

const DEFAULT_CONFIG: ActivityTrackerConfig = {
  enabled: true,
  trackedArtApps: [...DEFAULT_TRACKED_ART_APPS],
  idleTimeoutSec: 60,
}

const NON_WIN_SNAPSHOT: ActivitySnapshot = {
  processName: '',
  idleSec: 0,
  artAppActive: true,
  userActive: true,
  shouldCountTime: true,
}

let config: ActivityTrackerConfig = { ...DEFAULT_CONFIG }
let cachedSnapshot: ActivitySnapshot | null = null
let lastGoodSnapshot: ActivitySnapshot | null = null
let refreshInFlight: Promise<ActivitySnapshot> | null = null
let lastRefreshMs = 0
let activityTrackingPaused = false

/** Stop spawning PowerShell polls (call before app shutdown). */
export function pauseActivityTracking(): void {
  activityTrackingPaused = true
}

const WIN_PS = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AQWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  [DllImport("kernel32.dll")] public static extern uint GetTickCount();
}
"@
$hwnd = [AQWin]::GetForegroundWindow()
$fgPid = [uint32]0
[void][AQWin]::GetWindowThreadProcessId($hwnd, [ref]$fgPid)
$proc = if ($fgPid -gt 0) { (Get-Process -Id $fgPid -ErrorAction SilentlyContinue).ProcessName } else { "" }
$lii = New-Object AQWin+LASTINPUTINFO
$lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)
[void][AQWin]::GetLastInputInfo([ref]$lii)
$tick = [AQWin]::GetTickCount()
$idleMs = [uint32]($tick - $lii.dwTime)
Write-Output ("{0}|{1}" -f $proc, [math]::Floor($idleMs / 1000))
`.trim()

export function setActivityTrackerConfig(partial: Partial<ActivityTrackerConfig>): void {
  const customProcessName =
    partial.customArtAppProcessName !== undefined
      ? partial.customArtAppProcessName
      : config.customArtAppProcessName
  config = {
    enabled: partial.enabled ?? config.enabled,
    trackedArtApps: partial.trackedArtApps
      ? normalizeTrackedArtApps(partial.trackedArtApps)
      : config.trackedArtApps,
    idleTimeoutSec:
      typeof partial.idleTimeoutSec === 'number' && partial.idleTimeoutSec >= 10
        ? Math.min(600, Math.floor(partial.idleTimeoutSec))
        : config.idleTimeoutSec,
    customArtAppProcessName: customProcessName,
  }
}

export function setCustomArtAppExecutablePath(exePath: string | undefined): void {
  const normalized = normalizeCustomArtAppExecutablePath(exePath)
  config = {
    ...config,
    customArtAppProcessName: normalized ? processNameFromExecutablePath(normalized) : undefined,
  }
}

export function getActivityTrackerConfig(): ActivityTrackerConfig {
  return { ...config }
}

function parseWindowsOutput(raw: string): { processName: string; idleSec: number } {
  const [processName = '', idleRaw = '0'] = raw.split('|')
  const idleSec = Math.max(0, parseInt(idleRaw, 10) || 0)
  return { processName, idleSec }
}

function buildSnapshot(processName: string, idleSec: number): ActivitySnapshot {
  if (!config.enabled) {
    return {
      processName,
      idleSec,
      artAppActive: true,
      userActive: true,
      shouldCountTime: true,
    }
  }

  const artAppActive = isTrackedArtProcess(processName, config.trackedArtApps, config.customArtAppProcessName)
  const userActive = idleSec < config.idleTimeoutSec
  const shouldCountTime = artAppActive && userActive

  return { processName, idleSec, artAppActive, userActive, shouldCountTime }
}

function fallbackSnapshot(): ActivitySnapshot {
  return cachedSnapshot ?? lastGoodSnapshot ?? buildSnapshot('', 0)
}

async function readWindowsActivityAsync(): Promise<{ processName: string; idleSec: number }> {
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WIN_PS],
      { encoding: 'utf8', timeout: 3000, windowsHide: true, maxBuffer: 4096 },
    )
    return parseWindowsOutput(String(stdout).trim())
  } catch {
    if (lastGoodSnapshot) {
      return { processName: lastGoodSnapshot.processName, idleSec: lastGoodSnapshot.idleSec }
    }
    return { processName: '', idleSec: 0 }
  }
}

/** Non-blocking read of last cached snapshot (may trigger background refresh). */
export function sampleActivity(): ActivitySnapshot {
  if (process.platform !== 'win32') {
    cachedSnapshot = NON_WIN_SNAPSHOT
    lastGoodSnapshot = NON_WIN_SNAPSHOT
    return NON_WIN_SNAPSHOT
  }

  const stale = Date.now() - lastRefreshMs > 900
  if (stale && !refreshInFlight && !activityTrackingPaused) {
    void refreshActivitySnapshot()
  }
  return fallbackSnapshot()
}

/** Refresh foreground process / idle state asynchronously (deduped). */
export function refreshActivitySnapshot(): Promise<ActivitySnapshot> {
  if (activityTrackingPaused) {
    return Promise.resolve(fallbackSnapshot())
  }
  if (process.platform !== 'win32') {
    cachedSnapshot = NON_WIN_SNAPSHOT
    lastGoodSnapshot = NON_WIN_SNAPSHOT
    lastRefreshMs = Date.now()
    return Promise.resolve(NON_WIN_SNAPSHOT)
  }

  if (refreshInFlight) return refreshInFlight

  refreshInFlight = readWindowsActivityAsync()
    .then(({ processName, idleSec }) => {
      const snap = buildSnapshot(processName, idleSec)
      cachedSnapshot = snap
      lastGoodSnapshot = snap
      lastRefreshMs = Date.now()
      return snap
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}
