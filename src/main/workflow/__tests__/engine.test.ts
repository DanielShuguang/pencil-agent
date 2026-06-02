import { describe, it, expect, vi } from 'vitest'
import { WorkflowEngine } from '../engine'
import type { WorkflowDefinition } from '@shared/ipc'

function mockAgents() {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    prompt: vi.fn().mockImplementation(async function* (_sessionId: string, _message: string) {
      yield { type: 'text' as const, content: 'mock response' }
    }),
    destroy: vi.fn(),
  }
}

function mockTools() {
  return {
    get: vi.fn().mockReturnValue({ name: 'test-tool', description: 'Test', parameters: {} }),
    has: vi.fn().mockReturnValue(true),
    list: vi.fn().mockReturnValue([]),
    register: vi.fn(),
    unregister: vi.fn(),
    clear: vi.fn(),
  }
}

function createWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'test-workflow',
    name: 'Test Workflow',
    nodes: [],
    edges: [],
    ...overrides,
  }
}

describe('WorkflowEngine', () => {
  it('executes simple linear workflow', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'e' },
      ],
    })

    const result = await engine.execute(workflow, { foo: 'bar' }, onProgress)

    expect(result).toEqual({ foo: 'bar' })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 's', status: 'running' })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 's', status: 'success', result: { foo: 'bar' } })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 'e', status: 'running' })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 'e', status: 'success', result: { foo: 'bar' } })
  })

  it('passes start input to agent node', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: { model: { id: 'test-model', provider: 'anthropic' } } }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'e' },
      ],
    })

    await engine.execute(workflow, { prompt: 'hello' }, onProgress)

    expect(agents.create).toHaveBeenCalledWith({
      sessionId: 'test-workflow-a',
      model: { id: 'test-model', provider: 'anthropic' },
      systemPrompt: undefined,
    })
  })

  it('routes condition true branch correctly', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'c', type: 'condition', data: { config: { expression: '$input !== null' } }, position: { x: 0, y: 100 } },
        { id: 'true-target', type: 'end', data: {}, position: { x: -100, y: 200 } },
        { id: 'false-target', type: 'end', data: {}, position: { x: 100, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'c' },
        { id: 'e2', source: 'c', target: 'true-target', sourceHandle: 'true' },
        { id: 'e3', source: 'c', target: 'false-target', sourceHandle: 'false' },
      ],
    })

    const result = await engine.execute(workflow, { value: 42 }, onProgress)

    expect(result).toEqual({ value: 42 })

    const progressCalls = onProgress.mock.calls.map((c: unknown[]) => c[0]) as { nodeId: string; status: string; result?: unknown }[]
    const trueTargetProgress = progressCalls.findLast(
      (p) => p.nodeId === 'true-target',
    )
    const falseTargetProgress = progressCalls.findLast(
      (p) => p.nodeId === 'false-target',
    )
    expect(trueTargetProgress).toMatchObject({ status: 'success', result: { value: 42 } })
    expect(falseTargetProgress).toMatchObject({ status: 'success', result: {} })
  })

  it('routes condition false branch correctly', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    // false-branch listed first so execute finds it as the workflow result
    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'c', type: 'condition', data: { config: { expression: '$input === null' } }, position: { x: 0, y: 100 } },
        { id: 'false-branch', type: 'end', data: {}, position: { x: 100, y: 200 } },
        { id: 'true-branch', type: 'end', data: {}, position: { x: -100, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'c' },
        { id: 'e2', source: 'c', target: 'true-branch', sourceHandle: 'true' },
        { id: 'e3', source: 'c', target: 'false-branch', sourceHandle: 'false' },
      ],
    })

    const result = await engine.execute(workflow, { value: 42 }, onProgress)

    expect(result).toEqual({ value: 42 })

    const progressCalls = onProgress.mock.calls.map((c: unknown[]) => c[0]) as { nodeId: string; status: string; result?: unknown }[]
    const falseBranchProgress = progressCalls.findLast(
      (p) => p.nodeId === 'false-branch',
    )
    const trueBranchProgress = progressCalls.findLast(
      (p) => p.nodeId === 'true-branch',
    )
    expect(falseBranchProgress).toMatchObject({ status: 'success', result: { value: 42 } })
    expect(trueBranchProgress).toMatchObject({ status: 'success', result: {} })
  })

  it('reports node error and cleans up agent sessions', async () => {
    const agents = mockAgents()
    agents.create = vi.fn().mockRejectedValue(new Error('Session creation failed'))
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'e' },
      ],
    })

    await expect(engine.execute(workflow, {}, onProgress)).rejects.toThrow('Session creation failed')

    expect(onProgress).toHaveBeenCalledWith({ nodeId: 's', status: 'running' })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 's', status: 'success', result: {} })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 'a', status: 'running' })
    expect(onProgress).toHaveBeenCalledWith({ nodeId: 'a', status: 'error', error: 'Error: Session creation failed' })
  })

  it('detects cycles and throws', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'b', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
    })

    await expect(engine.execute(workflow, {}, onProgress)).rejects.toThrow('Workflow contains a cycle')
  })

  it('returns empty object when no end node exists', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
      ],
      edges: [],
    })

    const result = await engine.execute(workflow, {}, onProgress)
    expect(result).toEqual({})
  })

  it('tool node requires toolName config', async () => {
    const agents = mockAgents()
    const tools = mockTools()
    const engine = new WorkflowEngine(agents as any, tools as any)
    const onProgress = vi.fn()

    const workflow = createWorkflow({
      nodes: [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 't', type: 'tool', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 't' },
        { id: 'e2', source: 't', target: 'e' },
      ],
    })

    await expect(engine.execute(workflow, {}, onProgress)).rejects.toThrow('Tool node missing toolName config')
  })
})
