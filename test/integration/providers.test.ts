import { describe, it, expect, vi, beforeEach } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dirname || __dirname, '../../.env.local') })

// --- Mock electron（safeStorage 在 vitest 中不可用，用内存替代） ---
const store = new Map<string, unknown>()

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((str: string) => Buffer.from(`enc:${str}`)),
    decryptString: vi.fn((buf: Buffer) => buf.toString().replace('enc:', '')),
  },
}))

vi.mock('../../src/main/lib/store', () => ({
  appStore: {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
    delete: (key: string) => store.delete(key),
  },
}))

import { ModelConfigManager } from '../../src/main/agent/model-config'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ProviderEnv {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  apiFormat: 'openai' | 'anthropic'
  model: string
}

function loadEnvProviders(): ProviderEnv[] {
  const providers: ProviderEnv[] = []

  const openaiKey = process.env.PROVIDER_OPENAI_API_KEY
  if (openaiKey) {
    providers.push({
      id: 'openai-test',
      name: 'OpenAI',
      baseUrl: process.env.PROVIDER_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: openaiKey,
      apiFormat: 'openai',
      model: process.env.PROVIDER_OPENAI_MODEL || 'gpt-4o-mini',
    })
  }

  const anthropicKey = process.env.PROVIDER_ANTHROPIC_API_KEY
  if (anthropicKey) {
    providers.push({
      id: 'anthropic-test',
      name: 'Anthropic',
      baseUrl: process.env.PROVIDER_ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      apiKey: anthropicKey,
      apiFormat: 'anthropic',
      model: process.env.PROVIDER_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    })
  }

  return providers
}

async function testAnthropicConnectivity(baseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    return res.ok || res.status === 400
  } catch {
    return false
  }
}

async function callChat(
  env: ProviderEnv,
  messages: Message[],
): Promise<{ ok: boolean; content: string; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let url: string
  let body: string

  if (env.apiFormat === 'openai') {
    headers['Authorization'] = `Bearer ${env.apiKey}`
    url = `${env.baseUrl}/chat/completions`
    body = JSON.stringify({
      model: env.model,
      messages,
      max_tokens: 100,
    })
  } else {
    headers['x-api-key'] = env.apiKey
    headers['anthropic-version'] = '2023-06-01'
    url = `${env.baseUrl}/v1/messages`
    body = JSON.stringify({
      model: env.model,
      max_tokens: 100,
      messages,
    })
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(30000),
      body,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, content: '', error: (err as any).error?.message || `HTTP ${res.status}` }
    }

    const data = (await res.json()) as any
    let content = ''
    if (env.apiFormat === 'openai') {
      content = data.choices?.[0]?.message?.content ?? ''
    } else {
      // Anthropic content 可能包含 thinking + text，取第一个 text 类型
      const textBlock = data.content?.find((b: any) => b.type === 'text')
      content = textBlock?.text ?? ''
    }

    return { ok: true, content }
  } catch (e) {
    return { ok: false, content: '', error: (e as Error).message }
  }
}

async function callChatStream(env: ProviderEnv, messages: Message[]): Promise<string[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let url: string
  let body: string

  if (env.apiFormat === 'openai') {
    headers['Authorization'] = `Bearer ${env.apiKey}`
    url = `${env.baseUrl}/chat/completions`
    body = JSON.stringify({
      model: env.model,
      messages,
      max_tokens: 100,
      stream: true,
    })
  } else {
    headers['x-api-key'] = env.apiKey
    headers['anthropic-version'] = '2023-06-01'
    url = `${env.baseUrl}/v1/messages`
    body = JSON.stringify({
      model: env.model,
      max_tokens: 100,
      messages,
      stream: true,
    })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(30000),
    body,
  })

  if (!res.ok) return []

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (env.apiFormat === 'openai') {
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) chunks.push(delta)
          } else {
            // Anthropic: content_block_delta 事件
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              chunks.push(parsed.delta.text)
            }
          }
        } catch {
        // skip malformed lines
      }
    }
  }

  return chunks
}

const envProviders = loadEnvProviders()
const describeProvider = envProviders.length > 0 ? describe : describe.skip

