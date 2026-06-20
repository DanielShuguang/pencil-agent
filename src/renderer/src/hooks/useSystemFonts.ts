import { useState, useEffect } from 'react'

export interface FontOption {
  label: string
  value: string
}

const FALLBACK_FONTS: FontOption[] = [
  { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'Maple Mono NF CN', value: "'Maple Mono NF CN', monospace" },
]

async function querySystemFonts(): Promise<FontOption[]> {
  try {
    // 优先使用 IPC 接口获取系统字体
    if (window.api?.system?.getFonts) {
      const fonts = await window.api.system.getFonts()
      if (fonts && fonts.length > 0) {
        return fonts.map((family: string) => ({
          label: family,
          value: `'${family}', sans-serif`,
        }))
      }
    }

    // 回退到 navigator.fonts API
    const fontsApi = (navigator as unknown as Record<string, unknown>).fonts as
      | { query: () => AsyncIterable<{ family: string }> }
      | undefined

    if (!fontsApi || typeof fontsApi.query !== 'function') {
      return FALLBACK_FONTS
    }

    const seen = new Set<string>()
    const fonts: FontOption[] = []

    for await (const font of fontsApi.query()) {
      if (seen.has(font.family)) continue
      seen.add(font.family)
      fonts.push({
        label: font.family,
        value: `'${font.family}', sans-serif`,
      })
    }

    fonts.sort((a, b) => a.label.localeCompare(b.label))

    return fonts.length > 0 ? fonts : FALLBACK_FONTS
  } catch {
    return FALLBACK_FONTS
  }
}

export function useSystemFonts() {
  const [fonts, setFonts] = useState<FontOption[]>(FALLBACK_FONTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void querySystemFonts().then((result) => {
      if (!cancelled) {
        setFonts(result)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { fonts, loading }
}
