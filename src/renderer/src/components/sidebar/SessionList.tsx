import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../stores/agent-store'
import { SessionItem } from './SessionItem'
import { useListAnimate } from '../../hooks/useAutoAnimate'
import { toast } from '../../lib/toast'

export function SessionList() {
  const { sessionMetas, activeSessionId, validateAndSwitchSession, deleteSession } = useAgentStore()
  const { t } = useTranslation()
  const [listRef] = useListAnimate()

  const sortedSessions = Array.from(sessionMetas.values()).sort((a, b) => b.updatedAt - a.updatedAt)

  if (sortedSessions.length === 0) {
    return (
      <div className='p-4 text-sm text-muted-foreground text-center'>{t('sidebar.noSessions')}</div>
    )
  }

  const handleSessionClick = async (meta: { id: string; cwd?: string }) => {
    if (!meta.cwd) {
      toast.error(t('sidebar.workspaceMissing'))
      return
    }
    const ok = await validateAndSwitchSession(meta.id)
    if (!ok) {
      toast.error(t('sidebar.workspaceNotFound', { path: meta.cwd }))
    }
  }

  return (
    <div ref={listRef} className='flex flex-col gap-1 p-2'>
      {sortedSessions.map((meta) => (
        <SessionItem
          key={meta.id}
          meta={meta}
          isActive={meta.id === activeSessionId}
          onClick={() => handleSessionClick(meta)}
          onDelete={() => deleteSession(meta.id)}
        />
      ))}
    </div>
  )
}