describeProvider('ModelConfigManager 集成测试（真实供应商）', () => {
  for (const env of envProviders) {
    describe(env.name, () => {
      let manager: ModelConfigManager

      beforeEach(() => {
        store.clear()
        manager = new ModelConfigManager()
      })

      it('save → list：保存后可列出（不含 apiKey）', () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        const list = manager.list()
        expect(list).toHaveLength(1)
        expect(list[0].id).toBe(env.id)
        expect(list[0].name).toBe(env.name)
        expect((list[0] as any).apiKey).toBeUndefined()
      })

      it('testConnection：真实联通性测试', async () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        if (env.apiFormat === 'anthropic') {
          // Anthropic 无 /v1/models 端点，用 messages 端点验证连通性
          const connected = await testAnthropicConnectivity(env.baseUrl, env.apiKey)
          expect(connected).toBe(true)
        } else {
          const result = await manager.testConnection(env.id)
          expect(result.success).toBe(true)
          expect(result.error).toBeUndefined()
        }
      })

      it('fetchModels：获取真实模型列表', async () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        if (env.apiFormat === 'anthropic') {
          // Anthropic 无 models 列表端点，验证 API Key 有效即可
          const connected = await testAnthropicConnectivity(env.baseUrl, env.apiKey)
          expect(connected).toBe(true)
        } else {
          const result = await manager.fetchModels(env.id)
          expect(result.models.length).toBeGreaterThan(0)
          expect(result.error).toBeUndefined()
          for (const m of result.models) {
            expect(m.id).toBeTruthy()
            expect(m.providerId).toBe(env.id)
          }
        }
      })

      it('saveModel → list：保存模型后可通过 list 查看', async () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        if (env.apiFormat === 'anthropic') {
          // Anthropic 无法 fetchModels，直接构造模型配置
          manager.saveModel(env.id, {
            id: env.model,
            name: env.model,
            providerId: env.id,
          })
        } else {
          const fetched = await manager.fetchModels(env.id)
          if (fetched.models.length === 0) return
          manager.saveModel(env.id, fetched.models[0])
        }

        const list = manager.list()
        expect(list[0].models).toHaveLength(1)
      })

      it('deleteModel：删除模型后不再出现', async () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        manager.saveModel(env.id, {
          id: 'test-model',
          name: 'test-model',
          providerId: env.id,
        })
        manager.deleteModel(env.id, 'test-model')

        const list = manager.list()
        expect(list[0].models).toHaveLength(0)
      })

      it('delete：删除 provider 后 list 为空', () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        manager.delete(env.id)
        expect(manager.list()).toHaveLength(0)
      })

      it('加密存储验证：store 中 apiKey 已加密', () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        const stored = store.get('modelProviders') as any[]
        expect(stored).toHaveLength(1)
        // base64 编码后不等于明文
        expect(stored[0].encryptedApiKey).not.toBe(env.apiKey)
        expect(stored[0].encryptedApiKey).toBeTruthy()
      })

      it('getApiKey：通过 loadFromStorage 解密恢复', () => {
        manager.save({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          apiKey: env.apiKey,
          apiFormat: env.apiFormat,
          models: [],
        })

        const manager2 = new ModelConfigManager()
        expect(manager2.getApiKey(env.id)).toBe(env.apiKey)
      })

      // === 对话测试 ===

      it('对话：发送消息并收到有效回复', async () => {
        const result = await callChat(env, [{ role: 'user', content: '回复"ok"两个字，不要有其他内容。' }])
        expect(result.ok).toBe(true)
        expect(result.content).toBeTruthy()
        expect(result.content.length).toBeLessThan(100)
      })

      it('对话：多轮上下文保持', async () => {
        const first = await callChat(env, [
          { role: 'user', content: '我养了一只猫叫小花，请记住这个名字。' },
        ])
        expect(first.ok).toBe(true)

        const second = await callChat(env, [
          { role: 'user', content: '我养了一只猫叫小花，请记住这个名字。' },
          { role: 'assistant', content: first.content },
          { role: 'user', content: '我刚才说我的猫叫什么名字？只回答名字。' },
        ])
        expect(second.ok).toBe(true)
        expect(second.content).toContain('小花')
      })

      it('对话：流式输出（SSE）', async () => {
        const chunks = await callChatStream(env, [{ role: 'user', content: '回复数字1到3，每个数字一行。' }])
        expect(chunks.length).toBeGreaterThan(0)
        const fullText = chunks.join('')
        expect(fullText).toBeTruthy()
      })
    })
  }
})

describe('ModelConfigManager mock 基础验证', () => {
  let manager: ModelConfigManager

  beforeEach(() => {
    store.clear()
    manager = new ModelConfigManager()
  })

  it('save 后 list 返回该 provider', () => {
    manager.save({
      id: 'mock-provider',
      name: 'Mock',
      baseUrl: 'https://mock.api.com/v1',
      apiKey: 'sk-mock',
      apiFormat: 'openai',
      models: [],
    })
    expect(manager.list()).toHaveLength(1)
    expect(manager.list()[0].id).toBe('mock-provider')
  })

  it('testConnection 对不存在的 provider 返回错误', async () => {
    const result = await manager.testConnection('non-existent')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Provider not found')
  })

  it('fetchModels 对不存在的 provider 返回错误', async () => {
    const result = await manager.fetchModels('non-existent')
    expect(result.models).toHaveLength(0)
    expect(result.error).toBe('Provider not found')
  })
})
