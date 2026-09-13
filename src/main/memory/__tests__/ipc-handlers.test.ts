import { describe, it, expect, vi, beforeEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()
const memoryMocks = vi.hoisted(() => ({
  mockStore: vi.fn(),
  mockRecall: vi.fn(),
  mockSearch: vi.fn(),
  mockDeleteFn: vi.fn(),
  mockClearAll: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler)
    }),
  },
}))

vi.mock('../vector-store', () => ({
  VectorStore: function () {
    return {
      store: memoryMocks.mockStore,
      recall: memoryMocks.mockRecall,
      search: memoryMocks.mockSearch,
      delete: memoryMocks.mockDeleteFn,
      clearAll: memoryMocks.mockClearAll,
    }
  },
}))

import { registerMemoryHandlers } from '../ipc-handlers'

describe('registerMemoryHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    registerMemoryHandlers()
  })

  describe('memory:store', () => {
    it('should store memory and return id', async () => {
      memoryMocks.mockStore.mockResolvedValue('mem-1')
      const result = await ipcHandlers.get('memory:store')!(
        {},
        {
          content: 'Hello',
          metadata: { sessionId: 's1', role: 'user', timestamp: 1000, tags: [] },
        },
      )
      expect(result).toBe('mem-1')
      expect(memoryMocks.mockStore).toHaveBeenCalledWith('Hello', {
        sessionId: 's1',
        role: 'user',
        timestamp: 1000,
        tags: [],
      })
    })
  })

  describe('memory:recall', () => {
    it('should recall memories', async () => {
      memoryMocks.mockRecall.mockResolvedValue([{ id: 'mem-1', content: 'doc1', metadata: {} }])
      const result = await ipcHandlers.get('memory:recall')!({}, { query: 'test', topK: 5 })
      expect(result).toEqual([{ id: 'mem-1', content: 'doc1', metadata: {} }])
    })
  })

  describe('memory:delete', () => {
    it('should delete memory by id', async () => {
      await ipcHandlers.get('memory:delete')!({}, 'mem-1')
      expect(memoryMocks.mockDeleteFn).toHaveBeenCalledWith('mem-1')
    })
  })

  describe('memory:clear-all', () => {
    it('should clear all memories', async () => {
      await ipcHandlers.get('memory:clear-all')!({})
      expect(memoryMocks.mockClearAll).toHaveBeenCalled()
    })
  })

  describe('memory:search', () => {
    it('should forward query and filters', async () => {
      memoryMocks.mockSearch.mockResolvedValue([{ id: 'mem-2', content: 'hit', metadata: {} }])

      const result = await ipcHandlers.get('memory:search')!(
        {},
        { query: 'hello', filters: { sessionId: 's1', tags: ['a'] } },
      )

      expect(result).toEqual([{ id: 'mem-2', content: 'hit', metadata: {} }])
      expect(memoryMocks.mockSearch).toHaveBeenCalledWith('hello', {
        sessionId: 's1',
        tags: ['a'],
      })
    })
  })

  describe('错误包装', () => {
    it.each([
      ['memory:store', { content: 'x', metadata: {} }, 'mockStore', 'Failed to store memory'],
      ['memory:recall', { query: 'x' }, 'mockRecall', 'Failed to recall memory'],
      ['memory:search', { query: 'x' }, 'mockSearch', 'Failed to search memory'],
      ['memory:delete', 'mem-1', 'mockDeleteFn', 'Failed to delete memory'],
    ])('%s 失败时抛出带前缀的错误', async (channel, payload, mockName, prefix) => {
      ;(memoryMocks as any)[mockName].mockRejectedValue(new Error('boom'))

      await expect(ipcHandlers.get(channel)!({}, payload)).rejects.toThrow(prefix)
    })

    it('memory:clear-all 失败时抛出带前缀的错误', async () => {
      memoryMocks.mockClearAll.mockRejectedValue(new Error('boom'))

      await expect(ipcHandlers.get('memory:clear-all')!({})).rejects.toThrow(
        'Failed to clear memories',
      )
    })
  })
})
