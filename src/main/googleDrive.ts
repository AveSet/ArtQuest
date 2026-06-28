import { app, safeStorage, shell } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from './googleOAuth.config'
import {
  getCloudAccount,
  getNextUploadCandidate,
  getStorageMode,
  importDownloadedGalleryFile,
  getGalleryItemByRemoteFileId,
  findGalleryItemByBasename,
  getGalleryItemByChecksum,
  getGalleryItemById,
  linkGalleryItemToRemoteFile,
  listPendingUploadGalleryItems,
  markUploadFailed,
  markUploadStarted,
  markUploadSucceeded,
  normalizeDrivePath,
  requeuePendingGalleryUploads,
  retryGalleryUpload,
  migrateGalleryItemsToCloudMode,
  upsertCloudAccount,
  type CloudAccount,
  type UploadCandidate,
} from './localDb'
import { usesCloudStorage } from '../shared/storageMode'

type TokenBundle = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

type GoogleTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

type GoogleDriveFile = {
  id?: string
  name?: string
  mimeType?: string
  appProperties?: Record<string, string>
}

const GOOGLE_PROVIDER = 'google' as const
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const IDENTITY_SCOPES = 'openid email'
const DEFAULT_DRIVE_PATH = '/ArtQuest/Gallery'

export type UploadQueueResult = {
  uploaded: number
  failed: number
  downloaded: number
  linked: number
  lastError: string | null
  needsScopeReconnect: boolean
}

let uploadLoopRunning = false
let uploadLoopPending = false
let onUploadQueueIdle: (() => void) | null = null

export function getGoogleDriveFolderWebUrl(): string | null {
  const account = getGoogleDriveStatus()
  if (!account.remoteRootFolderId) return null
  return `https://drive.google.com/drive/folders/${account.remoteRootFolderId}`
}

function isGoogleDriveAuthenticated(): boolean {
  return getGoogleDriveStatus().connected && loadTokens() != null
}

async function verifyRemoteDriveFile(remoteFileId: string): Promise<boolean> {
  try {
    const data = await googleFetch<{ id?: string; trashed?: boolean }>(
      `https://www.googleapis.com/drive/v3/files/${remoteFileId}?fields=id,trashed&supportsAllDrives=true`,
    )
    return Boolean(data.id && !data.trashed)
  } catch {
    return false
  }
}

function invalidateDriveFolderCache(): void {
  const account = getCloudAccount(GOOGLE_PROVIDER)
  if (!account) return
  upsertCloudAccount({
    provider: GOOGLE_PROVIDER,
    connected: account.connected,
    accountEmail: account.accountEmail,
    remoteRootFolderId: null,
  })
}

export function setUploadQueueIdleHandler(handler: (() => void) | null): void {
  onUploadQueueIdle = handler
}

function nowMs(): number {
  return Date.now()
}

function getGoogleClientId(): string {
  return (
    process.env.ARTQUEST_GOOGLE_CLIENT_ID ||
    process.env.VITE_ARTQUEST_GOOGLE_CLIENT_ID ||
    GOOGLE_OAUTH_CLIENT_ID
  )
}

function getGoogleClientSecret(): string {
  return (
    process.env.ARTQUEST_GOOGLE_CLIENT_SECRET ||
    process.env.VITE_ARTQUEST_GOOGLE_CLIENT_SECRET ||
    GOOGLE_OAUTH_CLIENT_SECRET
  )
}

function googleTokenParams(params: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams(params)
  const secret = getGoogleClientSecret()
  if (secret) body.set('client_secret', secret)
  return body
}

function formatGoogleConnectError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('client_secret')) {
    return 'Google OAuth client secret is missing. Set ARTQUEST_GOOGLE_CLIENT_SECRET in your build environment and rebuild.'
  }
  return message
}

function getTokenPath(): string {
  return path.join(app.getPath('userData'), 'secrets', 'google-drive-token.bin')
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

function base64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = base64Url(crypto.randomBytes(32))
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

function saveTokens(tokens: TokenBundle): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS encryption is not available')
  }
  const tokenPath = getTokenPath()
  ensureDir(path.dirname(tokenPath))
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens))
  fs.writeFileSync(tokenPath, encrypted)
}

