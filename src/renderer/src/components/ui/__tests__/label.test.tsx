import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from '../label'

describe('Label', () => {
  it('renders children', () => {
    render(<Label>Username</Label>)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('renders with htmlFor', () => {
    render(<Label htmlFor='username'>Username</Label>)
    expect(screen.getByText('Username')).toHaveAttribute('for', 'username')
  })

  it('applies custom className', () => {
    render(<Label className='custom-label'>Label</Label>)
    expect(screen.getByText('Label').className).toContain('custom-label')
  })

  it('forwards ref', () => {
    const ref = { current: null }
    render(<Label ref={ref}>Label</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })
})
