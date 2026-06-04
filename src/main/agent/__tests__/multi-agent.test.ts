import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MultiAgentOrchestrator } from '../multi-agent'
import type { AgentSessionManager } from '../session-manager'
import type { RoleManager, AgentRole } from '../role-manager'

function mockAgents(): AgentSessionManager {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    prompt: vi.fn().mockImplementation(async function* () {
      yield { type: 'text', content: 'mock output' }
    }),
    stop: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  } as any
}

function mockRoles(): RoleManager {
  const roles: AgentRole[] = [
    {
      id: 'researcher',
      name: '研究员',
      description: 'Research agent',
      systemPrompt: 'You are a researcher',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'analyst',
      name: '分析师',
      description: 'Analysis agent',
      systemPrompt: 'You are an analyst',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'writer',
      name: '写作者',
      description: 'Writer agent',
      systemPrompt: 'You are a writer',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  return {
    list: vi.fn().mockReturnValue(roles),
    get: vi.fn().mockImplementation((id: string) => roles.find((r) => r.id === id)),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any
}

describe('MultiAgentOrchestrator', () => {
  let orchestrator: MultiAgentOrchestrator
  let agents: AgentSessionManager
  let roles: RoleManager

  beforeEach(() => {
    agents = mockAgents()
    roles = mockRoles()
    orchestrator = new MultiAgentOrchestrator(agents, roles)
  })

  it('should execute sequential orchestration', async () => {
    const result = await orchestrator.execute('sequential', ['researcher', 'analyst'], 'test input')

    expect(result.mode).toBe('sequential')
    expect(result.results).toHaveLength(2)
    expect(result.finalOutput).toBe('mock output')
    expect(agents.create).toHaveBeenCalledTimes(2)
    expect(agents.prompt).toHaveBeenCalledTimes(2)
  })

  it('should execute parallel orchestration', async () => {
    const result = await orchestrator.execute('parallel', ['researcher', 'analyst'], 'test input')

    expect(result.mode).toBe('parallel')
    expect(result.results).toHaveLength(2)
    expect(agents.create).toHaveBeenCalledTimes(2)
    expect(agents.prompt).toHaveBeenCalledTimes(2)
  })

  it('should execute parallel orchestration with merger', async () => {
    const result = await orchestrator.execute('parallel', ['researcher', 'analyst'], 'test input', {
      mergerRoleId: 'writer',
    })

    expect(result.mode).toBe('parallel')
    expect(result.results).toHaveLength(2)
    expect(agents.create).toHaveBeenCalledTimes(3) // 2 workers + 1 merger
  })

  it('should execute debate orchestration', async () => {
    const result = await orchestrator.execute(
      'debate',
      ['researcher', 'analyst', 'writer'],
      'test input',
      { maxRounds: 2 },
    )

    expect(result.mode).toBe('debate')
    expect(result.results.length).toBeGreaterThan(0)
    expect(agents.create).toHaveBeenCalled()
  })

  it('should throw error for debate with less than 3 roles', async () => {
    await expect(
      orchestrator.execute('debate', ['researcher', 'analyst'], 'test input'),
    ).rejects.toThrow('Debate mode requires at least 3 roles')
  })

  it('should execute hierarchical orchestration', async () => {
    const result = await orchestrator.execute(
      'hierarchical',
      ['researcher', 'analyst', 'writer'],
      'test input',
    )

    expect(result.mode).toBe('hierarchical')
    expect(result.results.length).toBeGreaterThan(0)
    expect(agents.create).toHaveBeenCalled()
  })

  it('should throw error for hierarchical with less than 2 roles', async () => {
    await expect(
      orchestrator.execute('hierarchical', ['researcher'], 'test input'),
    ).rejects.toThrow('Hierarchical mode requires at least 2 roles')
  })

  it('should throw error for unknown mode', async () => {
    await expect(
      orchestrator.execute('unknown' as any, ['researcher'], 'test input'),
    ).rejects.toThrow('Unknown orchestration mode')
  })

  it('should call onProgress callback', async () => {
    const onProgress = vi.fn()
    await orchestrator.execute('sequential', ['researcher'], 'test input', { onProgress })

    expect(onProgress).toHaveBeenCalledWith('researcher', 'mock output')
  })
})
