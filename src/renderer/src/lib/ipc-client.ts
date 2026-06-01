import type { AgentChunk, AgentToolCall } from '@shared/ipc'

export function setupAgentListeners() {
  const cleanupChunk = window.api.agent.onChunk((chunk: AgentChunk) => {
    const { useAgentStore } = require('../stores/agent-store')
    useAgentStore.getState().appendChunk(chunk)
  })

  const cleanupToolCall = window.api.agent.onToolCall((_call: AgentToolCall) => {
    // Handle tool call UI updates
  })

  const cleanupDone = window.api.agent.onDone(() => {
    const { useAgentStore } = require('../stores/agent-store')
    useAgentStore.setState({ isGenerating: false })
  })

  const cleanupError = window.api.agent.onError((error: string) => {
    console.error('Agent error:', error)
    const { useAgentStore } = require('../stores/agent-store')
    useAgentStore.setState({ isGenerating: false })
  })

  return () => {
    cleanupChunk()
    cleanupToolCall()
    cleanupDone()
    cleanupError()
  }
}
