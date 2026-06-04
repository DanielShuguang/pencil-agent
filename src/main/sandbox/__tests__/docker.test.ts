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
  })

  describe('stop', () => {
    it('should not throw when stopping non-existent execution', () => {
      expect(() => sandbox.stop('non-existent')).not.toThrow()
    })
  })
})
