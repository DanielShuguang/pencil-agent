import { useState } from 'react'
import { useMemoryStore } from '../../stores/memory-store'

export function MemoryPanel() {
  const { memories, searchResults, isLoading, searchQuery, searchMemory, deleteMemory, clearAllMemories } = useMemoryStore()
  const [localQuery, setLocalQuery] = useState('')

  const handleSearch = () => {
    if (localQuery.trim()) {
      searchMemory(localQuery.trim())
    }
  }

  const displayItems = searchQuery ? searchResults : memories

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium mb-2">记忆搜索</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
            placeholder="搜索记忆..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={handleSearch}
            disabled={!localQuery.trim() || isLoading}
          >
            搜索
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center">加载中...</div>
        ) : displayItems.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">
            {searchQuery ? '未找到结果' : '暂无记忆'}
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg">
                <div className="text-sm">{item.content.slice(0, 200)}...</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {item.metadata.tags?.map((tag) => (
                      <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                    {item.score !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        相关度：{item.score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    className="text-xs text-destructive hover:underline"
                    onClick={() => deleteMemory(item.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {displayItems.length > 0 && (
        <div className="p-4 border-t">
          <button
            className="w-full px-3 py-1.5 text-sm text-destructive border border-destructive rounded-md hover:bg-destructive/10"
            onClick={clearAllMemories}
          >
            清空所有记忆
          </button>
        </div>
      )}
    </div>
  )
}
