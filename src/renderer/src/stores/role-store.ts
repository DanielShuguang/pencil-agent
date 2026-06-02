import { create } from 'zustand'
import type { AgentRole } from '@shared/ipc'

interface RoleState {
  roles: AgentRole[]
  selectedRoleId: string | null
  isLoading: boolean

  fetchRoles: () => Promise<void>
  createRole: (role: Omit<AgentRole, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRole: (id: string, updates: Partial<AgentRole>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  selectRole: (id: string | null) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  roles: [],
  selectedRoleId: null,
  isLoading: false,

  fetchRoles: async () => {
    set({ isLoading: true })
    try {
      const roles = await window.api.role.list()
      set({ roles, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      set({ isLoading: false })
    }
  },

  createRole: async (role) => {
    try {
      await window.api.role.create(role)
      const roles = await window.api.role.list()
      set({ roles })
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  },

  updateRole: async (id, updates) => {
    try {
      await window.api.role.update(id, updates)
      const roles = await window.api.role.list()
      set({ roles })
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  },

  deleteRole: async (id) => {
    try {
      await window.api.role.delete(id)
      const roles = await window.api.role.list()
      set({ roles, selectedRoleId: null })
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  },

  selectRole: (id) => {
    set({ selectedRoleId: id })
  },
}))