function loadTokens(): TokenBundle | null {
  try {
    const tokenPath = getTokenPath()
    if (!fs.existsSync(tokenPath) || !safeStorage.isEncryptionAvailable()) return null
    const raw = safeStorage.decryptString(fs.readFileSync(tokenPath))
    const parsed = JSON.parse(raw) as Partial<TokenBundle>
    if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'number') return null
    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

function clearTokens(): void {
  try {
    const tokenPath = getTokenPath()
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath)
  } catch {
    // Ignore token cleanup errors; DB disconnect still prevents uploads.
  }
}

async function exchangeToken(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = (await response.json()) as GoogleTokenResponse
  if (!response.ok || json.error) {
    throw new Error(json.error_description || json.error || `Google token HTTP ${response.status}`)
  }
  return json
}

async function getAccessToken(): Promise<string> {
  const tokens = loadTokens()
  if (!tokens) throw new Error('Google Drive is not connected')
  if (tokens.expiresAt - nowMs() > 60_000) return tokens.accessToken
  if (!tokens.refreshToken) throw new Error('Google refresh token is missing')

  const clientId = getGoogleClientId()
  if (!clientId) throw new Error('Google OAuth client id is not configured')
  const refreshed = await exchangeToken(
    googleTokenParams({
      client_id: clientId,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  )
  const next: TokenBundle = {
    accessToken: refreshed.access_token || tokens.accessToken,
    refreshToken: refreshed.refresh_token || tokens.refreshToken,
    expiresAt: nowMs() + Math.max(60, refreshed.expires_in ?? 3600) * 1000,
  }
  saveTokens(next)
  return next.accessToken
}

async function googleFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })
  const text = await response.text()
  let json: T & { error?: { message?: string } } = {} as T & { error?: { message?: string } }
  if (text) {
    try {
      json = JSON.parse(text) as T & { error?: { message?: string } }
    } catch {
      throw new Error(text.slice(0, 200) || `Google Drive HTTP ${response.status}`)
    }
  }
  if (!response.ok) {
    const errorMessage = (json as { error?: { message?: string } }).error?.message
    const message = errorMessage || `Google Drive HTTP ${response.status}`
    throw new Error(message)
  }
  return json as T
}

function isInsufficientScopeError(message: string): boolean {
  return /insufficient authentication scopes/i.test(message)
}

export function needsGoogleDriveScopeReconnect(message: string | null | undefined): boolean {
  return Boolean(message && isInsufficientScopeError(message))
}

async function validateGoogleDriveAccess(): Promise<void> {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('pageSize', '1')
  url.searchParams.set('spaces', 'drive')
  url.searchParams.set('fields', 'files(id)')
  await googleFetch(url.toString())
}

export async function checkGoogleDriveScopeAccess(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await validateGoogleDriveAccess()
    return { ok: true }
  } catch (err) {
    const error = String(err instanceof Error ? err.message : err)
    return { ok: false, error }
  }
}

async function fetchAccountEmail(): Promise<string | null> {
  try {
    const data = await googleFetch<{ email?: string }>('https://openidconnect.googleapis.com/v1/userinfo')
    return data.email ?? null
  } catch {
    return null
  }
}

