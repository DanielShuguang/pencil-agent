import { useTranslation } from 'react-i18next'
import { useUpdateStore } from '../../stores/update-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

interface UpdateDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UpdateDialog({ isOpen, onClose }: UpdateDialogProps) {
  const { t } = useTranslation()
  const { status, progress, error, updateInfo, downloadUpdate, installUpdate, reset } = useUpdateStore()

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDownload = () => downloadUpdate()
  const handleInstall = () => installUpdate()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('updater.title')}</DialogTitle>
        </DialogHeader>

        {status === 'checking' && (
          <div className='text-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4' />
            <p className='text-muted-foreground'>{t('updater.checking')}</p>
          </div>
        )}

        {status === 'available' && (
          <div className='space-y-4'>
            <p>{t('updater.available')}</p>
            {updateInfo && (
              <div className='bg-muted p-3 rounded-md text-sm'>
                <p><strong>{t('updater.version')}:</strong> {(updateInfo as { version?: string }).version}</p>
                {(updateInfo as { releaseNotes?: string }).releaseNotes && (
                  <p className='mt-2'><strong>{t('updater.releaseNotes')}:</strong></p>
                )}
                {(updateInfo as { releaseNotes?: string }).releaseNotes && (
                  <p className='mt-1 whitespace-pre-wrap'>{(updateInfo as { releaseNotes?: string }).releaseNotes}</p>
                )}
              </div>
            )}
            <div className='flex justify-end gap-2'>
              <Button variant='secondary' onClick={handleClose}>
                {t('updater.later')}
              </Button>
              <Button onClick={handleDownload}>
                {t('updater.download')}
              </Button>
            </div>
          </div>
        )}

        {status === 'downloading' && (
          <div className='space-y-4'>
            <p>{t('updater.downloading')}</p>
            <div className='w-full bg-secondary rounded-full h-2.5'>
              <div className='bg-primary h-2.5 rounded-full transition-all' style={{ width: `${progress}%` }} />
            </div>
            <p className='text-sm text-muted-foreground text-center'>{Math.round(progress)}%</p>
          </div>
        )}

        {status === 'downloaded' && (
          <div className='space-y-4'>
            <p>{t('updater.downloaded')}</p>
            <div className='flex justify-end gap-2'>
              <Button variant='secondary' onClick={handleClose}>
                {t('updater.later')}
              </Button>
              <Button onClick={handleInstall}>
                {t('updater.install')}
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className='space-y-4'>
            <p className='text-destructive'>{error || t('updater.error')}</p>
            <div className='flex justify-end'>
              <Button variant='secondary' onClick={handleClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className='space-y-4'>
            <p className='text-muted-foreground'>{t('updater.noUpdate')}</p>
            <div className='flex justify-end'>
              <Button variant='secondary' onClick={handleClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
