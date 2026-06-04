import { create } from 'zustand'

interface SandboxOutputLine {
  type: 'stdout' | 'stderr' | 'exit'
  content: string
  exitCode?: number
  timestamp: number
}

interface Execution {
  id: string
  language: string
  code: string
  status: 'running' | 'completed' | 'error'
  exitCode?: number
  output: SandboxOutputLine[]
}

interface SandboxState {
  executions: Map<string, Execution>
  activeExecutionId: string | null

  startExecution: (id: string, language: string, code: string) => void
  appendOutput: (output: {
    type: 'stdout' | 'stderr' | 'exit'
    content: string
    exitCode?: number
  }) => void
  completeExecution: (exitCode: number) => void
  setActiveExecution: (id: string | null) => void
  clearExecution: (id: string) => void
  clearAll: () => void
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  executions: new Map(),
  activeExecutionId: null,

  startExecution: (id: string, language: string, code: string) => {
    set((state) => {
      const executions = new Map(state.executions)
      executions.set(id, {
        id,
        language,
        code,
        status: 'running',
        output: [],
      })
      return { executions, activeExecutionId: id }
    })
  },

  appendOutput: (output) => {
    const { activeExecutionId } = get()
    if (!activeExecutionId) return

    set((state) => {
      const execution = state.executions.get(activeExecutionId)
      if (!execution) return state

      const newOutput: SandboxOutputLine = {
        ...output,
        timestamp: Date.now(),
      }

      const updatedExecution: Execution = {
        ...execution,
        output: [...execution.output, newOutput],
        ...(output.type === 'exit'
          ? { status: output.exitCode === 0 ? 'completed' : 'error', exitCode: output.exitCode }
          : {}),
      }

      const executions = new Map(state.executions)
      executions.set(activeExecutionId, updatedExecution)
      return { executions }
    })
  },

  completeExecution: (exitCode: number) => {
    const { activeExecutionId } = get()
    if (!activeExecutionId) return

    set((state) => {
      const execution = state.executions.get(activeExecutionId)
      if (!execution) return state

      const updatedExecution: Execution = {
        ...execution,
        status: exitCode === 0 ? 'completed' : 'error',
        exitCode,
      }

      const executions = new Map(state.executions)
      executions.set(activeExecutionId, updatedExecution)
      return { executions }
    })
  },

  setActiveExecution: (id) => {
    set({ activeExecutionId: id })
  },

  clearExecution: (id) => {
    set((state) => {
      const executions = new Map(state.executions)
      executions.delete(id)
      const activeExecutionId = state.activeExecutionId === id ? null : state.activeExecutionId
      return { executions, activeExecutionId }
    })
  },

  clearAll: () => {
    set({ executions: new Map(), activeExecutionId: null })
  },
}))
