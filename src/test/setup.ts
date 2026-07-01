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

const mockIpcResult = { success: true }

const mockElectronAPI = {
  progress: {
    save: () => Promise.resolve(mockIpcResult),
    saveSync: () => mockIpcResult,
    load: () => Promise.resolve({ status: 'empty' as const }),
    readCorruptBackup: () => Promise.resolve({ success: false as const, error: 'not found' }),
    clear: () => Promise.resolve(mockIpcResult),
    exportFile: () => Promise.resolve({ success: true }),
    importFile: () => Promise.resolve({ success: false, error: 'not configured' }),
    appendLog: () => Promise.resolve(mockIpcResult),
    onBeforeQuit: () => () => {},
  },
  shell: {
    showItemInFolder: () => Promise.resolve(),
    openExternal: () => Promise.resolve({ success: true }),
    saveShareCardPng: () => Promise.resolve({ success: true }),
  },
  overlay: {
    setPayload: () => Promise.resolve(mockIpcResult),
    setPatch: () => Promise.resolve(mockIpcResult),
    setLayout: () => Promise.resolve(mockIpcResult),
    setSessionActive: () => Promise.resolve(mockIpcResult),
    open: () => Promise.resolve(mockIpcResult),
    hide: () => Promise.resolve(mockIpcResult),
    toggle: () => Promise.resolve(mockIpcResult),
    expand: () => Promise.resolve(mockIpcResult),
    cancel: () => Promise.resolve(mockIpcResult),
    close: () => Promise.resolve(mockIpcResult),
    getSnapshot: () => ({ hasSession: false }),
    getPayload: () => Promise.resolve({ success: true, payload: { hasSession: false } }),
    notifyReady: () => Promise.resolve(mockIpcResult),
    onRequestSync: () => () => {},
    onUpdate: () => () => {},
    onPatch: () => () => {},
  },
  reference: {
    open: () => Promise.resolve(mockIpcResult),
    navigate: () => Promise.resolve(mockIpcResult),
    onNavigate: () => () => {},
  },
  cloud: {
    getMode: () => Promise.resolve({ success: true, mode: 'local' }),
    setMode: () => Promise.resolve({ success: true, mode: 'local' }),
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
  },
  gallery: {
    saveImage: () => Promise.resolve({ ...mockIpcResult, path: '/mock/path.png' }),
    saveQuestReference: () => Promise.resolve({ ...mockIpcResult, path: '/mock/ref.png', id: 'ref-1' }),
    deleteQuestReference: () => Promise.resolve(mockIpcResult),
    listImages: () => Promise.resolve([]),
    readImage: () => Promise.resolve('data:image/png;base64,mock'),
    getLocalMediaUrl: (filepath: string) => Promise.resolve(`file://${filepath}`),
    pickPortraitImage: () => Promise.resolve({ success: true, dataUrl: 'data:image/png;base64,mock' }),
    saveCustomAvatar: () => Promise.resolve({ success: true, path: '/mock/avatar.jpg' }),
    retryUpload: () => Promise.resolve({ success: true }),
    retryAllUploads: () => Promise.resolve({ success: true, uploaded: 0, failed: 0, downloaded: 0, linked: 0, requeued: 0 }),
    sync: () => Promise.resolve({ success: true, uploaded: 0, failed: 0, downloaded: 0, linked: 0, requeued: 0 }),
    onSyncUpdated: () => () => {},
  },
  session: {
    dispatchCommand: () => Promise.resolve(mockIpcResult),
    onCommand: () => () => {},
    onActivityUpdate: () => () => {},
    onTick: () => () => {},
    setTickActive: () => Promise.resolve({ success: true }),
  },
  desktop: {
    activityTrackingNative: true,
    syncSettings: () => Promise.resolve(),
    pickArtAppExecutable: () => Promise.resolve({ success: true, path: 'C:\\Apps\\Krita\\krita.exe' }),
    showTestNotification: () => Promise.resolve({ success: true }),
    setTaskbarProgress: () => Promise.resolve({ success: true }),
    applyWindowBounds: () => Promise.resolve({ success: true }),
    onWindowBoundsReport: () => () => {},
    onNavigate: () => () => {},
    trackTelemetry: () => Promise.resolve({ success: true }),
  },
}

Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true })

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = vi.fn()
}
