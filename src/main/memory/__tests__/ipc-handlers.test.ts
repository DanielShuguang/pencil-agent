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
})
