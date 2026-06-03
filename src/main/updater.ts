import pkg from 'electron-updater'
const { autoUpdater } = pkg
import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'

export class Updater {
  private static initialized = false

  private mainWindow: BrowserWindow
  private isChecking = false
  private isDownloading = false

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupAutoUpdater()
    if (!Updater.initialized) {
      this.setupIPC()
      Updater.initialized = true
    }
  }

  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
      this.isChecking = true
      this.sendStatus('checking')
    })

    autoUpdater.on('update-available', (info) => {
      this.isChecking = false
      this.sendUpdateInfo('available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      this.isChecking = false
      this.sendUpdateInfo('not-available', info)
    })

    autoUpdater.on('error', (error) => {
      this.isChecking = false
      this.isDownloading = false
      this.sendError(error.message)
    })

    autoUpdater.on('download-progress', (progress) => {
      this.sendProgress(progress)
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.isDownloading = false
      this.sendUpdateInfo('downloaded', info)
    })
  }

  private setupIPC(): void {
    ipcMain.handle('updater:check', async () => {
      if (this.isChecking) return { status: 'checking' }
      try {
        const result = await autoUpdater.checkForUpdates()
        return { status: 'ok', result }
      } catch (error) {
        return { status: 'error', error: (error as Error).message }
      }
    })

    ipcMain.handle('updater:download', async () => {
      if (this.isDownloading) return { status: 'downloading' }
      try {
        this.isDownloading = true
        await autoUpdater.downloadUpdate()
        return { status: 'ok' }
      } catch (error) {
        this.isDownloading = false
        return { status: 'error', error: (error as Error).message }
      }
    })

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall(false, true)
    })

    ipcMain.handle('updater:getStatus', () => {
      return {
        isChecking: this.isChecking,
        isDownloading: this.isDownloading,
      }
    })
  }

  private sendStatus(status: string): void {
    this.mainWindow.webContents.send('updater:status', { status })
  }

  private sendUpdateInfo(status: string, info: object): void {
    this.mainWindow.webContents.send('updater:info', { status, info })
  }

  private sendError(error: string): void {
    this.mainWindow.webContents.send('updater:error', { error })
  }

  private sendProgress(progress: object): void {
    this.mainWindow.webContents.send('updater:progress', progress)
  }
}
