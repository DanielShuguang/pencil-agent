import { describe, it, expect, vi } from 'vitest'

const factoryMocks = vi.hoisted(() => ({
  mockIsAvailable: vi.fn(),
}))

vi.mock('../docker', () => ({
  DockerSandbox: function () {
    return { isAvailable: factoryMocks.mockIsAvailable, execute: vi.fn(), stop: vi.fn() }
  },
}))

vi.mock('../child-process', () => ({
  ChildProcessSandbox: function () {
    return { execute: vi.fn(), stop: vi.fn() }
  },
}))

import { createSandboxExecutor } from '../factory'

describe('createSandboxExecutor', () => {
  it('should return DockerSandbox when docker is available', async () => {
    factoryMocks.mockIsAvailable.mockResolvedValue(true)
    const executor = await createSandboxExecutor()
    expect(executor).toHaveProperty('execute')
    expect(executor).toHaveProperty('stop')
    expect(executor).toHaveProperty('isAvailable')
  })

  it('should fallback to ChildProcessSandbox when docker is unavailable', async () => {
    factoryMocks.mockIsAvailable.mockResolvedValue(false)
    const executor = await createSandboxExecutor()
    expect(executor).toHaveProperty('execute')
    expect(executor).toHaveProperty('stop')
    expect(executor).not.toHaveProperty('isAvailable')
  })

  it('should fallback to ChildProcessSandbox when docker check throws', async () => {
    factoryMocks.mockIsAvailable.mockRejectedValue(new Error('Docker error'))
    const executor = await createSandboxExecutor()
    expect(executor).toHaveProperty('execute')
    expect(executor).toHaveProperty('stop')
    expect(executor).not.toHaveProperty('isAvailable')
  })
})
