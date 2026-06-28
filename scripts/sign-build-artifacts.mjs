/**
 * Signs final installer/portable artifacts when a code-signing certificate is configured.
 */
import fs from 'node:fs'
import path from 'node:path'
import { signWindowsFile } from './win-sign.mjs'

export default async function afterAllArtifactBuild(context) {
  const artifactPaths = context.artifactPaths ?? []
  for (const artifactPath of artifactPaths) {
    const ext = path.extname(artifactPath).toLowerCase()
    if (ext !== '.exe') continue
    if (!fs.existsSync(artifactPath)) continue
    await signWindowsFile(artifactPath)
  }
}
