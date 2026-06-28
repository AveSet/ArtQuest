import { describe, it, expect, vi } from 'vitest'
import { readFileAsDataURL } from '../fileHelpers'

describe('fileHelpers', () => {
  describe('readFileAsDataURL', () => {
    it('resolves with data URL for a file', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = await readFileAsDataURL(file)
      expect(result).toContain('data:text/plain;base64,')
    })

    it('rejects on file read error', async () => {
      const file = new File([], 'bad.txt', { type: 'text/plain' })
      const originalReadAsDataURL = FileReader.prototype.readAsDataURL
      FileReader.prototype.readAsDataURL = vi.fn(function (this: FileReader) {
        this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>)
      })

      await expect(readFileAsDataURL(file)).rejects.toBeDefined()

      FileReader.prototype.readAsDataURL = originalReadAsDataURL
    })
  })
})
