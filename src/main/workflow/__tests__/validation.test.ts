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

describe('WorkflowEngine - Validation', () => {
  let agents: AgentSessionManager
  let tools: ToolRegistry
  let roleManager: RoleManager

  beforeEach(() => {
    agents = mockAgents()
    tools = mockTools()
    roleManager = mockRoleManager()
  })

  describe('multi-agent node validation', () => {
    it('should reject empty roleIds', async () => {
      const engine = new WorkflowEngine(agents, tools, roleManager)

      const workflow = createWorkflow(
        [
          { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
          {
            id: 'ma',
            type: 'multi-agent',
            data: { config: { mode: 'sequential', roleIds: [] } },
            position: { x: 0, y: 100 },
          },
          { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
        ],
        [
          { id: 'e1', source: 's', target: 'ma' },
          { id: 'e2', source: 'ma', target: 'e' },
        ],
      )

      await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow(
        'Multi-agent node requires at least one roleId',
      )
    })

    it('should reject invalid mode', async () => {
      const engine = new WorkflowEngine(agents, tools, roleManager)

      const workflow = createWorkflow(
        [
          { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
          {
            id: 'ma',
            type: 'multi-agent',
            data: { config: { mode: 'invalid', roleIds: ['test'] } },
            position: { x: 0, y: 100 },
          },
          { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
        ],
        [
          { id: 'e1', source: 's', target: 'ma' },
          { id: 'e2', source: 'ma', target: 'e' },
        ],
      )

      await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow(
        'Invalid multi-agent mode: invalid',
      )
    })

    it('should accept valid mode', async () => {
      const engine = new WorkflowEngine(agents, tools, roleManager)

      const workflow = createWorkflow(
        [
          { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
          {
            id: 'ma',
            type: 'multi-agent',
            data: { config: { mode: 'parallel', roleIds: ['test'] } },
            position: { x: 0, y: 100 },
          },
          { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
        ],
        [
          { id: 'e1', source: 's', target: 'ma' },
          { id: 'e2', source: 'ma', target: 'e' },
        ],
      )

      // Should not throw
      await engine.execute(workflow, {}, vi.fn())
    })
  })

  describe('agent node validation', () => {
    it('should use default model when not specified', async () => {
      const engine = new WorkflowEngine(agents, tools)

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

      expect(agents.create).toHaveBeenCalledWith({
        sessionId: 'test-workflow-a',
        model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
        cwd: expect.any(String),
        systemPrompt: undefined,
      })
    })
  })

  describe('condition node validation', () => {
    it('should reject missing expression', async () => {
      const engine = new WorkflowEngine(agents, tools)

      const workflow = createWorkflow(
        [
          { id: 's', type: 'start', data: {}, position: { x: 0, y: 0 } },
          {
            id: 'c',
            type: 'condition',
            data: { config: {} },
            position: { x: 0, y: 100 },
          },
          { id: 'e', type: 'end', data: {}, position: { x: 0, y: 200 } },
        ],
        [
          { id: 'e1', source: 's', target: 'c' },
          { id: 'e2', source: 'c', target: 'e' },
        ],
      )

      await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow(
        'Condition node missing expression config',
      )
    })
  })

  describe('workflow structure validation', () => {
    it('should detect cycles', async () => {
      const engine = new WorkflowEngine(agents, tools)

      const workflow = createWorkflow(
        [
          { id: 'a', type: 'start', data: {}, position: { x: 0, y: 0 } },
          { id: 'b', type: 'agent', data: { config: {} }, position: { x: 0, y: 100 } },
        ],
        [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'a' },
        ],
      )

      await expect(engine.execute(workflow, {}, vi.fn())).rejects.toThrow(
        'Workflow contains a cycle',
      )
    })
  })
})