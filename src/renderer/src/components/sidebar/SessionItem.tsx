import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

function formatTime(timestamp: number, lang: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('common.justNow')
  if (diff < 3600000) return t('common.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('common.hoursAgo', { count: Math.floor(diff / 3600000) })
  return date.toLocaleDateString(lang)
}

export function SessionItem({ meta, isActive, onClick, onDelete }: SessionItemProps) {
  const { t, i18n } = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group',
          isActive ? 'bg-accent' : 'hover:bg-accent/50'
        )}
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{meta.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{meta.model.provider}/{meta.model.id}</span>
            <span>·</span>
            <span>{formatTime(meta.updatedAt, i18n.language, t)}</span>
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
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
