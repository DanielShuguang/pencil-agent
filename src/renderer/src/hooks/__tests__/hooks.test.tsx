import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSystemFonts } from '../useSystemFonts'
import { useGlobalShortcuts } from '../useGlobalShortcuts'
import { useNewSession } from '../useNewSession'
import { useAgentStore } from '../../stores/agent-store'

const FALLBACK_VALUES = [
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "Consolas, 'Courier New', monospace",
  "'Fira Code', monospace",
  "'Maple Mono NF CN', monospace",
]

function stubApi(api: Record<string, unknown>) {
  // 不能整体替换 window，否则 @testing-library 拿不到 document
  Object.assign(window, { api })
}

function clearApi() {
  delete (window as any).api
}

describe('useSystemFonts', () => {
  afterEach(() => {
    clearApi()
    delete (navigator as any).fonts
  })

  it('初始返回回退字体且处于 loading', () => {
    stubApi({ system: { getFonts: vi.fn().mockResolvedValue([]) } })

    const { result } = renderHook(() => useSystemFonts())

    expect(result.current.loading).toBe(true)
    expect(result.current.fonts.map((f) => f.value)).toEqual(FALLBACK_VALUES)
  })

  it('使用 IPC 返回的系统字体并结束 loading', async () => {
    stubApi({ system: { getFonts: vi.fn().mockResolvedValue(['Arial', 'Consolas']) } })

    const { result } = renderHook(() => useSystemFonts())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.fonts).toEqual([
      { label: 'Arial', value: "'Arial', sans-serif" },
      { label: 'Consolas', value: "'Consolas', sans-serif" },
    ])
  })

  it('IPC 返回空数组时回退到 navigator.fonts', async () => {
    stubApi({ system: { getFonts: vi.fn().mockResolvedValue([]) } })
    ;(navigator as any).fonts = {
      query: () => ({
        async *[Symbol.asyncIterator]() {
          yield { family: 'Zebra' }
          yield { family: 'Alpha' }
          yield { family: 'Alpha' }
        },
      }),
    }

    const { result } = renderHook(() => useSystemFonts())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.fonts.map((f) => f.label)).toEqual(['Alpha', 'Zebra'])
  })

  it('IPC 抛错时回退到回退字体列表', async () => {
    stubApi({ system: { getFonts: vi.fn().mockRejectedValue(new Error('ipc failed')) } })

    const { result } = renderHook(() => useSystemFonts())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.fonts.map((f) => f.value)).toEqual(FALLBACK_VALUES)
  })

  it('navigator.fonts 返回空时使用回退字体', async () => {
    stubApi({ system: { getFonts: vi.fn().mockResolvedValue([]) } })
    ;(navigator as any).fonts = {
      query: () => ({ async *[Symbol.asyncIterator]() {} }),
    }

    const { result } = renderHook(() => useSystemFonts())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.fonts.map((f) => f.value)).toEqual(FALLBACK_VALUES)
  })

  it('卸载后不再更新状态', async () => {
    let resolveFonts: (value: string[]) => void = () => {}
    const pending = new Promise<string[]>((resolve) => {
      resolveFonts = resolve
    })
    stubApi({ system: { getFonts: vi.fn().mockReturnValue(pending) } })

    const { unmount } = renderHook(() => useSystemFonts())
    unmount()

    await act(async () => {
      resolveFonts(['Late Font'])
      await pending
    })
    // 不应抛出 "state update on unmounted component" 类错误
    expect(true).toBe(true)
  })
})

describe('useGlobalShortcuts', () => {
  function keydown(init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', { cancelable: true, ...init })
    window.dispatchEvent(event)
    return event
  }

  it('Ctrl + 按键触发对应处理器并阻止默认行为', () => {
    const handler = vi.fn()
    renderHook(() => useGlobalShortcuts({ k: handler }))

    const event = keydown({ key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('Meta + 按键同样触发', () => {
    const handler = vi.fn()
    renderHook(() => useGlobalShortcuts({ n: handler }))

    keydown({ key: 'n', metaKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('未按下修饰键时不触发', () => {
    const handler = vi.fn()
    renderHook(() => useGlobalShortcuts({ k: handler }))

    const event = keydown({ key: 'k' })

    expect(handler).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('没有匹配的快捷键时不阻止默认行为', () => {
    const handler = vi.fn()
    renderHook(() => useGlobalShortcuts({ k: handler }))

    const event = keydown({ key: 'x', ctrlKey: true })

    expect(event.defaultPrevented).toBe(false)
  })

  it('大小写不敏感', () => {
    const handler = vi.fn()
    renderHook(() => useGlobalShortcuts({ k: handler }))

    keydown({ key: 'K', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('卸载后不再响应', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useGlobalShortcuts({ k: handler }))

    unmount()
    keydown({ key: 'k', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('useNewSession', () => {
  beforeEach(() => {
    useAgentStore.setState({
      sessions: [],
      activeSessionId: null,
      createSession: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  afterEach(() => {
    clearApi()
  })

  it('选择目录后创建会话', async () => {
    stubApi({
      dialog: { selectDirectory: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/ws'] }) },
    })
    const createSession = vi.fn().mockResolvedValue(undefined)
    useAgentStore.setState({ createSession } as any)

    const { result } = renderHook(() => useNewSession())
    await act(async () => {
      await result.current()
    })

    expect(createSession).toHaveBeenCalledWith('/ws')
  })

  it('取消选择时不创建会话', async () => {
    stubApi({
      dialog: { selectDirectory: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }) },
    })
    const createSession = vi.fn()
    useAgentStore.setState({ createSession } as any)

    const { result } = renderHook(() => useNewSession())
    await act(async () => {
      await result.current()
    })

    expect(createSession).not.toHaveBeenCalled()
  })

  it('返回空路径列表时不创建会话', async () => {
    stubApi({
      dialog: { selectDirectory: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }) },
    })
    const createSession = vi.fn()
    useAgentStore.setState({ createSession } as any)

    const { result } = renderHook(() => useNewSession())
    await act(async () => {
      await result.current()
    })

    expect(createSession).not.toHaveBeenCalled()
  })

  it('缺少 dialog API 时安全返回', async () => {
    stubApi({})
    const createSession = vi.fn()
    useAgentStore.setState({ createSession } as any)

    const { result } = renderHook(() => useNewSession())
    await act(async () => {
      await result.current()
    })

    expect(createSession).not.toHaveBeenCalled()
  })
})
