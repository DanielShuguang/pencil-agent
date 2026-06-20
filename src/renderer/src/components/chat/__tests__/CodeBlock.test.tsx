import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeBlock } from '../CodeBlock'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn(() => ({ value: 'hl' })),
    highlightAuto: vi.fn(() => ({ value: 'hl' })),
    getLanguage: vi.fn(() => true),
  },
}))

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders code in pre>code', () => {
    render(<CodeBlock code='console.log(1)' />)
    const pre = document.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre?.querySelector('code')).toBeInTheDocument()
  })

  it('calls highlight with language when provided', async () => {
    const hljs = (await import('highlight.js')).default
    render(<CodeBlock code='const x = 1' language='typescript' />)
    expect(hljs.highlight).toHaveBeenCalledWith('const x = 1', { language: 'typescript' })
  })

  it('calls highlightAuto when no language provided', async () => {
    const hljs = (await import('highlight.js')).default
    render(<CodeBlock code='const x = 1' />)
    expect(hljs.highlightAuto).toHaveBeenCalledWith('const x = 1')
  })

  it('renders copy button with Copy icon initially', () => {
    render(<CodeBlock code='test' />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.querySelector('.text-green-500')).not.toBeInTheDocument()
  })

  it('shows Check icon after copy click and resets after timeout', async () => {
    render(<CodeBlock code='test' />)
    const user = userEvent.setup()
    const button = screen.getByRole('button')
    await user.click(button)
    expect(button.querySelector('.text-green-500')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(button.querySelector('.text-green-500')).not.toBeInTheDocument()
  })
})
