import { useTranslation } from 'react-i18next'
import { Shield, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { usePermissionStore } from '../../stores/permission-store'

const MODES = ['auto', 'prompt', 'smart'] as const

const modeIcons = {
  auto: ShieldCheck,
  prompt: ShieldAlert,
  smart: Shield,
}

const AVAILABLE_TOOLS = ['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls']

export function PermissionPanel() {
  const { config, isLoaded, fetchConfig, updateConfig } = usePermissionStore()
  const { t } = useTranslation()

  if (!isLoaded) {
    fetchConfig()
    return <div className='text-sm text-muted-foreground'>{t('common.loading')}</div>
  }

  const handleModeChange = (mode: (typeof MODES)[number]) => {
    updateConfig({ mode })
  }

  const handleToggleTool = (tool: string) => {
    const disabled = config.disabledTools.includes(tool)
    const newDisabled = disabled
      ? config.disabledTools.filter((t) => t !== tool)
      : [...config.disabledTools, tool]
    updateConfig({ disabledTools: newDisabled })
  }

  return (
    <div className='space-y-6'>
      {/* 确认模式 */}
      <div className='space-y-3'>
        <label className='text-sm font-medium'>{t('permission.mode')}</label>
        <div className='grid grid-cols-3 gap-2'>
          {MODES.map((mode) => {
            const Icon = modeIcons[mode]
            return (
              <Button
                key={mode}
                variant={config.mode === mode ? 'default' : 'outline'}
                className='flex-col gap-1 h-auto py-3'
                onClick={() => handleModeChange(mode)}
              >
                <Icon className='h-5 w-5' />
                <span className='text-xs'>{t(`permission.mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}</span>
              </Button>
            )
          })}
        </div>
        <p className='text-xs text-muted-foreground'>
          {t(`permission.modeDesc${config.mode.charAt(0).toUpperCase() + config.mode.slice(1)}`)}
        </p>
      </div>

      {/* 工具启用/禁用 */}
      <div className='space-y-3'>
        <label className='text-sm font-medium'>{t('permission.disabledTools')}</label>
        <div className='space-y-1'>
          {AVAILABLE_TOOLS.map((tool) => {
            const isDisabled = config.disabledTools.includes(tool)
            return (
              <div
                key={tool}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted',
                  isDisabled && 'opacity-50',
                )}
              >
                <div className='flex items-center gap-2'>
                  {isDisabled ? (
                    <ShieldOff className='h-4 w-4 text-destructive' />
                  ) : (
                    <ShieldCheck className='h-4 w-4 text-green-500' />
                  )}
                  <span className='text-sm font-medium'>{tool}</span>
                </div>
                <Button
                  size='sm'
                  variant={isDisabled ? 'outline' : 'ghost'}
                  onClick={() => handleToggleTool(tool)}
                >
                  {isDisabled ? t('permission.enable') : t('permission.disable')}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
