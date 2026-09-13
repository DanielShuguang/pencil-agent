import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSettingsStore } from '../settings-store'
import { useUpdateStore } from '../update-store'
import { useThemeStore } from '../theme-store'

describe('settings-store 错误路径', () => {
  beforeEach(() => {
    useSettingsStore.setState({ apiKeys: {} })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadApiKey 异常时返回 null 并保持状态', async () => {
    vi.stubGlobal('window', {
      api: { settings: { getKey: vi.fn().mockRejectedValue(new Error('ipc down')) } },
    })

    await expect(useSettingsStore.getState().loadApiKey('openai')).resolves.toBeNull()
    expect(useSettingsStore.getState().apiKeys).toEqual({})
  })

  it('saveApiKey 异常时抛出并保持状态', async () => {
    vi.stubGlobal('window', {
      api: { settings: { saveKey: vi.fn().mockRejectedValue(new Error('disk full')) } },
    })

    await expect(useSettingsStore.getState().saveApiKey('openai', 'sk')).rejects.toThrow(
      'disk full',
    )
    expect(useSettingsStore.getState().apiKeys).toEqual({})
  })

  it('deleteApiKey 异常时抛出并保持状态', async () => {
    vi.stubGlobal('window', {
      api: { settings: { deleteKey: vi.fn().mockRejectedValue(new Error('locked')) } },
    })
    useSettingsStore.setState({ apiKeys: { openai: 'sk' } })

    await expect(useSettingsStore.getState().deleteApiKey('openai')).rejects.toThrow('locked')
    expect(useSettingsStore.getState().apiKeys).toEqual({ openai: 'sk' })
  })

  it('loadApiKey 把 null 存为空字符串', async () => {
    vi.stubGlobal('window', {
      api: { settings: { getKey: vi.fn().mockResolvedValue(null) } },
    })

    await expect(useSettingsStore.getState().loadApiKey('openai')).resolves.toBeNull()
    expect(useSettingsStore.getState().apiKeys.openai).toBe('')
  })
})

