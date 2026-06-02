import { useState } from 'react'
import { ApiKeyForm } from './ApiKeyForm'
import { ModelConfigPanel } from './ModelConfigPanel'

type SettingsTab = 'api-keys' | 'models'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-background border rounded-lg shadow-lg w-full max-w-2xl p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>设置</h2>
          <button className='p-1 hover:bg-accent rounded-md transition-colors' onClick={onClose}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          </button>
        </div>

        <div className='flex gap-2 mb-4 border-b'>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'api-keys'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('api-keys')}
          >
            API 密钥
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('models')}
          >
            模型
          </button>
        </div>

        {activeTab === 'api-keys' ? <ApiKeyForm /> : <ModelConfigPanel />}
      </div>
    </div>
  )
}
