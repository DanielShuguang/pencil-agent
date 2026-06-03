import { ipcMain, safeStorage, nativeTheme, type BrowserWindow } from 'electron'
import Store from 'electron-store'
import type { AgentSessionManager } from './session-manager'
import type { ToolRegistry } from './tool-registry'
import { RoleManager } from './role-manager'
import { ModelConfigManager } from './model-config'
import type { ThemeMode } from '@shared/ipc'

const store = new Store()

let roleManager: RoleManager | null = null
function getRoleManager(): RoleManager {
  if (!roleManager) {
    roleManager = new RoleManager()
  }
  return roleManager
}

let modelConfigManager: ModelConfigManager | null = null
function getModelConfigManager(): ModelConfigManager {
  if (!modelConfigManager) {
    modelConfigManager = new ModelConfigManager()
  }
  return modelConfigManager
}

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

  ipcMain.handle('settings:checkConnection', async (_, { provider }: { provider: string }) => {
    try {
      const stored = store.get(`api-keys.${provider}`) as string | undefined
      if (!stored) return false

      let apiKey: string
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(stored, 'base64')
        apiKey = safeStorage.decryptString(buffer)
      } else {
        apiKey = stored
      }

      const url = provider === 'openai'
        ? 'https://api.openai.com/v1/models'
        : provider === 'anthropic'
          ? 'https://api.anthropic.com/v1/messages'
          : null

      if (!url) return false

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      try {
        const headers: Record<string, string> = {}
        if (provider === 'openai') {
          headers['Authorization'] = `Bearer ${apiKey}`
        } else if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey
          headers['anthropic-version'] = '2023-06-01'
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeout)
        return response.ok || response.status === 401
      } catch {
        clearTimeout(timeout)
        return false
      }
    } catch (error) {
      console.error(`Failed to check connection for ${provider}:`, error)
      return false
    }
  })

  // 角色相关 handlers
  ipcMain.handle('role:list', () => {
    return getRoleManager().list()
  })

  ipcMain.handle('role:get', (_, id: string) => {
    return getRoleManager().get(id)
  })

  ipcMain.handle('role:create', (_, role) => {
    return getRoleManager().create(role)
  })

  ipcMain.handle('role:update', (_, { id, updates }: { id: string; updates: Partial<any> }) => {
    return getRoleManager().update(id, updates)
  })

  ipcMain.handle('role:delete', (_, id: string) => {
    return getRoleManager().delete(id)
  })

  // 模型配置相关 handlers
  ipcMain.handle('model-config:list', () => {
    return getModelConfigManager().list()
  })

  ipcMain.handle('model-config:save', (_, provider) => {
    return getModelConfigManager().save(provider)
  })

  ipcMain.handle('model-config:delete', (_, providerId: string) => {
    getModelConfigManager().delete(providerId)
  })

  ipcMain.handle('model-config:test-connection', async (_, { providerId }) => {
    return getModelConfigManager().testConnection(providerId)
  })

  ipcMain.handle('model-config:save-model', (_, { providerId, model }) => {
    getModelConfigManager().saveModel(providerId, model)
  })

  ipcMain.handle('model-config:delete-model', (_, { providerId, modelId }) => {
    getModelConfigManager().deleteModel(providerId, modelId)
  })

  // 主题相关 handlers
  ipcMain.handle('theme:get', () => {
    const mode = store.get('theme.mode', 'system') as string
    const isDark = nativeTheme.shouldUseDarkColors
    const currentThemeId = mode === 'system' ? (isDark ? 'dark' : 'light') : mode
    return { mode, currentThemeId, isDark }
  })

  ipcMain.handle('theme:setMode', (_, mode: ThemeMode) => {
    store.set('theme.mode', mode)
    nativeTheme.themeSource = mode
    const isDark = nativeTheme.shouldUseDarkColors
    const currentThemeId = mode === 'system' ? (isDark ? 'dark' : 'light') : mode
    const state = { mode, currentThemeId, isDark }
    mainWindow.webContents.send('theme:changed', state)
  })

  ipcMain.handle('theme:setTheme', (_, themeId: string) => {
    store.set('theme.mode', themeId)
    nativeTheme.themeSource = themeId as 'light' | 'dark'
    const state = { mode: themeId, currentThemeId: themeId, isDark: themeId === 'dark' }
    mainWindow.webContents.send('theme:changed', state)
  })

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    const mode = store.get('theme.mode', 'system') as string
    if (mode === 'system') {
      const isDark = nativeTheme.shouldUseDarkColors
      const currentThemeId = isDark ? 'dark' : 'light'
      const state = { mode, currentThemeId, isDark }
      mainWindow.webContents.send('theme:changed', state)
    }
  })
}
