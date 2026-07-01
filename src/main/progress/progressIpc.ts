import { app, dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { expandPayloadCompletionLogs } from '../../shared/progressLogCompression'
import {
  isProgressChunkBatchPayload,
  isProgressChunkPayload,
  mergeProgressChunks,
  PROGRESS_CHUNK_KEYS,
  type ProgressChunkKey,
} from '../../shared/progressChunkMerge'
import type { LoadProgressResponse } from '../../shared/loadProgressResponse'
import {
  normalizeProgressPayloadResult,
  parseProgressPayload,
  pickLoadedProgressFields,
  validateQuestCompletionLogsAppend,
} from '../progressSchema'
import { clearLocalUserData, getGalleryRoot } from '../localDb'
import {
  rebuildProgressFromChunks,
  saveProgressSnapshot,
  loadProgressSnapshot,
  rebuildProgressFromChunksWithMeta,
  loadProgressChunksWithMeta,
  persistProgressChunkBatch,
  saveFullProgressAtomic,
} from '../db/progressRepository'
import {
  appendCompletionLogEntry,
  loadAllCompletionLogs,
  migrateCompletionLogsFromProgress,
  countCompletionLogs,
} from '../db/questCompletionLogRepository'
import { backupCorruptProgress } from './corruptProgressBackup'
import { isPathUnderRoot } from '../pathSafety'
import { SQLITE_LOGS_SCHEMA_VERSION, unpackQuestCompletionLogsFromStorage } from '../../shared/progressLogLiveCompression'

export type ProgressDebugLogger = (msg: string) => void

export type ProgressIpcDeps = {
  getProgressPath: () => string
  getProgressBackupPath: () => string
  getQuestBackupDir: () => string
  getDebugLogPath?: () => string
  appendDebugLog: ProgressDebugLogger
}

const SNAPSHOT_EVERY_N_CHUNK_SAVES = 24
let chunkSaveCount = 0
let lastFullSaveAtMs = 0

type ProgressChunkWriteEntry = {
  _chunkKey: string
  data: Record<string, unknown>
  _createdAtMs?: number
}

function readProgressJsonFile(
  filePath: string,
  appendDebugLog: ProgressDebugLogger,
): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) return null
  const data = fs.readFileSync(filePath, 'utf-8')
  if (data.length > 100 * 1024 * 1024) {
    appendDebugLog('[WARN] progress file too large: ' + filePath)
    return null
  }
  try {
    const parsed = JSON.parse(data) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    appendDebugLog('[WARN] progress file is not an object: ' + filePath)
    return null
  } catch (e) {
    appendDebugLog('[WARN] JSON parse failed for ' + filePath + ': ' + String(e))
    return null
  }
}

function tryNormalizeRaw(
  raw: Record<string, unknown>,
): { ok: true; filtered: Record<string, unknown> } | { ok: false; message: string } {
  const enriched = enrichProgressWithSqliteLogs(raw)
  const result = normalizeProgressPayloadResult(enriched)
  if (result.ok) {
    return { ok: true, filtered: pickLoadedProgressFields(result.data) }
  }
  return {
    ok: false,
    message: result.errorMessage ?? result.reason,
  }
}

function enrichProgressWithSqliteLogs(raw: Record<string, unknown>): Record<string, unknown> {
  const version =
    typeof raw.schemaVersion === 'number' ? raw.schemaVersion : SQLITE_LOGS_SCHEMA_VERSION - 1
  const inlineLogs = Array.isArray(raw.questCompletionLogs) ? raw.questCompletionLogs : []
  const expandedInline =
    inlineLogs.length > 0 ? inlineLogs : unpackQuestCompletionLogsFromStorage(raw)

  if (countCompletionLogs() === 0 && expandedInline.length > 0) {
    migrateCompletionLogsFromProgress(expandedInline as Record<string, unknown>[])
  }

  const sqliteLogs = loadAllCompletionLogs()
  if (sqliteLogs.length > 0) {
    return {
      ...raw,
      schemaVersion: Math.max(version, SQLITE_LOGS_SCHEMA_VERSION),
      questCompletionLogs: sqliteLogs,
    }
  }

  if (version >= SQLITE_LOGS_SCHEMA_VERSION && expandedInline.length > 0) {
    return { ...raw, schemaVersion: SQLITE_LOGS_SCHEMA_VERSION, questCompletionLogs: expandedInline }
  }

  return raw
}

