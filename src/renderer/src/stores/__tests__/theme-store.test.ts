import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../theme-store'

describe('ThemeStore', () => {
  beforeEach(() => {
    // 重置 store 到默认状态
    useThemeStore.setState({
      mode: 'system',
      currentThemeId: 'dark',
      isDark: true,
      currentTheme: useThemeStore.getState().currentTheme,
    })
  })

  it('should have default state', () => {
    const state = useThemeStore.getState()
    expect(state.mode).toBe('system')
    expect(state.currentThemeId).toBe('dark')
    expect(state.isDark).toBe(true)
    expect(state.currentTheme.id).toBe('dark')
  })

  it('should set theme by id', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('light')

    const state = useThemeStore.getState()
    expect(state.currentThemeId).toBe('light')
    expect(state.isDark).toBe(false)
    expect(state.currentTheme.id).toBe('light')
  })

  it('should not set invalid theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('non-existent')

    const state = useThemeStore.getState()
    expect(state.currentThemeId).toBe('dark')
  })

  it('should set theme mode', () => {
    const { setThemeMode } = useThemeStore.getState()
    setThemeMode('light')

    const state = useThemeStore.getState()
    expect(state.mode).toBe('light')
  })

  it('should set dark mode', () => {
    const { setDark } = useThemeStore.getState()
    setDark(false)

    const state = useThemeStore.getState()
    expect(state.isDark).toBe(false)
    expect(state.currentThemeId).toBe('light')
  })

  it('should set light mode', () => {
    const { setDark } = useThemeStore.getState()
    setDark(true)

    const state = useThemeStore.getState()
    expect(state.isDark).toBe(true)
    expect(state.currentThemeId).toBe('dark')
  })
})
