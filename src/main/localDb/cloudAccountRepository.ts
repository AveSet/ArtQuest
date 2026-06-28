import {
  normalizeStorageMode,
  type StorageMode,
} from '../../shared/storageMode'
import { appendEvent, getDb, nowIso } from './dbCore'
import type { CloudAccount } from './types'

export function getStorageMode(): StorageMode {
  const row = getDb().prepare('SELECT value FROM app_meta WHERE key = ?').get('storage_mode') as
    | { value: string }
    | undefined
  return normalizeStorageMode(row?.value)
}

export function setStorageMode(mode: StorageMode): void {
  const normalized = normalizeStorageMode(mode)
  const updatedAt = nowIso()
  getDb()
    .prepare(
      `INSERT INTO app_meta (key, value, updated_at)
       VALUES ('storage_mode', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(normalized, updatedAt)
  appendEvent('storage_mode_changed', { mode: normalized })
}

export function getCloudAccount(provider: 'google'): CloudAccount | null {
  const row = getDb().prepare('SELECT * FROM cloud_account WHERE provider = ?').get(provider) as
    | {
        provider: 'google'
        connected: number
        account_email: string | null
        remote_root_path: string
        remote_root_folder_id: string | null
        connected_at: string | null
        updated_at: string
      }
    | undefined
  if (!row) return null
  return {
    provider: row.provider,
    connected: row.connected === 1,
    accountEmail: row.account_email,
    remoteRootPath: row.remote_root_path,
    remoteRootFolderId: row.remote_root_folder_id ?? null,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  }
}

export function upsertCloudAccount(input: {
  provider: 'google'
  connected: boolean
  accountEmail?: string | null
  remoteRootPath?: string
  remoteRootFolderId?: string | null
}): CloudAccount {
  const existing = getCloudAccount(input.provider)
  const updatedAt = nowIso()
  const remoteRootPath = normalizeDrivePath(input.remoteRootPath ?? existing?.remoteRootPath ?? '/ArtQuest/Gallery')
  const pathChanged = existing != null && existing.remoteRootPath !== remoteRootPath
  const remoteRootFolderId =
    input.remoteRootFolderId !== undefined
      ? input.remoteRootFolderId
      : pathChanged
        ? null
        : (existing?.remoteRootFolderId ?? null)
  const connectedAt = input.connected ? existing?.connectedAt ?? updatedAt : null
  getDb()
    .prepare(
      `INSERT INTO cloud_account (provider, connected, account_email, remote_root_path, remote_root_folder_id, connected_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider) DO UPDATE SET
         connected = excluded.connected,
         account_email = excluded.account_email,
         remote_root_path = excluded.remote_root_path,
         remote_root_folder_id = excluded.remote_root_folder_id,
         connected_at = excluded.connected_at,
         updated_at = excluded.updated_at`,
    )
    .run(
      input.provider,
      input.connected ? 1 : 0,
      input.accountEmail ?? existing?.accountEmail ?? null,
      remoteRootPath,
      remoteRootFolderId,
      connectedAt,
      updatedAt,
    )
  appendEvent('cloud_account_updated', { provider: input.provider, connected: input.connected })
  return getCloudAccount(input.provider)!
}

export function normalizeDrivePath(raw: string): string {
  const parts = raw
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/[\\:*?"<>|]/g, '-').slice(0, 80))
  return `/${(parts.length > 0 ? parts : ['ArtQuest', 'Gallery']).join('/')}`
}
