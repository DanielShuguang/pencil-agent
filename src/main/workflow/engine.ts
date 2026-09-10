import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowProgress } from '@shared/ipc'
import type { AgentSessionManager } from '../agent/session-manager'
import type { ToolRegistry } from '../agent/tool-registry'
import { calculateExecutionLayers } from './topological-sort'
import { MultiAgentOrchestrator } from '../agent/multi-agent'
import { RoleManager } from '../agent/role-manager'
import { evaluateSafeExpression } from './safe-evaluator'

const MAX_AGENT_OUTPUT_LENGTH = 100_000
/** 同一层内最多同时执行的节点数（见 workflow-engine 规格：up to 3 concurrent）。 */
const MAX_CONCURRENT_NODES = 3
const CONDITION_NODE_TYPE = 'condition'

export interface WorkflowExecutionOptions {
  /** 工作目录：传递给 agent 会话与工具执行器。 */
  cwd?: string
  /** 外部取消信号。 */
  signal?: AbortSignal
}

interface ExecutionContext {
  workflowId: string
  nodeOutputs: Map<string, unknown>
  variables: Map<string, unknown>
  status: Map<string, 'pending' | 'running' | 'success' | 'error'>
  /** 本次执行真正创建过的 agent 会话，用于精确清理。 */
  activeSessions: Set<string>
}

export class WorkflowEngine {
  private orchestrator: MultiAgentOrchestrator | null = null

  constructor(
    private agents: AgentSessionManager,
    private tools: ToolRegistry,
    roleManager?: RoleManager,
    private toolExecutor?: (
      toolName: string,
      parameters: Record<string, unknown>,
      cwd?: string,
    ) => Promise<unknown>,
  ) {
    if (roleManager) {
      this.orchestrator = new MultiAgentOrchestrator(agents, roleManager)
    }
  }

  async execute(
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
    onProgress: (progress: WorkflowProgress) => void,
    options: WorkflowExecutionOptions | string = {},
  ): Promise<Record<string, unknown>> {
    // 兼容早期 `execute(..., cwd)` 的调用方式
    const executionOptions: WorkflowExecutionOptions =
      typeof options === 'string' ? { cwd: options } : options

    const context: ExecutionContext = {
      workflowId: workflow.id,
      nodeOutputs: new Map([['start', input]]),
      variables: new Map(Object.entries(input)),
      status: new Map(workflow.nodes.map((n) => [n.id, 'pending'])),
      activeSessions: new Set(),
    }

    const executionLayers = calculateExecutionLayers(workflow.nodes, workflow.edges)

    try {
      for (const layer of executionLayers) {
        if (executionOptions.signal?.aborted) {
          throw new Error('Workflow execution aborted')
        }

        const layerController = new AbortController()
        const abortLayer = () => layerController.abort()
        const layerNodes = layer
          .map((nodeId) => workflow.nodes.find((n) => n.id === nodeId))
          .filter((node): node is WorkflowNode => Boolean(node))
        executionOptions.signal?.addEventListener('abort', abortLayer, { once: true })

        let layerError: unknown = null
        let failureHandled = false
        const visitedNodes = new Set<string>()

        const runNode = async (nodeId: string): Promise<void> => {
          const node = layerNodes.find((n) => n.id === nodeId)
          if (!node) return
          visitedNodes.add(nodeId)

          if (layerController.signal.aborted) {
            context.status.set(nodeId, 'error')
            onProgress({ nodeId, status: 'error', error: 'Skipped: an upstream node failed' })
            return
          }

          context.status.set(nodeId, 'running')
          onProgress({ nodeId, status: 'running' })

          try {
            const inputs = this.collectNodeInputs(node, workflow.nodes, workflow.edges, context)
            const result = await this.executeNode(
              node,
              inputs,
              context,
              executionOptions.cwd,
              layerController.signal,
            )
            context.nodeOutputs.set(nodeId, result)
            context.status.set(nodeId, 'success')
            onProgress({ nodeId, status: 'success', result })
          } catch (error) {
            context.status.set(nodeId, 'error')
            onProgress({ nodeId, status: 'error', error: String(error) })

            if (layerController.signal.aborted && failureHandled) {
              // 同层已经有节点失败，本节点是被连带中止的，不再向上抛错
              return
            }

            failureHandled = true
            layerError = error
            layerController.abort()
            // 停掉同层所有已创建的会话，避免兄弟节点在失败后继续跑完整个请求
            await Promise.all(layerNodes.map((layerNode) => this.abortNode(layerNode, context)))
          }
        }

        try {
          for (let i = 0; i < layer.length; i += MAX_CONCURRENT_NODES) {
            if (layerController.signal.aborted) {
              // 本层已有节点失败：尚未开始的节点直接标记为跳过，不再启动
              for (const nodeId of layer) {
                if (visitedNodes.has(nodeId)) continue
                visitedNodes.add(nodeId)
                context.status.set(nodeId, 'error')
                onProgress({ nodeId, status: 'error', error: 'Skipped: an upstream node failed' })
              }
              break
            }
            const batch = layer.slice(i, i + MAX_CONCURRENT_NODES)
            await Promise.all(batch.map((nodeId) => runNode(nodeId)))
          }
        } finally {
          executionOptions.signal?.removeEventListener('abort', abortLayer)
          layerController.abort()
        }

        if (layerError) {
          throw layerError
        }
      }
    } finally {
      await this.cleanupSessions([...context.activeSessions])
    }

    // Return end node output
    const endNode = workflow.nodes.find((n) => n.type === 'end')
    return endNode ? (context.nodeOutputs.get(endNode.id) as Record<string, unknown>) : {}
  }

