import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoleStore } from '../../stores/role-store'
import { cn } from '../../lib/utils'

interface RoleListProps {
  onSelect?: (roleId: string) => void
  selectedRoleId?: string | null
}

export function RoleList({ onSelect, selectedRoleId }: RoleListProps) {
  const { roles, isLoading, fetchRoles, deleteRole } = useRoleStore()
  const { t } = useTranslation()

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">{t('role.loading')}</div>
  }

  if (roles.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">{t('role.noRoles')}</div>
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {roles.map((role) => (
        <div
          key={role.id}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group',
            selectedRoleId === role.id ? 'bg-accent' : 'hover:bg-accent/50'
          )}
          onClick={() => onSelect?.(role.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{role.name}</div>
            <div className="text-xs text-muted-foreground truncate">{role.description}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                {role.model.provider}/{role.model.id}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('role.toolsCount', { count: role.tools.length })}
              </span>
            </div>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              deleteRole(role.id)
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
      ))}
    </div>
  )
}
