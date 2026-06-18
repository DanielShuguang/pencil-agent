import type { AgentRole, ThemeMode, ToolPermissionConfig, ConfirmRequest, ConfirmResponse } from '@shared/ipc'
import { ipcMain, safeStorage, nativeTheme, dialog, BrowserWindow } from 'electron'
import { access, constants } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { appStore } from '../lib/store'
import type { AgentSessionManager } from './session-manager'
import type { ToolRegistry } from './tool-registry'
import { RoleManager } from './role-manager'
import { ModelConfigManager } from './model-config'
import type { PermissionManager } from './permission-manager'
import type { AuditLogger } from './audit-logger'

const execAsync = promisify(exec)

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
  sharedModelConfigManager?: ModelConfigManager,
  permissionManager?: PermissionManager,
  auditLogger?: AuditLogger,
): void {
  if (sharedModelConfigManager) {
    modelConfigManager = sharedModelConfigManager
  }
  ipcMain.handle('agent:create', async (_, config) => {
    try {
      // 校验目录存在且可读
      await access(config.cwd, constants.R_OK)
      await manager.create(config)
      // 持久化会话 cwd
      appStore.set(`session:${config.sessionId}.cwd`, config.cwd)
      return config.sessionId
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`工作空间不存在：${config.cwd}`)
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new Error(`无权限访问工作空间：${config.cwd}`)
      }
      throw new Error(`Failed to create session: ${error}`)
    }
  })

  ipcMain.on('agent:prompt', async (_, { sessionId, message, model }) => {
    try {
      const cwd = appStore.get(`session:${sessionId}.cwd`) as string | undefined
      for await (const chunk of manager.prompt(sessionId, message, model, cwd)) {
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

  // 目录选择
  ipcMain.handle('dialog:selectDirectory', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) {
      return { canceled: true, filePaths: [] }
    }
    const result = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openDirectory'],
    })
    return result
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
        appStore.set(`api-keys.${provider}`, encrypted)
      } else {
        appStore.set(`api-keys.${provider}`, key)
      }
    } catch (error) {
      throw new Error(`Failed to save API key: ${error}`)
    }
  })

  ipcMain.handle('settings:get-key', (_, { provider }: { provider: string }) => {
    try {
      const stored = appStore.get(`api-keys.${provider}`) as string | undefined
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
      appStore.delete(`api-keys.${provider}`)
    } catch (error) {
      throw new Error(`Failed to delete API key: ${error}`)
    }
  })

  ipcMain.handle('settings:get-masked-key', (_, { provider }: { provider: string }) => {
    try {
      // 首先检查 ModelConfigManager 中的自定义 provider
      const modelConfigApiKey = getModelConfigManager().getApiKey(provider)
      
      if (modelConfigApiKey) {
        const key = modelConfigApiKey
        // 加密显示：前4字符 + *** + 后4字符
        if (key.length <= 8) {
          return '*'.repeat(key.length)
        }
        return `${key.slice(0, 4)  }***${  key.slice(-4)}`
      }

      // 如果 ModelConfigManager 中没有，检查 api-keys 存储
      const stored = appStore.get(`api-keys.${provider}`) as string | undefined
      if (!stored) {
        return null
      }

      let key: string
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(stored, 'base64')
        key = safeStorage.decryptString(buffer)
      } else {
        key = stored
      }

      // 加密显示：前4字符 + *** + 后4字符
      if (key.length <= 8) {
        return '*'.repeat(key.length)
      }
      return `${key.slice(0, 4)  }***${  key.slice(-4)}`
    } catch (error) {
      console.error(`Failed to get masked API key for ${provider}:`, error)
      return null
    }
  })

  ipcMain.handle('settings:checkConnection', async (_, { provider }: { provider: string }) => {
    try {
      // 优先使用 ModelConfigManager 的 testConnection（支持自定义 baseUrl/apiFormat）
      const result = await getModelConfigManager().testConnection(provider)
      if (result.success || result.error !== 'Provider not found') {
        return result.success
      }

      // 兼容旧的 api-keys 存储
      const stored = appStore.get(`api-keys.${provider}`) as string | undefined
      if (!stored) return false

      let apiKey: string
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(stored, 'base64')
        apiKey = safeStorage.decryptString(buffer)
      } else {
        apiKey = stored
      }

      const url =
        provider === 'openai'
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

  ipcMain.handle('role:create', (_, role: Omit<AgentRole, 'createdAt' | 'updatedAt'>) => {
    return getRoleManager().create(role)
  })

  ipcMain.handle(
    'role:update',
    (_, { id, updates }: { id: string; updates: Partial<AgentRole> }) => {
      return getRoleManager().update(id, updates)
    },
  )

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

  ipcMain.handle('model-config:fetch-models', async (_, { providerId }) => {
    return getModelConfigManager().fetchModels(providerId)
  })

  ipcMain.handle('model-config:save-model', (_, { providerId, model }) => {
    getModelConfigManager().saveModel(providerId, model)
  })

  ipcMain.handle('model-config:delete-model', (_, { providerId, modelId }) => {
    getModelConfigManager().deleteModel(providerId, modelId)
  })

  ipcMain.handle('model-config:toggle-visibility', (_, { providerId, modelId }) => {
    getModelConfigManager().toggleModelVisibility(providerId, modelId)
  })

  // 主题相关 handlers
  ipcMain.handle('theme:get', () => {
    const mode = appStore.get('theme.mode', 'system') as string
    const themeId = appStore.get('theme.themeId', '') as string
    const isDark = nativeTheme.shouldUseDarkColors
    const currentThemeId = mode === 'system' ? (isDark ? 'dark' : 'light') : themeId || mode
    return { mode, currentThemeId, isDark }
  })

  ipcMain.handle('theme:setMode', (_, mode: ThemeMode) => {
    appStore.set('theme.mode', mode)
    nativeTheme.themeSource = mode
    const isDark = nativeTheme.shouldUseDarkColors
    const currentThemeId = mode === 'system' ? (isDark ? 'dark' : 'light') : mode
    const state = { mode, currentThemeId, isDark }
    mainWindow.webContents.send('theme:changed', state)
  })

  ipcMain.handle('theme:setTheme', (_, themeId: string) => {
    appStore.set('theme.themeId', themeId)
    nativeTheme.themeSource = themeId as 'light' | 'dark'
    const state = { mode: themeId, currentThemeId: themeId, isDark: themeId === 'dark' }
    mainWindow.webContents.send('theme:changed', state)
  })

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    const mode = appStore.get('theme.mode', 'system') as string
    if (mode === 'system') {
      const isDark = nativeTheme.shouldUseDarkColors
      const currentThemeId = isDark ? 'dark' : 'light'
      const state = { mode, currentThemeId, isDark }
      mainWindow.webContents.send('theme:changed', state)
    }
  })

  // 权限管理 handlers
  if (permissionManager) {
    ipcMain.handle('permission:getConfig', () => {
      return permissionManager.getConfig()
    })

    ipcMain.handle('permission:setConfig', (_, config: Partial<ToolPermissionConfig>) => {
      permissionManager.updateConfig(config)
    })

    // 确认请求-响应机制
    const pendingConfirms = new Map<string, (response: ConfirmResponse) => void>()

    ipcMain.handle('permission:confirm-response', (_, response: ConfirmResponse) => {
      const resolve = pendingConfirms.get(response.id)
      if (resolve) {
        resolve(response)
        pendingConfirms.delete(response.id)
      }
    })

    // 暴露确认请求方法供权限管理器调用
    ;(mainWindow as any).__requestConfirm = (request: ConfirmRequest): Promise<ConfirmResponse> => {
      return new Promise((resolve) => {
        pendingConfirms.set(request.id, resolve)
        mainWindow.webContents.send('permission:confirm-request', request)
      })
    }
  }

  // 审计日志 handlers
  if (auditLogger) {
    ipcMain.handle('audit:getLogs', (_, sessionId: string) => {
      return auditLogger.getLogs(sessionId)
    })

    ipcMain.handle('audit:clearLogs', () => {
      auditLogger.clearAll()
    })
  }

  // 系统字体 handlers
  ipcMain.handle('system:getFonts', async () => {
    try {
      if (process.platform === 'win32') {
        // Windows: 通过注册表获取已安装的字体
        // 同时查询系统级和用户级字体
        const fonts = new Set<string>()

        // 查询两个注册表路径：系统级和用户级
        const regPaths = [
          'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',
          'HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',
        ]

        for (const regPath of regPaths) {
          try {
            // 使用 chcp 65001 切换到 UTF-8 代码页，避免乱码
            const { stdout } = await execAsync(
              `chcp 65001 >nul && reg query "${regPath}"`,
              { encoding: 'buffer' }
            )
            // 将 Buffer 转为 UTF-8 字符串
            const text = Buffer.from(stdout).toString('utf-8')
            for (const line of text.split('\n')) {
              // 匹配注册表格式：字体名称    REG_SZ    文件名
              const match = line.match(/^\s+(.+?)\s+REG_SZ\s+/)
              if (match) {
                let name = match[1].trim()
                // 移除 (TrueType) / (OpenType) 后缀
                name = name.replace(/\s*\(TrueType\)\s*$/i, '').replace(/\s*\(OpenType\)\s*$/i, '')
                if (name && !name.includes('\\') && name.length > 0) {
                  fonts.add(name)
                }
              }
            }
          } catch {
            // 某些注册表路径可能不存在，忽略错误继续
          }
        }
        return Array.from(fonts).sort()
      } else if (process.platform === 'darwin') {
        // macOS: 使用 system_profiler 获取字体
        const { stdout } = await execAsync(
          'system_profiler SPFontsDataType -json 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); fonts=set(); [fonts.add(f[\'_name\'].split(\',\')[0].strip()) for f in data.get(\'SPFontsDataType\',[]) if \'_name\' in f]; print(\'\\n\'.join(sorted(fonts)))"',
          { encoding: 'utf-8' }
        )
        return stdout.split('\n').filter((f) => f.trim().length > 0)
      } else {
        // Linux: 使用 fc-list 获取字体
        const { stdout } = await execAsync('fc-list : family | sort -u', { encoding: 'utf-8' })
        return stdout.split('\n').filter((f) => f.trim().length > 0)
      }
    } catch (error) {
      console.error('Failed to get system fonts:', error)
      return []
    }
  })
}
