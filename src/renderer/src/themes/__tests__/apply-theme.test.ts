import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyTheme } from '../apply-theme'
import type { Theme } from '@shared/ipc'

describe('applyTheme', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>
  let mockClassList: {
    remove: ReturnType<typeof vi.fn>
    add: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSetProperty = vi.fn()
    mockClassList = {
      remove: vi.fn(),
      add: vi.fn(),
    }

    vi.spyOn(document, 'documentElement', 'get').mockReturnValue({
      style: { setProperty: mockSetProperty },
      classList: mockClassList,
    } as any)
  })

  it('should apply theme colors as CSS variables', () => {
    const theme: Theme = {
      id: 'dark',
      name: '暗色',
      colors: {
        background: '222.2 84% 4.9%',
        foreground: '210 40% 98%',
        card: '222.2 84% 4.9%',
        cardForeground: '210 40% 98%',
        popover: '222.2 84% 4.9%',
        popoverForeground: '210 40% 98%',
        primary: '210 40% 98%',
        primaryForeground: '222.2 47.4% 11.2%',
        secondary: '217.2 32.6% 17.5%',
        secondaryForeground: '210 40% 98%',
        muted: '217.2 32.6% 17.5%',
        mutedForeground: '215 20.2% 65.1%',
        accent: '217.2 32.6% 17.5%',
        accentForeground: '210 40% 98%',
        destructive: '0 62.8% 30.6%',
        destructiveForeground: '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        input: '217.2 32.6% 17.5%',
        ring: '212.7 26.8% 83.9%',
      },
    }

    applyTheme(theme)

    expect(mockSetProperty).toHaveBeenCalledWith('--background', 'hsl(222.2 84% 4.9%)')
    expect(mockSetProperty).toHaveBeenCalledWith('--foreground', 'hsl(210 40% 98%)')
    expect(mockSetProperty).toHaveBeenCalledWith('--card', 'hsl(222.2 84% 4.9%)')
    expect(mockSetProperty).toHaveBeenCalledWith('--primary', 'hsl(210 40% 98%)')
  })

  it('should add dark class for dark theme', () => {
    const theme: Theme = {
      id: 'dark',
      name: '暗色',
      colors: {} as any,
    }

    applyTheme(theme)

    expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark')
    expect(mockClassList.add).toHaveBeenCalledWith('dark')
  })

  it('should add light class for light theme', () => {
    const theme: Theme = {
      id: 'light',
      name: '亮色',
      colors: {} as any,
    }

    applyTheme(theme)

    expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark')
    expect(mockClassList.add).toHaveBeenCalledWith('light')
  })

  it('should convert camelCase to kebab-case', () => {
    const theme: Theme = {
      id: 'dark',
      name: '暗色',
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
      } as any,
    }

    applyTheme(theme)

    expect(mockSetProperty).toHaveBeenCalledWith('--card-foreground', 'hsl(0 0% 0%)')
    expect(mockSetProperty).toHaveBeenCalledWith('--popover-foreground', 'hsl(0 0% 0%)')
    expect(mockSetProperty).toHaveBeenCalledWith('--primary-foreground', 'hsl(0 0% 100%)')
  })
})
