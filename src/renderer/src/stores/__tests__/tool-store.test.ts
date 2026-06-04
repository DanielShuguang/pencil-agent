import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToolStore } from '../tool-store'

const mockToolApi = {
  list: vi.fn().mockResolvedValue([]),
}

beforeEach(() => {
  vi.stubGlobal('window', {
    ...window,
    api: { tool: mockToolApi },
  })
  vi.mocked(mockToolApi.list).mockClear().mockResolvedValue([])
  useToolStore.setState({ tools: [] })
})

const sampleTools = [
  { name: 'read_file', description: 'Read a file', parameters: { path: 'string' } },
  {
    name: 'write_file',
    description: 'Write a file',
    parameters: { path: 'string', content: 'string' },
  },
]

describe('tool-store', () => {
  describe('initial state', () => {
    it('should have empty tools', () => {
      expect(useToolStore.getState().tools).toEqual([])
    })
  })

  describe('setTools', () => {
    it('should set tools directly', () => {
      useToolStore.getState().setTools(sampleTools)
      expect(useToolStore.getState().tools).toEqual(sampleTools)
    })

    it('should replace existing tools', () => {
      useToolStore.setState({ tools: sampleTools })
      useToolStore.getState().setTools([sampleTools[0]])
      expect(useToolStore.getState().tools).toHaveLength(1)
    })
  })

  describe('fetchTools', () => {
    it('should fetch tools from API', async () => {
      vi.mocked(mockToolApi.list).mockResolvedValueOnce(sampleTools)

      await useToolStore.getState().fetchTools()

      expect(mockToolApi.list).toHaveBeenCalled()
      expect(useToolStore.getState().tools).toEqual(sampleTools)
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockToolApi.list).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useToolStore.getState().fetchTools()

      expect(useToolStore.getState().tools).toEqual([])
      consoleSpy.mockRestore()
    })
  })
})
