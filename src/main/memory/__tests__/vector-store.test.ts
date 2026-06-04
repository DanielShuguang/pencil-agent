import { describe, it, expect, vi, beforeEach } from 'vitest'

const vectorMocks = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockQuery: vi.fn(),
  mockDelete: vi.fn(),
  mockGetOrCreateCollection: vi.fn(),
  mockDeleteCollection: vi.fn(),
}))

vi.mock('chromadb', () => ({
  ChromaClient: function () {
    return {
      getOrCreateCollection: vectorMocks.mockGetOrCreateCollection,
      deleteCollection: vectorMocks.mockDeleteCollection,
    }
  },
}))

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/test-user-data') },
}))

import { VectorStore } from '../vector-store'

describe('VectorStore', () => {
  let store: VectorStore

  beforeEach(() => {
    vi.clearAllMocks()
    store = new VectorStore()

    vectorMocks.mockGetOrCreateCollection.mockResolvedValue({
      add: vectorMocks.mockAdd,
      query: vectorMocks.mockQuery,
      delete: vectorMocks.mockDelete,
    })
  })

  describe('store', () => {
    it('should store a memory entry and return id', async () => {
      const id = await store.store('Hello world', {
        sessionId: 'session-1',
        role: 'user',
        timestamp: 1000,
        tags: ['test'],
      })
      expect(id).toMatch(/^mem-\d+-[a-z0-9]+$/)
      expect(vectorMocks.mockAdd).toHaveBeenCalledWith({
        ids: [id],
        documents: ['Hello world'],
        metadatas: [{ sessionId: 'session-1', role: 'user', timestamp: 1000, tags: ['test'] }],
      })
    })

    it('should throw if not initialized', async () => {
      vectorMocks.mockGetOrCreateCollection.mockRejectedValue(new Error('Init failed'))
      await expect(
        store.store('test', { sessionId: 's1', role: 'user', timestamp: 0, tags: [] }),
      ).rejects.toThrow('Init failed')
    })
  })

  describe('recall', () => {
    it('should recall memories by query', async () => {
      vectorMocks.mockQuery.mockResolvedValue({
        ids: [['mem-1', 'mem-2']],
        documents: [['doc1', 'doc2']],
        metadatas: [
          [
            { sessionId: 's1', role: 'user', timestamp: 1000, tags: ['a'] },
            { sessionId: 's2', role: 'assistant', timestamp: 2000, tags: ['b'] },
          ],
        ],
        distances: [[0.1, 0.2]],
      })

      const results = await store.recall('test query', 5)
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('mem-1')
      expect(results[0].score).toBe(0.1)
    })

    it('should return empty array when no results', async () => {
      vectorMocks.mockQuery.mockResolvedValue({
        ids: [[]],
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      })
      const results = await store.recall('empty', 5)
      expect(results).toEqual([])
    })
  })

  describe('search', () => {
    it('should search with session filter', async () => {
      vectorMocks.mockQuery.mockResolvedValue({
        ids: [['mem-1']],
        documents: [['doc1']],
        metadatas: [[{ sessionId: 's1', role: 'user', timestamp: 1000, tags: [] }]],
        distances: [[0.1]],
      })
      const results = await store.search('query', { sessionId: 's1' })
      expect(results).toHaveLength(1)
    })

    it('should filter by tags when specified', async () => {
      vectorMocks.mockQuery.mockResolvedValue({
        ids: [['mem-1', 'mem-2']],
        documents: [['doc1', 'doc2']],
        metadatas: [
          [
            { sessionId: 's1', role: 'user', timestamp: 1000, tags: ['important'] },
            { sessionId: 's2', role: 'assistant', timestamp: 2000, tags: ['normal'] },
          ],
        ],
        distances: [[0.1, 0.2]],
      })
      const results = await store.search('query', { tags: ['important'] })
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('mem-1')
    })
  })

  describe('delete', () => {
    it('should delete a memory entry by id', async () => {
      await store.delete('mem-1')
      expect(vectorMocks.mockDelete).toHaveBeenCalledWith({ ids: ['mem-1'] })
    })
  })

  describe('clearAll', () => {
    it('should clear all memories', async () => {
      vectorMocks.mockGetOrCreateCollection.mockResolvedValue({
        add: vectorMocks.mockAdd,
        query: vectorMocks.mockQuery,
        delete: vectorMocks.mockDelete,
      })
      await store.clearAll()
      expect(vectorMocks.mockDeleteCollection).toHaveBeenCalledWith({ name: 'agent_memory' })
    })
  })
})
