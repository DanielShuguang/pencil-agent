import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, TestTube, ChevronDown, ChevronRight } from 'lucide-react'
import type { ModelProvider, ModelProviderInfo, ModelConfig } from '@shared/ipc'
import { useModelConfigStore } from '../../stores/model-config-store'
import { Button } from '../ui/button'
import { ProviderForm } from './ProviderForm'
import { ModelForm } from './ModelForm'

export function ModelConfigPanel() {
  const { providers, isLoading, error, fetchProviders, saveProvider, deleteProvider, saveModel, deleteModel, testConnection } =
    useModelConfigStore()

  const [editingProvider, setEditingProvider] = useState<ModelProviderInfo | null>(null)
  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [editingModel, setEditingModel] = useState<{ providerId: string; model?: ModelConfig } | null>(null)
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({})

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleSaveProvider = async (provider: Omit<ModelProvider, 'createdAt' | 'updatedAt'>) => {
    await saveProvider(provider)
    setEditingProvider(null)
    setIsAddingProvider(false)
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('确定删除此供应商？')) {
      await deleteProvider(providerId)
    }
  }

  const handleSaveModel = async (model: ModelConfig) => {
    if (editingModel) {
      await saveModel(editingModel.providerId, model)
      setEditingModel(null)
    }
  }

  const handleDeleteModel = async (providerId: string, modelId: string) => {
    if (confirm('确定删除此模型？')) {
      await deleteModel(providerId, modelId)
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
        <h3 className='text-lg font-medium'>{editingProvider ? '编辑供应商' : '添加供应商'}</h3>
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
        <h3 className='text-lg font-medium'>{editingModel.model ? '编辑模型' : '添加模型'}</h3>
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
        <h3 className='text-lg font-medium'>模型供应商</h3>
        <Button size='sm' onClick={() => setIsAddingProvider(true)}>
          <Plus className='mr-2 h-4 w-4' />
          添加供应商
        </Button>
      </div>

      {error && <div className='text-sm text-destructive'>{error}</div>}

      {isLoading ? (
        <div className='text-sm text-muted-foreground'>加载中...</div>
      ) : providers.length === 0 ? (
        <div className='text-sm text-muted-foreground'>暂无供应商</div>
      ) : (
        <div className='space-y-2'>
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
                  <span className='text-sm text-muted-foreground'>（{provider.models.length} 个模型）</span>
                </button>

                <div className='flex items-center gap-1'>
                  {testResults[provider.id] && (
                    <span
                      className={`text-xs ${
                        testResults[provider.id].success ? 'text-green-500' : 'text-destructive'
                      }`}
                    >
                      {testResults[provider.id].success ? '已连接' : testResults[provider.id].error}
                    </span>
                  )}

                  <Button size='sm' variant='ghost' onClick={() => handleTestConnection(provider.id)}>
                    <TestTube className='h-4 w-4' />
                  </Button>

                  <Button size='sm' variant='ghost' onClick={() => setEditingProvider(provider)}>
                    <Pencil className='h-4 w-4' />
                  </Button>

                  <Button size='sm' variant='ghost' onClick={() => handleDeleteProvider(provider.id)}>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {expandedProviders.has(provider.id) && (
                <div className='border-t p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>模型列表</span>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditingModel({ providerId: provider.id })}
                    >
                      <Plus className='mr-2 h-3 w-3' />
                      添加模型
                    </Button>
                  </div>

                  {provider.models.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>暂无模型</div>
                  ) : (
                    <div className='space-y-1'>
                      {provider.models.map((model) => (
                        <div key={model.id} className='flex items-center justify-between rounded-md p-2 hover:bg-muted'>
                          <div>
                            <span className='font-medium'>{model.name}</span>
                            <span className='ml-2 text-sm text-muted-foreground'>{model.id}</span>
                          </div>

                          <div className='flex items-center gap-1'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setEditingModel({ providerId: provider.id, model })}
                            >
                              <Pencil className='h-3 w-3' />
                            </Button>

                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleDeleteModel(provider.id, model.id)}
                            >
                              <Trash2 className='h-3 w-3' />
                            </Button>
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
    </div>
  )
}
