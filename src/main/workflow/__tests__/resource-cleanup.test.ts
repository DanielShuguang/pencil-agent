import { describe, it, expect, vi, beforeEach } from 'vitest'
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

describe('WorkflowEngine - Resource Cleanup', () => {
  let agents: AgentSessionManager
  let tools: ToolRegistry
  let roleManager: RoleManager

  beforeEach(() => {
    agents = mockAgents()
    tools = mockTools()
    roleManager = mockRoleManager()
  })

  it('should cleanup agent sessions on successful execution', async () => {
    const engine = new WorkflowEngine(agents, tools, roleManager)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'e' },
      ],
    )

    await engine.execute(workflow, {}, vi.fn())

    // 应该调用 destroy 清理 session
    expect(agents.destroy).toHaveBeenCalledWith('test-workflow-a')
  })

  it('should cleanup agent sessions on error', async () => {
    // Mock agent to throw error
    agents.create = vi.fn().mockRejectedValue(new Error('Session creation failed'))

    const engine = new WorkflowEngine(agents, tools, roleManager)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'e' },
      ],
    )

    await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow('Session creation failed')

    // 错误时也应该清理 session
    expect(agents.destroy).toHaveBeenCalled()
  })

  it('should wait for destroy to complete', async () => {
    let destroyResolve: () => void
    const destroyPromise = new Promise<void>((resolve) => {
      destroyResolve = resolve
    })

    agents.destroy = vi.fn().mockReturnValue(destroyPromise)

    const engine = new WorkflowEngine(agents, tools, roleManager)

    const workflow = createWorkflow(
      [
        { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
        { id: 'a', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
      ],
      [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'e' },
      ],
    )

    const executePromise = engine.execute(workflow, {}, vi.fn())

    // 等待一小段时间让 destroy 被调用
    await new Promise((resolve) => setTimeout(resolve, 50))

    // 完成 destroy
    destroyResolve!()

    await executePromise

    expect(agents.destroy).toHaveBeenCalled()
  })

  it('should cleanup multiple agent sessions', async () => {
    const engine = new WorkflowEngine(agents, tools, roleManager)

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

    await engine.execute(workflow, {}, vi.fn())

    // 应该清理所有 agent session
    expect(agents.destroy).toHaveBeenCalledWith('test-workflow-a1')
    expect(agents.destroy).toHaveBeenCalledWith('test-workflow-a2')
  })
})