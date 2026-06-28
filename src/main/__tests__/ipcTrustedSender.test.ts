import { describe, expect, it } from 'vitest'
import { assertTrustedIpcSender, isTrustedRendererUrl } from '../ipcTrustedSender'

describe('ipcTrustedSender', () => {
  it('allows packaged renderer and dev server origins', () => {
    const cwdRenderer = `file:///${process.cwd().replace(/\\/g, '/').replace(/\/$/, '')}/out/renderer/index.html`
    expect(isTrustedRendererUrl(cwdRenderer)).toBe(true)
    expect(isTrustedRendererUrl('http://localhost:5173/#/')).toBe(true)
    expect(isTrustedRendererUrl('http://127.0.0.1:4173/#/quests')).toBe(true)
  })

  it('rejects external and blank origins', () => {
    expect(isTrustedRendererUrl('https://evil.example/')).toBe(false)
    expect(isTrustedRendererUrl('about:blank')).toBe(false)
    expect(isTrustedRendererUrl('')).toBe(false)
  })

  it('assertTrustedIpcSender throws for untrusted senders', () => {
    expect(() =>
      assertTrustedIpcSender({
        senderFrame: { url: 'https://evil.example' },
        sender: { getURL: () => 'https://evil.example' },
      } as never),
    ).toThrow(/untrusted/i)
  })
})
