import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowEngine } from '../engine'
import type { AgentSessionManager } from '../../agent/session-manager'
import type { ToolRegistry } from '../../agent/tool-registry'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function createWorkflow(nodes: any[], edges: any[]) {
  return { id: 'test-workflow', name: 'Test Workflow', nodes, edges }
}

function mockTools(): ToolRegistry {
  return {
    list: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue({ name: 'test-tool' }),
  } as any
}

describe('WorkflowEngine - Failure handling', () => {
  let tools: ToolRegistry

  beforeEach(() => {
    tools = mockTools()
  })

  it('cancels sibling nodes when one node in the layer fails', async () => {
    const streamedChunks: string[] = []
    const stop = vi.fn().mockResolvedValue(undefined)
    const agents = {
      create: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockImplementation(async function* () {
        // 模拟一个会持续很久的流式输出
        for (let i = 0; i < 20; i++) {
          await sleep(10)
          streamedChunks.push(`chunk-${i}`)
          yield { type: 'text', content: `chunk-${i}` }
        }
      }),
      stop,
      destroy: vi.fn(),
    } as unknown as AgentSessionManager

    const toolExecutor = vi.fn().mockImplementation(async () => {
      await sleep(5)
      throw new Error('tool blew up')
    })

    const engine = new WorkflowEngine(agents, tools, undefined, toolExecutor)

    // start -> (agent1 || tool1) -> end，两个节点处于同一层
    const workflow = createWorkflow(
      [
        { id: 'start', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'agent1', type: 'agent', data: { config: {} }, position: { x: 0, y: 1 } },
        {
          id: 'tool1',
          type: 'tool',
          data: { config: { toolName: 'test-tool' } },
          position: { x: 0, y: 2 },
        },
        { id: 'end', type: 'end', data: {}, position: { x: 0, y: 3 } },
      ],
      [
        { id: 'e1', source: 'start', target: 'agent1' },
        { id: 'e2', source: 'start', target: 'tool1' },
        { id: 'e3', source: 'agent1', target: 'end' },
        { id: 'e4', source: 'tool1', target: 'end' },
      ],
    )

    await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow('tool blew up')

    // 兄弟节点应当被主动中止，而不是继续跑完 20 个 chunk
    expect(stop).toHaveBeenCalledWith('test-workflow-agent1')
    expect(streamedChunks.length).toBeLessThan(20)
  })

  it('runs at most 3 nodes concurrently within a layer', async () => {
    let running = 0
    let peak = 0

    const agents = {
      create: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockImplementation(async function* () {
        running += 1
        peak = Math.max(peak, running)
        await sleep(20)
        running -= 1
        yield { type: 'text', content: 'ok' }
      }),
      stop: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    } as unknown as AgentSessionManager

    const engine = new WorkflowEngine(agents, tools)

    const agentNodes = [1, 2, 3, 4, 5].map((index) => ({
      id: `a${index}`,
      type: 'agent',
      data: { config: {} },
      position: { x: index * 50, y: 100 },
    }))

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        ...agentNodes,
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 300 } },
      ],
      [
        ...agentNodes.map((node, index) => ({ id: `s${index}`, source: 's', target: node.id })),
        ...agentNodes.map((node, index) => ({ id: `t${index}`, source: node.id, target: 'e' })),
      ],
    )

    await engine.execute(workflow, {}, vi.fn())

    expect(peak).toBeLessThanOrEqual(3)
    expect(peak).toBeGreaterThan(1)
  })

  it('returns every branch result when multiple inputs reach the end node', async () => {
    const agents = {
      create: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockImplementation(async function* () {
        yield { type: 'text', content: 'branch output' }
      }),
      stop: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    } as unknown as AgentSessionManager

    const engine = new WorkflowEngine(agents, tools)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a1', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'a2', type: 'agent', data: { config: {} }, position: { x: 200, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 100, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'a1' },
        { id: 'e2', source: 's', target: 'a2' },
        { id: 'e3', source: 'a1', target: 'e' },
        { id: 'e4', source: 'a2', target: 'e' },
      ],
    )

    const result = await engine.execute(workflow, {}, vi.fn())

    expect(result).toEqual(['branch output', 'branch output'])
  })
})
