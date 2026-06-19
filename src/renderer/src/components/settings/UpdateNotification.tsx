import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdateStore } from '../../stores/update-store'
import { UpdateDialog } from './UpdateDialog'

export function UpdateNotification() {
  const { t } = useTranslation()
  const status = useUpdateStore((s) => s.status)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsDialogOpen(true)
    window.addEventListener('open-update-dialog', handler)
    return () => window.removeEventListener('open-update-dialog', handler)
  }, [])

  return (
    <>
      {status === 'available' || status === 'downloaded' ? (
        <button
          onClick={() => setIsDialogOpen(true)}
          className='flex items-center gap-1.5 hover:text-foreground transition-colors text-xs'
          title={t('updater.available')}
        >
          <Download className='h-3 w-3' />
          <span>{t('updater.checkNow')}</span>
        </button>
      ) : null}
      <UpdateDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  )
}
