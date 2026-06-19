import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '../theme-store'

vi.stubGlobal('window', {
  ...window,
  matchMedia: vi.fn(() => ({ matches: false })),
  api: { theme: { setMode: vi.fn(), setTheme: vi.fn() } },
})

describe('ThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      mode: 'system',
      currentThemeId: 'dark',
      isDark: true,
      currentTheme: useThemeStore.getState().currentTheme,
    })
    vi.clearAllMocks()
  })

  it('should have default state', () => {
    const state = useThemeStore.getState()
    expect(state.mode).toBe('system')
    expect(state.currentThemeId).toBe('dark')
    expect(state.isDark).toBe(true)
    expect(state.currentTheme.id).toBe('dark')
  })

  it('should set theme by id and call IPC', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('light')

    const state = useThemeStore.getState()
    expect(state.currentThemeId).toBe('light')
    expect(state.isDark).toBe(false)
    expect(state.currentTheme.id).toBe('light')
    expect(window.api.theme.setTheme).toHaveBeenCalledWith('light')
  })

  it('should not set invalid theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('non-existent')

    const state = useThemeStore.getState()
    expect(state.currentThemeId).toBe('dark')
    expect(window.api.theme.setTheme).not.toHaveBeenCalled()
  })

  it('should set theme mode and call IPC', () => {
    const { setThemeMode } = useThemeStore.getState()
    setThemeMode('light')

    const state = useThemeStore.getState()
    expect(state.mode).toBe('light')
    expect(state.currentThemeId).toBe('light')
    expect(window.api.theme.setMode).toHaveBeenCalledWith('light')
  })

  it('should apply state from main process', () => {
    const { applyFromMain } = useThemeStore.getState()
    applyFromMain({ mode: 'light', currentThemeId: 'light', isDark: false })

    const state = useThemeStore.getState()
    expect(state.mode).toBe('light')
    expect(state.currentThemeId).toBe('light')
    expect(state.isDark).toBe(false)
    expect(state.currentTheme.id).toBe('light')
  })
})
