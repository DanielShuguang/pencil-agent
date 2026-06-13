import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SandboxExecuteRequest } from '@shared/ipc'
import { ChildProcessSandbox } from '../child-process'

vi.mock('@earendil-works/pi-coding-agent', () => {
  return {
    createLocalBashOperations: vi.fn(() => ({
      exec: vi.fn(async (_command: string, _cwd: string, options: any) => {
        // 模拟输出
        if (options.onData) {
          options.onData(Buffer.from('mock output'))
        }
        return { exitCode: 0 }
      }),
    })),
  }
})

vi.mock('crypto', () => {
  const mockRandomUUID = vi.fn(() => 'test-uuid')
  return {
    default: { randomUUID: mockRandomUUID },
    randomUUID: mockRandomUUID,
  }
})

describe('ChildProcessSandbox', () => {
  let sandbox: ChildProcessSandbox

  beforeEach(() => {
    vi.clearAllMocks()
    sandbox = new ChildProcessSandbox()
  })

  describe('execute', () => {
    it('should execute javascript command', async () => {
      const req: SandboxExecuteRequest = { code: 'console.log("hi")', language: 'javascript' }
      const result = await sandbox.execute(req)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('mock output')
      expect(result.executionId).toBe('test-uuid')
    })

    it('should return error for unsupported language', async () => {
      const result = await sandbox.execute({ code: 'test', language: 'ruby' } as any)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unsupported language: ruby')
    })

    it('should call onOutput callback', async () => {
      const onOutput = vi.fn()
      await sandbox.execute({ code: 'output', language: 'javascript' }, onOutput)
      expect(onOutput).toHaveBeenCalledWith({ type: 'stdout', content: 'mock output' })
      expect(onOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 0 })
    })
  })

  describe('stop', () => {
    it('should not throw when stopping non-existent execution', () => {
      expect(() => sandbox.stop('non-existent')).not.toThrow()
    })
  })
})
