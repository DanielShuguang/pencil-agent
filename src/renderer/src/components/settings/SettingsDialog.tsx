import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiKeyForm } from './ApiKeyForm'
import { ModelConfigPanel } from './ModelConfigPanel'
import { useAgentStore } from '../../stores/agent-store'
import { useThemeStore } from '../../stores/theme-store'
import { themeRegistry } from '../../themes/theme-registry'

type SettingsTab = 'api-keys' | 'models' | 'language' | 'theme'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')
  const { t } = useTranslation()
  const { language, setLanguage } = useAgentStore()
  const { mode, currentThemeId } = useThemeStore()

  if (!isOpen) return null

  const themes = themeRegistry.getAllThemes()

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
          <button
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'theme'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('theme')}
          >
            {t('settings.theme')}
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
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.themeMode')}</label>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    mode === 'system'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => window.api?.theme?.setMode('system')}
                >
                  {t('settings.followSystem')}
                </button>
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    mode === 'light'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => window.api?.theme?.setMode('light')}
                >
                  {t('settings.lightMode')}
                </button>
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    mode === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => window.api?.theme?.setMode('dark')}
                >
                  {t('settings.darkMode')}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.selectTheme')}</label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    className={`p-3 rounded-md border transition-colors ${
                      currentThemeId === theme.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => window.api?.theme?.setTheme(theme.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                      />
                      <span className="text-sm">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
