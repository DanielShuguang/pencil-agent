import { useCallback, useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdateStore } from '../../stores/update-store'
import { UpdateDialog } from './UpdateDialog'

export function UpdateNotification() {
  const { t } = useTranslation()
  const status = useUpdateStore((s) => s.status)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClick = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  useEffect(() => {
    const handler = () => setIsDialogOpen(true)
    window.addEventListener('open-update-dialog', handler)
    return () => window.removeEventListener('open-update-dialog', handler)
  }, [])

  const handleClose = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  return (
    <>
      {(status === 'available' || status === 'downloaded') && (
        <button
          onClick={handleClick}
          className='flex items-center gap-1.5 hover:text-foreground transition-colors text-xs'
          title={t('updater.available')}
        >
          <Download className='h-3 w-3' />
          <span>{t('updater.checkNow')}</span>
        </button>
      )}
      <UpdateDialog isOpen={isDialogOpen} onClose={handleClose} />
    </>
  )
}
