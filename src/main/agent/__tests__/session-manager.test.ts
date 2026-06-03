import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  mockCreateAgentSession: vi.fn(),
  mockSubscribe: vi.fn(),
  mockPrompt: vi.fn(),
  mockAbort: vi.fn(),
  mockDispose: vi.fn(),
}))

vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: mocks.mockCreateAgentSession,
  AuthStorage: { inMemory: () => ({}) },
  ModelRegistry: { inMemory: () => ({}) },
}))

vi.mock('@earendil-works/pi-ai', () => ({
  getModel: vi.fn(() => ({ id: 'gpt-4', provider: 'openai' })),
}))

import { AgentSessionManager } from '../session-manager'

describe('AgentSessionManager', () => {
  let manager: AgentSessionManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new AgentSessionManager()

    mocks.mockCreateAgentSession.mockResolvedValue({
      session: {
        prompt: mocks.mockPrompt,
        subscribe: mocks.mockSubscribe,
        abort: mocks.mockAbort,
        dispose: mocks.mockDispose,
      },
    })
  })

  describe('create', () => {
    it('should create a new session', async () => {
      await manager.create({
        sessionId: 'session-1',
        model: { id: 'gpt-4', provider: 'openai' },
      })
      expect(mocks.mockCreateAgentSession).toHaveBeenCalledWith({
        model: { id: 'gpt-4', provider: 'openai' },
        authStorage: expect.any(Object),
        modelRegistry: expect.any(Object),
      })
    })

    it('should create multiple sessions', async () => {
      await manager.create({ sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' } })
      await manager.create({ sessionId: 's2', model: { id: 'claude', provider: 'anthropic' } })
      expect(mocks.mockCreateAgentSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('prompt', () => {
    beforeEach(async () => {
      await manager.create({ sessionId: 'session-1', model: { id: 'gpt-4', provider: 'openai' } })
      vi.clearAllMocks()
    })

    it('should throw for non-existent session', async () => {
      const generator = manager.prompt('non-existent', 'hello')
      await expect(generator.next()).rejects.toThrow('Session non-existent not found')
    })

    it('should yield text chunks from session events', async () => {
      const unsubscribe = vi.fn()
      mocks.mockSubscribe.mockReturnValue(unsubscribe)
      mocks.mockPrompt.mockResolvedValue(undefined)

      const generator = manager.prompt('session-1', 'hello')
      const results: string[] = []

      // Consumer: iterate generator
      const consume = (async () => {
        for await (const chunk of generator) {
          results.push(chunk.content)
        }
      })()

      await vi.waitFor(() => expect(mocks.mockSubscribe).toHaveBeenCalled())
      const subscribeCb = mocks.mockSubscribe.mock.calls[0][0]

      // Fire events while generator is waiting
      subscribeCb({ type: 'message_update', message: { role: 'assistant', content: [{ type: 'text', text: 'Hello' }] } })
      null
      subscribeCb({ type: 'message_update', message: { role: 'assistant', content: [{ type: 'text', text: ' World' }] } })
      subscribeCb({ type: 'message_end' })

      await consume
      expect(results).toEqual(['Hello', ' World'])
      expect(mocks.mockPrompt).toHaveBeenCalledWith('hello')
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle agent_end event', async () => {
      mocks.mockSubscribe.mockReturnValue(vi.fn())

      const generator = manager.prompt('session-1', 'hello')
      const results: string[] = []

      const consume = (async () => {
        for await (const chunk of generator) {
          results.push(chunk.content)
        }
      })()

      await vi.waitFor(() => expect(mocks.mockSubscribe).toHaveBeenCalled())
      const subscribeCb = mocks.mockSubscribe.mock.calls[0][0]
      subscribeCb({ type: 'agent_end' })

      await consume
      expect(results).toEqual([])
    })

    it('should call unsubscribe on completion', async () => {
      const unsubscribe = vi.fn()
      mocks.mockSubscribe.mockReturnValue(unsubscribe)

      const generator = manager.prompt('session-1', 'hello')

      const consume = (async () => {
        for await (const _ of generator) { }
      })()

      await vi.waitFor(() => expect(mocks.mockSubscribe).toHaveBeenCalled())
      const subscribeCb = mocks.mockSubscribe.mock.calls[0][0]
      subscribeCb({ type: 'message_end' })

      await consume
      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    beforeEach(async () => {
      await manager.create({ sessionId: 'session-1', model: { id: 'gpt-4', provider: 'openai' } })
    })

    it('should abort the session', async () => {
      await manager.stop('session-1')
      expect(mocks.mockAbort).toHaveBeenCalled()
    })

    it('should not throw for non-existent session', async () => {
      await expect(manager.stop('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('destroy', () => {
    beforeEach(async () => {
      await manager.create({ sessionId: 'session-1', model: { id: 'gpt-4', provider: 'openai' } })
    })

    it('should dispose the session', () => {
      manager.destroy('session-1')
      expect(mocks.mockDispose).toHaveBeenCalled()
    })

    it('should not throw for non-existent session', () => {
      expect(() => manager.destroy('non-existent')).not.toThrow()
    })
  })

  describe('destroyAll', () => {
    it('should destroy all sessions', async () => {
      await manager.create({ sessionId: 's1', model: { id: 'gpt-4', provider: 'openai' } })
      await manager.create({ sessionId: 's2', model: { id: 'claude', provider: 'anthropic' } })
      vi.clearAllMocks()
      mocks.mockDispose.mockClear()

      manager.destroyAll()
      expect(mocks.mockDispose).toHaveBeenCalledTimes(2)
    })
  })
})
