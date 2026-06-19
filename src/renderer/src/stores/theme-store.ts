import { create } from 'zustand'
import type { Theme, ThemeMode, ThemeState as MainThemeState } from '@shared/ipc'
import { themeRegistry } from '../themes/theme-registry'

interface ThemeState {
  mode: ThemeMode
  currentThemeId: string
  isDark: boolean
  currentTheme: Theme
  setTheme: (themeId: string) => void
  setThemeMode: (mode: ThemeMode) => void
  applyFromMain: (state: MainThemeState) => void
  initFromStorage: () => Promise<void>
}

const DEFAULT_THEME_ID = 'dark'

function resolveThemeId(mode: ThemeMode): string {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  currentThemeId: DEFAULT_THEME_ID,
  isDark: true,
  currentTheme: themeRegistry.getTheme(DEFAULT_THEME_ID)!,

  setTheme: (themeId: string) => {
    const theme = themeRegistry.getTheme(themeId)
    if (!theme) {
      console.warn(`Theme not found: ${themeId}`)
      return
    }
    set({
      currentThemeId: themeId,
      currentTheme: theme,
      isDark: themeId === 'dark',
    })
    window.api?.theme?.setTheme(themeId)
  },

  setThemeMode: (mode: ThemeMode) => {
    const themeId = resolveThemeId(mode)
    const theme = themeRegistry.getTheme(themeId)
    if (theme) {
      set({
        mode,
        currentThemeId: themeId,
        currentTheme: theme,
        isDark: themeId === 'dark',
      })
    } else {
      set({ mode })
    }
    window.api?.theme?.setMode(mode)
  },

  applyFromMain: (state: MainThemeState) => {
    const themeId = state.mode === 'system' ? state.currentThemeId : state.mode
    const theme = themeRegistry.getTheme(themeId) ?? themeRegistry.getTheme(DEFAULT_THEME_ID)!
    set({
      mode: state.mode as ThemeMode,
      currentThemeId: state.currentThemeId,
      isDark: state.isDark,
      currentTheme: theme,
    })
  },

  initFromStorage: async () => {
    try {
      if (window.api?.theme) {
        const state = await window.api.theme.get()
        if (state) {
          const theme = themeRegistry.getTheme(state.currentThemeId) ?? themeRegistry.getTheme(DEFAULT_THEME_ID)!
          set({
            mode: state.mode as ThemeMode,
            currentThemeId: state.currentThemeId,
            isDark: state.isDark,
            currentTheme: theme,
          })
        }
      }
    } catch (error) {
      console.error('Failed to init theme from storage:', error)
    }
  },
}))
