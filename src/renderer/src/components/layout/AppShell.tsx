import { useState, useEffect, type ReactNode } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.window.isMaximized().then(setIsMaximized)
    const cleanup = window.api.window.onMaximizedChanged(setIsMaximized)
    return cleanup
  }, [])

  return (
    <div className='flex h-screen flex-col bg-background text-foreground'>
      <header
        className='flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4'
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className='flex items-center gap-2'>
          <div className='h-6 w-6 rounded-full bg-primary' />
          <span className='text-sm font-semibold'>Pencil Agent</span>
        </div>
        <div
          className='flex items-center'
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-muted'
            onClick={() => window.api.window.minimize()}
          >
            <Minus className='h-4 w-4' />
          </button>
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-muted'
            onClick={() => window.api.window.maximize()}
          >
            {isMaximized ? (
              <Maximize2 className='h-3.5 w-3.5' />
            ) : (
              <Square className='h-3.5 w-3.5' />
            )}
          </button>
          <button
            className='flex h-10 w-11 items-center justify-center hover:bg-destructive hover:text-destructive-foreground'
            onClick={() => window.api.window.close()}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </header>
      <main className='flex-1 overflow-hidden'>{children}</main>
    </div>
  )
}
