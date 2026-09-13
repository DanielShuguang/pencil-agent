import { describe, it, expect, vi, afterEach } from 'vitest'

function stubStoredLanguage(language: string | null): void {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) =>
      key === 'pencil-agent:language' ? JSON.stringify(language) : null,
    ),
    setItem: vi.fn(),
  })
}

describe('i18n 启动语言', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('使用存储中的英文偏好启动', async () => {
    stubStoredLanguage('en')

    const { default: i18n } = await import('../i18n')

    expect(i18n.language).toBe('en')
    expect(i18n.t('chat.send')).toBe('Send')
  })

  it('使用存储中的中文偏好启动', async () => {
    stubStoredLanguage('zh')

    const { default: i18n } = await import('../i18n')

    expect(i18n.language).toBe('zh')
  })

  it('没有存储值时回退到中文', async () => {
    stubStoredLanguage(null)

    const { default: i18n } = await import('../i18n')

    expect(i18n.language).toBe('zh')
  })

  it('存储值损坏时回退到中文', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => '{not-json'),
      setItem: vi.fn(),
    })

    const { default: i18n } = await import('../i18n')

    expect(i18n.language).toBe('zh')
  })
})
