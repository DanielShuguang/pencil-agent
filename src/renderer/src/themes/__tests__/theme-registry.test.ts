import { describe, it, expect, beforeEach } from 'vitest'
import type { Theme } from '@shared/ipc'
import { themeRegistry } from '../theme-registry'
import { darkTheme } from '../dark'
import { lightTheme } from '../light'

describe('ThemeRegistry', () => {
  beforeEach(() => {
    // 注意：themeRegistry 是单例，测试间会共享状态
    // 但由于内置主题已在构造函数中注册，这里不需要重置
  })

  it('should have built-in themes registered', () => {
    expect(themeRegistry.hasTheme('dark')).toBe(true)
    expect(themeRegistry.hasTheme('light')).toBe(true)
  })

  it('should get theme by id', () => {
    const theme = themeRegistry.getTheme('dark')
    expect(theme).toBeDefined()
    expect(theme?.id).toBe('dark')
    expect(theme?.name).toBe('暗色')
  })

  it('should return null for non-existent theme', () => {
    const theme = themeRegistry.getTheme('non-existent')
    expect(theme).toBeNull()
  })

  it('should get all themes', () => {
    const themes = themeRegistry.getAllThemes()
    expect(themes.length).toBeGreaterThanOrEqual(2)
    expect(themes.some(t => t.id === 'dark')).toBe(true)
    expect(themes.some(t => t.id === 'light')).toBe(true)
  })

  it('should register a new theme', () => {
    const customTheme: Theme = {
      id: 'custom',
      name: '自定义',
      colors: {
        background: '0 0% 100%',
        foreground: '0 0% 0%',
        card: '0 0% 100%',
        cardForeground: '0 0% 0%',
        popover: '0 0% 100%',
        popoverForeground: '0 0% 0%',
        primary: '0 0% 0%',
        primaryForeground: '0 0% 100%',
        secondary: '0 0% 90%',
        secondaryForeground: '0 0% 0%',
        muted: '0 0% 90%',
        mutedForeground: '0 0% 50%',
        accent: '0 0% 90%',
        accentForeground: '0 0% 0%',
        destructive: '0 100% 50%',
        destructiveForeground: '0 0% 100%',
        border: '0 0% 80%',
        input: '0 0% 80%',
        ring: '0 0% 0%',
      },
    }

    themeRegistry.register(customTheme)
    expect(themeRegistry.hasTheme('custom')).toBe(true)
    expect(themeRegistry.getTheme('custom')).toEqual(customTheme)
  })

  it('should check if theme exists', () => {
    expect(themeRegistry.hasTheme('dark')).toBe(true)
    expect(themeRegistry.hasTheme('non-existent')).toBe(false)
  })
})
