import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder='Enter text' />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts value and handles change', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input value='hello' onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'x')
    expect(onChange).toHaveBeenCalled()
  })

  it('applies disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Input className='custom-class' />)
    expect(screen.getByRole('textbox').className).toContain('custom-class')
  })

  it('renders password type', () => {
    render(<Input type='password' aria-label='password' />)
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'password')
  })

  it('forwards ref', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
