import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupAgentListeners, cleanup } from '../ipc-client'

const mockOnChunk = vi.fn().mockReturnValue(vi.fn())
const mockOnDone = vi.fn().mockReturnValue(vi.fn())
const mockOnError = vi.fn().mockReturnValue(vi.fn())

beforeEach(() => {
  vi.resetModules()
  cleanup()
  vi.stubGlobal('window', {
    ...window,
    api: {
      agent: {
        onChunk: mockOnChunk,
        onDone: mockOnDone,
        onError: mockOnError,
      },
    },
  })
  vi.mocked(mockOnChunk).mockClear().mockReturnValue(vi.fn())
  vi.mocked(mockOnDone).mockClear().mockReturnValue(vi.fn())
  vi.mocked(mockOnError).mockClear().mockReturnValue(vi.fn())
})

describe('ipc-client', () => {
  describe('setupAgentListeners', () => {
    it('should register onChunk, onDone, onError listeners', () => {
      setupAgentListeners()

      expect(mockOnChunk).toHaveBeenCalledTimes(1)
      expect(mockOnDone).toHaveBeenCalledTimes(1)
      expect(mockOnError).toHaveBeenCalledTimes(1)
    })

    it('should clean up existing listeners before re-registering', () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()
      const cleanup3 = vi.fn()

      vi.mocked(mockOnChunk).mockReturnValueOnce(cleanup1)
      vi.mocked(mockOnDone).mockReturnValueOnce(cleanup2)
      vi.mocked(mockOnError).mockReturnValueOnce(cleanup3)

      setupAgentListeners()

      const cleanup4 = vi.fn()
      const cleanup5 = vi.fn()
      const cleanup6 = vi.fn()
      vi.mocked(mockOnChunk).mockReturnValueOnce(cleanup4)
      vi.mocked(mockOnDone).mockReturnValueOnce(cleanup5)
      vi.mocked(mockOnError).mockReturnValueOnce(cleanup6)

      setupAgentListeners()

      expect(cleanup1).toHaveBeenCalled()
      expect(cleanup2).toHaveBeenCalled()
      expect(cleanup3).toHaveBeenCalled()
    })

    it('should call appendChunk on chunk event', async () => {
      const mockAppendChunk = vi.fn()
      vi.doMock('../../stores/agent-store', () => ({
        useAgentStore: { getState: () => ({ appendChunk: mockAppendChunk }) },
      }))

      let chunkHandler: (chunk: unknown) => void
      vi.mocked(mockOnChunk).mockImplementation((handler) => {
        chunkHandler = handler
        return vi.fn()
      })

      setupAgentListeners()

      const chunk = { type: 'text', content: 'hello' }
      chunkHandler!(chunk)

      await vi.waitFor(() => {
        expect(mockAppendChunk).toHaveBeenCalledWith(chunk)
      })

      vi.doUnmock('../../stores/agent-store')
    })

    it('should set isGenerating false on done event', async () => {
      const mockSetState = vi.fn()
      vi.doMock('../../stores/agent-store', () => ({
        useAgentStore: { setState: mockSetState },
      }))

      let doneHandler: () => void
      vi.mocked(mockOnDone).mockImplementation((handler) => {
        doneHandler = handler
        return vi.fn()
      })

      setupAgentListeners()
      doneHandler!()

      await vi.waitFor(() => {
        expect(mockSetState).toHaveBeenCalledWith({ isGenerating: false })
      })

      vi.doUnmock('../../stores/agent-store')
    })

    it('should set isGenerating false and log error on error event', async () => {
      const mockSetState = vi.fn()
      vi.doMock('../../stores/agent-store', () => ({
        useAgentStore: { setState: mockSetState },
      }))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      let errorHandler: (error: string) => void
      vi.mocked(mockOnError).mockImplementation((handler) => {
        errorHandler = handler
        return vi.fn()
      })

      setupAgentListeners()
      errorHandler!('connection failed')

      await vi.waitFor(() => {
        expect(mockSetState).toHaveBeenCalledWith({ isGenerating: false })
        expect(consoleSpy).toHaveBeenCalledWith('Agent error:', 'connection failed')
      })

      consoleSpy.mockRestore()
      vi.doUnmock('../../stores/agent-store')
    })
  })

  describe('cleanup', () => {
    it('should call all cleanup functions', () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()
      const cleanup3 = vi.fn()

      vi.mocked(mockOnChunk).mockReturnValueOnce(cleanup1)
      vi.mocked(mockOnDone).mockReturnValueOnce(cleanup2)
      vi.mocked(mockOnError).mockReturnValueOnce(cleanup3)

      setupAgentListeners()
      cleanup()

      expect(cleanup1).toHaveBeenCalled()
      expect(cleanup2).toHaveBeenCalled()
      expect(cleanup3).toHaveBeenCalled()
    })

    it('should be safe to call multiple times', () => {
      const cleanup1 = vi.fn()
      vi.mocked(mockOnChunk).mockReturnValueOnce(cleanup1)
      vi.mocked(mockOnDone).mockReturnValueOnce(vi.fn())
      vi.mocked(mockOnError).mockReturnValueOnce(vi.fn())

      setupAgentListeners()
      cleanup()
      cleanup()

      expect(cleanup1).toHaveBeenCalledTimes(1)
    })

    it('should be safe to call without setup', () => {
      expect(() => cleanup()).not.toThrow()
    })
  })
})
