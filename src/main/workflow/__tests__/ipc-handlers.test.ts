import { describe, it, expect, vi, beforeEach } from 'vitest'

const ipcHandlers = new Map<string, Function>()
const mockWebContentsSend = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler)
    }),
  },
}))

import { registerWorkflowHandlers } from '../ipc-handlers'

describe('registerWorkflowHandlers', () => {
  let mockEngine: any
  let mainWindow: any

  beforeEach(() => {
    vi.clearAllMocks()
    ipcHandlers.clear()
    mockEngine = { execute: vi.fn() }
    mainWindow = { webContents: { send: mockWebContentsSend } }
    registerWorkflowHandlers(mockEngine as any, mainWindow as any)
  })

  it('should execute a workflow and return result', async () => {
    mockEngine.execute.mockResolvedValue({ status: 'completed', output: 'result' })
    const graph = { nodes: [], edges: [] }
    const result = await ipcHandlers.get('workflow:execute')!({}, graph, {})
    expect(mockEngine.execute).toHaveBeenCalledWith(graph, {}, expect.any(Function))
    expect(result).toEqual({ status: 'completed', output: 'result' })
  })

  it('should handle execute errors', async () => {
    mockEngine.execute.mockRejectedValue(new Error('Execution error'))
    await expect(
      ipcHandlers.get('workflow:execute')!({}, { nodes: [], edges: [] }, {}),
    ).rejects.toThrow('Workflow execution failed: Error: Execution error')
  })
})
