import { create } from 'zustand'
import type { Theme, ThemeMode } from '@shared/ipc'
import { themeRegistry } from '../themes/theme-registry'

interface ThemeState {
  mode: ThemeMode
  currentThemeId: string
  isDark: boolean
  currentTheme: Theme
  setTheme: (themeId: string) => void
  setThemeMode: (mode: ThemeMode) => void
  setDark: (isDark: boolean) => void
  initFromStorage: () => Promise<void>
}

const DEFAULT_THEME_ID = 'dark'

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
    localStorage.setItem('theme-mode', themeId)
  },

  setThemeMode: (mode: ThemeMode) => {
    const themeId =
      mode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : mode
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
    localStorage.setItem('theme-mode', themeId)
  },

  setDark: (isDark: boolean) => {
    const themeId = isDark ? 'dark' : 'light'
    const theme = themeRegistry.getTheme(themeId)
    if (theme) {
      set({
        isDark,
        currentThemeId: themeId,
        currentTheme: theme,
      })
      localStorage.setItem('theme-mode', themeId)
    }
  },

  initFromStorage: async () => {
    try {
      if (window.api?.theme) {
        const state = await window.api.theme.get()
        if (state) {
          set({
            mode: state.mode,
            currentThemeId: state.currentThemeId,
            isDark: state.isDark,
            currentTheme:
              themeRegistry.getTheme(state.currentThemeId) ??
              themeRegistry.getTheme(DEFAULT_THEME_ID)!,
          })
          localStorage.setItem('theme-mode', state.currentThemeId)
        }
      }
    } catch (error) {
      console.error('Failed to init theme from storage:', error)
    }
  },
}))
