import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageBubble } from '../MessageBubble'

const baseMessage = {
  id: '1',
  content: 'Hello World',
  timestamp: 1000,
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('MessageBubble', () => {
  it('renders user message right-aligned', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-end')
  })

  it('renders assistant message left-aligned', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'assistant' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-start')
  })

  it('renders message content', () => {
    render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders system message left-aligned like assistant', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'system' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-start')
  })

  it('renders thinking block when thinkingContent is present', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Let me analyze...' }}
      />,
    )
    expect(screen.getByText('chat.thinkingProcess')).toBeInTheDocument()
  })

  it('thinking block is collapsed by default', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Deep thought' }}
      />,
    )
    expect(screen.queryByText('Deep thought')).not.toBeInTheDocument()
  })

  it('thinking block expands on click', async () => {
    const user = userEvent.setup()
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Deep thought' }}
      />,
    )
    await user.click(screen.getByText('chat.thinkingProcess'))
    expect(screen.getByText('Deep thought')).toBeInTheDocument()
  })

  it('shows rewind button for user messages when onRewind is provided', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  it('does not show rewind button when onRewind is not provided', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} />,
    )
    const button = container.querySelector('button')
    expect(button).toBeNull()
  })

  it('does not show rewind button for assistant messages', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'assistant' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')
    expect(button).toBeNull()
  })

  it('shows confirmation dialog when rewind button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')!
    await user.click(button)
    expect(screen.getByText('chat.rewindTitle')).toBeInTheDocument()
    expect(screen.getByText('chat.rewindConfirm')).toBeInTheDocument()
  })

  it('calls onRewind when confirmation is accepted', async () => {
    const user = userEvent.setup()
    const onRewind = vi.fn()
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={onRewind} />,
    )
    await user.click(container.querySelector('button')!)
    await user.click(screen.getByText('common.ok'))
    expect(onRewind).toHaveBeenCalledWith('1')
  })
})
