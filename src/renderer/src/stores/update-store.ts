import { create } from 'zustand'

interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  progress: number
  error: string | null
  updateInfo: object | null

  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => void
  reset: () => void
  initListeners: () => () => void
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  progress: 0,
  error: null,
  updateInfo: null,

  checkForUpdates: async () => {
    if (!window.api?.updater) return
    set({ status: 'checking', error: null })
    try {
      const result = await window.api.updater.check()
      if (result.status === 'error') {
        set({ status: 'error', error: result.error || '检查更新失败' })
      } else if (result.status === 'ok') {
        const currentStatus = get().status
        if (currentStatus === 'checking') {
          set({ status: 'idle' })
        }
      }
    } catch (error) {
      set({ status: 'error', error: (error as Error).message })
    }
  },

  downloadUpdate: async () => {
    if (!window.api?.updater) return
    set({ status: 'downloading', progress: 0, error: null })
    try {
      const result = await window.api.updater.download()
      if (result.status === 'error') {
        set({ status: 'error', error: result.error || '下载更新失败' })
      }
    } catch (error) {
      set({ status: 'error', error: (error as Error).message })
    }
  },

  installUpdate: () => {
    if (!window.api?.updater) return
    window.api.updater.install()
  },

  reset: () => {
    set({ status: 'idle', progress: 0, error: null, updateInfo: null })
  },

  initListeners: () => {
    if (!window.api?.updater) return () => {}

    const unsubStatus = window.api.updater.onStatus((data) => {
      set({ status: data.status as UpdateState['status'] })
    })

    const unsubInfo = window.api.updater.onInfo((data) => {
      if (data.status === 'available') {
        set({ status: 'available', updateInfo: data.info })
      } else if (data.status === 'downloaded') {
        set({ status: 'downloaded', updateInfo: data.info })
      } else if (data.status === 'not-available') {
        set({ status: 'idle' })
      }
    })

    const unsubError = window.api.updater.onError((data) => {
      set({ status: 'error', error: data.error })
    })

    const unsubProgress = window.api.updater.onProgress((progress: { percent: number }) => {
      set({ progress: progress.percent })
    })

    return () => {
      unsubStatus()
      unsubInfo()
      unsubError()
      unsubProgress()
    }
  },
}))
