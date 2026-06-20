import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TokenUsageBadge } from '../TokenUsageBadge'

function dispatchTokenUsage(detail: Partial<{ prompt: number; completion: number }>) {
  act(() => {
    window.dispatchEvent(new CustomEvent('token-usage', { detail }))
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TokenUsageBadge', () => {
  it('returns null initially', () => {
    const { container } = render(<TokenUsageBadge />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when total is 0', () => {
    render(<TokenUsageBadge />)
    dispatchTokenUsage({ prompt: 0, completion: 0 })
    const { container } = render(<TokenUsageBadge />)
    expect(container.innerHTML).toBe('')
  })

  it('shows formatted tokens when total > 0', () => {
    render(<TokenUsageBadge />)
    dispatchTokenUsage({ prompt: 100, completion: 200 })
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('formats tokens >= 1000 as x.xk', () => {
    render(<TokenUsageBadge />)
    dispatchTokenUsage({ prompt: 800, completion: 700 })
    expect(screen.getByText('1.5k')).toBeInTheDocument()
  })

  it('formats large token counts correctly', () => {
    render(<TokenUsageBadge />)
    dispatchTokenUsage({ prompt: 5000, completion: 3500 })
    expect(screen.getByText('8.5k')).toBeInTheDocument()
  })
})
