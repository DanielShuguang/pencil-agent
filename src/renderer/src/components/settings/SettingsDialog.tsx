import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { match } from 'ts-pattern'
import { ApiKeyForm } from './ApiKeyForm'
import { ModelConfigPanel } from './ModelConfigPanel'
import { PermissionPanel } from './PermissionPanel'
import { AuditLogPanel } from '../audit/AuditLogPanel'
import { MemoryPanel } from '../memory/MemoryPanel'
import { useAgentStore } from '../../stores/agent-store'
import { useThemeStore } from '../../stores/theme-store'
import { useUpdateStore } from '../../stores/update-store'
import { useSystemFonts } from '../../hooks/useSystemFonts'
import { themeRegistry } from '../../themes/theme-registry'
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { FontSelect } from '../ui/font-select'

type SettingsTab = 'api-keys' | 'models' | 'permission' | 'audit' | 'memory' | 'language' | 'theme'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

const TAB_KEYS: Record<SettingsTab, string> = {
  'api-keys': 'apiKeys',
  models: 'models',
  permission: 'permission',
  audit: 'auditLog',
  memory: 'memory',
  language: 'language',
  theme: 'theme',
}

const THEME_MODE_KEYS: Record<string, string> = {
  system: 'followSystem',
  light: 'lightMode',
  dark: 'darkMode',
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')
  const { t } = useTranslation()
  const { language, setLanguage } = useAgentStore()
  const { mode, currentThemeId } = useThemeStore()
  const { status, checkForUpdates } = useUpdateStore()

  const themes = themeRegistry.getAllThemes()
  const { fonts: fontOptions } = useSystemFonts()

  const [currentFont, setCurrentFont] = useState(() => {
    return localStorage.getItem('pencil-agent:font-family') || ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tab) setActiveTab(detail.tab as SettingsTab)
    }
    window.addEventListener('open-settings', handler)
    return () => window.removeEventListener('open-settings', handler)
  }, [])

  const handleFontChange = useCallback((fontValue: string) => {
    setCurrentFont(fontValue)
    localStorage.setItem('pencil-agent:font-family', fontValue)
    document.documentElement.style.setProperty('--font-family', fontValue)
  }, [])

  const handleCheckUpdate = async () => {
    await checkForUpdates()
    window.dispatchEvent(new CustomEvent('open-update-dialog'))
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className='max-w-2xl'
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className='flex gap-2 mb-4 border-b'>
            {(['api-keys', 'models', 'permission', 'audit', 'memory', 'language', 'theme'] as SettingsTab[]).map((tab) => (
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

          {match(activeTab)
            .with('api-keys', () => <ApiKeyForm />)
            .with('models', () => <ModelConfigPanel />)
            .with('permission', () => <PermissionPanel />)
            .with('audit', () => <AuditLogPanel />)
            .with('memory', () => <MemoryPanel />)
            .with('language', () => (
              <div className='space-y-4'>
                <div className='flex gap-2'>
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
            ))
            .with('theme', () => (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>{t('settings.fontFamily')}</label>
                  <FontSelect
                    value={currentFont}
                    onValueChange={handleFontChange}
                    options={fontOptions}
                    placeholder={t('settings.fontFamily')}
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>{t('settings.themeMode')}</label>
                  <div className='flex gap-2'>
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
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>{t('settings.selectTheme')}</label>
                  <div className='grid grid-cols-2 gap-2'>
                    {themes.map((theme) => (
                      <Button
                        key={theme.id}
                        variant={currentThemeId === theme.id ? 'default' : 'outline'}
                        className='justify-start gap-2'
                        onClick={() => window.api?.theme?.setTheme(theme.id)}
                      >
                        <div
                          className='w-4 h-4 rounded-full shrink-0'
                          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        />
                        <span className='text-sm'>{theme.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))
            .exhaustive()}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
