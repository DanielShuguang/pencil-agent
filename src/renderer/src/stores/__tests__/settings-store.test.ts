import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from '../settings-store'

beforeEach(() => {
  vi.stubGlobal('console', { error: vi.fn() })
  vi.stubGlobal('window', {
    api: {
      settings: {
        saveKey: vi.fn().mockResolvedValue(undefined),
        getKey: vi.fn().mockResolvedValue(null),
        deleteKey: vi.fn().mockResolvedValue(undefined),
      },
    },
  })
  useSettingsStore.setState({
    apiKeys: {},
  })
})

describe('settings-store', () => {
  it('defaults to empty keys', () => {
    const state = useSettingsStore.getState()
    expect(state.apiKeys).toEqual({})
  })

  it('loadApiKey returns null for unknown provider', async () => {
    const key = await useSettingsStore.getState().loadApiKey('anthropic')
    expect(key).toBeNull()
  })

  it('saveApiKey stores a key for a provider', async () => {
    await useSettingsStore.getState().saveApiKey('anthropic', 'sk-ant-xxx')
    expect(useSettingsStore.getState().apiKeys.anthropic).toBe('sk-ant-xxx')
  })

  it('saveApiKey merges with existing keys', async () => {
    await useSettingsStore.getState().saveApiKey('anthropic', 'sk-ant-xxx')
    await useSettingsStore.getState().saveApiKey('openai', 'sk-openai-xxx')
    expect(useSettingsStore.getState().apiKeys).toEqual({
      anthropic: 'sk-ant-xxx',
      openai: 'sk-openai-xxx',
    })
  })

  it('deleteApiKey removes a key', async () => {
    await useSettingsStore.getState().saveApiKey('anthropic', 'sk-ant-xxx')
    await useSettingsStore.getState().deleteApiKey('anthropic')
    expect(useSettingsStore.getState().apiKeys.anthropic).toBeUndefined()
  })
})
