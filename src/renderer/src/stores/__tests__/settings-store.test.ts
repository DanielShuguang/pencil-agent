import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../settings-store'

beforeEach(() => {
  useSettingsStore.setState({ theme: 'system', language: 'zh-CN', apiKeys: {} })
})

describe('settings-store', () => {
  it('defaults to system theme and zh-CN', () => {
    const state = useSettingsStore.getState()
    expect(state.theme).toBe('system')
    expect(state.language).toBe('zh-CN')
    expect(state.apiKeys).toEqual({})
  })

  it('setTheme updates the theme', () => {
    useSettingsStore.getState().setTheme('dark')
    expect(useSettingsStore.getState().theme).toBe('dark')
  })

  it('setLanguage updates the language', () => {
    useSettingsStore.getState().setLanguage('en-US')
    expect(useSettingsStore.getState().language).toBe('en-US')
  })

  it('setApiKey stores a key for a provider', () => {
    useSettingsStore.getState().setApiKey('anthropic', 'sk-ant-xxx')
    expect(useSettingsStore.getState().apiKeys.anthropic).toBe('sk-ant-xxx')
  })

  it('setApiKey merges with existing keys', () => {
    useSettingsStore.getState().setApiKey('anthropic', 'sk-ant-xxx')
    useSettingsStore.getState().setApiKey('openai', 'sk-openai-xxx')
    expect(useSettingsStore.getState().apiKeys).toEqual({
      anthropic: 'sk-ant-xxx',
      openai: 'sk-openai-xxx'
    })
  })

  it('setApiKey overwrites existing key for same provider', () => {
    useSettingsStore.getState().setApiKey('anthropic', 'old-key')
    useSettingsStore.getState().setApiKey('anthropic', 'new-key')
    expect(useSettingsStore.getState().apiKeys.anthropic).toBe('new-key')
  })
})
