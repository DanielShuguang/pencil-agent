import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toast } from '../toast'

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('creates a toast element with message', () => {
    toast.info('Hello')
    const el = document.body.lastElementChild as HTMLElement
    expect(el).toBeTruthy()
    expect(el.textContent).toBe('Hello')
  })

  it('applies error styles for error toast', () => {
    toast.error('Error message')
    const el = document.body.lastElementChild as HTMLElement
    expect(el.className).toContain('bg-destructive')
  })

  it('applies success styles for success toast', () => {
    toast.success('Success message')
    const el = document.body.lastElementChild as HTMLElement
    expect(el.className).toContain('bg-green-600')
  })

  it('removes toast after duration', () => {
    toast.info('Gone soon')
    expect(document.body.lastElementChild).toBeTruthy()

    vi.advanceTimersByTime(3300)
    expect(document.body.lastElementChild).toBeNull()
  })
})
