import {
  createAgentSession,
  type AgentSession,
  type AgentSessionEvent,
  AuthStorage,
  ModelRegistry,
} from '@earendil-works/pi-coding-agent'
import { getModel, type KnownProvider } from '@earendil-works/pi-ai'

interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error'
  content: string
  metadata?: Record<string, unknown>
}

interface SessionConfig {
  sessionId: string
  model: { id: string; provider: string }
  systemPrompt?: string
  tools?: string[]
}

export class AgentSessionManager {
  private sessions = new Map<string, AgentSession>()
  private authStorage: AuthStorage
  private modelRegistry: ModelRegistry

  constructor() {
    this.authStorage = AuthStorage.inMemory()
    this.modelRegistry = ModelRegistry.inMemory(this.authStorage)
  }

  async create(config: SessionConfig): Promise<void> {
    const provider = config.model.provider as KnownProvider
    const modelId = config.model.id as never
    const model = getModel(provider, modelId)

    const { session } = await createAgentSession({
      model,
      authStorage: this.authStorage,
      modelRegistry: this.modelRegistry,
    })

    this.sessions.set(config.sessionId, session)
  }

  async *prompt(sessionId: string, message: string): AsyncGenerator<AgentChunk> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    let resolveNext: ((value: IteratorResult<AgentChunk>) => void) | null = null
    const chunks: AgentChunk[] = []
    let done = false

    const unsubscribe = session.subscribe((event: AgentSessionEvent) => {
      if (event.type === 'message_update') {
        const message = event.message
        if (message.role === 'assistant' && 'content' in message) {
          const textContent = (message.content as any[]).find((c: any) => c.type === 'text')
          if (textContent && 'text' in textContent) {
            const chunk: AgentChunk = {
              type: 'text',
              content: textContent.text,
            }
            if (resolveNext) {
              const r = resolveNext
              resolveNext = null
              r({ value: chunk, done: false })
            } else {
              chunks.push(chunk)
            }
          }
        }
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
    }
  }

  destroyAll(): void {
    for (const [sessionId] of this.sessions) {
      this.destroy(sessionId)
    }
  }
}
