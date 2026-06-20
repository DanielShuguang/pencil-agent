import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import type { PermissionManager } from '../permission-manager'
import type { AuditLogger } from '../audit-logger'
import type { BrowserWindow } from 'electron'
import type { ConfirmRequest, ConfirmResponse } from '@shared/ipc'

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/test-user-data') },
}))

function createMockPermissionManager(): PermissionManager {
  return {
    checkToolPermission: vi.fn(),
    rememberSessionChoice: vi.fn(),
  } as unknown as PermissionManager
}

function createMockAuditLogger(): AuditLogger {
  return {
    log: vi.fn(),
  } as unknown as AuditLogger
}

function createMockMainWindow(confirmFn?: (req: ConfirmRequest) => Promise<ConfirmResponse>): BrowserWindow {
  const win = {} as BrowserWindow
  if (confirmFn) {
    ;(win as any).__requestConfirm = confirmFn
  }
  return win
}

function createMockExtensionAPI(): ExtensionAPI & { handlers: Record<string, Function> } {
  const handlers: Record<string, Function> = {}
  return {
    handlers,
    on: vi.fn((event: string, handler: Function) => {
      handlers[event] = handler
    }),
  } as unknown as ExtensionAPI & { handlers: Record<string, Function> }
}

describe('createPermissionExtension', () => {
  let permissionManager: ReturnType<typeof createMockPermissionManager>
  let auditLogger: ReturnType<typeof createMockAuditLogger>
  let getMainWindow: () => BrowserWindow | null
  let getSessionId: () => string
  let getSessionCwd: () => string

  beforeEach(async () => {
    vi.clearAllMocks()
    permissionManager = createMockPermissionManager()
    auditLogger = createMockAuditLogger()
    getMainWindow = () => createMockMainWindow()
    getSessionId = () => 'test-session'
    getSessionCwd = () => '/tmp/workspace'
  })

  async function createExtension() {
    const { createPermissionExtension } = await import('../permission-extension')
    return createPermissionExtension(
      permissionManager,
      auditLogger,
      getMainWindow,
      getSessionId,
      getSessionCwd,
    )
  }

  describe('extension factory', () => {
    it('should register tool_call and tool_result handlers', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)
      expect(api.on).toHaveBeenCalledWith('tool_call', expect.any(Function))
      expect(api.on).toHaveBeenCalledWith('tool_result', expect.any(Function))
    })
  })

  describe('tool_call handler', () => {
    it('should allow execution when no confirmation needed', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: false,
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-1' },
        { cwd: '/tmp/workspace' },
      )

      expect(result).toBeUndefined()
      expect(permissionManager.checkToolPermission).toHaveBeenCalledWith(
        'read',
        { path: '/tmp/file.txt' },
        'test-session',
        '/tmp/workspace',
      )
    })

    it('should use ctx.cwd over getSessionCwd', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })

      await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-1' },
        { cwd: '/custom/cwd' },
      )

      expect(permissionManager.checkToolPermission).toHaveBeenCalledWith(
        'read',
        { path: '/tmp/file.txt' },
        'test-session',
        '/custom/cwd',
      )
    })

    it('should fallback to getSessionCwd when ctx.cwd is empty', async () => {
      const getSessionCwdFn = vi.fn(() => '/fallback/cwd')
      const { createPermissionExtension } = await import('../permission-extension')
      const ext = createPermissionExtension(
        permissionManager, auditLogger, getMainWindow, getSessionId, getSessionCwdFn,
      )
      const api = createMockExtensionAPI()
      ext(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })

      await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-1' },
        { cwd: '' },
      )

      expect(getSessionCwdFn).toHaveBeenCalled()
    })

    it('should block when window is null and confirmation needed', async () => {
      getMainWindow = () => null
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(result).toEqual({ block: true, reason: '无法获取用户确认' })
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'denied', error: 'No window' }),
      )
    })

    it('should block when user denies', async () => {
      const confirmFn = vi.fn().mockResolvedValue({ id: 'req-1', allowed: false })
      getMainWindow = () => createMockMainWindow(confirmFn)
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'rm -rf /tmp' }, riskLevel: 'high' },
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'rm -rf /tmp' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(result).toEqual({ block: true, reason: '用户拒绝执行' })
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'denied', error: 'User denied' }),
      )
    })

    it('should remember session choice when rememberSession is true', async () => {
      const confirmFn = vi.fn().mockResolvedValue({ id: 'req-1', allowed: true, rememberSession: true })
      getMainWindow = () => createMockMainWindow(confirmFn)
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(permissionManager.rememberSessionChoice).toHaveBeenCalledWith('test-session', 'bash', true)
    })

    it('should not remember session choice when rememberSession is false', async () => {
      const confirmFn = vi.fn().mockResolvedValue({ id: 'req-1', allowed: true, rememberSession: false })
      getMainWindow = () => createMockMainWindow(confirmFn)
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(permissionManager.rememberSessionChoice).not.toHaveBeenCalled()
    })

    it('should block and log when checkToolPermission throws', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockImplementation(() => {
        throw new Error('工具已被禁用')
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(result).toEqual({ block: true, reason: '工具已被禁用' })
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'denied', error: '工具已被禁用' }),
      )
    })

    it('should block and log when requestConfirmation throws', async () => {
      const confirmFn = vi.fn().mockRejectedValue(new Error('IPC failed'))
      getMainWindow = () => createMockMainWindow(confirmFn)
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      // requestConfirmation catches errors and resolves with allowed: false
      expect(result).toEqual({ block: true, reason: '用户拒绝执行' })
    })

    it('should block when __requestConfirm is not mounted on window', async () => {
      getMainWindow = () => createMockMainWindow() // no confirmFn
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      const result = await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      expect(result).toEqual({ block: true, reason: '用户拒绝执行' })
    })

    it('should block when confirmation times out (30s)', async () => {
      vi.useFakeTimers()
      const confirmFn = vi.fn(() => new Promise<ConfirmResponse>(() => {})) // never resolves
      getMainWindow = () => createMockMainWindow(confirmFn)
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({
        needsConfirm: true,
        request: { id: 'req-1', toolName: 'bash', parameters: { command: 'ls' }, riskLevel: 'medium' },
      })

      const resultPromise = api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'ls' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      await vi.advanceTimersByTimeAsync(30000)

      const result = await resultPromise
      expect(result).toEqual({ block: true, reason: '用户拒绝执行' })

      vi.useRealTimers()
    })
  })

  describe('tool_result handler', () => {
    it('should log successful execution', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      // 先触发 tool_call 以记录 startTime
      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })
      await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-1' },
        { cwd: '/tmp' },
      )

      // 触发 tool_result
      api.handlers['tool_result'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-1', isError: false },
        {},
      )

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session',
          toolName: 'read',
          status: 'success',
          error: undefined,
        }),
      )
    })

    it('should log error execution', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      // 先触发 tool_call
      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })
      await api.handlers['tool_call'](
        { toolName: 'bash', input: { command: 'fail' }, toolCallId: 'call-2' },
        { cwd: '/tmp' },
      )

      // 触发 tool_result with error
      api.handlers['tool_result'](
        { toolName: 'bash', input: { command: 'fail' }, toolCallId: 'call-2', isError: true },
        {},
      )

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: '工具执行失败',
        }),
      )
    })

    it('should calculate duration correctly', async () => {
      vi.useFakeTimers()
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })

      await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-3' },
        { cwd: '/tmp' },
      )

      vi.advanceTimersByTime(500)

      api.handlers['tool_result'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-3', isError: false },
        {},
      )

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 500 }),
      )

      vi.useRealTimers()
    })

    it('should handle tool_result without prior tool_call', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      api.handlers['tool_result'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'unknown-call', isError: false },
        {},
      )

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 0 }),
      )
    })

    it('should clean up toolStartTimes after tool_result', async () => {
      const factory = await createExtension()
      const api = createMockExtensionAPI()
      factory(api as any)

      vi.mocked(permissionManager.checkToolPermission).mockReturnValue({ needsConfirm: false })

      await api.handlers['tool_call'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-cleanup' },
        { cwd: '/tmp' },
      )

      api.handlers['tool_result'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-cleanup', isError: false },
        {},
      )

      // 再次触发 tool_result 应该 duration=0（因为 startTime 已被清理）
      api.handlers['tool_result'](
        { toolName: 'read', input: { path: '/tmp/file.txt' }, toolCallId: 'call-cleanup', isError: false },
        {},
      )

      expect(auditLogger.log).toHaveBeenLastCalledWith(
        expect.objectContaining({ duration: 0 }),
      )
    })
  })
})
