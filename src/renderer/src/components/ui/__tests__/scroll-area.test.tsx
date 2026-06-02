import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollArea } from '../scroll-area'

describe('ScrollArea', () => {
  it('renders children', () => {
    render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>,
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ScrollArea className='custom-scroll'>
        <div>Content</div>
      </ScrollArea>,
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('custom-scroll')
    expect(root.className).toContain('overflow-hidden')
  })
})
