import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../MessageBubble'

const baseMessage = {
  id: '1',
  content: 'Hello World',
  timestamp: 1000,
}

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
})
