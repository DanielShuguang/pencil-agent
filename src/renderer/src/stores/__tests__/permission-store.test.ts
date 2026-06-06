import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePermissionStore } from '../permission-store'

vi.mock('../../../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockGetConfig = vi.fn()
const mockSetConfig = vi.fn()
const mockSubmitConfirmResponse = vi.fn()
const mockOnConfirmRequest = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  usePermissionStore.setState({
    config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
    pendingConfirm: null,
    isLoaded: false,
  })
  ;(window as any).api = {
    permission: {
      getConfig: mockGetConfig,
      setConfig: mockSetConfig,
      onConfirmRequest: mockOnConfirmRequest,
      submitConfirmResponse: mockSubmitConfirmResponse,
    },
  }
})

describe('permission-store', () => {
  describe('fetchConfig', () => {
    it('should fetch and set config', async () => {
      mockGetConfig.mockResolvedValue({
        mode: 'prompt',
        disabledTools: ['bash'],
        dangerousPatternOverrides: [],
      })

      await usePermissionStore.getState().fetchConfig()

      const state = usePermissionStore.getState()
      expect(state.config.mode).toBe('prompt')
      expect(state.config.disabledTools).toEqual(['bash'])
      expect(state.isLoaded).toBe(true)
    })

    it('should use default config on error', async () => {
      mockGetConfig.mockRejectedValue(new Error('fail'))

      await usePermissionStore.getState().fetchConfig()

      const state = usePermissionStore.getState()
      expect(state.config.mode).toBe('smart')
      expect(state.isLoaded).toBe(true)
    })
  })

  describe('updateConfig', () => {
    it('should update config locally and persist', async () => {
      mockSetConfig.mockResolvedValue(undefined)

      await usePermissionStore.getState().updateConfig({ mode: 'auto' })

      const state = usePermissionStore.getState()
      expect(state.config.mode).toBe('auto')
      expect(mockSetConfig).toHaveBeenCalledWith(expect.objectContaining({ mode: 'auto' }))
    })
  })

  describe('handleConfirmRequest', () => {
    it('should set pending confirm', () => {
      const request = {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        riskLevel: 'medium' as const,
      }

      usePermissionStore.getState().handleConfirmRequest(request)

      expect(usePermissionStore.getState().pendingConfirm).toEqual(request)
    })
  })

  describe('submitConfirmResponse', () => {
    it('should submit response and clear pending', () => {
      usePermissionStore.setState({
        pendingConfirm: {
          id: 'confirm-1',
          toolName: 'bash',
          parameters: {},
          riskLevel: 'low',
        },
      })

      usePermissionStore.getState().submitConfirmResponse({
        id: 'confirm-1',
        allowed: true,
      })

      expect(mockSubmitConfirmResponse).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'confirm-1', allowed: true }),
      )
      expect(usePermissionStore.getState().pendingConfirm).toBeNull()
    })
  })

  describe('dismissConfirm', () => {
    it('should deny and clear pending', () => {
      usePermissionStore.setState({
        pendingConfirm: {
          id: 'confirm-1',
          toolName: 'bash',
          parameters: {},
          riskLevel: 'low',
        },
      })

      usePermissionStore.getState().dismissConfirm()

      expect(mockSubmitConfirmResponse).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'confirm-1', allowed: false }),
      )
      expect(usePermissionStore.getState().pendingConfirm).toBeNull()
    })

    it('should do nothing if no pending', () => {
      usePermissionStore.getState().dismissConfirm()
      expect(mockSubmitConfirmResponse).not.toHaveBeenCalled()
    })
  })
})
