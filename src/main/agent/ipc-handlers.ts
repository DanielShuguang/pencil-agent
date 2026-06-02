import { ipcMain, safeStorage, type BrowserWindow } from 'electron'
import Store from 'electron-store'
import type { AgentSessionManager } from './session-manager'
import type { ToolRegistry } from './tool-registry'

const store = new Store()

export function registerAgentHandlers(
  manager: AgentSessionManager,
  mainWindow: BrowserWindow,
  toolRegistry: ToolRegistry,
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

  // 工具相关 handlers
  ipcMain.handle('tool:list', () => {
    return toolRegistry.list()
  })

  ipcMain.handle('tool:get', (_, name: string) => {
    return toolRegistry.get(name)
  })

  // 设置相关 handlers
  ipcMain.handle('settings:save-key', (_, { provider, key }: { provider: string; key: string }) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(key).toString('base64')
        store.set(`api-keys.${provider}`, encrypted)
      } else {
        store.set(`api-keys.${provider}`, key)
      }
    } catch (error) {
      throw new Error(`Failed to save API key: ${error}`)
    }
  })

  ipcMain.handle('settings:get-key', (_, { provider }: { provider: string }) => {
    try {
      const stored = store.get(`api-keys.${provider}`) as string | undefined
      if (!stored) return null

      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(stored, 'base64')
        return safeStorage.decryptString(buffer)
      }
      return stored
    } catch (error) {
      console.error(`Failed to get API key for ${provider}:`, error)
      return null
    }
  })

  ipcMain.handle('settings:delete-key', (_, { provider }: { provider: string }) => {
    try {
      store.delete(`api-keys.${provider}`)
    } catch (error) {
      throw new Error(`Failed to delete API key: ${error}`)
    }
  })
}
