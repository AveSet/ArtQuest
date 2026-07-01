import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const NAMESPACE_KEYS = [
  'progress',
  'shell',
  'overlay',
  'reference',
  'cloud',
  'gallery',
  'session',
  'desktop',
] as const

/** Ensures preload exposes every ElectronAPI namespace declared in electron.d.ts */
describe('electronAPI contract', () => {
  it('preload exposeInMainWorld keys match ElectronAPI namespaces', () => {
    const exposeSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/preload/exposeElectronApi.ts'),
      'utf-8',
    )
    const typesSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/renderer/types/electron.d.ts'),
      'utf-8',
    )

    const exposeStart = exposeSrc.indexOf("contextBridge.exposeInMainWorld('electronAPI', {")
    expect(exposeStart).toBeGreaterThanOrEqual(0)
    const exposeEnd = exposeSrc.indexOf('})', exposeStart)
    const exposeBlock = exposeSrc.slice(exposeStart, exposeEnd)

    const preloadKeys = [...exposeBlock.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1])
    const interfaceBlock = typesSrc.match(/export interface ElectronAPI \{([\s\S]*?)\n\}/)?.[1]
    expect(interfaceBlock).toBeTruthy()

    const typeKeys = [...interfaceBlock!.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])

    for (const key of NAMESPACE_KEYS) {
      expect(typeKeys, `missing ElectronAPI namespace: ${key}`).toContain(key)
      expect(preloadKeys, `missing preload namespace: ${key}`).toContain(key)
    }

    for (const key of preloadKeys) {
      expect(NAMESPACE_KEYS as readonly string[], `unexpected preload key: ${key}`).toContain(key)
    }
  })

  it('overlay preload exposes only overlay, session, and reference namespaces', () => {
    const exposeSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/preload/exposeElectronApi.ts'),
      'utf-8',
    )
    const overlayStart = exposeSrc.indexOf('export function exposeOverlayElectronApi')
    expect(overlayStart).toBeGreaterThanOrEqual(0)
    const overlayBlock = exposeSrc.slice(overlayStart)
    const exposeStart = overlayBlock.indexOf("contextBridge.exposeInMainWorld('electronAPI', {")
    const exposeEnd = overlayBlock.indexOf('})', exposeStart)
    const keys = [...overlayBlock.slice(exposeStart, exposeEnd).matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1])
    expect(keys.sort()).toEqual(['overlay', 'reference', 'session'])
  })
})
