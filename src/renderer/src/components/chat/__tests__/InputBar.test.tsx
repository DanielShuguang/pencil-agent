import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputBar } from '../InputBar'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({ activeSessionId: 's1', sessions: new Map() })),
    setState: vi.fn(),
  }),
}))

import { useAgentStore } from '../../../stores/agent-store'

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

  describe('斜杠命令', () => {
    beforeEach(() => {
      ;(window as any).api = { theme: {} }
    })

    it('输入 / 时展示命令建议', async () => {
      const user = userEvent.setup()
      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)

      await user.type(screen.getByPlaceholderText('输入消息...'), '/')

      expect(screen.getByText('/help')).toBeInTheDocument()
      expect(screen.getByText('/clear')).toBeInTheDocument()
    })

    it('继续输入时按前缀过滤命令', async () => {
      const user = userEvent.setup()
      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)

      await user.type(screen.getByPlaceholderText('输入消息...'), '/hel')

      expect(screen.getByText('/help')).toBeInTheDocument()
      expect(screen.queryByText('/clear')).not.toBeInTheDocument()
    })

    it('Tab 补全命令名', async () => {
      const user = userEvent.setup()
      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      const input = screen.getByPlaceholderText('输入消息...')
      await user.type(input, '/hel')

      await user.keyboard('{Tab}')

      expect(input).toHaveValue('/help ')
    })

    it('ArrowDown 后 Tab 会选择下一个命令', async () => {
      const user = userEvent.setup()
      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      const input = screen.getByPlaceholderText('输入消息...')
      await user.type(input, '/')
      const firstName = screen.getAllByRole('button')[0].textContent?.split(' ')[0] ?? ''

      await user.keyboard('{ArrowDown}{Tab}')

      expect(input).not.toHaveValue(`${firstName} `)
    })

    it('点击建议项补全命令', async () => {
      const user = userEvent.setup()
      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      const input = screen.getByPlaceholderText('输入消息...')
      await user.type(input, '/hel')

      await user.click(screen.getByText('/help'))

      expect(input).toHaveValue('/help ')
    })

    it('执行 /help 并把结果写入会话消息', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      const setState = vi.fn()
      const sessions = new Map<string, any[]>([['s1', []]])
      ;(useAgentStore.getState as any) = vi.fn(() => ({
        activeSessionId: 's1',
        sessions,
      }))
      ;(useAgentStore as any).setState = setState

      render(<InputBar onSend={onSend} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      const input = screen.getByPlaceholderText('输入消息...')
      await user.type(input, '/help')
      await user.keyboard('{Enter}')

      expect(onSend).not.toHaveBeenCalled()
      expect(setState).toHaveBeenCalled()
      const nextSessions = setState.mock.calls[0][0].sessions as Map<string, any[]>
      expect(nextSessions.get('s1')).toHaveLength(2)
      expect(nextSessions.get('s1')?.[0].content).toBe('/help')
      expect(input).toHaveValue('')
    })

    it('未知命令写入错误提示', async () => {
      const user = userEvent.setup()
      const setState = vi.fn()
      ;(useAgentStore.getState as any) = vi.fn(() => ({
        activeSessionId: 's1',
        sessions: new Map<string, any[]>([['s1', []]]),
      }))
      ;(useAgentStore as any).setState = setState

      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      await user.type(screen.getByPlaceholderText('输入消息...'), '/nope')
      await user.keyboard('{Enter}')

      const nextSessions = setState.mock.calls[0][0].sessions as Map<string, any[]>
      expect(nextSessions.get('s1')?.[1].content).toContain('/nope')
    })

    it('没有活跃会话时执行命令不写入消息', async () => {
      const user = userEvent.setup()
      const setState = vi.fn()
      ;(useAgentStore.getState as any) = vi.fn(() => ({ activeSessionId: null, sessions: new Map() }))
      ;(useAgentStore as any).setState = setState

      render(<InputBar onSend={vi.fn()} onStop={vi.fn()} isGenerating={false} disabled={false} />)
      await user.type(screen.getByPlaceholderText('输入消息...'), '/help')
      await user.keyboard('{Enter}')

      expect(setState).not.toHaveBeenCalled()
    })
  })
})
