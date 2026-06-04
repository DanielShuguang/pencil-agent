import { describe, it, expect, vi, beforeEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()
const ipcListeners = new Map<string, Function>()
const mockWebContentsSend = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler)
    }),
    on: vi.fn((channel: string, handler: Function) => {
      ipcListeners.set(channel, handler)
    }),
  },
}))

import { registerSandboxHandlers } from '../ipc-handlers'

describe('registerSandboxHandlers', () => {
  let mainWindow: any
  let mockSandbox: any

  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    ipcListeners.clear()
    mainWindow = { webContents: { send: mockWebContentsSend } }
    mockSandbox = { execute: vi.fn(), stop: vi.fn() }
    registerSandboxHandlers(mockSandbox, mainWindow as any)
  })

  describe('sandbox:execute', () => {
    it('should execute code and return result', async () => {
      mockSandbox.execute.mockResolvedValue({
        stdout: 'hello',
        stderr: '',
        exitCode: 0,
        executionId: 'exec-1',
      })
      const result = await ipcHandlers.get('sandbox:execute')!(
        {},
        { code: 'console.log("hi")', language: 'javascript' },
      )
      expect(result.stdout).toBe('hello')
    })

    it('should forward output to renderer', async () => {
      mockSandbox.execute.mockImplementation(async (_req: any, onOutput: Function) => {
        onOutput({ type: 'stdout', content: 'output' })
        return { stdout: 'output', stderr: '', exitCode: 0, executionId: 'exec-1' }
      })
      await ipcHandlers.get('sandbox:execute')!({}, { code: 'test', language: 'javascript' })
      expect(mockWebContentsSend).toHaveBeenCalledWith('sandbox:output', {
        type: 'stdout',
        content: 'output',
      })
    })

    it('should throw on execution failure', async () => {
      mockSandbox.execute.mockRejectedValue(new Error('Execution error'))
      await expect(
        ipcHandlers.get('sandbox:execute')!({}, { code: 'bad code', language: 'javascript' }),
      ).rejects.toThrow('Sandbox execution failed: Error: Execution error')
    })
  })

  describe('sandbox:stop', () => {
    it('should stop execution by id', () => {
      ipcListeners.get('sandbox:stop')!({}, 'exec-1')
      expect(mockSandbox.stop).toHaveBeenCalledWith('exec-1')
    })
  })
})
