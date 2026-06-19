import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Trash2 } from 'lucide-react'
import type { SessionMeta } from '../../stores/agent-store'
import { cn } from '../../lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

interface SessionItemProps {
  meta: SessionMeta
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

function formatTime(
  timestamp: number,
  lang: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('common.justNow')
  if (diff < 3600000) return t('common.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('common.hoursAgo', { count: Math.floor(diff / 3600000) })
  return date.toLocaleDateString(lang)
}

function getProjectName(cwd?: string): string | null {
  if (!cwd) return null
  const parts = cwd.replace(/[/\\]+$/, '').split(/[/\\]/)
  return parts[parts.length - 1] || null
}

export function SessionItem({ meta, isActive, onClick, onDelete }: SessionItemProps) {
  const { t, i18n } = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const projectName = getProjectName(meta.cwd)

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group',
          isActive ? 'bg-accent' : 'hover:bg-accent/50',
        )}
        onClick={onClick}
      >
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-medium truncate'>{meta.title}</div>
          {projectName && (
            <div className='flex items-center gap-1 text-xs text-muted-foreground' title={meta.cwd}>
              <Folder className='h-3 w-3 shrink-0' />
              <span className='truncate'>{projectName}</span>
            </div>
          )}
          <div className='text-xs text-muted-foreground'>
            <span>{formatTime(meta.updatedAt, i18n.language, t)}</span>
          </div>
        </div>
        <button
          className='opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity'
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className='h-3.5 w-3.5 text-destructive' />
        </button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sidebar.deleteSession')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{t('common.ok')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
