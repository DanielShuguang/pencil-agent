import { describe, it, expect, vi, beforeEach } from 'vitest'

const dockerMocks = vi.hoisted(() => ({
  mockPing: vi.fn(),
  mockCreateContainer: vi.fn(),
  mockGetContainer: vi.fn(),
}))

vi.mock('dockerode', () => ({
  default: function () {
    return {
      ping: dockerMocks.mockPing,
      createContainer: dockerMocks.mockCreateContainer,
      getContainer: dockerMocks.mockGetContainer,
    }
  },
}))

vi.mock('crypto', () => {
  const mockRandomUUID = vi.fn(() => 'test-uuid')
  return {
    randomUUID: mockRandomUUID,
    default: { randomUUID: mockRandomUUID },
  }
})

import { DockerSandbox } from '../docker'

describe('DockerSandbox', () => {
  let sandbox: DockerSandbox

  function mockContainer() {
    const container = {
      id: 'container-1',
      start: vi.fn(),
      attach: vi.fn(),
      kill: vi.fn(),
      wait: vi.fn(),
    }
    dockerMocks.mockCreateContainer.mockResolvedValue(container)
    return container
  }

  beforeEach(() => {
    vi.clearAllMocks()
    sandbox = new DockerSandbox()
  })

  describe('isAvailable', () => {
    it('should return true when docker is available', async () => {
      dockerMocks.mockPing.mockResolvedValue(undefined)
      expect(await sandbox.isAvailable()).toBe(true)
    })

    it('should return false when docker is not available', async () => {
      dockerMocks.mockPing.mockRejectedValue(new Error('Docker not running'))
      expect(await sandbox.isAvailable()).toBe(false)
    })
  })

  describe('execute', () => {
    it('should create and start a container', async () => {
      const container = mockContainer()
      const promise = sandbox.execute({ code: 'console.log("hi")', language: 'javascript' })

      await vi.waitFor(() => {
        expect(container.attach).toHaveBeenCalled()
      })

      expect(dockerMocks.mockCreateContainer).toHaveBeenCalledWith({
        Image: 'node:22-slim',
        Cmd: ['node', '-e', 'console.log("hi")'],
        HostConfig: {
          Memory: 268435456,
          CpuQuota: 50000,
          NetworkMode: 'none',
          AutoRemove: true,
          ReadonlyRootfs: true,
        },
        Env: [],
        StopTimeout: 30,
      })

      const attachCb = container.attach.mock.calls[0][1]
      attachCb(null, { on: vi.fn() })

      expect(container.wait).toHaveBeenCalled()
      const waitCb = container.wait.mock.calls[0][0]
      waitCb(null, { StatusCode: 0 })
      const result = await promise
      expect(result.exitCode).toBe(0)
    })

    it('should handle attach error', async () => {
      const container = mockContainer()
      const promise = sandbox.execute({ code: 'test', language: 'javascript' })

      await vi.waitFor(() => {
        expect(container.attach).toHaveBeenCalled()
      })

      const attachCb = container.attach.mock.calls[0][1]
      attachCb(new Error('Attach error'), null)
      const result = await promise
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toBe('Attach error')
    })

    it('should call onOutput callback', async () => {
      const container = mockContainer()
      const onOutput = vi.fn()
      const promise = sandbox.execute({ code: 'test', language: 'javascript' }, onOutput)

      await vi.waitFor(() => {
        expect(container.attach).toHaveBeenCalled()
      })

      const attachCb = container.attach.mock.calls[0][1]
      const stream = { on: vi.fn() }
      attachCb(null, stream)
      const header = Buffer.alloc(7, 0)
      const dataCb = stream.on.mock.calls.find((c: any[]) => c[0] === 'data')![1]
      dataCb(Buffer.concat([Buffer.from([1]), header, Buffer.from('output')]))

      expect(container.wait).toHaveBeenCalled()
      const waitCb = container.wait.mock.calls[0][0]
      waitCb(null, { StatusCode: 0 })
      await promise
      expect(onOutput).toHaveBeenCalledWith({ type: 'stdout', content: 'output' })
    })

    it('should pass env vars to the container', async () => {
      mockContainer()
      const promise = sandbox.execute({
        code: 'test',
        language: 'javascript',
        env: { FOO: 'bar', BAZ: '1' },
      })

      await vi.waitFor(() => {
        expect(dockerMocks.mockCreateContainer).toHaveBeenCalled()
      })

      expect(dockerMocks.mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({ Env: ['FOO=bar', 'BAZ=1'] }),
      )
      // 收尾，避免挂起的 promise
      const container = await dockerMocks.mockCreateContainer.mock.results[0].value
      container.attach.mock.calls[0][1](null, { on: vi.fn() })
      container.wait.mock.calls[0][0](null, { StatusCode: 0 })
      await promise
    })

    it('should route stderr multiplexed frames to onOutput', async () => {
      const container = mockContainer()
      const onOutput = vi.fn()
      const promise = sandbox.execute({ code: 'test', language: 'javascript' }, onOutput)

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      const stream = { on: vi.fn() }
      container.attach.mock.calls[0][1](null, stream)
      const dataCb = stream.on.mock.calls.find((c: any[]) => c[0] === 'data')![1]

      const header = Buffer.alloc(7, 0)
      dataCb(Buffer.concat([Buffer.from([2]), header, Buffer.from('boom')]))
      dataCb(Buffer.from('plain output'))

      container.wait.mock.calls[0][0](null, { StatusCode: 0 })
      const result = await promise

      expect(result.stderr).toBe('boom')
      expect(result.stdout).toBe('plain output')
      expect(onOutput).toHaveBeenCalledWith({ type: 'stderr', content: 'boom' })
      expect(onOutput).toHaveBeenCalledWith({ type: 'stdout', content: 'plain output' })
    })

    it('should report exit event with container status code', async () => {
      const container = mockContainer()
      const onOutput = vi.fn()
      const promise = sandbox.execute({ code: 'test', language: 'python' }, onOutput)

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      container.attach.mock.calls[0][1](null, { on: vi.fn() })
      container.wait.mock.calls[0][0](null, { StatusCode: 3 })

      await promise

      expect(onOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 3 })
    })

    it('should fall back to exit code 1 when wait returns no result', async () => {
      const container = mockContainer()
      const promise = sandbox.execute({ code: 'test', language: 'bash' })

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      container.attach.mock.calls[0][1](null, { on: vi.fn() })
      container.wait.mock.calls[0][0](null, undefined)

      const result = await promise
      expect(result.exitCode).toBe(1)
    })

    it('should kill the container and resolve 124 on timeout', async () => {
      vi.useFakeTimers()
      const container = mockContainer()
      container.kill.mockResolvedValue(undefined)
      const onOutput = vi.fn()
      const promise = sandbox.execute(
        { code: 'test', language: 'javascript', timeout: 30000 },
        onOutput,
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(container.attach).toHaveBeenCalled()
      container.attach.mock.calls[0][1](null, { on: vi.fn() })

      await vi.advanceTimersByTimeAsync(30000)
      const result = await promise

      expect(container.kill).toHaveBeenCalled()
      expect(result.exitCode).toBe(124)
      expect(result.stderr).toContain('[超时]')
      expect(onOutput).toHaveBeenCalledWith({ type: 'exit', content: '', exitCode: 124 })
      vi.useRealTimers()
    })

    it('should compute StopTimeout from the requested timeout', async () => {
      const container = mockContainer()
      const promise = sandbox.execute({ code: 'test', language: 'javascript', timeout: 10000 })

      await vi.waitFor(() => expect(dockerMocks.mockCreateContainer).toHaveBeenCalled())
      expect(dockerMocks.mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({ StopTimeout: 10 }),
      )

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      container.attach.mock.calls[0][1](null, { on: vi.fn() })
      container.wait.mock.calls[0][0](null, { StatusCode: 0 })
      await promise
    })

    it.each([
      ['typescript', 'node:22-slim', ['npx', 'tsx', '-e', 'test']],
      ['python', 'python:3.12-slim', ['python3', '-c', 'test']],
      ['bash', 'ubuntu:24.04', ['bash', '-c', 'test']],
    ])('should map %s to the right image and command', async (language, image, cmd) => {
      const container = mockContainer()
      const promise = sandbox.execute({ code: 'test', language: language as never })

      await vi.waitFor(() => expect(dockerMocks.mockCreateContainer).toHaveBeenCalled())
      expect(dockerMocks.mockCreateContainer).toHaveBeenCalledWith(
        expect.objectContaining({ Image: image, Cmd: cmd }),
      )

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      container.attach.mock.calls[0][1](null, { on: vi.fn() })
      container.wait.mock.calls[0][0](null, { StatusCode: 0 })
      await promise
    })

    it('should reject unsupported languages', async () => {
      await expect(sandbox.execute({ code: 'test', language: 'ruby' as never })).rejects.toThrow(
        'Unsupported language: ruby',
      )
      expect(dockerMocks.mockCreateContainer).not.toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should not throw when stopping non-existent execution', () => {
      expect(() => sandbox.stop('non-existent')).not.toThrow()
    })

    it('should kill the running container and forget it', async () => {
      const container = mockContainer()
      const kill = vi.fn().mockResolvedValue(undefined)
      dockerMocks.mockGetContainer.mockReturnValue({ kill })
      const promise = sandbox.execute({ code: 'test', language: 'javascript' })

      await vi.waitFor(() => expect(container.attach).toHaveBeenCalled())
      container.attach.mock.calls[0][1](null, { on: vi.fn() })

      sandbox.stop('test-uuid')

      expect(dockerMocks.mockGetContainer).toHaveBeenCalledWith('container-1')
      expect(kill).toHaveBeenCalled()

      // 已停止的执行不再触发超时清理
      container.wait.mock.calls[0][0](null, { StatusCode: 0 })
      await promise
    })
  })
})
