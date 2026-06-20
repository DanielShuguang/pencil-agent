import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DefaultModelSettings } from '../DefaultModelSettings'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../chat/ModelSelector', () => ({
  ModelSelector: (p: any) =>
    React.createElement('div', { 'data-testid': 'model-selector', 'data-mode': p.mode }, 'ModelSelector'),
}))

describe('DefaultModelSettings', () => {
  it('渲染标题和描述', () => {
    render(<DefaultModelSettings />)
    expect(screen.getByText('settings.defaultModel')).toBeInTheDocument()
    expect(screen.getByText('settings.defaultModelDescription')).toBeInTheDocument()
  })

  it('渲染 ModelSelector 并传递 mode=default', () => {
    render(<DefaultModelSettings />)
    const selector = screen.getByTestId('model-selector')
    expect(selector).toBeInTheDocument()
    expect(selector.getAttribute('data-mode')).toBe('default')
  })

  it('渲染模型标签', () => {
    render(<DefaultModelSettings />)
    expect(screen.getByText('settings.model:')).toBeInTheDocument()
  })
})
