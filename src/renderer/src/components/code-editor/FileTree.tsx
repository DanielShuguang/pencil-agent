import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useEditorStore } from '../../stores/editor-store'

interface FileTreeProps {
  className?: string
}

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: TreeNode[]
}

function buildTree(files: Map<string, unknown>): TreeNode[] {
  const root: TreeNode[] = []
  const dirMap = new Map<string, TreeNode>()

  const sortedPaths = Array.from(files.keys()).sort()

  for (const path of sortedPaths) {
    const parts = path.split('/')
    let currentChildren = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const currentPath = parts.slice(0, i + 1).join('/')
      const isFile = i === parts.length - 1

      if (isFile) {
        currentChildren.push({
          name: part,
          path,
          isDirectory: false,
          children: [],
        })
      } else {
        let dir = dirMap.get(currentPath)
        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            isDirectory: true,
            children: [],
          }
          dirMap.set(currentPath, dir)
          currentChildren.push(dir)
        }
        currentChildren = dir.children
      }
    }
  }

  return root
}

function FileTreeNode({
  node,
  depth,
  onSelect,
}: {
  node: TreeNode
  depth: number
  onSelect: (path: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleClick = () => {
    if (node.isDirectory) {
      setIsExpanded(!isExpanded)
    } else {
      onSelect(node.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-0.5 text-xs hover:bg-muted/50 transition-colors',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className='h-3 w-3 shrink-0' />
            ) : (
              <ChevronRight className='h-3 w-3 shrink-0' />
            )}
            {isExpanded ? (
              <FolderOpen className='h-3.5 w-3.5 text-yellow-500 shrink-0' />
            ) : (
              <Folder className='h-3.5 w-3.5 text-yellow-500 shrink-0' />
            )}
          </>
        ) : (
          <>
            <span className='w-3 shrink-0' />
            <File className='h-3.5 w-3.5 text-blue-400 shrink-0' />
          </>
        )}
        <span className='truncate'>{node.name}</span>
      </button>
      {node.isDirectory && isExpanded && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ className }: FileTreeProps) {
  const { files, openFile } = useEditorStore()
  const tree = buildTree(files)
  const { t } = useTranslation()

  const handleSelect = (path: string) => {
    const file = files.get(path)
    if (file) {
      openFile(path, file.content, file.language)
    }
  }

  if (files.size === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground p-4', className)}>
        <p className='text-xs'>{t('editor.noOpenFiles')}</p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-auto', className)}>
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} onSelect={handleSelect} />
      ))}
    </div>
  )
}
