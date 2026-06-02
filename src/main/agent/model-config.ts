import { safeStorage } from 'electron'
import Store from 'electron-store'
import type { ApiFormat, ModelProvider, ModelProviderInfo, ModelConfig } from '@shared/ipc'

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

export class ModelConfigManager {
  private store: Store
  private providers: Map<string, ModelProvider> = new Map()

  constructor() {
    this.store = new Store()
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const stored = this.store.get('modelProviders') as StoredProvider[] | undefined
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
        apiFormat: (item.apiFormat === 'openai' || item.apiFormat === 'anthropic') ? item.apiFormat : 'openai',
        models: item.models,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    }
  }

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

    this.store.set('modelProviders', stored)
  }

  list(): ModelProviderInfo[] {
    return Array.from(this.providers.values()).map(({ apiKey: _, ...rest }) => rest)
  }

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

  delete(providerId: string): void {
    this.providers.delete(providerId)
    this.saveToStorage()
  }

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

  deleteModel(providerId: string, modelId: string): void {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`)
    }

    provider.models = provider.models.filter((m) => m.id !== modelId)
    provider.updatedAt = Date.now()
    this.saveToStorage()
  }

  async testConnection(providerId: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      return { success: false, error: 'Provider not found' }
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

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
