import '@testing-library/jest-dom'
import { vi } from 'vitest'

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-test-url')
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn()
}

if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
  class MockAudioContext {
    state = 'running'
    destination = {}
    currentTime = 0
    createOscillator() {
      return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0 }, type: 'sine' }
    }
    createGain() {
      return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }
    }
    resume() { return Promise.resolve() }
    close() { return Promise.resolve() }
  }
  ;(window as any).AudioContext = MockAudioContext
  ;(window as any).webkitAudioContext = MockAudioContext
}

// Mock electronAPI for tests
const mockIpcResult = { success: true }
const mockElectronAPI = {
  activityTrackingNative: true,
  saveProgress: () => Promise.resolve(mockIpcResult),
  saveProgressSync: () => mockIpcResult,
  loadProgress: () => Promise.resolve({ status: 'empty' as const }),
  readCorruptProgressBackup: () => Promise.resolve({ success: false as const, error: 'not found' }),
  clearProgress: () => Promise.resolve(mockIpcResult),
  saveImage: () => Promise.resolve({ ...mockIpcResult, path: '/mock/path.png' }),
  saveQuestReference: () => Promise.resolve({ ...mockIpcResult, path: '/mock/ref.png', id: 'ref-1' }),
  deleteQuestReference: () => Promise.resolve(mockIpcResult),
  getSavedImages: () => Promise.resolve([]),
  readImage: () => Promise.resolve('data:image/png;base64,mock'),
  getLocalMediaUrl: (filepath: string) => Promise.resolve(`file://${filepath}`),
  pickPortraitImage: () => Promise.resolve({ success: true, dataUrl: 'data:image/png;base64,mock' }),
  saveCustomAvatar: () => Promise.resolve({ success: true, path: '/mock/avatar.jpg' }),
  showItemInFolder: () => Promise.resolve(),
  syncDesktopSettings: () => Promise.resolve(),
  pickArtAppExecutable: () => Promise.resolve({ success: true, path: 'C:\\Apps\\Krita\\krita.exe' }),
  showTestNotification: () => Promise.resolve({ success: true }),
  openExternal: () => Promise.resolve({ success: true }),
  getStorageMode: () => Promise.resolve({ success: true, mode: 'local' }),
  setStorageMode: () => Promise.resolve({ success: true, mode: 'local' }),
  connectGoogleDrive: () => Promise.resolve({ success: false, error: 'not configured' }),
  disconnectGoogleDrive: () => Promise.resolve({ success: true }),
  setGoogleDrivePath: () => Promise.resolve({ success: true }),
  getGoogleDriveStatus: () => Promise.resolve({
    success: true,
    account: {
      provider: 'google',
      connected: false,
      accountEmail: null,
      remoteRootPath: '/ArtQuest/Gallery',
      connectedAt: null,
      updatedAt: new Date(0).toISOString(),
    },
  }),
  retryGalleryUpload: () => Promise.resolve({ success: true }),
  retryAllGalleryUploads: () => Promise.resolve({ success: true, uploaded: 0, failed: 0, downloaded: 0, linked: 0, requeued: 0 }),
  syncGallery: () => Promise.resolve({ success: true, uploaded: 0, failed: 0, downloaded: 0, linked: 0, requeued: 0 }),
  onAppBeforeQuit: () => () => {},
  onGallerySyncUpdated: () => () => {},
  setSessionTickActive: () => Promise.resolve({ success: true }),
  setTaskbarProgress: () => Promise.resolve({ success: true }),
  applyWindowBounds: () => Promise.resolve({ success: true }),
  onWindowBoundsReport: () => () => {},
  onSessionTick: () => () => {},
}
Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true })

// Polyfill scrollIntoView for jsdom
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = vi.fn()
}