function createWriteProgressFile(deps: ProgressIpcDeps) {
  const maybeRebuildProgressSnapshot = (): { success: true } | { success: false; error: string } => {
    const merged = rebuildProgressFromChunks()
    if (!merged) {
      deps.appendDebugLog('SNAPSHOT SKIP: chunk merge empty')
      return { success: false, error: 'Chunk merge failed' }
    }
    const checked = parseProgressPayload(merged)
    if (!checked.success) {
      const err = 'Invalid merged progress (schema): ' + checked.error.message
      deps.appendDebugLog('SNAPSHOT FAILED: ' + err)
      return { success: false, error: 'Invalid data structure' }
    }
    saveProgressSnapshot(checked.data)
    deps.appendDebugLog('SNAPSHOT OK sqlite=true')
    return { success: true }
  }

  const validateChunkPreview = (
    entries: ProgressChunkWriteEntry[],
  ): { success: true; entries: ProgressChunkWriteEntry[] } | { success: false; error: string } => {
    const freshEntries = entries.filter((entry) => {
      if (typeof entry._createdAtMs !== 'number') return true
      return entry._createdAtMs >= lastFullSaveAtMs
    })
    if (freshEntries.length === 0) {
      deps.appendDebugLog('SAVE SKIP chunks=stale-after-full-save')
      return { success: true, entries: [] }
    }

    const { chunks: existingChunks } = loadProgressChunksWithMeta()
    const snapshot = loadProgressSnapshot()
    const previewChunks: Partial<Record<ProgressChunkKey, Record<string, unknown>>> = {
      ...(existingChunks as Partial<Record<ProgressChunkKey, Record<string, unknown>>>),
    }
    for (const entry of freshEntries) {
      previewChunks[entry._chunkKey as ProgressChunkKey] = entry.data
    }
    const preview = mergeProgressChunks(previewChunks, snapshot ?? undefined)

    if (tryFastValidateQuestsChunkAppend(freshEntries, existingChunks, snapshot)) {
      return { success: true, entries: freshEntries }
    }

    const checked = parseProgressPayload(preview)
    if (!checked.success) {
      const err = 'Invalid chunk merge (schema): ' + checked.error.message
      deps.appendDebugLog('SAVE FAILED chunks: ' + err)
      return { success: false, error: 'Invalid data structure' }
    }
    return { success: true, entries: freshEntries }
  }

  const persistProgressChunks = (
    entries: ProgressChunkWriteEntry[],
  ): { success: true } | { success: false; error: string } => {
    const preview = validateChunkPreview(entries)
    if (!preview.success) return { success: false, error: preview.error }
    if (preview.entries.length === 0) return { success: true }

    persistProgressChunkBatch(preview.entries)
    chunkSaveCount += preview.entries.length
    if (chunkSaveCount >= SNAPSHOT_EVERY_N_CHUNK_SAVES) {
      chunkSaveCount = 0
      const snap = maybeRebuildProgressSnapshot()
      if (!snap.success) return snap
    }
    deps.appendDebugLog('SAVE OK chunks=' + preview.entries.map((e) => e._chunkKey).join(',') + ' sqlite=true')
    return { success: true }
  }

  return (data: unknown): { success: true } | { success: false; error: string } => {
    try {
      let parsed: object
      if (typeof data === 'string') {
        parsed = JSON.parse(data)
      } else if (typeof data === 'object') {
        parsed = data as object
      } else {
        const err = 'Invalid progress data type: ' + typeof data
        console.error(err)
        deps.appendDebugLog('SAVE FAILED: ' + err)
        return { success: false, error: err }
      }

      if (isProgressChunkBatchPayload(parsed)) {
        return persistProgressChunks(parsed._chunkBatch)
      }

      if (isProgressChunkPayload(parsed)) {
        return persistProgressChunks([parsed])
      }

      const checked = parseProgressPayload(parsed)
      if (!checked.success) {
        const err = 'Invalid progress data (schema): ' + checked.error.message
        console.error(err)
        deps.appendDebugLog('SAVE FAILED: ' + err)
        return { success: false, error: 'Invalid data structure' }
      }

      const jsonString = JSON.stringify(checked.data)
      if (jsonString.length > 100 * 1024 * 1024) {
        const err = 'Data too large: ' + jsonString.length
        deps.appendDebugLog('SAVE FAILED: ' + err)
        return { success: false, error: 'Data too large' }
      }

      const saveAtMs = Date.now()
      saveFullProgressAtomic(checked.data as Record<string, unknown>, saveAtMs)
      chunkSaveCount = 0
      lastFullSaveAtMs = saveAtMs

      const p = checked.data as Record<string, unknown>
      const debug = {
        completedToday: p.completedToday,
        dailyQuestsIds: p.dailyQuestsIds,
        lastDailyQuestDate: p.lastDailyQuestDate,
        skillNode0Xp: Array.isArray(p.skillNodes)
          ? (p.skillNodes as Record<string, unknown>[])[0]?.xp
          : 'N/A',
        skillNode0Level: Array.isArray(p.skillNodes)
          ? (p.skillNodes as Record<string, unknown>[])[0]?.level
          : 'N/A',
      }
      deps.appendDebugLog(
        'SAVE OK: path=' + deps.getProgressPath() + ' sqlite=true size=' + jsonString.length + ' debug=' + JSON.stringify(debug),
      )

      return { success: true }
    } catch (error) {
      const errMsg = String(error)
      console.error('Failed to save progress:', error)
      deps.appendDebugLog('SAVE EXCEPTION: ' + errMsg)
      return { success: false, error: errMsg }
    }
  }
}

