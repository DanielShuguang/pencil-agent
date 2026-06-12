import type { ExtensionFactory, ExtensionAPI } from '@earendil-works/pi-coding-agent'
import type { PermissionManager } from './permission-manager'
import type { AuditLogger } from './audit-logger'
import type { BrowserWindow } from 'electron'
import type { ConfirmRequest, ConfirmResponse } from '@shared/ipc'

// 追踪每个工具调用的开始时间
const toolStartTimes = new Map<string, number>()

// 创建权限控制扩展，注入工具执行拦截
export function createPermissionExtension(
  permissionManager: PermissionManager,
  auditLogger: AuditLogger,
  getMainWindow: () => BrowserWindow | null,
  getSessionId: () => string,
  getSessionCwd: () => string,
): ExtensionFactory {
  return (pi: ExtensionAPI) => {
    pi.on('tool_call', async (event, _ctx) => {
      const toolName = event.toolName
      const parameters = event.input as Record<string, unknown>
      const sessionId = getSessionId()
      const cwd = getSessionCwd()
      const startTime = Date.now()

      toolStartTimes.set(event.toolCallId, startTime)

      try {
        // 检查工具权限
        const { needsConfirm, request } = permissionManager.checkToolPermission(
          toolName,
          parameters,
          sessionId,
          cwd,
        )

        if (needsConfirm && request) {
          // 发送确认请求到渲染进程
          const mainWindow = getMainWindow()
          if (!mainWindow) {
            auditLogger.log({ sessionId, toolName, parameters, status: 'denied', error: 'No window', duration: 0 })
            return { block: true, reason: '无法获取用户确认' }
          }

          const response = await requestConfirmation(mainWindow, request)

          if (!response.allowed) {
            auditLogger.log({ sessionId, toolName, parameters, status: 'denied', error: 'User denied', duration: Date.now() - startTime })
            toolStartTimes.delete(event.toolCallId)
            return { block: true, reason: '用户拒绝执行' }
          }

          // 记住会话级选择
          if (response.rememberSession) {
            permissionManager.rememberSessionChoice(sessionId, toolName, true)
          }
        }

        // 放行执行，在 tool_result 中记录执行结果
        return undefined
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        auditLogger.log({ sessionId, toolName, parameters, status: 'denied', error: errorMessage, duration: Date.now() - startTime })
        toolStartTimes.delete(event.toolCallId)
        return { block: true, reason: errorMessage }
      }
    })

    // 在 tool_result 中记录实际执行结果
    pi.on('tool_result', (event) => {
      const sessionId = getSessionId()
      const startTime = toolStartTimes.get(event.toolCallId)
      const duration = startTime ? Date.now() - startTime : 0
      const parameters = event.input as Record<string, unknown>

      toolStartTimes.delete(event.toolCallId)

      auditLogger.log({
        sessionId,
        toolName: event.toolName,
        parameters,
        status: event.isError ? 'error' : 'success',
        duration,
        error: event.isError ? '工具执行失败' : undefined,
      })
    })
  }
}

// 通过 IPC 请求用户确认
function requestConfirmation(mainWindow: BrowserWindow, request: ConfirmRequest): Promise<ConfirmResponse> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // 30 秒超时自动拒绝
      resolve({ id: request.id, allowed: false })
    }, 30000)

    // 通过 mainWindow 上挂载的确认方法
    const requestFn = (mainWindow as any).__requestConfirm as
      | ((req: ConfirmRequest) => Promise<ConfirmResponse>)
      | undefined

    if (!requestFn) {
      clearTimeout(timeout)
      resolve({ id: request.id, allowed: false })
      return
    }

    requestFn(request)
      .then((response) => {
        clearTimeout(timeout)
        resolve(response)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve({ id: request.id, allowed: false })
      })
  })
}
