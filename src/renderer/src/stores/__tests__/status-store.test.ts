import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStatusStore } from '../status-store'

vi.stubGlobal('window', {
  api: {
    app: {
      getVersion: vi.fn().mockResolvedValue('1.0.0'),
    },
    settings: {
      checkConnection: vi.fn().mockResolvedValue(true),
    },
  },
})

describe('status-store', () => {
  beforeEach(() => {
    useStatusStore.setState({
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      connectionStatus: 'checking',
      lastChecked: 0,
      version: '0.0.0',
    })
  })

  describe('Token usage tracking', () => {
    it('should increment token usage', () => {
      const { incrementTokenUsage } = useStatusStore.getState()

      incrementTokenUsage({ prompt: 100, completion: 50, total: 150 })

      const { tokenUsage } = useStatusStore.getState()
      expect(tokenUsage.prompt).toBe(100)
      expect(tokenUsage.completion).toBe(50)
      expect(tokenUsage.total).toBe(150)
    })

    it('should accumulate token usage', () => {
      const { incrementTokenUsage } = useStatusStore.getState()

      incrementTokenUsage({ prompt: 100, completion: 50, total: 150 })
      incrementTokenUsage({ prompt: 200, completion: 100, total: 300 })

      const { tokenUsage } = useStatusStore.getState()
      expect(tokenUsage.prompt).toBe(300)
      expect(tokenUsage.completion).toBe(150)
      expect(tokenUsage.total).toBe(450)
    })

    it('should handle partial token usage', () => {
      const { incrementTokenUsage } = useStatusStore.getState()

      incrementTokenUsage({ prompt: 100 })

      const { tokenUsage } = useStatusStore.getState()
      expect(tokenUsage.prompt).toBe(100)
      expect(tokenUsage.completion).toBe(0)
      expect(tokenUsage.total).toBe(0)
    })

    it('should reset token usage', () => {
      const { incrementTokenUsage, resetTokenUsage } = useStatusStore.getState()

      incrementTokenUsage({ prompt: 100, completion: 50, total: 150 })
      resetTokenUsage()

      const { tokenUsage } = useStatusStore.getState()
      expect(tokenUsage.prompt).toBe(0)
      expect(tokenUsage.completion).toBe(0)
      expect(tokenUsage.total).toBe(0)
    })
  })

  describe('Connection status', () => {
    it('should update connection status on check', async () => {
      const { checkConnection } = useStatusStore.getState()

      await checkConnection()

      const { connectionStatus, lastChecked } = useStatusStore.getState()
      expect(connectionStatus).toBe('connected')
      expect(lastChecked).toBeGreaterThan(0)
    })

    it('should handle connection check failure', async () => {
      vi.mocked(window.api.settings.checkConnection).mockResolvedValueOnce(false)

      const { checkConnection } = useStatusStore.getState()
      await checkConnection()

      const { connectionStatus } = useStatusStore.getState()
      expect(connectionStatus).toBe('disconnected')
    })

    it('should handle connection check error', async () => {
      vi.mocked(window.api.settings.checkConnection).mockRejectedValueOnce(
        new Error('Network error'),
      )

      const { checkConnection } = useStatusStore.getState()
      await checkConnection()

      const { connectionStatus } = useStatusStore.getState()
      expect(connectionStatus).toBe('disconnected')
    })
  })

  describe('Init', () => {
    it('should initialize version and check connection', async () => {
      const { init } = useStatusStore.getState()

      await init()

      const { version, connectionStatus } = useStatusStore.getState()
      expect(version).toBe('1.0.0')
      expect(connectionStatus).toBe('connected')
    })
  })
})