function tryFastValidateQuestsChunkAppend(
  freshEntries: ProgressChunkWriteEntry[],
  existingChunks: Record<string, Record<string, unknown>>,
  snapshot: Record<string, unknown> | null,
): boolean {
  if (freshEntries.length !== 1) return false
  const entry = freshEntries[0]
  if (!entry || entry._chunkKey !== 'quests') return false

  const existingQuests = existingChunks.quests ?? {}
  const snapshotQuests = snapshot
    ? {
        userQuests: snapshot.userQuests,
        deletedQuestIds: snapshot.deletedQuestIds,
        questTitleOverrides: snapshot.questTitleOverrides,
        completedQuests: snapshot.completedQuests,
        questCompletionLogs: snapshot.questCompletionLogs,
        microChallengesCompleted: snapshot.microChallengesCompleted,
        questSavedReferences: snapshot.questSavedReferences,
        questPhaseMedia: snapshot.questPhaseMedia,
      }
    : {}

  const baseLogs = Array.isArray(existingQuests.questCompletionLogs)
    ? existingQuests.questCompletionLogs
    : Array.isArray(snapshotQuests.questCompletionLogs)
      ? snapshotQuests.questCompletionLogs
      : []

  const incoming = entry.data
  const questFieldKeys = [
    'userQuests',
    'deletedQuestIds',
    'questTitleOverrides',
    'completedQuests',
    'questCompletionLogs',
    'microChallengesCompleted',
    'questSavedReferences',
    'questPhaseMedia',
  ] as const

  for (const key of questFieldKeys) {
    if (key === 'questCompletionLogs') continue
    const existingVal = existingQuests[key] ?? snapshotQuests[key]
    if (JSON.stringify(incoming[key]) !== JSON.stringify(existingVal)) return false
  }

  const incomingLogs = incoming.questCompletionLogs
  if (!Array.isArray(incomingLogs)) return false
  return validateQuestCompletionLogsAppend(baseLogs, incomingLogs)
}

