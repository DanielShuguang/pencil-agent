import { useState, useEffect } from 'react'
import { useAgentStore } from '../../stores/agent-store'
import { useModelConfigStore } from '../../stores/model-config-store'

interface ModelSelectorProps {
  onClose?: () => void
}

export function ModelSelector({ onClose }: ModelSelectorProps) {
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

  return (
    <div className='relative'>
      <button
        className='flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='text-muted-foreground'>{currentProvider?.name || currentModel.provider}</span>
        <span className='font-medium'>{currentModelInfo?.name || currentModel.id}</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d='m6 9 6 6 6-6' />
        </svg>
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
                  <div className='px-2 py-1 text-xs font-medium text-muted-foreground'>{provider.name}</div>
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                        currentModel.provider === provider.id && currentModel.id === model.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        switchModel({ id: model.id, provider: provider.id })
                        setIsOpen(false)
                        onClose?.()
                      }}
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
