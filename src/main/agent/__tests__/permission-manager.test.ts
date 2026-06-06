import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAppStoreGet, mockAppStoreSet } = vi.hoisted(() => ({
  mockAppStoreGet: vi.fn(() => undefined),
  mockAppStoreSet: vi.fn(),
}))

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/test-user-data') },
}))

vi.mock('../../lib/store', () => ({
  appStore: {
    get: mockAppStoreGet,
    set: mockAppStoreSet,
  },
}))

const { PermissionManager } = await import('../permission-manager')

describe('PermissionManager', () => {
  let manager: InstanceType<typeof PermissionManager>

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppStoreGet.mockReturnValue(undefined)
    manager = new PermissionManager()
  })

  describe('getConfig / updateConfig', () => {
    it('should return default config (smart mode)', () => {
      const config = manager.getConfig()
      expect(config.mode).toBe('smart')
      expect(config.disabledTools).toEqual([])
    })

    it('should update config', () => {
      manager.updateConfig({ mode: 'prompt' })
      expect(manager.getConfig().mode).toBe('prompt')
      expect(mockAppStoreSet).toHaveBeenCalledWith('permission.config', expect.objectContaining({ mode: 'prompt' }))
    })
  })

  describe('isToolDisabled', () => {
    it('should return false for enabled tools', () => {
      expect(manager.isToolDisabled('bash')).toBe(false)
    })

    it('should return true for disabled tools', () => {
      manager.updateConfig({ disabledTools: ['bash'] })
      expect(manager.isToolDisabled('bash')).toBe(true)
    })
  })

  describe('checkPathAccess', () => {
    it('should allow access to work directory', () => {
      const result = manager.checkPathAccess('/home/user/project/file.ts', '/home/user/project')
      expect(result.allowed).toBe(true)
    })

    it('should deny access to .ssh directory', () => {
      const home = process.env.HOME || process.env.USERPROFILE || '/root'
      const result = manager.checkPathAccess(`${home}/.ssh/id_rsa`, '/home/user/project')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('.ssh')
    })

    it('should deny access to /etc', () => {
      const result = manager.checkPathAccess('/etc/passwd', '/home/user/project')
      expect(result.allowed).toBe(false)
    })
  })

  describe('checkToolPermission', () => {
    it('should throw for disabled tools', () => {
      manager.updateConfig({ disabledTools: ['bash'] })
      expect(() => manager.checkToolPermission('bash', { command: 'ls' }, 'session-1', '/tmp')).toThrow(
        '已被禁用',
      )
    })

    it('should not need confirm in auto mode', () => {
      manager.updateConfig({ mode: 'auto' })
      const result = manager.checkToolPermission('bash', { command: 'ls' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(false)
    })

    it('should not need confirm for low-risk tools in smart mode', () => {
      manager.updateConfig({ mode: 'smart' })
      const result = manager.checkToolPermission('read', { path: '/tmp/file.txt' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(false)
    })

    it('should need confirm for bash in smart mode', () => {
      manager.updateConfig({ mode: 'smart' })
      const result = manager.checkToolPermission('bash', { command: 'echo hello' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(true)
      expect(result.request?.riskLevel).toBe('medium')
    })

    it('should need confirm for all tools in prompt mode', () => {
      manager.updateConfig({ mode: 'prompt' })
      const result = manager.checkToolPermission('read', { path: '/tmp/file.txt' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(true)
    })

    it('should detect high-risk bash commands', () => {
      manager.updateConfig({ mode: 'smart' })
      const result = manager.checkToolPermission(
        'bash',
        { command: 'rm -rf /tmp/dir' },
        'session-1',
        '/tmp',
      )
      expect(result.needsConfirm).toBe(true)
      expect(result.request?.riskLevel).toBe('high')
    })

    it('should deny access to sensitive paths', () => {
      manager.updateConfig({ mode: 'auto' })
      expect(() =>
        manager.checkToolPermission('read', { path: '/etc/passwd' }, 'session-1', '/tmp'),
      ).toThrow('禁止访问')
    })
  })

  describe('session memory', () => {
    it('should skip confirm after remembering choice', () => {
      manager.updateConfig({ mode: 'prompt' })
      manager.rememberSessionChoice('session-1', 'bash', true)
      const result = manager.checkToolPermission('bash', { command: 'ls' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(false)
    })

    it('should clear session memory', () => {
      manager.updateConfig({ mode: 'prompt' })
      manager.rememberSessionChoice('session-1', 'bash', true)
      manager.clearSessionMemory('session-1')
      const result = manager.checkToolPermission('bash', { command: 'ls' }, 'session-1', '/tmp')
      expect(result.needsConfirm).toBe(true)
    })
  })
})
