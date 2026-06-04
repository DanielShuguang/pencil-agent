import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUpdateStore } from '../update-store'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const mockUpdater = {
  check: vi.fn(),
  download: vi.fn(),
  install: vi.fn(),
  getStatus: vi.fn(),
  onStatus: vi.fn(() => vi.fn()),
  onInfo: vi.fn(() => vi.fn()),
  onError: vi.fn(() => vi.fn()),
  onProgress: vi.fn(() => vi.fn()),
}

beforeEach(() => {
  useUpdateStore.setState({ status: 'idle', progress: 0, error: null, updateInfo: null })
  vi.clearAllMocks()

  ;(window as any).api = { updater: mockUpdater }
})

describe('update-store', () => {
  it('should start with idle status', () => {
    const state = useUpdateStore.getState()
    expect(state.status).toBe('idle')
    expect(state.progress).toBe(0)
    expect(state.error).toBeNull()
    expect(state.updateInfo).toBeNull()
  })

  it('should set checking status on checkForUpdates', async () => {
    mockUpdater.check.mockResolvedValue({ status: 'ok' })

    const promise = useUpdateStore.getState().checkForUpdates()
    expect(useUpdateStore.getState().status).toBe('checking')

    await promise
  })

  it('should set error status when check fails', async () => {
    mockUpdater.check.mockResolvedValue({ status: 'error', error: 'Network error' })

    await useUpdateStore.getState().checkForUpdates()

    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toBe('Network error')
  })

  it('should handle check exception', async () => {
    mockUpdater.check.mockRejectedValue(new Error('Unexpected error'))

    await useUpdateStore.getState().checkForUpdates()

    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toBe('Unexpected error')
  })

  it('should set downloading status on downloadUpdate', async () => {
    mockUpdater.download.mockResolvedValue({ status: 'ok' })

    const promise = useUpdateStore.getState().downloadUpdate()
    expect(useUpdateStore.getState().status).toBe('downloading')

    await promise
  })

  it('should call install on installUpdate', () => {
    useUpdateStore.getState().installUpdate()
    expect(mockUpdater.install).toHaveBeenCalledOnce()
  })

  it('should call initListeners and return cleanup function', () => {
    const unsubStatus = vi.fn()
    const unsubInfo = vi.fn()
    const unsubError = vi.fn()
    const unsubProgress = vi.fn()
    mockUpdater.onStatus.mockReturnValue(unsubStatus)
    mockUpdater.onInfo.mockReturnValue(unsubInfo)
    mockUpdater.onError.mockReturnValue(unsubError)
    mockUpdater.onProgress.mockReturnValue(unsubProgress)

    const cleanup = useUpdateStore.getState().initListeners()

    expect(mockUpdater.onStatus).toHaveBeenCalledOnce()
    expect(mockUpdater.onInfo).toHaveBeenCalledOnce()
    expect(mockUpdater.onError).toHaveBeenCalledOnce()
    expect(mockUpdater.onProgress).toHaveBeenCalledOnce()

    cleanup()

    expect(unsubStatus).toHaveBeenCalledOnce()
    expect(unsubInfo).toHaveBeenCalledOnce()
    expect(unsubError).toHaveBeenCalledOnce()
    expect(unsubProgress).toHaveBeenCalledOnce()
  })

  it('should update progress from event', () => {
    let capturedCb: ((p: { percent: number }) => void) | undefined
    mockUpdater.onProgress = ((cb: (p: { percent: number }) => void) => {
      capturedCb = cb
      return vi.fn()
    }) as unknown as typeof mockUpdater.onProgress

    const cleanup = useUpdateStore.getState().initListeners()

    capturedCb?.({ percent: 50 })

    expect(useUpdateStore.getState().progress).toBe(50)

    cleanup()
  })

  it('should reset store state', () => {
    useUpdateStore.setState({
      status: 'error',
      progress: 75,
      error: 'something wrong',
      updateInfo: { version: '1.0' },
    })

    useUpdateStore.getState().reset()

    expect(useUpdateStore.getState().status).toBe('idle')
    expect(useUpdateStore.getState().progress).toBe(0)
    expect(useUpdateStore.getState().error).toBeNull()
    expect(useUpdateStore.getState().updateInfo).toBeNull()
  })
})
