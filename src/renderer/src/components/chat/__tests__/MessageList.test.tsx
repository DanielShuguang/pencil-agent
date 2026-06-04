import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from '../MessageList'

vi.mock('../../stores/agent-store', () => ({
  useAgentStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      sessions: new Map(),
      activeSessionId: null,
    }),
}))

describe('MessageList', () => {
  it('shows empty state when no active session', () => {
    render(<MessageList />)
    expect(screen.getByText('开始对话...')).toBeInTheDocument()
  })
})
