import type { AgentChunk } from '@shared/ipc'

let cleanupFunctions: (() => void)[] = []

export function setupAgentListeners() {
  // Clean up any existing listeners
  cleanup()

  const cleanupChunk = window.api.agent.onChunk((chunk: AgentChunk) => {
    // Dynamic import to avoid circular dependency
    import('../stores/agent-store').then(({ useAgentStore }) => {
      useAgentStore.getState().appendChunk(chunk)
    })
  })

  const cleanupDone = window.api.agent.onDone(() => {
    import('../stores/agent-store').then(({ useAgentStore }) => {
      useAgentStore.setState({ isGenerating: false })
    })
  })

  const cleanupError = window.api.agent.onError((error: string) => {
    console.error('Agent error:', error)
    import('../stores/agent-store').then(({ useAgentStore }) => {
      useAgentStore.setState({ isGenerating: false })
    })
  })

  cleanupFunctions = [cleanupChunk, cleanupDone, cleanupError]
}

export function cleanup() {
  cleanupFunctions.forEach((fn) => fn())
  cleanupFunctions = []
}
