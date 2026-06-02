import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputBar } from '../InputBar'
import '../../../i18n'

describe('InputBar', () => {
  it('renders input and send button', () => {
    render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument()
  })

  it('shows stop button when generating', () => {
    render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={true} disabled={false} />)
    expect(screen.getByRole('button', { name: '停止' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '发送' })).not.toBeInTheDocument()
  })

  it('calls onStop when stop button is clicked', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    render(<InputBar onSend={vi.fn()} onStop={onStop} isGenerating={true} disabled={false} />)
    await user.click(screen.getByRole('button', { name: '停止' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('disables input and send button when disabled', () => {
    render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={true} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeDisabled()
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
  })

  it('disables input when generating', () => {
    render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={true} disabled={false} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeDisabled()
  })

  it('sends message on Enter key', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await user.type(input, 'Hello')
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    const input = screen.getByPlaceholderText('输入消息...') as HTMLInputElement
    await user.type(input, 'Hello')
    await user.keyboard('{Enter}')
    expect(input.value).toBe('')
  })

  it('does not send empty message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends on button click', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('disables send button when input is empty', () => {
    render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
  })

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
    const input = screen.getByPlaceholderText('输入消息...')
    await user.type(input, 'Hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
