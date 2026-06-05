import { safeStorage } from 'electron'
import type { ApiFormat, ModelProvider, ModelProviderInfo, ModelConfig } from '@shared/ipc'
import { appStore } from '../lib/store'

// 存储格式的 Provider 定义（API Key 已加密）
interface StoredProvider {
  id: string
  name: string
  baseUrl: string
  encryptedApiKey: string
  apiFormat?: ApiFormat
  models: ModelConfig[]
  createdAt: number
  updatedAt: number
}

// 模型配置管理器，负责 Provider 和 Model 的 CRUD 操作
export class ModelConfigManager {
  private providers: Map<string, ModelProvider> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  // 从本地存储加载 Provider 配置（解密 API Key）
  private loadFromStorage(): void {
    const stored = appStore.get('modelProviders') as StoredProvider[] | undefined
    if (!stored) return

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available, cannot load API keys securely')
    }

    for (const item of stored) {
      const buffer = Buffer.from(item.encryptedApiKey, 'base64')
      const apiKey = safeStorage.decryptString(buffer)

      this.providers.set(item.id, {
        id: item.id,
        name: item.name,
        baseUrl: item.baseUrl,
        apiKey,
        // 兼容旧数据：默认使用 openai 格式
        apiFormat:
          item.apiFormat === 'openai' || item.apiFormat === 'anthropic' ? item.apiFormat : 'openai',
        models: item.models,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    }
  }

  // 将 Provider 配置保存到本地存储（加密 API Key）
  private saveToStorage(): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available, cannot save API keys securely')
    }

    const stored: StoredProvider[] = []

    for (const provider of this.providers.values()) {
      const encryptedApiKey = safeStorage.encryptString(provider.apiKey).toString('base64')

      stored.push({
        id: provider.id,
        name: provider.name,
        baseUrl: provider.baseUrl,
        encryptedApiKey,
        apiFormat: provider.apiFormat,
        models: provider.models,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      })
    }

    appStore.set('modelProviders', stored)
  }

  // 获取所有 Provider 列表（不包含 API Key）
  list(): ModelProviderInfo[] {
    return Array.from(this.providers.values()).map(({ apiKey: _, ...rest }) => rest)
  }

  // 保存 Provider 配置（新增或更新）
  save(provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>): ModelProvider {
    const existing = this.providers.get(provider.id)
    const now = Date.now()

    const saved: ModelProvider = {
      ...provider,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    this.providers.set(provider.id, saved)
    this.saveToStorage()

    return saved
  }

  // 删除 Provider
  delete(providerId: string): void {
    this.providers.delete(providerId)
    this.saveToStorage()
  }

  // 保存模型配置（新增或更新）
  saveModel(providerId: string, model: ModelConfig): void {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }

    const existingIndex = provider.models.findIndex((m) => m.id === model.id)
    if (existingIndex >= 0) {
      provider.models[existingIndex] = model
    } else {
      provider.models.push(model)
    }

    provider.updatedAt = Date.now()
    this.saveToStorage()
  }

  // 删除模型
  deleteModel(providerId: string, modelId: string): void {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }

    provider.models = provider.models.filter((m) => m.id !== modelId)
    provider.updatedAt = Date.now()
    this.saveToStorage()
  }

  // 测试 Provider 连接（支持 OpenAI 和 Anthropic 格式）
  async testConnection(providerId: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      return { success: false, error: 'Provider not found' }
    }

    try {
      // 设置 5 秒超时
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      // 根据 API 格式选择不同的端点和请求头
      const isOpenAI = provider.apiFormat === 'openai'
      const url = isOpenAI ? `${provider.baseUrl}/models` : `${provider.baseUrl}/v1/models`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (isOpenAI) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`
      } else {
        headers['x-api-key'] = provider.apiKey
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        return { success: true }
      }

      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: (errorData as any).error?.message || `HTTP ${response.status}`,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Connection timeout' }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
