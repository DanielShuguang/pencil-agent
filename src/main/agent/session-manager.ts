import {
  createAgentSession,
  DefaultResourceLoader,
  type AgentSession,
  type AgentSessionEvent,
  type ExtensionFactory,
  AuthStorage,
  ModelRegistry,
  createBashTool,
  createReadTool,
  createWriteTool,
  createEditTool,
} from '@earendil-works/pi-coding-agent'
import { getModel, type KnownProvider } from '@earendil-works/pi-ai'

interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error' | 'compaction'
  content: string
  metadata?: Record<string, unknown>
}

interface SessionConfig {
  sessionId: string
  model: { id: string; provider: string }
  cwd: string
  systemPrompt?: string
  tools?: string[]
}

export class AgentSessionManager {
  private sessions = new Map<string, AgentSession>()
  private sessionConfigs = new Map<string, SessionConfig>()
  private authStorage: AuthStorage
  private modelRegistry: ModelRegistry
  private getApiKey: (provider: string) => string | null
  private extensionFactories: ExtensionFactory[] = []

  constructor(getApiKey: (provider: string) => string | null = () => null) {
    this.getApiKey = getApiKey
    this.authStorage = AuthStorage.inMemory()
    this.modelRegistry = ModelRegistry.inMemory(this.authStorage)
  }

  // 会话 cwd 映射（供 permission-extension 等使用）
  private sessionCwds = new Map<string, string>()

  // 注册扩展工厂函数（在 create 时注入到每个 session）
  addExtension(factory: ExtensionFactory): void {
    this.extensionFactories.push(factory)
  }

  // 获取会话的 cwd
  getSessionCwd(sessionId: string): string | null {
    return this.sessionCwds.get(sessionId) ?? null
  }

  async create(config: SessionConfig): Promise<void> {
    const provider = config.model.provider as KnownProvider
    const modelId = config.model.id as never
    const model = getModel(provider, modelId)

    // 注入 API Key 到 AuthStorage
    const apiKey = this.getApiKey(provider)
    if (apiKey) {
      this.authStorage.setRuntimeApiKey(provider, apiKey)
    }

    // 构建系统提示词，注入工作目录信息
    const cwdInfo = `<working_directory>
${config.cwd}
</working_directory>

重要：你的所有文件操作必须基于上述工作目录。当用户询问"当前目录"或"工作目录"时，回答：${config.cwd}`
    
    // Windows 平台提示使用 PowerShell 语法
    const shellInfo = process.platform === 'win32'
      ? `\n\n<shell_environment>
Windows PowerShell 环境：
- 使用 Get-ChildItem 或 ls（而非 dir）
- 使用 Get-Content（而非 cat）
- 使用 Set-Location 或 cd
- 不要使用 bash 语法
</shell_environment>`
      : ''
    
    const baseSystemPrompt = config.systemPrompt || ''
    const fullSystemPrompt = baseSystemPrompt
      ? `${baseSystemPrompt}\n\n${cwdInfo}${shellInfo}`
      : `${cwdInfo}${shellInfo}`

    // 创建 ResourceLoader 并注入扩展
    const resourceLoader = new DefaultResourceLoader({
      cwd: config.cwd,
      agentDir: '~/.pi/agent',
      extensionFactories: this.extensionFactories,
      systemPrompt: fullSystemPrompt,
    })
    await resourceLoader.reload()

    // Windows 上使用 PowerShell 避免 WSL bash 问题
    const shellPath = process.platform === 'win32' ? 'powershell.exe' : undefined

    const { session } = await createAgentSession({
      model,
      authStorage: this.authStorage,
      modelRegistry: this.modelRegistry,
      resourceLoader,
      noTools: 'builtin',
      customTools: [
        createReadTool(config.cwd),
        createWriteTool(config.cwd),
        createEditTool(config.cwd),
        createBashTool(config.cwd, { shellPath }),
      ],
    })

    this.sessions.set(config.sessionId, session)
    this.sessionConfigs.set(config.sessionId, config)
    this.sessionCwds.set(config.sessionId, config.cwd)
  }

