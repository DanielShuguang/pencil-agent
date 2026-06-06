import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { usePermissionStore } from '../../stores/permission-store'

const riskIcons = {
  low: Shield,
  medium: AlertTriangle,
  high: AlertOctagon,
}

const riskColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

export function PermissionConfirmDialog() {
  const { pendingConfirm, submitConfirmResponse, dismissConfirm } = usePermissionStore()
  const [rememberSession, setRememberSession] = useState(false)
  const { t } = useTranslation()

  if (!pendingConfirm) return null

  const handleAllow = () => {
    submitConfirmResponse({
      id: pendingConfirm.id,
      allowed: true,
      rememberSession,
    })
  }

  const handleDeny = () => {
    submitConfirmResponse({
      id: pendingConfirm.id,
      allowed: false,
      rememberSession,
    })
  }

  const RiskIcon = riskIcons[pendingConfirm.riskLevel]

  return (
    <Dialog open={true} onOpenChange={() => dismissConfirm()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <RiskIcon className={`h-5 w-5 ${riskColors[pendingConfirm.riskLevel]}`} />
            {t('permission.confirmTitle')}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className='space-y-3'>
            <div className='rounded-md border p-3 text-sm'>
              <div className='font-medium mb-1'>{t('permission.toolName')}</div>
              <div className='text-muted-foreground'>{pendingConfirm.toolName}</div>
            </div>

            {pendingConfirm.pattern && (
              <div className='rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm'>
                <div className='font-medium mb-1 text-destructive'>{t('permission.riskWarning')}</div>
                <div>{pendingConfirm.pattern}</div>
              </div>
            )}

            <div className='rounded-md border p-3 text-sm'>
              <div className='font-medium mb-1'>{t('permission.parameters')}</div>
              <pre className='text-xs text-muted-foreground overflow-auto max-h-32'>
                {JSON.stringify(pendingConfirm.parameters, null, 2)}
              </pre>
            </div>

            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={rememberSession}
                onCheckedChange={(checked) => setRememberSession(checked === true)}
              />
              {t('permission.rememberSession')}
            </label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant='outline' onClick={handleDeny}>
            {t('permission.deny')}
          </Button>
          <Button onClick={handleAllow}>
            {t('permission.allow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
