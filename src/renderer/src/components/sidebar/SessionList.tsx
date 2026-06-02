import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../stores/agent-store'
import { SessionItem } from './SessionItem'

export function SessionList() {
  const { sessionMetas, activeSessionId, switchSession, deleteSession } = useAgentStore()
  const { t } = useTranslation()

  const sortedSessions = Array.from(sessionMetas.values()).sort((a, b) => b.updatedAt - a.updatedAt)

  if (sortedSessions.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground text-center">{t('sidebar.noSessions')}</div>
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {sortedSessions.map((meta) => (
        <SessionItem
          key={meta.id}
          meta={meta}
          isActive={meta.id === activeSessionId}
          onClick={() => switchSession(meta.id)}
          onDelete={() => deleteSession(meta.id)}
        />
      ))}
    </div>
  )
}