  async *prompt(
    sessionId: string,
    message: string,
    model?: { id: string; provider: string },
    cwd?: string,
  ): AsyncGenerator<AgentChunk> {
    let session = this.sessions.get(sessionId)
    if (!session) {
      // 会话不存在时自动重建（应用重启后主进程内存丢失的情况）
      // 优先使用存储的配置，确保恢复一致性
      const storedConfig = this.sessionConfigs.get(sessionId)
      const configToUse = storedConfig || (model && cwd ? { sessionId, model, cwd } : null)
      
      if (configToUse) {
        await this.create(configToUse)
        session = this.sessions.get(sessionId)
      }
      if (!session) {
        throw new Error(`Session ${sessionId} not found`)
      }
    }

    let resolveNext: ((value: IteratorResult<AgentChunk>) => void) | null = null
    const chunks: AgentChunk[] = []
    let done = false
    let currentToolCallId: string | null = null
    let toolCallCounter = 0

    const generateToolCallId = (): string => {
      toolCallCounter++
      return `tc-${sessionId}-${toolCallCounter}-${Date.now()}`
    }

    const emitChunk = (chunk: AgentChunk) => {
      if (resolveNext) {
        const r = resolveNext
        resolveNext = null
        r({ value: chunk, done: false })
      } else {
        chunks.push(chunk)
      }
    }

    const unsubscribe = session.subscribe((event: AgentSessionEvent) => {
      if (event.type === 'message_update') {
        const assistantEvent = (event as any).assistantMessageEvent
        if (assistantEvent?.type === 'text_delta' && assistantEvent.delta) {
          emitChunk({ type: 'text', content: assistantEvent.delta })
        } else if (assistantEvent?.type === 'thinking_delta' && assistantEvent.delta) {
          emitChunk({ type: 'thinking', content: assistantEvent.delta })
        }
      } else if (event.type === 'tool_execution_start') {
        const e = event as any
        currentToolCallId = generateToolCallId()
        emitChunk({
          type: 'tool_call',
          content: '',
          metadata: { toolCallId: currentToolCallId, toolName: e.toolName, parameters: e.args },
        })
      } else if (event.type === 'tool_execution_end') {
        const e = event as any
        emitChunk({
          type: 'tool_result',
          content: typeof e.result === 'string' ? e.result : JSON.stringify(e.result),
          metadata: {
            toolCallId: currentToolCallId,
            toolName: e.toolName,
            error: e.isError ? (typeof e.result === 'string' ? e.result : 'Tool execution failed') : undefined,
          },
        })
        currentToolCallId = null
      } else if (event.type === 'compaction_end') {
        const e = event as any
        const result = e.result
        emitChunk({
          type: 'compaction',
          content: result?.summary || '',
          metadata: {
            reason: e.reason,
            tokensBefore: result?.tokensBefore,
            aborted: e.aborted,
          },
        })
      } else if (event.type === 'message_end') {
        done = true
        if (resolveNext) {
          const r = resolveNext
          resolveNext = null
          r({ value: undefined as any, done: true })
        }
      } else if (event.type === 'agent_end') {
        done = true
        if (resolveNext) {
          const r = resolveNext
          resolveNext = null
          r({ value: undefined as any, done: true })
        }
      }
    })

    try {
      await session.prompt(message)

      while (!done) {
        if (chunks.length > 0) {
          const chunk = chunks.shift()!
          yield chunk
        } else {
          const result = await new Promise<IteratorResult<AgentChunk>>((resolve) => {
            resolveNext = resolve
          })
          if (!result.done) {
            yield result.value
          }
        }
      }

      // Yield remaining chunks
      while (chunks.length > 0) {
        yield chunks.shift()!
      }
    } finally {
      unsubscribe()
    }
  }

  async stop(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      await session.abort()
    }
  }

  destroy(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.dispose()
      this.sessions.delete(sessionId)
      this.sessionConfigs.delete(sessionId)
      this.sessionCwds.delete(sessionId)
    }
  }

  destroyAll(): void {
    for (const [sessionId] of this.sessions) {
      this.destroy(sessionId)
    }
  }
}
