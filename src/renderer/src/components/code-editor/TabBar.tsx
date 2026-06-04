import { X, File } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useEditorStore } from '../../stores/editor-store'

interface TabBarProps {
  className?: string
}

export function TabBar({ className }: TabBarProps) {
  const { files, openFiles, activeFilePath, setActiveFile, closeFile } = useEditorStore()

  if (openFiles.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center border-b bg-muted/30 overflow-x-auto', className)}>
      {openFiles.map((path) => {
        const file = files.get(path)
        if (!file) return null

        const isActive = path === activeFilePath

        return (
          <button
            key={path}
            onClick={() => setActiveFile(path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs border-r hover:bg-muted/50 transition-colors min-w-0',
              isActive ? 'bg-background text-foreground' : 'text-muted-foreground',
            )}
          >
            <File className='h-3 w-3 shrink-0' />
            <span className='truncate'>{file.name}</span>
            {file.isDirty && <span className='h-2 w-2 rounded-full bg-yellow-500 shrink-0' />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeFile(path)
              }}
              className='ml-1 p-0.5 hover:bg-muted rounded shrink-0'
            >
              <X className='h-3 w-3' />
            </button>
          </button>
        )
      })}
    </div>
  )
}
