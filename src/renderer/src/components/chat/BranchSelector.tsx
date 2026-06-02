import { useAgentStore } from '../../stores/agent-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

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
        <Select value={activeSessionId} onValueChange={(value) => switchSession(value)}>
          <SelectTrigger className="text-xs bg-background border rounded px-2 py-1 h-7 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
