import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowProgress } from '@shared/ipc'
import type { AgentSessionManager } from '../agent/session-manager'
import type { ToolRegistry } from '../agent/tool-registry'
import { CycleError } from './topological-sort'
import { MultiAgentOrchestrator } from '../agent/multi-agent'
import { RoleManager } from '../agent/role-manager'
import { evaluateSafeExpression } from './safe-evaluator'

const MAX_AGENT_OUTPUT_LENGTH = 100_000
const CONDITION_TYPES = new Set(['condition'])

interface ExecutionContext {
  workflowId: string
  nodeOutputs: Map<string, unknown>
  variables: Map<string, unknown>
  status: Map<string, 'pending' | 'running' | 'success' | 'error'>
}

export class WorkflowEngine {
  private orchestrator: MultiAgentOrchestrator | null = null

  constructor(
    private agents: AgentSessionManager,
    private tools: ToolRegistry,
    roleManager?: RoleManager,
    private toolExecutor?: (toolName: string, parameters: Record<string, unknown>, cwd?: string) => Promise<unknown>,
  ) {
    if (roleManager) {
      this.orchestrator = new MultiAgentOrchestrator(agents, roleManager)
    }
  }

  async execute(
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
    onProgress: (progress: WorkflowProgress) => void,
    cwd?: string,
  ): Promise<Record<string, unknown>> {
    const context: ExecutionContext = {
      workflowId: workflow.id,
      nodeOutputs: new Map([['start', input]]),
      variables: new Map(Object.entries(input)),
      status: new Map(workflow.nodes.map((n) => [n.id, 'pending'])),
    }

    const agentSessionIds: string[] = []
    const executionLayers = this.calculateExecutionLayers(workflow.nodes, workflow.edges)

    for (const layer of executionLayers) {
      const layerPromises = layer.map(async (nodeId) => {
        const node = workflow.nodes.find((n) => n.id === nodeId)!

        if (node.type === 'agent') {
          agentSessionIds.push(`${context.workflowId}-${node.id}`)
        }

        context.status.set(nodeId, 'running')
        onProgress({ nodeId, status: 'running' })

        try {
          const result = await this.executeNode(node, workflow.nodes, workflow.edges, context, cwd)
          context.nodeOutputs.set(nodeId, result)
          context.status.set(nodeId, 'success')
          onProgress({ nodeId, status: 'success', result })
        } catch (error) {
          context.status.set(nodeId, 'error')
          onProgress({ nodeId, status: 'error', error: String(error) })
          throw error
        }
      })

      try {
        await Promise.all(layerPromises)
      } catch (error) {
        await this.cleanupSessions(agentSessionIds)
        throw error
      }
    }

    // Cleanup agent sessions on successful execution
    await this.cleanupSessions(agentSessionIds)

    // Return end node output
    const endNode = workflow.nodes.find((n) => n.type === 'end')
    return endNode ? (context.nodeOutputs.get(endNode.id) as Record<string, unknown>) : {}
  }

  private async cleanupSessions(sessionIds: string[]): Promise<void> {
    const cleanupPromises = sessionIds.map((sid) => {
      try {
        return this.agents.destroy(sid)
      } catch {
        // Ignore cleanup errors
        return Promise.resolve()
      }
    })
    await Promise.all(cleanupPromises)
  }

  private calculateExecutionLayers(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    for (const node of nodes) {
      inDegree.set(node.id, 0)
      adjacency.set(node.id, [])
    }

    for (const edge of edges) {
      const targetDegree = inDegree.get(edge.target) ?? 0
      inDegree.set(edge.target, targetDegree + 1)
      const neighbors = adjacency.get(edge.source) ?? []
      neighbors.push(edge.target)
      adjacency.set(edge.source, neighbors)
    }

    const layers: string[][] = []
    const visited = new Set<string>()

    while (visited.size < nodes.length) {
      const currentLayer: string[] = []
      
      for (const [nodeId, degree] of inDegree) {
        if (degree === 0 && !visited.has(nodeId)) {
          currentLayer.push(nodeId)
        }
      }

      if (currentLayer.length === 0) {
        throw new CycleError('Workflow contains a cycle')
      }

      layers.push(currentLayer)

      for (const nodeId of currentLayer) {
        visited.add(nodeId)
        for (const neighbor of adjacency.get(nodeId) ?? []) {
          const degree = inDegree.get(neighbor)! - 1
          inDegree.set(neighbor, degree)
        }
      }
    }

    return layers
  }

