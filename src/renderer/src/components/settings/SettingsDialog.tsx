import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiKeyForm } from './ApiKeyForm'
import { ModelConfigPanel } from './ModelConfigPanel'
import { UpdateDialog } from './UpdateDialog'
import { useAgentStore } from '../../stores/agent-store'
import { useThemeStore } from '../../stores/theme-store'
import { useUpdateStore } from '../../stores/update-store'
import { themeRegistry } from '../../themes/theme-registry'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

type SettingsTab = 'api-keys' | 'models' | 'language' | 'theme'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

const TAB_KEYS: Record<SettingsTab, string> = {
  'api-keys': 'apiKeys',
  'models': 'models',
  'language': 'language',
  'theme': 'theme',
}

const THEME_MODE_KEYS: Record<string, string> = {
  system: 'followSystem',
  light: 'lightMode',
  dark: 'darkMode',
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const { t } = useTranslation()
  const { language, setLanguage } = useAgentStore()
  const { mode, currentThemeId } = useThemeStore()
  const { status, checkForUpdates } = useUpdateStore()

  const themes = themeRegistry.getAllThemes()

  const handleCheckUpdate = async () => {
    await checkForUpdates()
    setIsUpdateDialogOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className='flex gap-2 mb-4 border-b'>
          {(['api-keys', 'models', 'language', 'theme'] as SettingsTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setActiveTab(tab)}
            >
              {t(`settings.${TAB_KEYS[tab]}`)}
            </Button>
          ))}
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCheckUpdate}
            disabled={status === 'checking'}
          >
            {t('updater.checkNow')}
          </Button>
        </div>

        {activeTab === 'api-keys' && <ApiKeyForm />}
        {activeTab === 'models' && <ModelConfigPanel />}
        {activeTab === 'language' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={language === 'zh' ? 'default' : 'secondary'}
                onClick={() => setLanguage('zh')}
              >
                {t('settings.chinese')}
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'secondary'}
                onClick={() => setLanguage('en')}
              >
                {t('settings.english')}
              </Button>
            </div>
          </div>
        )}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.themeMode')}</label>
              <div className="flex gap-2">
                {(['system', 'light', 'dark'] as const).map((m) => (
                  <Button
                    key={m}
                    variant={mode === m ? 'default' : 'secondary'}
                    onClick={() => window.api?.theme?.setMode(m)}
                  >
                    {t(`settings.${THEME_MODE_KEYS[m]}`)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.selectTheme')}</label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((theme) => (
                  <Button
                    key={theme.id}
                    variant={currentThemeId === theme.id ? 'default' : 'outline'}
                    className='justify-start gap-2'
                    onClick={() => window.api?.theme?.setTheme(theme.id)}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                    />
                    <span className="text-sm">{theme.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <UpdateDialog isOpen={isUpdateDialogOpen} onClose={() => setIsUpdateDialogOpen(false)} />
    </Dialog>
  )
}
