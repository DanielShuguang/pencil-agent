import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRoleStore } from '../role-store'

const mockRoleApi = {
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  vi.stubGlobal('window', {
    ...window,
    api: { role: mockRoleApi },
  })
  vi.mocked(mockRoleApi.list).mockClear().mockResolvedValue([])
  vi.mocked(mockRoleApi.create).mockClear().mockResolvedValue(undefined)
  vi.mocked(mockRoleApi.update).mockClear().mockResolvedValue(undefined)
  vi.mocked(mockRoleApi.delete).mockClear().mockResolvedValue(undefined)
  useRoleStore.setState({
    roles: [],
    selectedRoleId: null,
    isLoading: false,
  })
})

const sampleRole = {
  id: 'role-1',
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

describe('role-store', () => {
  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useRoleStore.getState()
      expect(state.roles).toEqual([])
      expect(state.selectedRoleId).toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('fetchRoles', () => {
    it('should fetch roles and update state', async () => {
      vi.mocked(mockRoleApi.list).mockResolvedValueOnce([sampleRole])

      await useRoleStore.getState().fetchRoles()

      expect(mockRoleApi.list).toHaveBeenCalled()
      expect(useRoleStore.getState().roles).toEqual([sampleRole])
      expect(useRoleStore.getState().isLoading).toBe(false)
    })

    it('should set isLoading during fetch', async () => {
      let resolve: (v: unknown[]) => void
      vi.mocked(mockRoleApi.list).mockReturnValueOnce(new Promise((r) => { resolve = r }))

      const promise = useRoleStore.getState().fetchRoles()
      expect(useRoleStore.getState().isLoading).toBe(true)

      resolve!([])
      await promise
      expect(useRoleStore.getState().isLoading).toBe(false)
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockRoleApi.list).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useRoleStore.getState().fetchRoles()

      expect(useRoleStore.getState().isLoading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('createRole', () => {
    it('should create role and refresh list', async () => {
      vi.mocked(mockRoleApi.list).mockResolvedValueOnce([sampleRole])

      await useRoleStore.getState().createRole({
        id: 'role-1',
        name: 'Assistant',
        systemPrompt: 'You are a helpful assistant',
      })

      expect(mockRoleApi.create).toHaveBeenCalledWith({
        id: 'role-1',
        name: 'Assistant',
        systemPrompt: 'You are a helpful assistant',
      })
      expect(mockRoleApi.list).toHaveBeenCalled()
      expect(useRoleStore.getState().roles).toEqual([sampleRole])
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockRoleApi.create).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useRoleStore.getState().createRole({
        id: 'role-1',
        name: 'Assistant',
        systemPrompt: 'prompt',
      })

      consoleSpy.mockRestore()
    })
  })

  describe('updateRole', () => {
    it('should update role and refresh list', async () => {
      const updated = { ...sampleRole, name: 'Updated' }
      vi.mocked(mockRoleApi.list).mockResolvedValueOnce([updated])

      await useRoleStore.getState().updateRole('role-1', { name: 'Updated' })

      expect(mockRoleApi.update).toHaveBeenCalledWith('role-1', { name: 'Updated' })
      expect(useRoleStore.getState().roles[0].name).toBe('Updated')
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockRoleApi.update).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useRoleStore.getState().updateRole('role-1', { name: 'Updated' })

      consoleSpy.mockRestore()
    })
  })

  describe('deleteRole', () => {
    it('should delete role and refresh list', async () => {
      useRoleStore.setState({ roles: [sampleRole], selectedRoleId: 'role-1' })
      vi.mocked(mockRoleApi.list).mockResolvedValueOnce([])

      await useRoleStore.getState().deleteRole('role-1')

      expect(mockRoleApi.delete).toHaveBeenCalledWith('role-1')
      expect(useRoleStore.getState().roles).toEqual([])
      expect(useRoleStore.getState().selectedRoleId).toBeNull()
    })

    it('should handle error gracefully', async () => {
      vi.mocked(mockRoleApi.delete).mockRejectedValueOnce(new Error('fail'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await useRoleStore.getState().deleteRole('role-1')

      consoleSpy.mockRestore()
    })
  })

  describe('selectRole', () => {
    it('should set selectedRoleId', () => {
      useRoleStore.getState().selectRole('role-1')
      expect(useRoleStore.getState().selectedRoleId).toBe('role-1')
    })

    it('should clear selectedRoleId with null', () => {
      useRoleStore.setState({ selectedRoleId: 'role-1' })
      useRoleStore.getState().selectRole(null)
      expect(useRoleStore.getState().selectedRoleId).toBeNull()
    })
  })
})
