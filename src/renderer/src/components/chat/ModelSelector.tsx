import { useState } from 'react'
import { useAgentStore } from '../../stores/agent-store'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
]

const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  ],
}

interface ModelSelectorProps {
  onClose?: () => void
}

export function ModelSelector({ onClose }: ModelSelectorProps) {
  const { currentModel, switchModel } = useAgentStore()
  const [isOpen, setIsOpen] = useState(false)

  const currentProvider = PROVIDERS.find((p) => p.id === currentModel.provider)
  const currentModelInfo = MODELS[currentModel.provider]?.find((m) => m.id === currentModel.id)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-muted-foreground">{currentProvider?.name}</span>
        <span className="font-medium">{currentModelInfo?.name || currentModel.id}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="p-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {provider.name}
              </div>
              {MODELS[provider.id]?.map((model) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
