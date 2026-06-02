import { ipcMain, type BrowserWindow } from 'electron'
import type { AgentSessionManager } from './session-manager'

export function registerAgentHandlers(
  manager: AgentSessionManager,
  mainWindow: BrowserWindow,
): void {
  ipcMain.handle('agent:create', async (_, config) => {
    try {
      await manager.create(config)
      return config.sessionId
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`)
    }
  })

  ipcMain.on('agent:prompt', async (_, { sessionId, message }) => {
    try {
      for await (const chunk of manager.prompt(sessionId, message)) {
        mainWindow.webContents.send('agent:chunk', chunk)
      }
      mainWindow.webContents.send('agent:done')
    } catch (error) {
      mainWindow.webContents.send('agent:error', String(error))
    }
  })

  ipcMain.on('agent:stop', async (_, sessionId) => {
    try {
      await manager.stop(sessionId)
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  })
}
