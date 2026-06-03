import type { Theme } from '@shared/ipc'
import { darkTheme } from './dark'
import { lightTheme } from './light'

class ThemeRegistry {
  private themes = new Map<string, Theme>()

  constructor() {
    this.register(darkTheme)
    this.register(lightTheme)
  }

  register(theme: Theme): void {
    this.themes.set(theme.id, theme)
  }

  getTheme(themeId: string): Theme | null {
    return this.themes.get(themeId) ?? null
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  hasTheme(themeId: string): boolean {
    return this.themes.has(themeId)
  }
}

export const themeRegistry = new ThemeRegistry()
