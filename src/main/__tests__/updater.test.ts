import { describe, it, expect, vi, beforeEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()

const { mockAutoUpdater } = vi.hoisted(() => {
  const au = {
    on: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    autoDownload: false,
    autoInstallOnAppQuit: true,
  }
  return { mockAutoUpdater: au }
})

vi.mock('electron-updater', () => ({
  default: { autoUpdater: mockAutoUpdater },
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler)
    }),
  },
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    isPackaged: false,
    getPath: vi.fn(() => '/tmp/test'),
    getName: vi.fn(() => 'pencil-agent'),
  },
  BrowserWindow: vi.fn() as any,
}))

import { Updater } from '../updater'

describe('Updater', () => {
  let mainWindow: any

  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    ;(Updater as any).initialized = false
    mainWindow = { webContents: { send: vi.fn() } }
    new Updater(mainWindow as any)
  })

  it('should set up autoUpdater options on construction', () => {
    expect(mockAutoUpdater.autoDownload).toBe(false)
    expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true)
  })

  it('should register all autoUpdater event handlers', () => {
    const events = mockAutoUpdater.on.mock.calls.map((c: any[]) => c[0])
    expect(events).toContain('checking-for-update')
    expect(events).toContain('update-available')
    expect(events).toContain('update-not-available')
    expect(events).toContain('error')
    expect(events).toContain('download-progress')
    expect(events).toContain('update-downloaded')
  })

  describe('updater:check', () => {
    it('should call checkForUpdates', async () => {
      const handler = ipcHandlers.get('updater:check')!
      mockAutoUpdater.checkForUpdates.mockResolvedValue({ version: '2.0.0' })
      const result = await handler()
      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled()
      expect(result).toEqual({ status: 'ok', result: { version: '2.0.0' } })
    })

    it('should return checking status if already checking', async () => {
      const handler = ipcHandlers.get('updater:check')!

      const checkCb = mockAutoUpdater.on.mock.calls.find(
        (c: any[]) => c[0] === 'checking-for-update',
      )?.[1]
      checkCb?.()

      mockAutoUpdater.checkForUpdates.mockResolvedValue({ version: '2.0.0' })
      const result = await handler()
      expect(result).toEqual({ status: 'checking' })
    })

    it('should return error on failure', async () => {
      const handler = ipcHandlers.get('updater:check')!
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('Network error'))
      const result = await handler()
      expect(result.status).toBe('error')
      expect(result.error).toBe('Network error')
    })
  })

  describe('updater:download', () => {
    it('should call downloadUpdate', async () => {
      const handler = ipcHandlers.get('updater:download')!
      mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined)
      const result = await handler()
      expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalled()
      expect(result).toEqual({ status: 'ok' })
    })

    it('should handle download error', async () => {
      const handler = ipcHandlers.get('updater:download')!
      mockAutoUpdater.downloadUpdate.mockRejectedValue(new Error('Download failed'))
      const result = await handler()
      expect(result.status).toBe('error')
      expect(result.error).toBe('Download failed')
    })
  })

  describe('updater:install', () => {
    it('should call quitAndInstall', () => {
      const handler = ipcHandlers.get('updater:install')!
      handler()
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalledWith(false, true)
    })
  })

  describe('event forwarding', () => {
    it('should forward checking-for-update event', () => {
      const cb = mockAutoUpdater.on.mock.calls.find(
        (c: any[]) => c[0] === 'checking-for-update',
      )?.[1]
      cb?.()
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('updater:status', {
        status: 'checking',
      })
    })

    it('should forward update-available event', () => {
      const cb = mockAutoUpdater.on.mock.calls.find((c: any[]) => c[0] === 'update-available')?.[1]
      cb?.({ version: '2.0.0' })
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('updater:info', {
        status: 'available',
        info: { version: '2.0.0' },
      })
    })

    it('should forward error event', () => {
      const cb = mockAutoUpdater.on.mock.calls.find((c: any[]) => c[0] === 'error')?.[1]
      cb?.({ message: 'Update error' })
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('updater:error', {
        error: 'Update error',
      })
    })

    it('should forward download-progress event', () => {
      const cb = mockAutoUpdater.on.mock.calls.find((c: any[]) => c[0] === 'download-progress')?.[1]
      cb?.({ percent: 50 })
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('updater:progress', { percent: 50 })
    })
  })
})
