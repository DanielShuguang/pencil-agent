import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowProgress } from '@shared/ipc'
import type { AgentSessionManager } from '../agent/session-manager'
import type { ToolRegistry } from '../agent/tool-registry'
import { topologicalSort } from './topological-sort'

interface ExecutionContext {
  workflowId: string
  nodeOutputs: Map<string, unknown>
  variables: Map<string, unknown>
  status: Map<string, 'pending' | 'running' | 'success' | 'error'>
}

export class WorkflowEngine {
  constructor(
    private agents: AgentSessionManager,
    private tools: ToolRegistry,
  ) {}

  async execute(
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
    onProgress: (progress: WorkflowProgress) => void,
  ): Promise<Record<string, unknown>> {
    const context: ExecutionContext = {
      workflowId: workflow.id,
      nodeOutputs: new Map([['start', input]]),
      variables: new Map(Object.entries(input)),
      status: new Map(workflow.nodes.map((n) => [n.id, 'pending'])),
    }

    // Topological sort
    const executionOrder = topologicalSort(workflow.nodes, workflow.edges)

    const agentSessionIds: string[] = []

    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find((n) => n.id === nodeId)!
      context.status.set(nodeId, 'running')
      onProgress({ nodeId, status: 'running' })

      try {
        const result = await this.executeNode(node, workflow.nodes, workflow.edges, context)
        context.nodeOutputs.set(nodeId, result)
        context.status.set(nodeId, 'success')
        onProgress({ nodeId, status: 'success', result })
      } catch (error) {
        context.status.set(nodeId, 'error')
        onProgress({ nodeId, status: 'error', error: String(error) })
        for (const sid of agentSessionIds) {
          this.agents.destroy(sid)
        }
        throw error
      }

      if (node.type === 'agent') {
        agentSessionIds.push(`${context.workflowId}-${node.id}`)
      }
    }

    // Return end node output
    const endNode = workflow.nodes.find((n) => n.type === 'end')
    return endNode ? (context.nodeOutputs.get(endNode.id) as Record<string, unknown>) : {}
  }

  private async executeNode(
    node: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext,
  ): Promise<unknown> {
    // Collect inputs from source nodes
    const inputEdges = edges.filter((e) => e.target === node.id)
    const inputs = inputEdges.map((e) => {
      const sourceOutput = context.nodeOutputs.get(e.source)
      const sourceNode = nodes.find((n) => n.id === e.source)

      // Route condition node outputs based on sourceHandle
      if (sourceNode?.type === 'condition' && e.sourceHandle) {
        const conditionOutput = sourceOutput as { trueOutput: unknown; falseOutput: unknown } | undefined
        return e.sourceHandle === 'true' ? conditionOutput?.trueOutput : conditionOutput?.falseOutput
      }

      return sourceOutput
    })

    switch (node.type) {
      case 'start':
        return context.nodeOutputs.get('start') ?? node.data.input
      case 'end':
        return inputs[0] ?? {}
      case 'agent':
        return this.executeAgentNode(node, inputs, context)
      case 'tool':
        return this.executeToolNode(node, inputs)
      case 'condition':
        return this.evaluateCondition(node, inputs, context)
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    context: ExecutionContext,
  ): Promise<string> {
    const config = node.data.config as {
      model?: { id: string; provider: string }
      systemPrompt?: string
    } | undefined

    const sessionId = `${context.workflowId}-${node.id}`
    const model = config?.model ?? { id: 'claude-sonnet-4-20250514', provider: 'anthropic' }

    await this.agents.create({
      sessionId,
      model,
      systemPrompt: config?.systemPrompt,
    })

    let result = ''
    for await (const chunk of this.agents.prompt(sessionId, String(inputs[0] ?? ''))) {
      if (chunk.type === 'text') result += chunk.content
    }
    return result
  }

  private async executeToolNode(
    node: WorkflowNode,
    inputs: unknown[],
  ): Promise<unknown> {
    const config = node.data.config as {
      toolName?: string
      parameters?: Record<string, unknown>
    } | undefined

    const toolName = config?.toolName
    if (!toolName) throw new Error('Tool node missing toolName config')

    const tool = this.tools.get(toolName)
    if (!tool) throw new Error(`Tool not found: ${toolName}`)

    // For now, return the input as tool output
    // Real tool execution would use the sandbox or tool registry
    return inputs[0]
  }

  private evaluateCondition(
    node: WorkflowNode,
    inputs: unknown[],
    _context: ExecutionContext,
  ): { trueOutput: unknown; falseOutput: unknown } {
    const config = node.data.config as {
      expression?: string
    } | undefined

    const expression = config?.expression
    if (!expression) throw new Error('Condition node missing expression config')

    // Simple evaluation - in production, use a safe expression evaluator
    const input = inputs[0]
    let result: boolean

    try {
      // Basic expression evaluation (can be extended)
      // Replace $input with actual value and evaluate
      const evalExpression = expression.replace(/\$input/g, JSON.stringify(input))
      // Use Function constructor instead of eval for slightly better safety
      result = Boolean(new Function(`return ${evalExpression}`)())
    } catch {
      result = false
    }

    return {
      trueOutput: result ? input : undefined,
      falseOutput: result ? undefined : input,
    }
  }
}
