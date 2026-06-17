import { useTranslation } from 'react-i18next'
import { ModelSelector } from '../chat/ModelSelector'

export function DefaultModelSettings() {
  const { t } = useTranslation()

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-medium'>{t('settings.defaultModel')}</h3>
        <p className='text-sm text-muted-foreground'>
          {t('settings.defaultModelDescription')}
        </p>
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium'>{t('settings.model')}:</span>
        <ModelSelector mode='default' />
      </div>
    </div>
  )
}
