import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { SessionItem } from './SessionItem'
import { useListAnimate } from '../../hooks/useAutoAnimate'
import { toast } from '../../lib/toast'

export function SessionList() {
  const { sessionMetas, activeSessionId, validateAndSwitchSession, deleteSession } = useAgentStore()
  const { t } = useTranslation()
  const [listRef] = useListAnimate()
  const [searchQuery, setSearchQuery] = useState('')

  const sortedSessions = useMemo(
    () =>
      Array.from(sessionMetas.values())
        .filter((meta) =>
          !searchQuery || meta.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [sessionMetas, searchQuery],
  )

  if (sessionMetas.size === 0) {
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
    <div className='flex flex-col h-full'>
      <div className='px-2 pt-2 pb-1'>
        <div className='relative'>
          <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('sidebar.searchPlaceholder')}
            className='w-full pl-7 pr-2 py-1.5 text-xs border rounded-md bg-background'
          />
        </div>
      </div>
      <div ref={listRef} className='flex-1 overflow-auto flex flex-col gap-1 p-2 pt-1'>
        {sortedSessions.length === 0 ? (
          <div className='p-4 text-sm text-muted-foreground text-center'>{t('sidebar.noSessions')}</div>
        ) : (
          sortedSessions.map((meta) => (
            <SessionItem
              key={meta.id}
              meta={meta}
              isActive={meta.id === activeSessionId}
              onClick={() => handleSessionClick(meta)}
              onDelete={() => deleteSession(meta.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
