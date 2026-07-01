import { app } from 'electron'
import { DatabaseSync } from 'node:sqlite'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const CURRENT_SCHEMA_VERSION = 5

let db: DatabaseSync | null = null

export function nowIso(): string {
  return new Date().toISOString()
}

export function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

export function getDatabasePath(): string {
  return path.join(app.getPath('userData'), 'artquest.sqlite')
}

export function getGalleryRoot(): string {
  return path.join(app.getPath('userData'), 'gallery')
}

function backupDatabase(dbPath: string): void {
  if (!fs.existsSync(dbPath)) return
  const backupDir = path.join(app.getPath('userData'), 'backups')
  ensureDir(backupDir)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.copyFileSync(dbPath, path.join(backupDir, `artquest-${stamp}.sqlite`))
}

function migrate(database: DatabaseSync): void {
  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA busy_timeout = 5000')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const row = database.prepare('SELECT value FROM app_meta WHERE key = ?').get('schema_version') as
    | { value: string }
    | undefined
  const current = row ? Number(row.value) : 0
  if (current > 0 && current < CURRENT_SCHEMA_VERSION) {
    backupDatabase(getDatabasePath())
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS progress_snapshot (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_event_log_type ON event_log (type);
    CREATE INDEX IF NOT EXISTS idx_event_log_created_at ON event_log (created_at);

    CREATE TABLE IF NOT EXISTS cloud_account (
      provider TEXT PRIMARY KEY,
      connected INTEGER NOT NULL DEFAULT 0,
      account_email TEXT,
      remote_root_path TEXT NOT NULL DEFAULT '/ArtQuest/Gallery',
      connected_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_item (
      id TEXT PRIMARY KEY,
      quest_id INTEGER,
      skill_node_id TEXT,
      media_type TEXT NOT NULL,
      local_file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      checksum_sha256 TEXT NOT NULL,
      storage_mode TEXT NOT NULL DEFAULT 'local',
      cloud_provider TEXT,
      remote_file_id TEXT,
      remote_path TEXT,
      sync_status TEXT NOT NULL DEFAULT 'local_only',
      last_sync_at TEXT,
      title TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_gallery_item_sync ON gallery_item (cloud_provider, sync_status);
    CREATE INDEX IF NOT EXISTS idx_gallery_item_created_at ON gallery_item (created_at);

    CREATE TABLE IF NOT EXISTS upload_queue (
      id TEXT PRIMARY KEY,
      gallery_item_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error_code TEXT,
      last_error_message TEXT,
      next_attempt_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (gallery_item_id) REFERENCES gallery_item(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue (status, next_attempt_at);
  `)

  if (current < 2) {
    try {
      database.exec('ALTER TABLE cloud_account ADD COLUMN remote_root_folder_id TEXT')
    } catch {
      // Column already exists.
    }
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS progress_chunk (
      chunk_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_at_ms INTEGER NOT NULL DEFAULT 0
    );
  `)

  if (current < 4) {
    try {
      database.exec('ALTER TABLE progress_chunk ADD COLUMN updated_at_ms INTEGER NOT NULL DEFAULT 0')
    } catch {
      // Column already exists.
    }
    const rows = database
      .prepare('SELECT chunk_key, updated_at FROM progress_chunk')
      .all() as { chunk_key: string; updated_at: string }[]
    const updateMs = database.prepare(
      'UPDATE progress_chunk SET updated_at_ms = ? WHERE chunk_key = ?',
    )
    for (const row of rows) {
      const ms = Date.parse(row.updated_at)
      updateMs.run(Number.isFinite(ms) ? ms : Date.now(), row.chunk_key)
    }
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS quest_completion_log (
      id TEXT PRIMARY KEY,
      completed_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_qcl_completed_at ON quest_completion_log(completed_at);
    CREATE TABLE IF NOT EXISTS quest_completion_summary (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  database
    .prepare(
      `INSERT INTO app_meta (key, value, updated_at)
       VALUES ('schema_version', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(String(CURRENT_SCHEMA_VERSION), nowIso())
}

export function getDb(): DatabaseSync {
  if (db) return db
  ensureDir(app.getPath('userData'))
  const database = new DatabaseSync(getDatabasePath())
  migrate(database)
  db = database
  return database
}

export function runTransaction(fn: () => void): void {
  const database = getDb()
  database.exec('BEGIN IMMEDIATE')
  try {
    fn()
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

export function appendEvent(type: string, payload: unknown): void {
  try {
    getDb()
      .prepare('INSERT INTO event_log (id, type, payload_json, created_at) VALUES (?, ?, ?, ?)')
      .run(randomId('evt'), type, JSON.stringify(payload ?? {}), nowIso())
  } catch (err) {
    console.warn('[db] event log write failed:', err)
  }
}

export function clearLocalUserData(): void {
  const database = getDb()
  runTransaction(() => {
    database.prepare('DELETE FROM upload_queue').run()
    database.prepare('DELETE FROM gallery_item').run()
    database.prepare('DELETE FROM event_log').run()
    database.prepare('DELETE FROM progress_snapshot').run()
    database.prepare('DELETE FROM progress_chunk').run()
    database.prepare('DELETE FROM quest_completion_log').run()
    database.prepare('DELETE FROM quest_completion_summary').run()
  })
}
