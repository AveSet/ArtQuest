/**
 * Runs after pack + fuses, before NSIS portable bundling.
 * Replaces electron-builder rcedit (avoids winCodeSign 7z + symlink extraction on Windows Home).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rcedit } from 'rcedit'
import { signUnpackedDir } from './win-sign.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.join(__dirname, '..')
const PUBLISHER = 'ArtQuest'

function readProductName() {
  const ymlPath = path.join(projectDir, 'electron-builder.yml')
  const yml = fs.readFileSync(ymlPath, 'utf8')
  const m = yml.match(/^productName:\s*(.+)$/m)
  return m ? m[1].trim() : 'ArtQuest'
}

function winUnpackedDirs(outDir) {
  return fs
    .readdirSync(outDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('win-') && d.name.endsWith('-unpacked'))
    .map((d) => path.join(outDir, d.name))
}

function resolveMainExe(unpackedDir, productName) {
  const skip = new Set(['elevate.exe'])
  const exes = fs
    .readdirSync(unpackedDir)
    .filter((f) => f.endsWith('.exe') && !skip.has(f.toLowerCase()))
  if (exes.length === 0) throw new Error(`rcedit-win-unpacked: no .exe in ${unpackedDir}`)
  const match = exes.find((f) => f.toLowerCase() === `${productName.toLowerCase()}.exe`)
  return path.join(unpackedDir, match ?? exes[0])
}

export default async function artifactBuildStarted(event) {
  const outDir = path.dirname(event.file)
  const iconPath = path.join(projectDir, 'build', 'icon.ico')
  if (!fs.existsSync(iconPath)) {
    throw new Error(`rcedit-win-unpacked: missing ${iconPath}`)
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'))
  const productName = readProductName()
  const ver = pkg.version ?? '1.0.0'

  const exeFileName = `${productName}.exe`
  const copyright =
    typeof pkg.author === 'string' && pkg.author.trim()
      ? `Copyright © ${new Date().getFullYear()} ${pkg.author.trim()}`
      : `Copyright © ${new Date().getFullYear()} ${PUBLISHER}`

  for (const unpacked of winUnpackedDirs(outDir)) {
    const exePath = resolveMainExe(unpacked, productName)
    await rcedit(exePath, {
      icon: iconPath,
      'file-version': ver,
      'product-version': ver,
      'requested-execution-level': 'asInvoker',
      'version-string': {
        CompanyName: PUBLISHER,
        FileDescription: pkg.description || productName,
        InternalName: exeFileName,
        OriginalFilename: exeFileName,
        ProductName: productName,
        LegalCopyright: copyright,
      },
    })
    await signUnpackedDir(unpacked)
  }
}
