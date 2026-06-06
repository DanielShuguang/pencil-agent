import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, TestTube, Download, Eye, EyeOff, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { ModelProvider, ModelProviderInfo, ModelConfig } from '@shared/ipc'
import { useModelConfigStore } from '../../stores/model-config-store'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useListAnimate } from '../../hooks/useAutoAnimate'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { ProviderForm } from './ProviderForm'
import { ModelForm } from './ModelForm'

export function ModelConfigPanel() {
  const {
    providers,
    isLoading,
    error,
    fetchProviders,
    saveProvider,
    deleteProvider,
    saveModel,
    deleteModel,
    toggleVisibility,
    testConnection,
    fetchModels,
  } = useModelConfigStore()
  const { t } = useTranslation()
  const [providerListRef] = useListAnimate()

  const [editingProvider, setEditingProvider] = useState<ModelProviderInfo | null>(null)
  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [editingModel, setEditingModel] = useState<{
    providerId: string
    model?: ModelConfig
  } | null>(null)
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({})
  const [fetchingModels, setFetchingModels] = useState<Set<string>>(new Set())
  const [deleteProviderConfirm, setDeleteProviderConfirm] = useState<string | null>(null)
  const [deleteModelConfirm, setDeleteModelConfirm] = useState<{
    providerId: string
    modelId: string
  } | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleSaveProvider = async (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => {
    await saveProvider(provider)
    setEditingProvider(null)
    setIsAddingProvider(false)
    // 保存后自动获取可用模型
    handleFetchModels(provider.id)
  }

  const handleFetchModels = async (providerId: string) => {
    setFetchingModels((prev) => new Set(prev).add(providerId))
    try {
      const result = await fetchModels(providerId)
      if (result.models.length > 0) {
        // 保存获取到的模型（不覆盖已有的）
        const existingProvider = providers.find((p) => p.id === providerId)
        const existingIds = new Set(existingProvider?.models.map((m) => m.id) || [])
        for (const model of result.models) {
          if (!existingIds.has(model.id)) {
            await saveModel(providerId, model)
          }
        }
      }
    } finally {
      setFetchingModels((prev) => {
        const next = new Set(prev)
        next.delete(providerId)
        return next
      })
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    setDeleteProviderConfirm(providerId)
  }

  const confirmDeleteProvider = async () => {
    if (deleteProviderConfirm) {
      await deleteProvider(deleteProviderConfirm)
      setDeleteProviderConfirm(null)
    }
  }

  const handleSaveModel = async (model: ModelConfig) => {
    if (editingModel) {
      await saveModel(editingModel.providerId, model)
      setEditingModel(null)
    }
  }

  const handleDeleteModel = async (providerId: string, modelId: string) => {
    setDeleteModelConfirm({ providerId, modelId })
  }

  const confirmDeleteModel = async () => {
    if (deleteModelConfirm) {
      await deleteModel(deleteModelConfirm.providerId, deleteModelConfirm.modelId)
      setDeleteModelConfirm(null)
    }
  }

  const handleTestConnection = async (providerId: string) => {
    setTestResults((prev) => ({ ...prev, [providerId]: { success: false } }))
    const result = await testConnection(providerId)
    setTestResults((prev) => ({ ...prev, [providerId]: result }))
  }

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(providerId)) {
        next.delete(providerId)
      } else {
        next.add(providerId)
      }
      return next
    })
  }

  if (editingProvider || isAddingProvider) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-medium'>
          {editingProvider ? t('settings.editProvider') : t('settings.addProvider')}
        </h3>
        <ProviderForm
          provider={editingProvider || undefined}
          onSave={handleSaveProvider}
          onCancel={() => {
            setEditingProvider(null)
            setIsAddingProvider(false)
          }}
        />
      </div>
    )
  }

  if (editingModel) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-medium'>
          {editingModel.model ? t('settings.editModel') : t('settings.addModel')}
        </h3>
        <ModelForm
          model={editingModel.model}
          providerId={editingModel.providerId}
          onSave={handleSaveModel}
          onCancel={() => setEditingModel(null)}
        />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>{t('settings.models')}</h3>
        <Button size='sm' onClick={() => setIsAddingProvider(true)}>
          <Plus className='mr-2 h-4 w-4' />
          {t('settings.addProvider')}
        </Button>
      </div>

      {error && <div className='text-sm text-destructive'>{error}</div>}

      {isLoading ? (
        <div className='text-sm text-muted-foreground'>{t('common.loading')}</div>
      ) : providers.length === 0 ? (
        <div className='text-sm text-muted-foreground'>{t('settings.noProviders')}</div>
      ) : (
        <div ref={providerListRef} className='space-y-2'>
          {providers.map((provider) => (
            <div key={provider.id} className='rounded-md border'>
              <div className='flex items-center justify-between p-3'>
                <button
                  className='flex items-center gap-2 hover:text-foreground'
                  onClick={() => toggleProvider(provider.id)}
                >
                  {expandedProviders.has(provider.id) ? (
                    <ChevronDown className='h-4 w-4' />
                  ) : (
                    <ChevronRight className='h-4 w-4' />
                  )}
                  <span className='font-medium'>{provider.name}</span>
                  <span className='text-sm text-muted-foreground'>
                    {t('settings.modelsCount', { count: provider.models.length })}
                  </span>
                </button>

                <div className='flex items-center gap-1'>
                  {testResults[provider.id] && (
                    <span
                      className={`text-xs ${
                        testResults[provider.id].success ? 'text-green-500' : 'text-destructive'
                      }`}
                    >
                      {testResults[provider.id].success
                        ? t('settings.connected')
                        : testResults[provider.id].error}
                    </span>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleTestConnection(provider.id)}
                      >
                        <TestTube className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('settings.testConnection')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleFetchModels(provider.id)}
                        disabled={fetchingModels.has(provider.id)}
                      >
                        {fetchingModels.has(provider.id) ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Download className='h-4 w-4' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('settings.fetchModels')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size='sm' variant='ghost' onClick={() => setEditingProvider(provider)}>
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('settings.editProvider')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleDeleteProvider(provider.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.delete')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {expandedProviders.has(provider.id) && (
                <div className='border-t p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>{t('settings.modelList')}</span>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditingModel({ providerId: provider.id })}
                    >
                      <Plus className='mr-2 h-3 w-3' />
                      {t('settings.addModel')}
                    </Button>
                  </div>

                  {provider.models.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>{t('settings.noModels')}</div>
                  ) : (
                    <div className='space-y-1'>
                      {provider.models.map((model) => (
                        <div
                          key={model.id}
                          className={`flex items-center justify-between rounded-md p-2 hover:bg-muted ${model.visible === false ? 'opacity-50' : ''}`}
                        >
                          <div>
                            <span className='font-medium'>{model.name}</span>
                            <span className='ml-2 text-sm text-muted-foreground'>{model.id}</span>
                            {model.visible === false && (
                              <span className='ml-2 text-xs text-muted-foreground'>({t('settings.hideModel')})</span>
                            )}
                          </div>

                          <div className='flex items-center gap-1'>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => toggleVisibility(provider.id, model.id)}
                                >
                                  {model.visible === false ? (
                                    <EyeOff className='h-3 w-3' />
                                  ) : (
                                    <Eye className='h-3 w-3' />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {model.visible === false ? t('settings.showModel') : t('settings.hideModel')}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => setEditingModel({ providerId: provider.id, model })}
                                >
                                  <Pencil className='h-3 w-3' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('settings.editModel')}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => handleDeleteModel(provider.id, model.id)}
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('common.delete')}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(deleteProviderConfirm)}
        onOpenChange={() => setDeleteProviderConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.deleteProviderConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProvider}>{t('common.ok')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteModelConfirm)}
        onOpenChange={() => setDeleteModelConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.deleteModelConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteModel}>{t('common.ok')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
