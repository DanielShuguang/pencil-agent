import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useMemoryStore } from '../../stores/memory-store'

interface MemorySearchProps {
  onResultSelect?: (content: string) => void
}

export function MemorySearch({ onResultSelect }: MemorySearchProps) {
  const { searchResults, isLoading, searchMemory } = useMemoryStore()
  const [query, setQuery] = useState('')
  const { t } = useTranslation()

  const handleSearch = () => {
    if (query.trim()) {
      void searchMemory(query.trim())
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <Input
          placeholder={t('memory.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          size='sm'
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? t('memory.searching') : t('memory.search')}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className='border rounded-md max-h-60 overflow-auto'>
          {searchResults.map((result) => (
            <div
              key={result.id}
              className='p-2 hover:bg-accent cursor-pointer border-b last:border-b-0'
              onClick={() => onResultSelect?.(result.content)}
            >
              <div className='text-sm'>{result.content.slice(0, 150)}...</div>
              <div className='flex items-center gap-2 mt-1'>
                {result.metadata.tags?.map((tag) => (
                  <span key={tag} className='text-xs bg-secondary px-1.5 py-0.5 rounded'>
                    {tag}
                  </span>
                ))}
                {result.score !== undefined && (
                  <span className='text-xs text-muted-foreground'>
                    {t('memory.score')}: {result.score.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
