import { useState, useEffect } from 'react'
import { useAgentStore } from '../../stores/agent-store'
import { useModelConfigStore } from '../../stores/model-config-store'
import { ChevronDown } from 'lucide-react'

interface ModelSelectorProps {
  showTrigger?: boolean
}

export function ModelSelector({ showTrigger = true }: ModelSelectorProps) {
  const { currentModel, switchModel } = useAgentStore()
  const { providers, fetchProviders } = useModelConfigStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const currentProvider = providers.find((p) => p.id === currentModel.provider)
  const currentModelInfo = currentProvider?.models.find((m) => m.id === currentModel.id)

  const filteredProviders = providers
    .map((provider) => ({
      ...provider,
      models: provider.models.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((provider) => provider.models.length > 0)

  const handleSelect = (providerId: string, modelId: string) => {
    switchModel({ id: modelId, provider: providerId })
    setIsOpen(false)
    setSearchQuery('')
  }

  if (!showTrigger) {
    return (
      <div className='w-80'>
        <div className='p-2'>
          <input
            type='text'
            placeholder='搜索模型...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full px-3 py-1.5 text-sm border rounded-md bg-background'
          />
        </div>

        <div className='max-h-64 overflow-y-auto'>
          {filteredProviders.length === 0 ? (
            <div className='p-4 text-sm text-muted-foreground text-center'>未找到模型</div>
          ) : (
            filteredProviders.map((provider) => (
              <div key={provider.id} className='p-2'>
                <div className='px-2 py-1 text-xs font-medium text-muted-foreground'>
                  {provider.name}
                </div>
                {provider.models.map((model) => (
                  <button
                    key={model.id}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                      currentModel.provider === provider.id && currentModel.id === model.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelect(provider.id, model.id)}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='relative'>
      <button
        className='flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='text-muted-foreground'>
          {currentProvider?.name || currentModel.provider}
        </span>
        <span className='font-medium'>{currentModelInfo?.name || currentModel.id}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 w-80 bg-background border rounded-lg shadow-lg z-50'>
          <div className='p-2'>
            <input
              type='text'
              placeholder='搜索模型...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-3 py-1.5 text-sm border rounded-md bg-background'
            />
          </div>

          <div className='max-h-64 overflow-y-auto'>
            {filteredProviders.length === 0 ? (
              <div className='p-4 text-sm text-muted-foreground text-center'>未找到模型</div>
            ) : (
              filteredProviders.map((provider) => (
                <div key={provider.id} className='p-2'>
                  <div className='px-2 py-1 text-xs font-medium text-muted-foreground'>
                    {provider.name}
                  </div>
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                        currentModel.provider === provider.id && currentModel.id === model.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => handleSelect(provider.id, model.id)}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