export function registerProgressIpcHandlers(deps: ProgressIpcDeps): void {
  const writeProgressFile = createWriteProgressFile(deps)

  ipcMain.handle('save-progress', async (_, data: unknown) => writeProgressFile(data))

  ipcMain.handle('artquest:v1:progress:append-log', async (_, entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { success: false, error: 'Invalid completion log entry' }
    }
    const ok = appendCompletionLogEntry(entry as Record<string, unknown>)
    return ok ? { success: true } : { success: false, error: 'Append failed' }
  })

  ipcMain.on('save-progress-sync', (event, data: unknown) => {
    event.returnValue = writeProgressFile(data)
  })

  ipcMain.handle('load-progress', async (): Promise<LoadProgressResponse> => {
    try {
      const progressPath = deps.getProgressPath()
      const bakPath = deps.getProgressBackupPath()
      deps.appendDebugLog('LOAD: start sqlite=' + path.join(app.getPath('userData'), 'artquest.sqlite'))

      const candidates: Array<{
        raw: Record<string, unknown>
        source: string
        degraded?: boolean
        warnings?: string[]
      }> = []

      const rebuiltChunks = rebuildProgressFromChunksWithMeta()
      if (rebuiltChunks.merged) {
        const missingChunkKeys = PROGRESS_CHUNK_KEYS.filter(
          (key) => !rebuiltChunks.chunkKeys.includes(key),
        )
        const warnings: string[] = []
        if (rebuiltChunks.corruptKeys.length > 0) {
          warnings.push('Skipped corrupt progress chunks: ' + rebuiltChunks.corruptKeys.join(','))
        }
        if (!rebuiltChunks.usedSnapshot && missingChunkKeys.length > 0) {
          warnings.push('Loaded partial progress chunks without a snapshot: ' + missingChunkKeys.join(','))
        }
        candidates.push({
          raw: rebuiltChunks.merged,
          source: 'sqlite-chunks',
          degraded: warnings.length > 0,
          warnings,
        })
      }

      const snapshot = loadProgressSnapshot()
      if (snapshot) candidates.push({ raw: snapshot, source: 'sqlite-snapshot' })

      const primaryRaw = readProgressJsonFile(progressPath, deps.appendDebugLog)
      if (primaryRaw) candidates.push({ raw: primaryRaw, source: 'primary' })

      const backupRaw = readProgressJsonFile(bakPath, deps.appendDebugLog)
      if (backupRaw) candidates.push({ raw: backupRaw, source: 'backup' })

      const normalizedCandidates = candidates
        .map((candidate) => {
          const normalized = tryNormalizeRaw(candidate.raw)
          if (!normalized.ok) return null
          return { candidate, filtered: normalized.filtered }
        })
        .filter(
          (
            item,
          ): item is {
            candidate: (typeof candidates)[number]
            filtered: Record<string, unknown>
          } => item != null,
        )
        .sort((a, b) => {
          const rank = (candidate: (typeof candidates)[number]): number => {
            if (candidate.source === 'sqlite-chunks') return candidate.degraded ? 0 : 4
            if (candidate.source === 'sqlite-snapshot') return 3
            if (candidate.source === 'primary') return 2
            if (candidate.source === 'backup') return 1
            return 0
          }
          return rank(b.candidate) - rank(a.candidate)
        })

      for (const { candidate, filtered } of normalizedCandidates) {
          const debug = {
            completedToday: filtered.completedToday,
            dailyQuestsIds: filtered.dailyQuestsIds,
            lastDailyQuestDate: filtered.lastDailyQuestDate,
            skillNode0Xp: Array.isArray(filtered.skillNodes)
              ? (filtered.skillNodes as Record<string, unknown>[])[0]?.xp
              : 'N/A',
          }
          deps.appendDebugLog(
            'LOAD OK (' +
              candidate.source +
              '): fields=' +
              Object.keys(filtered).join(',') +
              ' debug=' +
              JSON.stringify(debug),
          )
          if (candidate.source === 'primary' || candidate.source === 'backup') {
            try {
              const checked = parseProgressPayload(filtered)
              if (checked.success) saveProgressSnapshot(checked.data)
            } catch (e) {
              deps.appendDebugLog('MIGRATE WARN: could not migrate legacy progress to sqlite: ' + String(e))
            }
            if (candidate.source === 'backup') {
              console.warn(
                '[ArtQuest] Loaded progress from backup (progress.json.bak). Consider checking progress.json integrity.',
              )
            }
          }
          return {
            status: 'ok',
            data: filtered,
            source: candidate.source,
            degraded: candidate.degraded,
            warnings: candidate.warnings,
          }
      }

      if (candidates.length > 0) {
        const corruptRaw = candidates[0].raw
        const backupPath = backupCorruptProgress(corruptRaw)
        const failed = tryNormalizeRaw(corruptRaw)
        const message = failed.ok ? 'Progress data failed validation' : failed.message
        deps.appendDebugLog(
          'LOAD CORRUPT: source=' + candidates[0].source + ' backup=' + (backupPath ?? 'none') + ' err=' + message,
        )
        return {
          status: 'corrupt',
          backupPath: backupPath ?? undefined,
          message,
        }
      }

      deps.appendDebugLog('LOAD: no readable progress found')
      return { status: 'empty' }
    } catch (error) {
      const errMsg = String(error)
      console.error('Failed to load progress:', error)
      deps.appendDebugLog('LOAD EXCEPTION: ' + errMsg)
      return { status: 'failed', message: errMsg }
    }
  })

  ipcMain.handle('clear-progress', async () => {
    try {
      clearLocalUserData()
      const progressPath = deps.getProgressPath()
      const bakPath = deps.getProgressBackupPath()
      if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath)
      if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath)

      const backupDir = deps.getQuestBackupDir()
      if (backupDir && fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true })
      }

      const imagesDir = path.join(app.getPath('userData'), 'images')
      if (fs.existsSync(imagesDir)) {
        fs.rmSync(imagesDir, { recursive: true, force: true })
      }
      const galleryDir = getGalleryRoot()
      if (fs.existsSync(galleryDir)) {
        fs.rmSync(galleryDir, { recursive: true, force: true })
      }
      const debugLog = deps.getDebugLogPath?.()
      if (debugLog && fs.existsSync(debugLog)) {
        fs.unlinkSync(debugLog)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to clear progress:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('read-corrupt-progress-backup', async (_, backupPath: string) => {
    try {
      if (typeof backupPath !== 'string' || !backupPath.trim()) {
        return { success: false as const, error: 'Invalid path' }
      }
      const backupsRoot = path.join(app.getPath('userData'), 'backups')
      const resolved = path.resolve(backupPath)
      if (!isPathUnderRoot(resolved, backupsRoot)) {
        return { success: false as const, error: 'Path not allowed' }
      }
      if (!fs.existsSync(resolved)) {
        return { success: false as const, error: 'Backup not found' }
      }
      const stat = fs.statSync(resolved)
      if (stat.size > 100 * 1024 * 1024) {
        return { success: false as const, error: 'Backup too large' }
      }
      const rawText = fs.readFileSync(resolved, 'utf8')
      const parsed = JSON.parse(rawText) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false as const, error: 'Invalid backup file' }
      }
      return { success: true as const, data: parsed }
    } catch (e) {
      return { success: false as const, error: String(e) }
    }
  })

  ipcMain.handle('import-progress-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      })
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'cancelled' }
      }
      const filePath = result.filePaths[0]
      const stat = fs.statSync(filePath)
      if (stat.size > 100 * 1024 * 1024) {
        return { success: false, error: 'File too large' }
      }
      const rawText = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(rawText) as Record<string, unknown>
      const payload = parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : parsed
      if (payload && typeof payload === 'object') {
        for (const key of Object.keys(payload)) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return { success: false, error: 'Invalid progress file' }
          }
        }
      }
      const expandedPayload =
        payload && typeof payload === 'object' && !Array.isArray(payload)
          ? expandPayloadCompletionLogs(payload as Record<string, unknown>)
          : payload
      const checked = parseProgressPayload(expandedPayload)
      if (!checked.success) {
        return { success: false, error: 'Invalid progress file' }
      }
      const saveAtMs = Date.now()
      saveFullProgressAtomic(checked.data as Record<string, unknown>, saveAtMs)
      return { success: true, data: pickLoadedProgressFields(checked.data) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
