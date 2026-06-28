import path from 'path'
import { describe, expect, it } from 'vitest'
import { isPathUnderRoot } from '../pathSafety'

describe('pathSafety', () => {
  it('accepts files inside the allowed root', () => {
    const root = path.join('C:', 'Users', 'AveSet', 'AppData', 'Roaming', 'ArtQuest', 'backups')
    const child = path.join(root, 'progress-corrupt-1.json')

    expect(isPathUnderRoot(child, root)).toBe(true)
  })

  it('rejects sibling paths with the same prefix', () => {
    const root = path.join('C:', 'Users', 'AveSet', 'AppData', 'Roaming', 'ArtQuest', 'backups')
    const sibling = path.join('C:', 'Users', 'AveSet', 'AppData', 'Roaming', 'ArtQuest', 'backups_evil', 'x.json')

    expect(isPathUnderRoot(sibling, root)).toBe(false)
  })

  it('rejects traversal outside the allowed root', () => {
    const root = path.resolve('userData', 'backups')
    const escaped = path.join(root, '..', 'secrets.json')

    expect(isPathUnderRoot(escaped, root)).toBe(false)
  })
})
