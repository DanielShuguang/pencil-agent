import { create } from 'zustand'

interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

interface ToolState {
  tools: ToolDefinition[]
  setTools: (tools: ToolDefinition[]) => void
  fetchTools: () => Promise<void>
}

export const useToolStore = create<ToolState>((set) => ({
  tools: [],

  setTools: (tools) => set({ tools }),

  fetchTools: async () => {
    try {
      const tools = await (window as any).api.tool.list()
      set({ tools })
    } catch (error) {
      console.error('Failed to fetch tools:', error)
    }
  },
}))
