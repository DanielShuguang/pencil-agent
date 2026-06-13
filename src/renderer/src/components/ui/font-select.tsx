import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import type { FontOption } from '../../hooks/useSystemFonts'

interface FontSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: FontOption[]
  placeholder?: string
}

const ITEM_HEIGHT = 32
const LIST_HEIGHT = 288

type FontRowProps = {
  fonts: FontOption[]
  selected: string
  onSelect: (value: string) => void
}

function FontRow({ index, fonts, selected, onSelect, style }: RowComponentProps<FontRowProps>) {
  const font = fonts[index]
  if (!font) return null

  return (
    <button
      style={{ ...style, fontFamily: font.value }}
      className={cn(
        'flex w-full items-center rounded-sm px-2 text-sm cursor-default outline-none hover:bg-accent hover:text-accent-foreground',
        selected === font.value && 'bg-accent',
      )}
      onClick={() => onSelect(font.value)}
    >
      <Check className={cn('mr-2 h-4 w-4 shrink-0', selected === font.value ? 'opacity-100' : 'opacity-0')} />
      {font.label}
    </button>
  )
}

export function FontSelect({ value, onValueChange, options, placeholder }: FontSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((f) => f.label.toLowerCase().includes(lower))
  }, [options, search])

  const selectedLabel = options.find((f) => f.value === value)?.label

  const handleSelect = useCallback(
    (fontValue: string) => {
      onValueChange(fontValue)
      setOpen(false)
    },
    [onValueChange],
  )

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between font-normal'
        >
          <span className='truncate' style={selectedLabel ? { fontFamily: value } : undefined}>
            {selectedLabel || placeholder || 'Select font...'}
          </span>
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
        <div className='flex items-center border-b px-3'>
          <Search className='h-4 w-4 shrink-0 opacity-50' />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search fonts...'
            className='border-0 focus-visible:ring-0 shadow-none h-8'
          />
        </div>
        {filtered.length === 0 ? (
          <div className='py-6 text-center text-sm text-muted-foreground'>No font found</div>
        ) : (
          <List
            rowComponent={FontRow}
            rowCount={filtered.length}
            rowHeight={ITEM_HEIGHT}
            rowProps={{ fonts: filtered, selected: value, onSelect: handleSelect }}
            style={{ height: Math.min(filtered.length * ITEM_HEIGHT, LIST_HEIGHT) }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