  private async cleanupSessions(sessionIds: string[]): Promise<void> {
    const cleanupPromises = sessionIds.map((sid) => {
      try {
        return Promise.resolve(this.agents.destroy(sid))
      } catch {
        // Ignore cleanup errors
        return Promise.resolve()
      }
    })
    await Promise.all(cleanupPromises)
  }

  /**
   * 从所有上游节点收集输入。
   *
   * 条件节点会返回 `{ trueOutput, falseOutput }`，这里按边的 `sourceHandle`
   * 取出实际走通的那一支；未走通的分支产出 `undefined`，并会被过滤掉。
   */
  private collectNodeInputs(
    node: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext,
  ): unknown[] {
    return edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => {
        const sourceOutput = context.nodeOutputs.get(edge.source)
        const sourceNode = nodes.find((n) => n.id === edge.source)

        if (sourceNode?.type === CONDITION_NODE_TYPE) {
          if (!edge.sourceHandle) {
            throw new Error(
              `Edge ${edge.id} from condition node ${edge.source} is missing sourceHandle`,
            )
          }
          const conditionOutput = sourceOutput as
            | { trueOutput: unknown; falseOutput: unknown }
            | undefined
          return edge.sourceHandle === 'true'
            ? conditionOutput?.trueOutput
            : conditionOutput?.falseOutput
        }

        return sourceOutput
      })
      .filter((value) => value !== undefined)
  }

  private async executeNode(
    node: WorkflowNode,
    inputs: unknown[],
    context: ExecutionContext,
    cwd?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    switch (node.type) {
      case 'start':
        return context.nodeOutputs.get('start') ?? {}
      case 'end':
        return inputs.length > 1 ? inputs : (inputs[0] ?? {})
      case 'agent':
        return this.executeAgentNode(node, inputs, context, cwd, signal)
      case 'tool':
        return this.executeToolNode(node, inputs, cwd)
      case 'condition':
        return this.evaluateCondition(node, inputs, context)
      case 'multi-agent':
        return this.executeMultiAgentNode(node, inputs, context, cwd, signal)
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  /** 停止节点执行期间创建的 agent 会话（若存在）。 */
  private async abortNode(node: WorkflowNode, context: ExecutionContext): Promise<void> {
    const sessionId = `${context.workflowId}-${node.id}`
    if (!context.activeSessions.has(sessionId)) return
    try {
      await this.agents.stop(sessionId)
    } catch {
      // 取消失败不应掩盖原始错误
    }
  }

  /** 把上游输入压成单个 prompt 字符串。 */
  private stringifyInput(inputs: unknown[]): string {
    if (inputs.length === 1 && typeof inputs[0] === 'string') return inputs[0]
    if (inputs.length === 0) return ''
    const payload = inputs.length === 1 ? inputs[0] : inputs
    return typeof payload === 'string' ? payload : JSON.stringify(payload)
  }

  /**
   * 构造工具节点参数。
   *
   * 上游输入按需注入，避免把节点本来没有声明的参数强塞给工具：
   * - 参数里出现 `$input` 时，取其字段值或整体值填充该字段；
   * - 参数里未引用 `$input`，且上游输出是对象时，按字段展开作为默认参数
   *   （节点显式配置的同名参数优先）。
   */
  private buildToolParameters(
    inputs: unknown[],
    configured?: Record<string, unknown>,
  ): Record<string, unknown> {
    const upstream = inputs[0]
    const parameters = configured ?? {}
    const merged: Record<string, unknown> = {}

    const referencesInput = Object.values(parameters).some(
      (value) => typeof value === 'string' && value.includes('$input'),
    )

    if (!referencesInput && upstream && typeof upstream === 'object' && !Array.isArray(upstream)) {
      Object.assign(merged, upstream as Record<string, unknown>)
    }

    for (const [key, value] of Object.entries(parameters)) {
      merged[key] = typeof value === 'string' ? this.resolveInputReference(value, upstream) : value
    }

    return merged
  }

  /** 把参数字符串里的 `$input` / `$input.<字段>` 替换为上游数据。 */
  private resolveInputReference(value: string, upstream: unknown): unknown {
    const exact = /^\$input(?:\.([A-Za-z_$][\w$]*))?$/.exec(value)
    if (exact) {
      if (!exact[1]) return upstream
      if (upstream && typeof upstream === 'object' && !Array.isArray(upstream)) {
        return (upstream as Record<string, unknown>)[exact[1]]
      }
      return undefined
    }

    return value.replace(/\$input(?:\.([A-Za-z_$][\w$]*))?/g, (_, key?: string) => {
      const resolved =
        key && upstream && typeof upstream === 'object'
          ? (upstream as Record<string, unknown>)[key]
          : upstream
      return typeof resolved === 'string' ? resolved : JSON.stringify(resolved ?? '')
    })
  }

  private async executeAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    context: ExecutionContext,
    cwd?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const config = node.data.config as
      | {
          model?: { id: string; provider: string }
          systemPrompt?: string
        }
      | undefined

    const sessionId = `${context.workflowId}-${node.id}`
    const model = config?.model ?? { id: 'claude-sonnet-4-20250514', provider: 'anthropic' }

    try {
      await this.agents.create({
        sessionId,
        model,
        cwd: cwd || process.cwd(),
        systemPrompt: config?.systemPrompt,
      })
      context.activeSessions.add(sessionId)

      let result = ''
      for await (const chunk of this.agents.prompt(sessionId, this.stringifyInput(inputs))) {
        // 同层兄弟节点失败后本层会被中止，这里主动退出，避免请求继续跑完
        if (signal?.aborted) break
        if (chunk.type === 'text') {
          result += chunk.content
          if (result.length > MAX_AGENT_OUTPUT_LENGTH) break
        }
      }
      return result
    } catch (error) {
      // create 抛错时也登记，保证 cleanup 覆盖
      context.activeSessions.add(sessionId)
      throw error
    }
  }

  private async executeToolNode(
    node: WorkflowNode,
    inputs: unknown[],
    cwd?: string,
  ): Promise<unknown> {
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

    return this.toolExecutor(toolName, this.buildToolParameters(inputs, config?.parameters), cwd)
  }

  private async executeMultiAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    _context: ExecutionContext,
    cwd?: string,
    signal?: AbortSignal,
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

    const input = this.stringifyInput(inputs)

    const result = await this.orchestrator.execute(mode, roleIds, input, {
      cwd,
      signal,
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
