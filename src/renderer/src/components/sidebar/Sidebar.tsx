import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SessionList } from './SessionList'
import { useAgentStore } from '../../stores/agent-store'
import { cn } from '../../lib/utils'

interface SidebarProps {
  width?: number
}

export function Sidebar({ width = 256 }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { createSession } = useAgentStore()
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'border-r bg-muted/30 flex flex-col overflow-hidden transition-all duration-200 ease-out',
        isCollapsed ? 'w-12' : '',
      )}
      style={{ width: isCollapsed ? 48 : width }}
    >
      {isCollapsed ? (
        <div className='flex flex-col items-center py-2 gap-2'>
          <button
            className='p-2 hover:bg-accent rounded-lg transition-colors'
            onClick={() => setIsCollapsed(false)}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect width='18' height='18' x='3' y='3' rx='2' ry='2' />
              <line x1='9' x2='9' y1='3' y2='21' />
            </svg>
          </button>
          <button
            className='p-2 hover:bg-accent rounded-lg transition-colors'
            onClick={() => createSession()}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M5 12h14' />
              <path d='M12 5v14' />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between p-2 border-b'>
            <button
              className='p-2 hover:bg-accent rounded-lg transition-colors text-sm font-medium'
              onClick={() => setIsCollapsed(true)}
            >
              {t('sidebar.sessions')}
            </button>
            <button
              className='p-2 hover:bg-accent rounded-lg transition-colors'
              onClick={() => createSession()}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M5 12h14' />
                <path d='M12 5v14' />
              </svg>
            </button>
          </div>
          <div className='flex-1 overflow-auto'>
            <SessionList />
          </div>
        </>
      )}
    </div>
  )
}