  private async executeNode(
    node: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext,
    cwd?: string,
  ): Promise<unknown> {
    // Collect inputs from source nodes
    const inputEdges = edges.filter((e) => e.target === node.id)
    const inputs = inputEdges.map((e) => {
      const sourceOutput = context.nodeOutputs.get(e.source)
      const sourceNode = nodes.find((n) => n.id === e.source)

      if (sourceNode?.type && CONDITION_TYPES.has(sourceNode.type) && e.sourceHandle) {
        const conditionOutput = sourceOutput as
          | { trueOutput: unknown; falseOutput: unknown }
          | undefined
        return e.sourceHandle === 'true'
          ? conditionOutput?.trueOutput
          : conditionOutput?.falseOutput
      }

      return sourceOutput
    })

    switch (node.type) {
      case 'start':
        return context.nodeOutputs.get('start') ?? node.data.input
      case 'end':
        return inputs[0] ?? {}
      case 'agent':
        return this.executeAgentNode(node, inputs, context, cwd)
      case 'tool':
        return this.executeToolNode(node, inputs, cwd)
      case 'condition':
        return this.evaluateCondition(node, inputs, context)
      case 'multi-agent':
        return this.executeMultiAgentNode(node, inputs, context, cwd)
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    context: ExecutionContext,
    cwd?: string,
  ): Promise<string> {
    const config = node.data.config as
      | {
          model?: { id: string; provider: string }
          systemPrompt?: string
        }
      | undefined

    const sessionId = `${context.workflowId}-${node.id}`
    const model = config?.model ?? { id: 'claude-sonnet-4-20250514', provider: 'anthropic' }

    await this.agents.create({
      sessionId,
      model,
      cwd: cwd || process.cwd(),
      systemPrompt: config?.systemPrompt,
    })

    let result = ''
    for await (const chunk of this.agents.prompt(sessionId, String(inputs[0] ?? ''))) {
      if (chunk.type === 'text') {
        result += chunk.content
        if (result.length > MAX_AGENT_OUTPUT_LENGTH) break
      }
    }
    return result
  }

  private async executeToolNode(node: WorkflowNode, _inputs: unknown[], cwd?: string): Promise<unknown> {
    const config = node.data.config as
      | {
          toolName?: string
          parameters?: Record<string, unknown>
        }
      | undefined

    const toolName = config?.toolName
    if (!toolName) throw new Error('Tool node missing toolName config')

    const tool = this.tools.get(toolName)
    if (!tool) throw new Error(`Tool not found: ${toolName}`)

    if (!this.toolExecutor) {
      throw new Error('Tool executor not provided')
    }

    return this.toolExecutor(toolName, config?.parameters ?? {}, cwd)
  }

  private async executeMultiAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    _context: ExecutionContext,
    cwd?: string,
  ): Promise<string> {
    if (!this.orchestrator) {
      throw new Error('Multi-agent orchestration requires a RoleManager')
    }

    const config = node.data.config as
      | {
          mode?: 'sequential' | 'parallel' | 'debate' | 'hierarchical'
          roleIds?: string[]
          maxRounds?: number
          mergerRoleId?: string
        }
      | undefined

    const mode = config?.mode || 'sequential'
    const roleIds = config?.roleIds || []

    // 验证 roleIds 不为空
    if (roleIds.length === 0) {
      throw new Error('Multi-agent node requires at least one roleId')
    }

    // 验证 mode 有效性
    const validModes = ['sequential', 'parallel', 'debate', 'hierarchical']
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid multi-agent mode: ${mode}`)
    }

    const input = String(inputs[0] ?? '')

    const result = await this.orchestrator.execute(mode, roleIds, input, {
      cwd,
      maxRounds: config?.maxRounds,
      mergerRoleId: config?.mergerRoleId,
    })

    return result.finalOutput
  }

  private evaluateCondition(
    node: WorkflowNode,
    inputs: unknown[],
    _context: ExecutionContext,
  ): { trueOutput: unknown; falseOutput: unknown } {
    const config = node.data.config as
      | {
          expression?: string
        }
      | undefined

    const expression = config?.expression
    if (!expression) throw new Error('Condition node missing expression config')

    const input = inputs[0]
    const result = evaluateSafeExpression(expression, input)

    return {
      trueOutput: result ? input : undefined,
      falseOutput: result ? undefined : input,
    }
  }
}
