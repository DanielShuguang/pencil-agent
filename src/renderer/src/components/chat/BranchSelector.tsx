import { useAgentStore } from '../../stores/agent-store'

export function BranchSelector() {
  const { activeSessionId, sessionMetas, getBranches, switchSession } = useAgentStore()
  const branches = getBranches()
  const activeMeta = activeSessionId ? sessionMetas.get(activeSessionId) : null

  if (!activeSessionId) return null

  const parentId = activeMeta?.parentSessionId

  return (
    <div className="flex items-center gap-2">
      {parentId && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => switchSession(parentId)}
        >
          ← 返回父会话
        </button>
      )}
      {branches.length > 0 && (
        <select
          className="text-xs bg-background border rounded px-2 py-1"
          value={activeSessionId}
          onChange={(e) => {
            if (e.target.value) {
              switchSession(e.target.value)
            }
          }}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.title}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
