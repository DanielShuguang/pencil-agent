import type { Theme } from '@shared/ipc'

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  const { colors } = theme

  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    // Theme colors are HSL values, wrap in hsl() for CSS
    root.style.setProperty(cssVarName, `hsl(${value})`)
  })

  root.classList.remove('light', 'dark')
  root.classList.add(theme.id === 'dark' ? 'dark' : 'light')
}
