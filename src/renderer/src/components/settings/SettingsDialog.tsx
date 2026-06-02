import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiKeyForm } from './ApiKeyForm'
import { ModelConfigPanel } from './ModelConfigPanel'
import { useAgentStore } from '../../stores/agent-store'

type SettingsTab = 'api-keys' | 'models' | 'language'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')
  const { t } = useTranslation()
  const { language, setLanguage } = useAgentStore()

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-background border rounded-lg shadow-lg w-full max-w-2xl p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>{t('settings.title')}</h2>
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
            {t('settings.apiKeys')}
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('models')}
          >
            {t('settings.models')}
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'language'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('language')}
          >
            {t('settings.language')}
          </button>
        </div>

        {activeTab === 'api-keys' && <ApiKeyForm />}
        {activeTab === 'models' && <ModelConfigPanel />}
        {activeTab === 'language' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  language === 'zh'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
                onClick={() => setLanguage('zh')}
              >
                {t('settings.chinese')}
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
                onClick={() => setLanguage('en')}
              >
                {t('settings.english')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
