import { useCallback } from 'react'
import { useAgentStore } from '../stores/agent-store'

export function useNewSession() {
  const createSession = useAgentStore((s) => s.createSession)

  return useCallback(async () => {
    if (!window.api?.dialog?.selectDirectory) return
    const result = await window.api.dialog.selectDirectory()
    if (result.canceled || result.filePaths.length === 0) return
    await createSession(result.filePaths[0])
  }, [createSession])
}