export async function connectGoogleDrive(): Promise<{ success: true; account: CloudAccount } | { success: false; error: string }> {
  try {
    const clientId = getGoogleClientId()
    if (!clientId) {
      return {
        success: false,
        error: 'Google Drive OAuth is not configured. Set ARTQUEST_GOOGLE_CLIENT_ID for Windows builds.',
      }
    }
    if (!safeStorage.isEncryptionAvailable()) {
      return { success: false, error: 'Windows secure storage is not available' }
    }

    const { verifier, challenge } = createPkcePair()
    const { redirectUri } = await new Promise<{ redirectUri: string }>((resolve, reject) => {
      const server = http.createServer()
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        server.close()
        if (!address || typeof address === 'string') reject(new Error('Could not allocate OAuth port'))
        else resolve({ redirectUri: `http://127.0.0.1:${address.port}/oauth2callback` })
      })
      server.on('error', reject)
    })

    // Recreate the real listener on the known port encoded in redirectUri.
    const port = new URL(redirectUri).port
    const codePromise = new Promise<{ code: string }>((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        if (error || !code) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('ArtQuest Google Drive connection failed. You can close this tab.')
          reject(new Error(error || 'No authorization code received'))
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('ArtQuest is connected to Google Drive. You can close this tab.')
          resolve({ code })
        }
        server.close()
      })
      server.on('error', reject)
      server.listen(Number(port), '127.0.0.1')
      setTimeout(() => {
        server.close()
        reject(new Error('Google login timed out'))
      }, 120_000).unref()
    })

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', `${DRIVE_FILE_SCOPE} ${IDENTITY_SCOPES}`)
    authUrl.searchParams.set('include_granted_scopes', 'true')
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    await shell.openExternal(authUrl.toString())

    const { code } = await codePromise
    const tokenResponse = await exchangeToken(
      googleTokenParams({
        client_id: clientId,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    )
    if (!tokenResponse.access_token) throw new Error('Google did not return an access token')
    saveTokens({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: nowMs() + Math.max(60, tokenResponse.expires_in ?? 3600) * 1000,
    })
    try {
      await validateGoogleDriveAccess()
    } catch (err) {
      clearTokens()
      const message = String(err instanceof Error ? err.message : err)
      if (isInsufficientScopeError(message)) {
        return {
          success: false,
          error:
            'Google Drive file access was not granted. Disconnect, then Connect again and allow Drive access. Also add drive.file scope in Google Cloud OAuth consent screen.',
        }
      }
      return { success: false, error: message }
    }
    const account = upsertCloudAccount({
      provider: GOOGLE_PROVIDER,
      connected: true,
      accountEmail: await fetchAccountEmail(),
      remoteRootPath: getCloudAccount(GOOGLE_PROVIDER)?.remoteRootPath ?? DEFAULT_DRIVE_PATH,
    })
    requeuePendingGalleryUploads()
    await ensureFolderPath(account.remoteRootPath)
    void processGoogleUploadQueue()
    return { success: true, account: getGoogleDriveStatus() }
  } catch (err) {
    return { success: false, error: formatGoogleConnectError(err) }
  }
}

export function disconnectGoogleDrive(): CloudAccount {
  clearTokens()
  return upsertCloudAccount({ provider: GOOGLE_PROVIDER, connected: false, remoteRootFolderId: null })
}

export function setGoogleDrivePath(rawPath: string): CloudAccount {
  const current = getCloudAccount(GOOGLE_PROVIDER)
  const account = upsertCloudAccount({
    provider: GOOGLE_PROVIDER,
    connected: current?.connected ?? false,
    accountEmail: current?.accountEmail ?? null,
    remoteRootPath: normalizeDrivePath(rawPath),
  })
  if (account.connected) {
    requeuePendingGalleryUploads()
    void processGoogleUploadQueue()
  }
  return account
}

export function getGoogleDriveStatus(): CloudAccount {
  return (
    getCloudAccount(GOOGLE_PROVIDER) ??
    upsertCloudAccount({ provider: GOOGLE_PROVIDER, connected: false, remoteRootPath: DEFAULT_DRIVE_PATH })
  )
}

async function findFolder(name: string, parentId: string | null): Promise<string | null> {
  const q = [
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
    `name = '${name.replace(/'/g, "\\'")}'`,
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(' and ')
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', q)
  url.searchParams.set('fields', 'files(id,name)')
  url.searchParams.set('spaces', 'drive')
  const data = await googleFetch<{ files?: GoogleDriveFile[] }>(url.toString())
  return data.files?.[0]?.id ?? null
}

async function findFolderSafe(name: string, parentId: string | null): Promise<string | null> {
  try {
    return await findFolder(name, parentId)
  } catch {
    // drive.file scope cannot always search Drive root; fall back to createFolder.
    return null
  }
}

async function createFolder(name: string, parentId: string | null): Promise<string> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) metadata.parents = [parentId]
  const data = await googleFetch<GoogleDriveFile>(
    'https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    },
  )
  if (!data.id) throw new Error('Google Drive folder creation returned no id')
  return data.id
}

