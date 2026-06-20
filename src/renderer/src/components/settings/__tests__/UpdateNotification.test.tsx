import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { UpdateNotification } from '../UpdateNotification'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../UpdateDialog', () => ({
  UpdateDialog: (p: any) =>
    React.createElement('div', { 'data-testid': 'update-dialog', 'data-open': p.isOpen }),
}))

vi.mock('../../../stores/update-store', () => ({
  useUpdateStore: vi.fn(),
}))

const { useUpdateStore } = await import('../../../stores/update-store')
const mockUseUpdateStore = vi.mocked(useUpdateStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseUpdateStore.mockReturnValue('idle')
})

describe('UpdateNotification', () => {
  it('status=idle 时隐藏按钮', () => {
    mockUseUpdateStore.mockReturnValue('idle')
    render(<UpdateNotification />)
    expect(screen.queryByText('updater.checkNow')).not.toBeInTheDocument()
  })

  it('status=available 时显示按钮', () => {
    mockUseUpdateStore.mockReturnValue('available')
    render(<UpdateNotification />)
    expect(screen.getByText('updater.checkNow')).toBeInTheDocument()
  })

  it('status=downloaded 时显示按钮', () => {
    mockUseUpdateStore.mockReturnValue('downloaded')
    render(<UpdateNotification />)
    expect(screen.getByText('updater.checkNow')).toBeInTheDocument()
  })

  it('点击按钮打开对话框', () => {
    mockUseUpdateStore.mockReturnValue('available')
    render(<UpdateNotification />)
    fireEvent.click(screen.getByText('updater.checkNow'))
    const dialog = screen.getByTestId('update-dialog')
    expect(dialog.getAttribute('data-open')).toBe('true')
  })

  it('open-update-dialog 事件打开对话框', () => {
    mockUseUpdateStore.mockReturnValue('idle')
    render(<UpdateNotification />)
    fireEvent(window, new Event('open-update-dialog'))
    const dialog = screen.getByTestId('update-dialog')
    expect(dialog.getAttribute('data-open')).toBe('true')
  })
})
