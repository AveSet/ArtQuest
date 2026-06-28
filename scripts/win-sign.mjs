/**
 * Optional Authenticode signing for Windows artifacts.
 * Set WIN_CSC_LINK + WIN_CSC_KEY_PASSWORD (or CSC_LINK + CSC_KEY_PASSWORD) to a .pfx path or base64 blob.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const TIMESTAMP_URL = 'http://timestamp.digicert.com'

function certEnv() {
  const link = process.env.WIN_CSC_LINK || process.env.CSC_LINK
  if (!link) return null
  const password = process.env.WIN_CSC_KEY_PASSWORD || process.env.CSC_KEY_PASSWORD || ''
  return { link, password }
}

function resolveCertificateFile(link) {
  const trimmed = link.trim()
  if (fs.existsSync(trimmed)) return { certPath: trimmed, cleanup: null }

  const decoded = Buffer.from(trimmed, 'base64')
  if (decoded.length < 100) {
    throw new Error('win-sign: CSC_LINK is not a valid file path or base64 .pfx')
  }
  const certPath = path.join(os.tmpdir(), `artquest-sign-${process.pid}.pfx`)
  fs.writeFileSync(certPath, decoded)
  return {
    certPath,
    cleanup: () => {
      try {
        fs.unlinkSync(certPath)
      } catch {
        //
      }
    },
  }
}

function findSigntool() {
  const kitRoot = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles
  if (!kitRoot) return null
  const kitsDir = path.join(kitRoot, 'Windows Kits', '10', 'bin')
  if (!fs.existsSync(kitsDir)) return null
  const versions = fs
    .readdirSync(kitsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  for (const ver of versions) {
    const candidate = path.join(kitsDir, ver, 'x64', 'signtool.exe')
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/**
 * @param {string} filePath
 * @returns {Promise<boolean>} true when signed
 */
export async function signWindowsFile(filePath) {
  if (process.platform !== 'win32') return false
  const cert = certEnv()
  if (!cert) return false
  if (!fs.existsSync(filePath)) return false

  const signtool = findSigntool()
  if (!signtool) {
    console.warn('win-sign: signtool.exe not found — install Windows SDK or Visual Studio Build Tools')
    return false
  }

  const { certPath, cleanup } = resolveCertificateFile(cert.link)
  try {
    const args = [
      'sign',
      '/f',
      certPath,
      '/p',
      cert.password,
      '/fd',
      'SHA256',
      '/tr',
      TIMESTAMP_URL,
      '/td',
      'SHA256',
      '/d',
      'ArtQuest',
      filePath,
    ]
    execFileSync(signtool, args, { stdio: 'inherit' })
    console.log(`win-sign: signed ${path.basename(filePath)}`)
    return true
  } finally {
    cleanup?.()
  }
}

/** Sign main app exe plus bundled Electron DLLs in an unpacked folder. */
export async function signUnpackedDir(unpackedDir) {
  if (!certEnv()) return

  const skip = new Set(['elevate.exe'])
  const files = fs
    .readdirSync(unpackedDir)
    .filter((f) => {
      const lower = f.toLowerCase()
      if (skip.has(lower)) return false
      return lower.endsWith('.exe') || lower.endsWith('.dll')
    })
    .map((f) => path.join(unpackedDir, f))

  for (const file of files) {
    await signWindowsFile(file)
  }
}
