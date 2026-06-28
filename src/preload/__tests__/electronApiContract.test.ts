import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/** Ensures preload exposes every ElectronAPI method declared in electron.d.ts */
describe('electronAPI contract', () => {
  it('preload exposeInMainWorld keys match ElectronAPI interface', () => {
    const preloadSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/preload/preload.ts'),
      'utf-8',
    )
    const typesSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/renderer/types/electron.d.ts'),
      'utf-8',
    )

    const exposeStart = preloadSrc.indexOf("contextBridge.exposeInMainWorld('electronAPI', {")
    expect(exposeStart).toBeGreaterThanOrEqual(0)
    const exposeEnd = preloadSrc.lastIndexOf('});')
    const exposeBlock = preloadSrc.slice(exposeStart, exposeEnd)

    const preloadKeys = [...exposeBlock.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])
    const interfaceBlock = typesSrc.match(/export interface ElectronAPI \{([\s\S]*?)\n\}/)?.[1]
    expect(interfaceBlock).toBeTruthy()

    const typeKeys = [...interfaceBlock!.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])

    for (const key of typeKeys) {
      expect(preloadKeys, `missing preload method: ${key}`).toContain(key)
    }

    for (const key of preloadKeys) {
      expect(typeKeys.includes(key) || key === 'closeQuestOverlay', `undeclared preload method: ${key}`).toBe(
        true,
      )
    }
  })
})
