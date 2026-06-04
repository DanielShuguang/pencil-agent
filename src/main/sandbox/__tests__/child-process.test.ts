import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SandboxExecuteRequest } from '@shared/ipc'
import { ChildProcessSandbox } from '../child-process'

vi.mock('child_process', () => {
  const mockSpawn = vi.fn()
  return {
    default: { spawn: mockSpawn },
    spawn: mockSpawn,
  }
})

vi.mock('crypto', () => {
  const mockRandomUUID = vi.fn(() => 'test-uuid')
  return {
    default: { randomUUID: mockRandomUUID },
    randomUUID: mockRandomUUID,
  }
})

import { spawn } from 'child_process'

describe('ChildProcessSandbox', () => {
  let sandbox: ChildProcessSandbox

  beforeEach(() => {
    vi.clearAllMocks()
    sandbox = new ChildProcessSandbox()
  })

  function mockChildProcess() {
    const mockStdout = { on: vi.fn() }
    const mockStderr = { on: vi.fn() }
    const mockChild = { stdout: mockStdout, stderr: mockStderr, kill: vi.fn(), on: vi.fn() }
    ;(spawn as any).mockReturnValue(mockChild)
    return { mockChild, mockStdout, mockStderr }
  }

  describe('execute', () => {
    it('should spawn child process for javascript', async () => {
      const { mockChild } = mockChildProcess()
      const req: SandboxExecuteRequest = { code: 'console.log("hi")', language: 'javascript' }
      const promise = sandbox.execute(req)
      const closeCb = mockChild.on.mock.calls.find((c: any[]) => c[0] === 'close')![1]
      closeCb(0)
      const result = await promise
      expect(spawn).toHaveBeenCalledWith('node', ['-e', 'console.log("hi")'], expect.any(Object))
      expect(result.exitCode).toBe(0)
      expect(result.executionId).toBe('test-uuid')
    })

    it('should throw for unsupported language', async () => {
      await expect(sandbox.execute({ code: 'test', language: 'ruby' } as any)).rejects.toThrow(
        'Unsupported language: ruby',
      )
    })

    it('should capture stdout content', async () => {
      const { mockChild, mockStdout } = mockChildProcess()
      const promise = sandbox.execute({ code: 'console.log("hello")', language: 'javascript' })
      const stdoutCb = mockStdout.on.mock.calls.find((c: any[]) => c[0] === 'data')![1]
      stdoutCb(Buffer.from('hello\n'))
      const closeCb = mockChild.on.mock.calls.find((c: any[]) => c[0] === 'close')![1]
      closeCb(0)
      const result = await promise
      expect(result.stdout).toBe('hello\n')
    })

    it('should call onOutput callback', async () => {
      const { mockChild, mockStdout } = mockChildProcess()
      const onOutput = vi.fn()
      const promise = sandbox.execute({ code: 'output', language: 'javascript' }, onOutput)
      const stdoutCb = mockStdout.on.mock.calls.find((c: any[]) => c[0] === 'data')![1]
      stdoutCb(Buffer.from('test output'))
      const closeCb = mockChild.on.mock.calls.find((c: any[]) => c[0] === 'close')![1]
      closeCb(0)
      await promise
      expect(onOutput).toHaveBeenCalledWith({ type: 'stdout', content: 'test output' })
      expect(onOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 0 })
    })

    it('should handle child process error', async () => {
      const { mockChild } = mockChildProcess()
      const promise = sandbox.execute({ code: 'error', language: 'javascript' })
      const errorCb = mockChild.on.mock.calls.find((c: any[]) => c[0] === 'error')![1]
      errorCb(new Error('Process error'))
      const result = await promise
      expect(result.stderr).toBe('Process error')
      expect(result.exitCode).toBe(1)
    })
  })

  describe('stop', () => {
    it('should kill a running process', async () => {
      const { mockChild } = mockChildProcess()
      const promise = sandbox.execute({ code: 'test', language: 'javascript' })
      sandbox.stop('test-uuid')
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM')
      const closeCb = mockChild.on.mock.calls.find((c: any[]) => c[0] === 'close')![1]
      closeCb(0)
      await promise
    })

    it('should not throw when stopping non-existent execution', () => {
      expect(() => sandbox.stop('non-existent')).not.toThrow()
    })
  })
})
