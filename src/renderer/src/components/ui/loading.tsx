import { useTranslation } from 'react-i18next'

export function Loading() {
  const { t } = useTranslation()

  return (
    <div className='flex h-full items-center justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        <p className='text-sm text-muted-foreground'>{t('common.loading')}</p>
      </div>
    </div>
  )
}
