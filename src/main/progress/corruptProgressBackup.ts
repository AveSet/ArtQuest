import { app } from 'electron'
import fs from 'fs'
import path from 'path'

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** Persist raw progress JSON before a corrupt payload is discarded. */
export function backupCorruptProgress(raw: unknown): string | null {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups')
    ensureDir(backupDir)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `progress-corrupt-${stamp}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(raw, null, 2), 'utf-8')
    return backupPath
  } catch (err) {
    console.error('[ArtQuest] Failed to backup corrupt progress:', err)
    return null
  }
}