async function ensureFolderPath(remotePath: string): Promise<string> {
  const normalized = normalizeDrivePath(remotePath)
  const account = getCloudAccount(GOOGLE_PROVIDER)
  if (account?.remoteRootFolderId && account.remoteRootPath === normalized) {
    return account.remoteRootFolderId
  }

  const parts = normalized.split('/').filter(Boolean)
  let parentId: string | null = null
  for (const part of parts) {
    parentId = (await findFolderSafe(part, parentId)) ?? (await createFolder(part, parentId))
  }
  if (!parentId) throw new Error('Invalid Google Drive path')

  upsertCloudAccount({
    provider: GOOGLE_PROVIDER,
    connected: account?.connected ?? true,
    accountEmail: account?.accountEmail ?? null,
    remoteRootPath: normalized,
    remoteRootFolderId: parentId,
  })
  return parentId
}

function mimeFromFile(filePath: string, mediaType: 'image' | 'video'): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.mov') return 'video/quicktime'
  return mediaType === 'video' ? 'application/octet-stream' : 'image/png'
}

async function downloadDriveFileBuffer(remoteFileId: string): Promise<Buffer> {
  const token = await getAccessToken()
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${remoteFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text.slice(0, 200) || `Google Drive download HTTP ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

function parseQuestIdFromFilename(name: string): number | null {
  const match = name.match(/^quest-(\d+)-\d+\.\w+$/i)
  if (!match) return null
  const parsed = Number.parseInt(match[1]!, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function mediaTypeFromMime(mime: string, fileName: string): 'image' | 'video' {
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  const ext = path.extname(fileName).toLowerCase()
  if (['.mp4', '.webm', '.mov'].includes(ext)) return 'video'
  return 'image'
}

function extFromName(name: string, mediaType: 'image' | 'video'): string {
  const ext = path.extname(name).replace('.', '').toLowerCase()
  if (ext) return ext
  return mediaType === 'video' ? 'mp4' : 'png'
}

async function listRemoteGalleryFiles(folderId: string): Promise<GoogleDriveFile[]> {
  const files: GoogleDriveFile[] = []
  let pageToken: string | undefined
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files')
    url.searchParams.set('q', `'${folderId}' in parents and trashed = false`)
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,appProperties)')
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const data = await googleFetch<{ files?: GoogleDriveFile[]; nextPageToken?: string }>(url.toString())
    files.push(...(data.files ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return files.filter((file) => file.id && file.mimeType !== 'application/vnd.google-apps.folder')
}

async function reconcilePendingUploadsWithRemote(remoteFiles: GoogleDriveFile[]): Promise<number> {
  const account = getGoogleDriveStatus()
  const byGalleryId = new Map<string, GoogleDriveFile>()
  const bySha = new Map<string, GoogleDriveFile>()
  for (const remote of remoteFiles) {
    if (!remote.id || !remote.name) continue
    const galleryItemId = remote.appProperties?.artquestGalleryItemId
    const sha = remote.appProperties?.sha256
    if (galleryItemId) byGalleryId.set(galleryItemId, remote)
    if (sha) bySha.set(sha, remote)
  }

  let linked = 0
  for (const pending of listPendingUploadGalleryItems()) {
    if (!fs.existsSync(pending.localFilePath)) continue

    const remoteByGalleryId = byGalleryId.get(pending.galleryItemId)
    const remoteBySha =
      pending.checksumSha256 && bySha.get(pending.checksumSha256)
        ? bySha.get(pending.checksumSha256)
        : undefined

    let remote: GoogleDriveFile | undefined
    if (remoteByGalleryId) {
      remote = remoteByGalleryId
    } else if (remoteBySha && remoteBySha.appProperties?.sha256 === pending.checksumSha256) {
      remote = remoteBySha
    } else {
      continue
    }

    if (!remote?.id || !remote.name) continue
    if (!(await verifyRemoteDriveFile(remote.id))) continue

    const remotePath = `${account.remoteRootPath.replace(/\/+$/, '')}/${remote.name}`
    linkGalleryItemToRemoteFile({
      queueId: pending.queueId,
      galleryItemId: pending.galleryItemId,
      remoteFileId: remote.id,
      remotePath,
    })
    linked += 1
  }
  return linked
}

function localFileMatchesRemote(localPath: string, remoteSha?: string, localChecksum?: string | null): boolean {
  if (!fs.existsSync(localPath)) return false
  if (remoteSha && localChecksum) return remoteSha === localChecksum
  if (remoteSha) {
    const buffer = fs.readFileSync(localPath)
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
    return checksum === remoteSha
  }
  return true
}

async function reconcileAndDownloadFromRemote(remoteFiles: GoogleDriveFile[]): Promise<{ downloaded: number; linked: number }> {
  const account = getGoogleDriveStatus()
  let downloaded = 0
  let linked = 0

  for (const remote of remoteFiles) {
    if (!remote.id || !remote.name) continue
    const remotePath = `${account.remoteRootPath.replace(/\/+$/, '')}/${remote.name}`
    const remoteSha = remote.appProperties?.sha256
    const galleryItemId = remote.appProperties?.artquestGalleryItemId

    const byRemote = getGalleryItemByRemoteFileId(remote.id)
    if (byRemote && fs.existsSync(byRemote.path)) continue

    const tryLink = async (itemId: string, localPath: string, localChecksum?: string | null): Promise<boolean> => {
      if (!localFileMatchesRemote(localPath, remoteSha, localChecksum)) return false
      if (!(await verifyRemoteDriveFile(remote.id!))) return false
      linkGalleryItemToRemoteFile({
        galleryItemId: itemId,
        remoteFileId: remote.id!,
        remotePath,
      })
      linked += 1
      return true
    }

    if (galleryItemId) {
      const local = getGalleryItemById(galleryItemId)
      if (local && (await tryLink(local.id, local.path, local.checksumSha256))) continue
    }

    if (remoteSha) {
      const byChecksum = getGalleryItemByChecksum(remoteSha)
      if (byChecksum && (await tryLink(byChecksum.id, byChecksum.localFilePath, byChecksum.checksumSha256))) continue
    }

    const byName = findGalleryItemByBasename(remote.name)
    if (
      byName &&
      byName.checksumSha256 &&
      remoteSha &&
      byName.checksumSha256 === remoteSha &&
      (await tryLink(byName.id, byName.localFilePath, byName.checksumSha256))
    ) {
      continue
    }

    const buffer = await downloadDriveFileBuffer(remote.id)
    const mediaType = mediaTypeFromMime(remote.mimeType ?? '', remote.name)
    const ext = extFromName(remote.name, mediaType)
    const questId = parseQuestIdFromFilename(remote.name)

    importDownloadedGalleryFile({
      buffer,
      ext,
      mediaType,
      questId,
      remoteFileId: remote.id,
      remotePath,
      galleryItemId,
    })
    downloaded += 1
  }

  return { downloaded, linked }
}

async function downloadMissingGalleryFromDrive(): Promise<{ downloaded: number; linked: number }> {
  const account = getGoogleDriveStatus()
  if (!account.connected) return { downloaded: 0, linked: 0 }
  const folderId = await ensureFolderPath(account.remoteRootPath)
  const remoteFiles = await listRemoteGalleryFiles(folderId)
  return reconcileAndDownloadFromRemote(remoteFiles)
}

async function uploadCandidate(candidate: UploadCandidate): Promise<string> {
  if (!fs.existsSync(candidate.localFilePath)) {
    if (candidate.remotePath) {
      throw new Error('Local gallery file is missing. Run Sync to restore from Google Drive.')
    }
    throw new Error('Local gallery file is missing')
  }
  const account = getGoogleDriveStatus()
  const folderId = await ensureFolderPath(account.remoteRootPath)
  const fileName = path.basename(candidate.localFilePath)
  const metadata: Record<string, unknown> = {
    name: fileName,
    parents: [folderId],
    appProperties: {
      artquestGalleryItemId: candidate.galleryItemId,
      ...(candidate.checksumSha256 ? { sha256: candidate.checksumSha256 } : {}),
    },
  }
  const boundary = `-------artquest${crypto.randomBytes(16).toString('hex')}`
  const mime = mimeFromFile(candidate.localFilePath, candidate.mediaType)
  const fileBuffer = fs.readFileSync(candidate.localFilePath)
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
    ),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  const data = await googleFetch<GoogleDriveFile>(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,parents&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: new Uint8Array(body),
    },
  )
  if (!data.id) throw new Error('Google Drive upload returned no file id')
  return data.id
}

export async function processGoogleUploadQueue(): Promise<UploadQueueResult> {
  const result: UploadQueueResult = {
    uploaded: 0,
    failed: 0,
    downloaded: 0,
    linked: 0,
    lastError: null,
    needsScopeReconnect: false,
  }
  if (uploadLoopRunning) {
    uploadLoopPending = true
    return result
  }
  uploadLoopRunning = true
  try {
    if (!isGoogleDriveAuthenticated()) return result
    const account = getGoogleDriveStatus()
    try {
      const folderId = await ensureFolderPath(account.remoteRootPath)
      const remoteFiles = await listRemoteGalleryFiles(folderId)
      result.linked = await reconcilePendingUploadsWithRemote(remoteFiles)
    } catch (err) {
      const message = String(err instanceof Error ? err.message : err)
      result.lastError = message
      if (isInsufficientScopeError(message)) result.needsScopeReconnect = true
    }
    for (;;) {
      const candidate = getNextUploadCandidate()
      if (!candidate) break
      markUploadStarted(candidate.id, candidate.galleryItemId)
      try {
        const remoteFileId = await uploadCandidate(candidate)
        if (!(await verifyRemoteDriveFile(remoteFileId))) {
          throw new Error('Upload reported success but the file is not visible on Google Drive.')
        }
        markUploadSucceeded(candidate.id, candidate.galleryItemId, remoteFileId)
        result.uploaded += 1
      } catch (err) {
        const message = String(err instanceof Error ? err.message : err)
        result.failed += 1
        result.lastError = message
        if (/not found|invalid.*parent|parent.*not/i.test(message)) {
          invalidateDriveFolderCache()
        }
        if (isInsufficientScopeError(message)) result.needsScopeReconnect = true
        markUploadFailed(candidate.id, candidate.galleryItemId, 'GOOGLE_UPLOAD_FAILED', message)
        if (result.needsScopeReconnect) break
      }
    }
  } finally {
    uploadLoopRunning = false
    const shouldRunAgain = uploadLoopPending
    uploadLoopPending = false
    onUploadQueueIdle?.()
    if (shouldRunAgain) {
      void processGoogleUploadQueue()
    }
  }
  return result
}

export function retryGoogleUpload(galleryItemId: string): { success: boolean } {
  const success = retryGalleryUpload(galleryItemId)
  void processGoogleUploadQueue()
  return { success }
}

export async function syncGoogleDriveGallery(): Promise<
  UploadQueueResult & { requeued: number; migrated: number }
> {
  if (!usesCloudStorage(getStorageMode())) {
    return { requeued: 0, migrated: 0, uploaded: 0, failed: 0, downloaded: 0, linked: 0, lastError: null, needsScopeReconnect: false }
  }
  if (isGoogleDriveAuthenticated()) {
    try {
      await ensureFolderPath(getGoogleDriveStatus().remoteRootPath)
    } catch (err) {
      const message = String(err instanceof Error ? err.message : err)
      return {
        requeued: 0,
        migrated: 0,
        uploaded: 0,
        failed: 1,
        downloaded: 0,
        linked: 0,
        lastError: message,
        needsScopeReconnect: needsGoogleDriveScopeReconnect(message),
      }
    }
  }
  const migrated = migrateGalleryItemsToCloudMode()
  const requeued = requeuePendingGalleryUploads()
  let downloaded = 0
  let linked = 0
  try {
    const pullResult = await downloadMissingGalleryFromDrive()
    downloaded = pullResult.downloaded
    linked = pullResult.linked
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err)
    return {
      requeued,
      migrated,
      uploaded: 0,
      failed: 1,
      downloaded: 0,
      linked: 0,
      lastError: message,
      needsScopeReconnect: needsGoogleDriveScopeReconnect(message),
    }
  }
  const uploadResult = await processGoogleUploadQueue()
  return { ...uploadResult, requeued, migrated, downloaded, linked: linked + uploadResult.linked }
}

export async function retryAllGoogleUploads(): Promise<
  UploadQueueResult & { requeued: number; migrated: number }
> {
  return syncGoogleDriveGallery()
}
