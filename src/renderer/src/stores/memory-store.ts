import { create } from 'zustand'
import type { MemoryEntry } from '@shared/ipc'

interface MemoryState {
  memories: MemoryEntry[]
  isLoading: boolean
  searchQuery: string
  searchResults: MemoryEntry[]

  storeMemory: (content: string, metadata: MemoryEntry['metadata']) => Promise<void>
  recallMemory: (query: string, topK?: number) => Promise<void>
  searchMemory: (query: string, filters?: { tags?: string[]; sessionId?: string }) => Promise<void>
  deleteMemory: (id: string) => Promise<void>
  clearAllMemories: () => Promise<void>
  setSearchQuery: (query: string) => void
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  isLoading: false,
  searchQuery: '',
  searchResults: [],

  storeMemory: async (content, metadata) => {
    set({ isLoading: true })
    try {
      await window.api.memory.store(content, metadata)
      const results = await window.api.memory.recall('', 50)
      set({ memories: results, isLoading: false })
    } catch (error) {
      console.error('Failed to store memory:', error)
      set({ isLoading: false })
    }
  },

  recallMemory: async (query, topK = 5) => {
    set({ isLoading: true })
    try {
      const results = await window.api.memory.recall(query, topK)
      set({ memories: results, isLoading: false })
    } catch (error) {
      console.error('Failed to recall memory:', error)
      set({ isLoading: false })
    }
  },

  searchMemory: async (query, filters) => {
    set({ isLoading: true, searchQuery: query })
    try {
      const results = await window.api.memory.search(query, filters)
      set({ searchResults: results, isLoading: false })
    } catch (error) {
      console.error('Failed to search memory:', error)
      set({ isLoading: false })
    }
  },

  deleteMemory: async (id) => {
    try {
      await window.api.memory.delete(id)
      set((state) => ({
        memories: state.memories.filter((m) => m.id !== id),
        searchResults: state.searchResults.filter((m) => m.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  },

  clearAllMemories: async () => {
    set({ isLoading: true })
    try {
      await window.api.memory.clearAll()
      set({ memories: [], searchResults: [], isLoading: false })
    } catch (error) {
      console.error('Failed to clear memories:', error)
      set({ isLoading: false })
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
}))
