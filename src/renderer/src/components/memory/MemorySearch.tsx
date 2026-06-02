import { useState } from 'react'
import { useMemoryStore } from '../../stores/memory-store'

interface MemorySearchProps {
  onResultSelect?: (content: string) => void
}

export function MemorySearch({ onResultSelect }: MemorySearchProps) {
  const { searchResults, isLoading, searchMemory } = useMemoryStore()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      searchMemory(query.trim())
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
          placeholder="Search memories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="border rounded-md max-h-60 overflow-auto">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
              onClick={() => onResultSelect?.(result.content)}
            >
              <div className="text-sm">{result.content.slice(0, 150)}...</div>
              <div className="flex items-center gap-2 mt-1">
                {result.metadata.tags?.map((tag) => (
                  <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {result.score !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Score: {result.score.toFixed(2)}
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
