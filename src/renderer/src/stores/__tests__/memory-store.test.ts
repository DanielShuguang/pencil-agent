import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMemoryStore } from '../memory-store'

const mockMemoryApi = {
  store: vi.fn().mockResolvedValue(undefined),
  recall: vi.fn().mockResolvedValue([]),
  search: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
  clearAll: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.stubGlobal('window', {
    ...window,
    api: { memory: mockMemoryApi },
  })
  vi.mocked(mockMemoryApi.store).mockClear().mockResolvedValue(undefined)
  vi.mocked(mockMemoryApi.recall).mockClear().mockResolvedValue([])
  vi.mocked(mockMemoryApi.search).mockClear().mockResolvedValue([])
  vi.mocked(mockMemoryApi.delete).mockClear().mockResolvedValue(undefined)
  vi.mocked(mockMemoryApi.clearAll).mockClear().mockResolvedValue(undefined)
  useMemoryStore.setState({
    memories: [],
    isLoading: false,
    searchQuery: '',
    searchResults: [],
  })
})

const sampleEntry = {
  id: 'mem-1',
  content: 'test content',
  metadata: {
    tags: ['test'],
    sessionId: 's1',
    role: 'user',
    timestamp: Date.now(),
  },
}

describe('memory-store', () => {
  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useMemoryStore.getState()
      expect(state.memories).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.searchQuery).toBe('')
      expect(state.searchResults).toEqual([])
    })
  })

  describe('storeMemory', () => {
    it('should call memory.api.store and refresh list', async () => {
      vi.mocked(mockMemoryApi.recall).mockResolvedValueOnce([sampleEntry])

      await useMemoryStore
        .getState()
        .storeMemory('test content', { tags: ['test'], sessionId: 's1', role: 'user', timestamp: Date.now() })

      expect(mockMemoryApi.store).toHaveBeenCalledWith('test content', {
        tags: ['test'],
        sessionId: 's1',
        role: 'user',
        timestamp: expect.any(Number),
      })
      expect(mockMemoryApi.recall).toHaveBeenCalledWith('', 50)

      const state = useMemoryStore.getState()
      expect(state.memories).toEqual([sampleEntry])
      expect(state.isLoading).toBe(false)
    })

    it('should set isLoading during operation', async () => {
      let resolveStore: () => void
      vi.mocked(mockMemoryApi.store).mockReturnValueOnce(
        new Promise<void>((r) => {
          resolveStore = r
        }),
      )
      vi.mocked(mockMemoryApi.recall).mockResolvedValueOnce([])

      const promise = useMemoryStore
        .getState()
        .storeMemory('content', { tags: [], sessionId: 's1', role: 'user', timestamp: Date.now() })
      expect(useMemoryStore.getState().isLoading).toBe(true)

      resolveStore!()
      await promise
      expect(useMemoryStore.getState().isLoading).toBe(false)
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockMemoryApi.store).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useMemoryStore.getState().storeMemory('content', { tags: [], sessionId: 's1', role: 'user', timestamp: Date.now() })

      expect(useMemoryStore.getState().isLoading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('recallMemory', () => {
    it('should recall memories with query and topK', async () => {
      vi.mocked(mockMemoryApi.recall).mockResolvedValueOnce([sampleEntry])

      await useMemoryStore.getState().recallMemory('query', 10)

      expect(mockMemoryApi.recall).toHaveBeenCalledWith('query', 10)
      expect(useMemoryStore.getState().memories).toEqual([sampleEntry])
    })

    it('should use default topK of 5', async () => {
      await useMemoryStore.getState().recallMemory('query')
      expect(mockMemoryApi.recall).toHaveBeenCalledWith('query', 5)
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockMemoryApi.recall).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useMemoryStore.getState().recallMemory('query')

      expect(useMemoryStore.getState().isLoading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('searchMemory', () => {
    it('should search with query and filters', async () => {
      vi.mocked(mockMemoryApi.search).mockResolvedValueOnce([sampleEntry])

      await useMemoryStore.getState().searchMemory('search term', { tags: ['test'] })

      expect(mockMemoryApi.search).toHaveBeenCalledWith('search term', { tags: ['test'] })
      expect(useMemoryStore.getState().searchResults).toEqual([sampleEntry])
      expect(useMemoryStore.getState().searchQuery).toBe('search term')
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockMemoryApi.search).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useMemoryStore.getState().searchMemory('query')

      expect(useMemoryStore.getState().isLoading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('deleteMemory', () => {
    it('should delete memory and remove from lists', async () => {
      useMemoryStore.setState({
        memories: [sampleEntry],
        searchResults: [sampleEntry],
      })

      await useMemoryStore.getState().deleteMemory('mem-1')

      expect(mockMemoryApi.delete).toHaveBeenCalledWith('mem-1')
      expect(useMemoryStore.getState().memories).toEqual([])
      expect(useMemoryStore.getState().searchResults).toEqual([])
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockMemoryApi.delete).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useMemoryStore.getState().deleteMemory('mem-1')

      consoleSpy.mockRestore()
    })
  })

  describe('clearAllMemories', () => {
    it('should clear all memories', async () => {
      useMemoryStore.setState({
        memories: [sampleEntry],
        searchResults: [sampleEntry],
      })

      await useMemoryStore.getState().clearAllMemories()

      expect(mockMemoryApi.clearAll).toHaveBeenCalled()
      expect(useMemoryStore.getState().memories).toEqual([])
      expect(useMemoryStore.getState().searchResults).toEqual([])
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockMemoryApi.clearAll).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useMemoryStore.getState().clearAllMemories()

      expect(useMemoryStore.getState().isLoading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      useMemoryStore.getState().setSearchQuery('new query')
      expect(useMemoryStore.getState().searchQuery).toBe('new query')
    })
  })
})
