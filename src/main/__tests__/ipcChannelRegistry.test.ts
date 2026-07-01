import { describe, expect, it } from 'vitest'
import { PRIVILEGED_IPC_CHANNELS } from '../ipcTrustedSender'

/** Privileged channels registered in main IPC handlers — must stay in sync with ipcTrustedSender. */
const EXPECTED_PRIVILEGED_CHANNELS = [
  'save-progress',
  'save-progress-sync',
  'load-progress',
  'read-corrupt-progress-backup',
  'clear-progress',
  'artquest:v1:progress:append-log',
  'artquest:v1:telemetry:track',
  'save-image',
  'save-quest-reference',
  'delete-quest-reference',
  'pick-portrait-image',
  'save-custom-avatar',
  'get-saved-images',
  'read-image',
  'get-local-media-url',
  'sync-desktop-settings',
  'show-test-notification',
  'artquest:v1:quest-session:dispatch-command',
  'artquest:v1:overlay:set-payload',
  'artquest:v1:overlay:set-patch',
  'artquest:v1:overlay:set-layout',
  'artquest:v1:overlay:set-session-active',
  'artquest:v1:overlay:open',
  'artquest:v1:overlay:hide',
  'artquest:v1:overlay:toggle',
  'artquest:v1:overlay:expand',
  'artquest:v1:overlay:cancel',
  'artquest:v1:overlay:close',
  'artquest:v1:reference-window:open',
  'artquest:v1:reference-window:navigate',
  'show-item-in-folder',
  'open-external',
  'artquest:v1:storage:getMode',
  'artquest:v1:storage:setMode',
  'artquest:v1:cloud:google:connect',
  'artquest:v1:cloud:google:disconnect',
  'artquest:v1:cloud:google:setPath',
  'artquest:v1:cloud:google:getStatus',
  'artquest:v1:gallery:retryUpload',
  'artquest:v1:gallery:retryAllUploads',
  'artquest:v1:gallery:sync',
  'export-progress-file',
  'import-progress-file',
  'pick-art-app-exe',
  'save-share-card-png',
  'app-before-quit-done',
  'artquest:v1:overlay:get-payload',
  'artquest:v1:overlay:ready',
  'artquest:v1:session:set-tick-active',
  'artquest:v1:taskbar:set-progress',
  'artquest:v1:window-bounds:apply',
] as const

describe('ipc channel registry', () => {
  it('guards every expected privileged channel', () => {
    for (const channel of EXPECTED_PRIVILEGED_CHANNELS) {
      expect(PRIVILEGED_IPC_CHANNELS.has(channel)).toBe(true)
    }
  })

  it('does not drift beyond the expected privileged set', () => {
    const expected = new Set<string>(EXPECTED_PRIVILEGED_CHANNELS)
    const extra = [...PRIVILEGED_IPC_CHANNELS].filter((ch) => !expected.has(ch))
    expect(extra).toEqual([])
  })
})
