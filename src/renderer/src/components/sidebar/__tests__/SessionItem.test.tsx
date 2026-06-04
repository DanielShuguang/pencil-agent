import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionItem } from '../SessionItem'
import '../../../i18n'

const baseMeta = {
  id: 'session-1',
  title: 'Test Session',
  model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  updatedAt: Date.now(),
  createdAt: Date.now(),
}

describe('SessionItem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders session title', () => {
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Test Session')).toBeInTheDocument()
  })

  it('renders model info', () => {
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('anthropic/claude-sonnet-4-20250514')).toBeInTheDocument()
  })

  it('applies active styles when isActive', () => {
    const { container } = render(<SessionItem meta={baseMeta} isActive={true} onClick={vi.fn()} onDelete={vi.fn()} />)
    expect(container.querySelector('.bg-accent')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<SessionItem meta={baseMeta} isActive={false} onClick={onClick} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('Test Session'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows delete confirmation dialog on delete button click', () => {
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={vi.fn()} />)
    const deleteBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(deleteBtn)
    expect(screen.getByText('删除会话')).toBeInTheDocument()
    expect(screen.getByText('确定删除？')).toBeInTheDocument()
  })

  it('calls onDelete when confirmed', () => {
    const onDelete = vi.fn()
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={onDelete} />)
    const deleteBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(deleteBtn)
    fireEvent.click(screen.getByText('确定'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('does not call onDelete when cancelled', () => {
    const onDelete = vi.fn()
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={onDelete} />)
    const deleteBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(deleteBtn)
    fireEvent.click(screen.getByText('取消'))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('shows just now for recent timestamps', () => {
    render(<SessionItem meta={baseMeta} isActive={false} onClick={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('刚刚')).toBeInTheDocument()
  })

  it('shows minutes ago for timestamps within an hour', () => {
    const meta = { ...baseMeta, updatedAt: Date.now() - 300000 }
    render(<SessionItem meta={meta} isActive={false} onClick={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('5 分钟前')).toBeInTheDocument()
  })
})
