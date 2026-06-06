import { useCallback, useRef, useEffect, useState } from 'react'
import { cn } from '@renderer/lib/utils'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  className?: string
}

export function ResizeHandle({ direction, onResize, className }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef(0)
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
      setIsDragging(true)
    },
    [direction],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - startPos.current
      startPos.current = currentPos
      onResizeRef.current(delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, direction])

  return (
    <div
      role='separator'
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      className={cn(
        'shrink-0 bg-border transition-colors',
        direction === 'horizontal'
          ? 'w-px cursor-col-resize hover:bg-primary/50'
          : 'h-px cursor-row-resize hover:bg-primary/50',
        isDragging && 'bg-primary/50',
        className,
      )}
      onMouseDown={handleMouseDown}
    />
  )
}
