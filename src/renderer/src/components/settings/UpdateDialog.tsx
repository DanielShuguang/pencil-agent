import { useTranslation } from 'react-i18next'
import { match } from 'ts-pattern'
import { useUpdateStore } from '../../stores/update-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

interface UpdateDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UpdateDialog({ isOpen, onClose }: UpdateDialogProps) {
  const { t } = useTranslation()
  const { status, progress, error, updateInfo, downloadUpdate, installUpdate, reset } =
    useUpdateStore()

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDownload = () => downloadUpdate()
  const handleInstall = () => installUpdate()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      modal={false}
    >
      <DialogContent
        className='max-w-md'
        onPointerDownOutside={(e) => {
          // 阻止事件冒泡到外层 Dialog
          e.preventDefault()
          e.stopPropagation()
        }}
        onInteractOutside={(e) => {
          // 阻止事件冒泡到外层 Dialog
          e.preventDefault()
          e.stopPropagation()
        }}
        onOpenAutoFocus={(e) => {
          // 阻止焦点自动移动到第一个可聚焦元素
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('updater.title')}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {match(status)
            .with('checking', () => (
              <div className='text-center py-8'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4' />
                <p className='text-muted-foreground'>{t('updater.checking')}</p>
              </div>
            ))
            .with('available', () => (
              <div className='space-y-4'>
                <p>{t('updater.available')}</p>
                {updateInfo && (
                  <div className='bg-muted p-3 rounded-md text-sm'>
                    <p>
                      <strong>{t('updater.version')}:</strong>{' '}
                      {(updateInfo as { version?: string }).version}
                    </p>
                    {(updateInfo as { releaseNotes?: string }).releaseNotes && (
                      <>
                        <p className='mt-2'>
                          <strong>{t('updater.releaseNotes')}:</strong>
                        </p>
                        <p className='mt-1 whitespace-pre-wrap'>
                          {(updateInfo as { releaseNotes?: string }).releaseNotes}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
            .with('downloading', () => (
              <div className='space-y-4'>
                <p>{t('updater.downloading')}</p>
                <div className='w-full bg-secondary rounded-full h-2.5'>
                  <div
                    className='bg-primary h-2.5 rounded-full transition-all'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className='text-sm text-muted-foreground text-center'>{Math.round(progress)}%</p>
              </div>
            ))
            .with('downloaded', () => (
              <p>{t('updater.downloaded')}</p>
            ))
            .with('error', () => (
              <p className='text-destructive'>{error || t('updater.error')}</p>
            ))
            .with('idle', () => (
              <p className='text-muted-foreground'>{t('updater.noUpdate')}</p>
            ))
            .exhaustive()}
        </DialogBody>

        <DialogFooter>
          {match(status)
            .with('checking', () => null)
            .with('available', () => (
              <>
                <Button variant='secondary' onClick={handleClose}>
                  {t('updater.later')}
                </Button>
                <Button onClick={handleDownload}>{t('updater.download')}</Button>
              </>
            ))
            .with('downloading', () => null)
            .with('downloaded', () => (
              <>
                <Button variant='secondary' onClick={handleClose}>
                  {t('updater.later')}
                </Button>
                <Button onClick={handleInstall}>{t('updater.install')}</Button>
              </>
            ))
            .with('error', () => (
              <Button variant='secondary' onClick={handleClose}>
                {t('common.close')}
              </Button>
            ))
            .with('idle', () => (
              <Button variant='secondary' onClick={handleClose}>
                {t('common.close')}
              </Button>
            ))
            .exhaustive()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
