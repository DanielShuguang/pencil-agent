import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowEngine } from '../engine'
import type { AgentSessionManager } from '../../agent/session-manager'
import type { ToolRegistry } from '../../agent/tool-registry'

function mockAgents(): AgentSessionManager {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    prompt: vi.fn().mockImplementation(async function* () {
      yield { type: 'text', content: 'agent output' }
    }),
    stop: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  } as any
}

function mockTools(): ToolRegistry {
  return {
    list: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue({
      name: 'test-tool',
      description: 'Test tool',
      parameters: { type: 'object', properties: {} },
    }),
    has: vi.fn().mockReturnValue(true),
    register: vi.fn(),
    unregister: vi.fn(),
    clear: vi.fn(),
  } as any
}

function createWorkflow(nodes: any[], edges: any[]) {
  return {
    id: 'test-workflow',
    name: 'Test Workflow',
    nodes,
    edges,
  }
}

describe('WorkflowEngine - Tool Execution', () => {
  let engine: WorkflowEngine
  let agents: AgentSessionManager
  let tools: ToolRegistry

  beforeEach(() => {
    agents = mockAgents()
    tools = mockTools()
    engine = new WorkflowEngine(agents, tools)
  })

  it('should execute tool node with parameters', async () => {
    const toolExecutor = vi.fn().mockResolvedValue({ success: true, output: 'tool result' })
    const engineWithExecutor = new WorkflowEngine(agents, tools, undefined, toolExecutor)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 't',
          type: 'tool',
          data: {
            config: {
              toolName: 'test-tool',
              parameters: { path: '/test/file.txt' },
            },
          },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 't' },
        { id: 'e2', source: 't', target: 'e' },
      ],
    )

    const onProgress = vi.fn()
    const result = await engineWithExecutor.execute(workflow, { input: 'test' }, onProgress)

    expect(toolExecutor).toHaveBeenCalledWith('test-tool', { path: '/test/file.txt' }, undefined)
    expect(result).toEqual({ success: true, output: 'tool result' })
  })

  it('should pass input to tool parameters', async () => {
    const toolExecutor = vi.fn().mockResolvedValue({ result: 'processed' })
    const engineWithExecutor = new WorkflowEngine(agents, tools, undefined, toolExecutor)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 't',
          type: 'tool',
          data: {
            config: {
              toolName: 'test-tool',
              parameters: { input: '$input' },
            },
          },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 't' },
        { id: 'e2', source: 't', target: 'e' },
      ],
    )

    const onProgress = vi.fn()
    await engineWithExecutor.execute(workflow, { data: 'test data' }, onProgress)

    expect(toolExecutor).toHaveBeenCalledWith(
      'test-tool',
      { input: '$input' },
      undefined,
    )
  })

  it('should throw error when tool executor not provided', async () => {
    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 't',
          type: 'tool',
          data: {
            config: {
              toolName: 'test-tool',
              parameters: {},
            },
          },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 't' },
        { id: 'e2', source: 't', target: 'e' },
      ],
    )

    const onProgress = vi.fn()
    await expect(engine.execute(workflow, {}, onProgress)).rejects.toThrow(
      'Tool executor not provided',
    )
  })

  it('should handle tool execution errors', async () => {
    const toolExecutor = vi.fn().mockRejectedValue(new Error('Tool execution failed'))
    const engineWithExecutor = new WorkflowEngine(agents, tools, undefined, toolExecutor)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 't',
          type: 'tool',
          data: {
            config: {
              toolName: 'test-tool',
              parameters: {},
            },
          },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 't' },
        { id: 'e2', source: 't', target: 'e' },
      ],
    )

    const onProgress = vi.fn()
    await expect(engineWithExecutor.execute(workflow, {}, onProgress)).rejects.toThrow(
      'Tool execution failed',
    )
  })
})