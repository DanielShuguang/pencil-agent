import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkflowEngine } from '../engine'
import type { AgentSessionManager } from '../../agent/session-manager'
import type { ToolRegistry } from '../../agent/tool-registry'
import type { RoleManager } from '../../agent/role-manager'

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
    get: vi.fn().mockReturnValue(undefined),
  } as any
}

function mockRoleManager(): RoleManager {
  return {
    list: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue({
      id: 'test-role',
      name: 'Test Role',
      systemPrompt: 'Test prompt',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: [],
    }),
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

describe('WorkflowEngine - Parallel Execution', () => {
  let engine: WorkflowEngine
  let agents: AgentSessionManager
  let tools: ToolRegistry
  let roleManager: RoleManager

  beforeEach(() => {
    agents = mockAgents()
    tools = mockTools()
    roleManager = mockRoleManager()
    engine = new WorkflowEngine(agents, tools, roleManager)
  })

  it('should execute independent nodes in parallel', async () => {
    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'b', type: 'agent', data: { config: {} }, position: { x: 200, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 100, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 's', target: 'b' },
        { id: 'e3', source: 'a', target: 'e' },
        { id: 'e4', source: 'b', target: 'e' },
      ]
    )

    const onProgress = vi.fn()
    const result = await engine.execute(workflow, { input: 'test' }, onProgress)

    expect(result).toBeDefined()
    expect(onProgress).toHaveBeenCalled()
  })

  it('should handle multi-agent node', async () => {
    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 'ma',
          type: 'multi-agent',
          data: {
            config: {
              mode: 'sequential',
              roleIds: ['researcher', 'analyst'],
            },
          },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'ma' },
        { id: 'e2', source: 'ma', target: 'e' },
      ]
    )

    const onProgress = vi.fn()
    const result = await engine.execute(workflow, { input: 'test' }, onProgress)

    expect(result).toBeDefined()
  })

  it('should throw error for multi-agent node without role manager', async () => {
    const engineWithoutRoles = new WorkflowEngine(agents, tools)
    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        {
          id: 'ma',
          type: 'multi-agent',
          data: { config: { mode: 'sequential', roleIds: ['test'] } },
          position: { x: 0, y: 100 },
        },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'ma' },
        { id: 'e2', source: 'ma', target: 'e' },
      ]
    )

    await expect(
      engineWithoutRoles.execute(workflow, {}, vi.fn())
    ).rejects.toThrow('Multi-agent orchestration requires a RoleManager')
  })
})