describe('update-store 错误与事件路径', () => {
  beforeEach(() => {
    useUpdateStore.setState({ status: 'idle', progress: 0, error: null, updateInfo: null })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('缺少 updater API 时 checkForUpdates 直接返回', async () => {
    vi.stubGlobal('window', { api: {} })

    await useUpdateStore.getState().checkForUpdates()

    expect(useUpdateStore.getState().status).toBe('idle')
  })

  it('检查更新返回 ok 时回到 idle', async () => {
    vi.stubGlobal('window', {
      api: { updater: { check: vi.fn().mockResolvedValue({ status: 'ok' }) } },
    })

    await useUpdateStore.getState().checkForUpdates()

    expect(useUpdateStore.getState().status).toBe('idle')
  })

  it('检查更新抛错时进入 error', async () => {
    vi.stubGlobal('window', {
      api: { updater: { check: vi.fn().mockRejectedValue(new Error('network')) } },
    })

    await useUpdateStore.getState().checkForUpdates()

    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toBe('network')
  })

  it('下载返回 error 时进入 error 并带默认文案', async () => {
    vi.stubGlobal('window', {
      api: { updater: { download: vi.fn().mockResolvedValue({ status: 'error' }) } },
    })

    await useUpdateStore.getState().downloadUpdate()

    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toBe('下载更新失败')
  })

  it('下载抛错时进入 error', async () => {
    vi.stubGlobal('window', {
      api: { updater: { download: vi.fn().mockRejectedValue(new Error('offline')) } },
    })

    await useUpdateStore.getState().downloadUpdate()

    expect(useUpdateStore.getState().error).toBe('offline')
  })

  it('缺少 updater API 时 download/install 是空操作', async () => {
    vi.stubGlobal('window', { api: {} })

    await expect(useUpdateStore.getState().downloadUpdate()).resolves.toBeUndefined()
    expect(() => useUpdateStore.getState().installUpdate()).not.toThrow()
  })

  it('缺少 updater API 时 initListeners 返回空清理函数', () => {
    vi.stubGlobal('window', { api: {} })

    const cleanup = useUpdateStore.getState().initListeners()

    expect(typeof cleanup).toBe('function')
    expect(() => cleanup()).not.toThrow()
  })

  it('available / downloaded 事件写入更新信息', () => {
    let infoCb: ((data: { status: string; info: object }) => void) | undefined
    vi.stubGlobal('window', {
      api: {
        updater: {
          onStatus: vi.fn(() => vi.fn()),
          onInfo: vi.fn((cb) => {
            infoCb = cb
            return vi.fn()
          }),
          onError: vi.fn(() => vi.fn()),
          onProgress: vi.fn(() => vi.fn()),
        },
      },
    })

    useUpdateStore.getState().initListeners()

    infoCb!({ status: 'available', info: { version: '1.1.0' } })
    expect(useUpdateStore.getState().status).toBe('available')
    expect(useUpdateStore.getState().updateInfo).toEqual({ version: '1.1.0' })

    infoCb!({ status: 'downloaded', info: { version: '1.1.0' } })
    expect(useUpdateStore.getState().status).toBe('downloaded')

    infoCb!({ status: 'not-available', info: {} })
    expect(useUpdateStore.getState().status).toBe('idle')
  })

  it('status/error 事件更新对应状态', () => {
    let statusCb: ((data: { status: string }) => void) | undefined
    let errorCb: ((data: { error: string }) => void) | undefined
    vi.stubGlobal('window', {
      api: {
        updater: {
          onStatus: vi.fn((cb) => {
            statusCb = cb
            return vi.fn()
          }),
          onInfo: vi.fn(() => vi.fn()),
          onError: vi.fn((cb) => {
            errorCb = cb
            return vi.fn()
          }),
          onProgress: vi.fn(() => vi.fn()),
        },
      },
    })

    useUpdateStore.getState().initListeners()

    statusCb!({ status: 'downloading' })
    expect(useUpdateStore.getState().status).toBe('downloading')

    errorCb!({ error: 'checksum mismatch' })
    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toBe('checksum mismatch')
  })

  it('清理函数注销全部四个监听', () => {
    const unsub = { status: vi.fn(), info: vi.fn(), error: vi.fn(), progress: vi.fn() }
    vi.stubGlobal('window', {
      api: {
        updater: {
          onStatus: vi.fn(() => unsub.status),
          onInfo: vi.fn(() => unsub.info),
          onError: vi.fn(() => unsub.error),
          onProgress: vi.fn(() => unsub.progress),
        },
      },
    })

    useUpdateStore.getState().initListeners()()

    expect(unsub.status).toHaveBeenCalled()
    expect(unsub.info).toHaveBeenCalled()
    expect(unsub.error).toHaveBeenCalled()
    expect(unsub.progress).toHaveBeenCalled()
  })
})

describe('theme-store 初始化', () => {
  const defaultTheme = useThemeStore.getState().currentTheme

  beforeEach(() => {
    useThemeStore.setState({
      mode: 'system',
      currentThemeId: 'dark',
      isDark: true,
      currentTheme: defaultTheme,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('initFromStorage 应用主进程返回的主题', async () => {
    vi.stubGlobal('window', {
      api: {
        theme: {
          get: vi.fn().mockResolvedValue({ mode: 'light', currentThemeId: 'light', isDark: false }),
        },
      },
    })

    await useThemeStore.getState().initFromStorage()

    expect(useThemeStore.getState().mode).toBe('light')
    expect(useThemeStore.getState().currentThemeId).toBe('light')
    expect(useThemeStore.getState().isDark).toBe(false)
  })

  it('未知主题 id 回退到默认主题', async () => {
    vi.stubGlobal('window', {
      api: {
        theme: {
          get: vi.fn().mockResolvedValue({
            mode: 'system',
            currentThemeId: 'non-existent',
            isDark: true,
          }),
        },
      },
    })

    await useThemeStore.getState().initFromStorage()

    expect(useThemeStore.getState().currentTheme.id).toBe('dark')
  })

  it('缺少 theme API 时保持默认状态', async () => {
    vi.stubGlobal('window', { api: {} })
    const before = useThemeStore.getState().currentThemeId

    await useThemeStore.getState().initFromStorage()

    expect(useThemeStore.getState().currentThemeId).toBe(before)
  })

  it('theme.get 抛错时记录日志但不崩溃', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('window', {
      api: { theme: { get: vi.fn().mockRejectedValue(new Error('ipc failed')) } },
    })

    await expect(useThemeStore.getState().initFromStorage()).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
  })

  it('setThemeMode 切换到 system 时按系统偏好解析', () => {
    vi.stubGlobal('window', {
      ...window,
      matchMedia: vi.fn(() => ({ matches: true })),
      api: { theme: { setMode: vi.fn() } },
    })

    useThemeStore.getState().setThemeMode('system')

    expect(useThemeStore.getState().mode).toBe('system')
    expect(useThemeStore.getState().currentThemeId).toBe('dark')
  })
})
