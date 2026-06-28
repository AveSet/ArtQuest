import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { ensureDir, getGalleryRoot, randomId } from './dbCore'
import { dataUrlToBuffer } from './mediaDataUrl'

export function getQuestReferencesRoot(): string {
  return path.join(app.getPath('userData'), 'quest_references')
}

export function deleteQuestReferenceFile(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  const refRoot = path.resolve(getQuestReferencesRoot()) + path.sep
  if (!resolved.startsWith(refRoot)) return false
  if (!fs.existsSync(resolved)) return true
  try {
    fs.unlinkSync(resolved)
    return true
  } catch {
    return false
  }
}

export function saveQuestReferenceFromDataUrl(
  dataUrl: string,
  questId: string,
): { id: string; path: string } | null {
  if (!/^[a-zA-Z0-9-]+$/.test(questId) || questId.length > 50) return null
  const parsed = dataUrlToBuffer(dataUrl)
  if (!parsed || parsed.mediaType !== 'image') return null

  const id = randomId('qref')
  const dir = path.join(getQuestReferencesRoot(), questId)
  ensureDir(dir)
  const filename = `${id}.${parsed.ext}`
  const localFilePath = path.join(dir, filename)
  const resolved = path.resolve(localFilePath)
  const root = path.resolve(dir) + path.sep
  if (!resolved.startsWith(root)) return null

  fs.writeFileSync(resolved, parsed.buffer)
  return { id, path: resolved }
}

export function saveCustomAvatarFromDataUrl(dataUrl: string): { path: string } | null {
  const parsed = dataUrlToBuffer(dataUrl)
  if (!parsed || parsed.mediaType !== 'image') return null

  const dir = path.join(app.getPath('userData'), 'avatars')
  ensureDir(dir)
  const filename = `custom.${parsed.ext}`
  const localFilePath = path.join(dir, filename)
  const resolved = path.resolve(localFilePath)
  const root = path.resolve(dir) + path.sep
  if (!resolved.startsWith(root)) return null

  fs.writeFileSync(resolved, parsed.buffer)
  return { path: resolved }
}

export function isManagedMediaPath(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  const roots = [
    path.join(app.getPath('userData'), 'images'),
    path.join(app.getPath('userData'), 'avatars'),
    path.join(app.getPath('userData'), 'quest_attachments'),
    getQuestReferencesRoot(),
    path.join(getGalleryRoot(), 'originals'),
    path.join(getGalleryRoot(), 'thumbs'),
  ].map((dir) => path.resolve(dir) + path.sep)
  return roots.some((root) => resolved.startsWith(root))
}
