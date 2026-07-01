import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const MAX_DEBUG_LOG_BYTES = 512 * 1024
const DEBUG_LOG_KEEP_LINES = 500

export function getDebugLogPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'progress_debug.log')
}

export function appendDebugLog(msg: string): void {
  try {
    const p = getDebugLogPath()
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p)
      if (stat.size > MAX_DEBUG_LOG_BYTES) {
        const content = fs.readFileSync(p, 'utf-8')
        const lines = content.split('\n').filter(Boolean)
        const trimmed = lines.slice(-DEBUG_LOG_KEEP_LINES).join('\n')
        fs.writeFileSync(p, trimmed.length > 0 ? trimmed + '\n' : '', 'utf-8')
      }
    }
    const timestamp = new Date().toISOString()
    fs.appendFileSync(p, `[${timestamp}] ${msg}\n`)
  } catch {
    //
  }
}

export function getQuestBackupDir(): string {
  return path.join(app.getPath('userData'), 'quest_attachments')
}

export function getProgressPath(): string {
  return path.join(app.getPath('userData'), 'progress.json')
}

export function getProgressBackupPath(): string {
  return getProgressPath() + '.bak'
}
